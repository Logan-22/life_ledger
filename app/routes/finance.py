"""Finance routes for investment tracking."""
from flask import Blueprint, request, jsonify
from app.models import db, Investment
from app.routes.auth import token_required
from datetime import datetime

finance_bp = Blueprint('finance', __name__)


@finance_bp.route('/investments', methods=['GET'])
@token_required
def get_investments():
    """Get all investments for the current user."""
    investments = Investment.query.filter_by(user_id=request.current_user.id).order_by(Investment.buy_date.desc()).all()
    return jsonify([inv.to_dict() for inv in investments])


@finance_bp.route('/investments', methods=['POST'])
@token_required
def create_investment():
    """Create a new investment."""
    data = request.json
    
    # Validate required fields
    required_fields = ['instrument_type', 'instrument_name', 'quantity', 'buy_price', 'buy_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        # Parse buy_date
        buy_date = datetime.strptime(data['buy_date'], '%Y-%m-%d').date()
        
        # Calculate total invested
        quantity = float(data['quantity'])
        buy_price = float(data['buy_price'])
        total_invested = quantity * buy_price
        
        # Create investment
        investment = Investment(
            user_id=request.current_user.id,
            instrument_type=data['instrument_type'],
            instrument_name=data['instrument_name'],
            symbol=data.get('symbol', ''),
            quantity=quantity,
            buy_price=buy_price,
            buy_date=buy_date,
            total_invested=total_invested,
            current_price=data.get('current_price', buy_price),  # Default to buy price
            current_value=data.get('current_value', total_invested),  # Default to invested amount
            notes=data.get('notes', '')
        )
        
        db.session.add(investment)
        db.session.commit()
        
        return jsonify(investment.to_dict()), 201
    
    except ValueError as e:
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@finance_bp.route('/investments/<int:investment_id>', methods=['PUT'])
@token_required
def update_investment(investment_id):
    """Update an investment's current price/value."""
    investment = Investment.query.filter_by(id=investment_id, user_id=request.current_user.id).first()
    
    if not investment:
        return jsonify({'error': 'Investment not found'}), 404
    
    data = request.json
    
    try:
        # Update current price if provided
        if 'current_price' in data:
            investment.current_price = float(data['current_price'])
            investment.current_value = investment.quantity * investment.current_price
            investment.last_updated = datetime.utcnow()
        
        # Allow manual current_value override
        if 'current_value' in data:
            investment.current_value = float(data['current_value'])
            investment.last_updated = datetime.utcnow()
        
        # Update notes if provided
        if 'notes' in data:
            investment.notes = data['notes']
        
        db.session.commit()
        return jsonify(investment.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@finance_bp.route('/investments/<int:investment_id>', methods=['DELETE'])
@token_required
def delete_investment(investment_id):
    """Delete an investment."""
    investment = Investment.query.filter_by(id=investment_id, user_id=request.current_user.id).first()
    
    if not investment:
        return jsonify({'error': 'Investment not found'}), 404
    
    try:
        db.session.delete(investment)
        db.session.commit()
        return jsonify({'message': 'Investment deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@finance_bp.route('/portfolio/summary', methods=['GET'])
@token_required
def get_portfolio_summary():
    """Get portfolio summary with totals and allocation."""
    investments = Investment.query.filter_by(user_id=request.current_user.id).all()
    
    if not investments:
        return jsonify({
            'total_invested': 0,
            'current_value': 0,
            'total_returns': 0,
            'returns_percent': 0,
            'count': 0,
            'allocation': []
        })
    
    total_invested = sum(inv.total_invested for inv in investments)
    current_value = sum(inv.current_value or inv.total_invested for inv in investments)
    total_returns = current_value - total_invested
    returns_percent = (total_returns / total_invested * 100) if total_invested > 0 else 0
    
    # Calculate allocation by instrument type
    allocation = {}
    for inv in investments:
        inv_value = inv.current_value or inv.total_invested
        if inv.instrument_type not in allocation:
            allocation[inv.instrument_type] = {
                'invested': 0,
                'current_value': 0,
                'count': 0
            }
        allocation[inv.instrument_type]['invested'] += inv.total_invested
        allocation[inv.instrument_type]['current_value'] += inv_value
        allocation[inv.instrument_type]['count'] += 1
    
    # Convert to list with percentages
    allocation_list = []
    for inst_type, data in allocation.items():
        allocation_list.append({
            'instrument_type': inst_type,
            'invested': round(data['invested'], 2),
            'current_value': round(data['current_value'], 2),
            'percentage': round((data['current_value'] / current_value * 100) if current_value > 0 else 0, 2),
            'count': data['count']
        })
    
    return jsonify({
        'total_invested': round(total_invested, 2),
        'current_value': round(current_value, 2),
        'total_returns': round(total_returns, 2),
        'returns_percent': round(returns_percent, 2),
        'count': len(investments),
        'allocation': sorted(allocation_list, key=lambda x: x['current_value'], reverse=True)
    })


@finance_bp.route('/stock/price', methods=['POST'])
@token_required
def get_stock_price():
    """Fetch stock price from Yahoo Finance."""
    import yfinance as yf
    from datetime import datetime, timedelta
    
    data = request.json
    symbol = data.get('symbol', '').upper()
    buy_date = data.get('buy_date')
    
    if not symbol:
        return jsonify({'error': 'Symbol is required'}), 400
    
    try:
        # Add .NS for NSE stocks if not already present
        if not symbol.endswith(('.NS', '.BO')):
            symbol = f"{symbol}.NS"
        
        print(f"\n=== Yahoo Finance Debug ===")
        print(f"Requesting data for: {symbol}")
        
        # Create ticker object with session to handle rate limits
        import requests
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        ticker = yf.Ticker(symbol, session=session)
        
        # Try to get historical data first (more reliable)
        stock_name = symbol.replace('.NS', '').replace('.BO', '')
        current_price = None
        buy_price = None
        
        # Get historical data for last 30 days for current price
        print("Fetching historical data for period='1mo'...")
        try:
            hist = ticker.history(period='1mo')
            print(f"History shape: {hist.shape}")
            print(f"History columns: {hist.columns.tolist()}")
            print(f"History empty: {hist.empty}")
            if not hist.empty:
                print(f"Last 3 rows:\n{hist.tail(3)}")
        except Exception as hist_error:
            print(f"History fetch error: {type(hist_error).__name__}: {hist_error}")
            raise
        
        if hist.empty:
            print(f"ERROR: No historical data returned for {symbol}")
            raise Exception(f'No data available for {symbol}. The symbol may be invalid or delisted.')
        
        # Get most recent close price as current price
        current_price = hist['Close'].iloc[-1]
        print(f"Current price extracted: {current_price}")
        
        # Try to get stock name from info (may fail due to rate limiting)
        try:
            print("Attempting to fetch ticker info...")
            info = ticker.info
            stock_name = info.get('longName', info.get('shortName', stock_name))
            print(f"Stock name from info: {stock_name}")
        except Exception as info_error:
            print(f"Info fetch failed (expected if rate limited): {type(info_error).__name__}: {info_error}")
            pass  # Use default name if info fails
        
        # Get historical price for buy date if provided
        buy_price = current_price  # Default to current price
        if buy_date:
            try:
                # Parse buy date
                buy_date_obj = datetime.strptime(buy_date, '%Y-%m-%d')
                # Fetch historical data (get a few days buffer)
                start_date = buy_date_obj - timedelta(days=7)
                end_date = buy_date_obj + timedelta(days=1)
                
                hist_buy = ticker.history(start=start_date, end=end_date)
                
                if not hist_buy.empty:
                    # Get the closest date to buy_date
                    hist_date = buy_date_obj.strftime('%Y-%m-%d')
                    if hist_date in hist_buy.index.strftime('%Y-%m-%d').tolist():
                        buy_price = hist_buy.loc[hist_buy.index.strftime('%Y-%m-%d') == hist_date, 'Close'].values[0]
                    else:
                        # Get the first available close price
                        buy_price = hist_buy['Close'].iloc[0]
            except Exception as e:
                print(f"Error fetching historical price for buy date: {type(e).__name__}: {e}")
                # If historical fetch fails, use current price
                pass
        
        print(f"Final prices - Buy: {buy_price}, Current: {current_price}")
        print("=== Success ===\n")
        
        return jsonify({
            'success': True,
            'symbol': symbol,
            'name': stock_name,
            'current_price': round(float(current_price), 2),
            'buy_price': round(float(buy_price), 2),
            'currency': 'INR'
        })
    
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        
        print(f"\n=== ERROR ===")
        print(f"Error type: {error_type}")
        print(f"Error message: {error_msg}")
        print(f"Full exception: {e}")
        print("=============\n")
        
        # Check for rate limiting
        if '429' in error_msg or 'Too Many Requests' in error_msg:
            return jsonify({
                'success': False,
                'error': 'Yahoo Finance rate limit exceeded. Please wait a few minutes and try again, or enter prices manually.'
            }), 200
        
        return jsonify({
            'success': False,
            'error': f'Could not fetch data for {symbol}. Error: {error_type} - {error_msg}'
        }), 200
