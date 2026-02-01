from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from app import db, bcrypt
from flask_mail import Message
import secrets
from app.models import User
import jwt
import datetime
from functools import wraps
from config import Config
import logging

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)


def token_required(f):
    """Decorator to require JWT token for API endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid authorization header format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode the token
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            current_user_obj = User.query.get(payload['user_id'])
            
            if not current_user_obj:
                return jsonify({'error': 'Invalid token'}), 401
            
            # Make user available in the request context
            request.current_user = current_user_obj
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Username, email, and password are required'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    # Create new user
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password
    )
    
    db.session.add(user)
    db.session.commit()
    
    # Log the user in
    login_user(user)
    
    # Generate token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, Config.SECRET_KEY, algorithm='HS256')
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'token': token
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login a user."""
    data = request.get_json()
    
    # Accept either username or email
    username_or_email = data.get('username') or data.get('email')
    password = data.get('password')
    
    if not data or not username_or_email or not password:
        return jsonify({'error': 'Username/email and password are required'}), 400
    
    # Find user by username or email
    user = User.query.filter((User.username == username_or_email) | (User.email == username_or_email)).first()
    
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid username/email or password'}), 401
    
    # Log the user in
    login_user(user, remember=data.get('remember', False))
    
    # Generate token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, Config.SECRET_KEY, algorithm='HS256')
    
    return jsonify({
        'message': 'Logged in successfully',
        'user': user.to_dict(),
        'token': token
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Logout a user."""
    logout_user()
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current logged-in user."""
    return jsonify({'user': current_user.to_dict()}), 200


@auth_bp.route('/verify', methods=['POST'])
def verify_token():
    """Verify a JWT token."""
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'error': 'Token is required'}), 400
    
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        user = User.query.get(payload['user_id'])
        
        if not user:
            return jsonify({'error': 'Invalid token'}), 401
        
        return jsonify({
            'valid': True,
            'user': user.to_dict()
        }), 200
    
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset email."""
    from datetime import datetime, timedelta
    
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    
    logger.info(f'Forgot password request for email: {email}')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Check if user exists
    user = User.query.filter_by(email=email).first()
    if not user:
        # Don't reveal if email exists (security best practice)
        logger.warning(f'Password reset requested for non-existent email: {email}')
        return jsonify({'success': True, 'message': 'If an account exists with this email, a reset link has been sent.'}), 200
    
    # Determine where to send the email
    send_to = email
    if email == 'admin@lifeledger.com':
        send_to = 'wastagemail2@gmail.com'
    
    # Generate secure token
    token = secrets.token_urlsafe(32)
    logger.info(f'Generated reset token for user {email}: {token[:20]}...')
    
    try:
        user.reset_token = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
        db.session.add(user)
        db.session.commit()
        logger.info(f'Token saved to database for user {email}')
    except Exception as e:
        logger.error(f'Failed to save reset token: {str(e)}')
        db.session.rollback()
        return jsonify({'error': 'Failed to save reset token'}), 500
    
    try:
        from app import mail
        # Compose professional email
        # Use the current request's base URL (localhost:5000 in dev, domain in production)
        base_url = request.host_url.rstrip('/')
        reset_link = f"{base_url}/reset-password?token={token}"
        
        msg = Message(
            subject='Life Ledger - Password Reset Request',
            recipients=[send_to],
            html=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">Life Ledger</h1>
                </div>
                <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; color: #333;">
                    <h2>Password Reset Request</h2>
                    <p>We received a request to reset your password. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" style="background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Or copy this link: {reset_link}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px;">
                        If you didn't request this, please ignore this email. This link will expire in 1 hour.
                    </p>
                </div>
            </div>
            """
        )
        mail.send(msg)
        logger.info(f'Password reset email sent to {send_to} for user {email}')
        return jsonify({'success': True, 'message': 'If an account exists with this email, a reset link has been sent.'}), 200
    
    except Exception as e:
        logger.error(f'Failed to send password reset email: {str(e)}')
        return jsonify({'error': f'Email service error: {str(e)}'}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Handle password reset with token."""
    from datetime import datetime
    
    data = request.get_json() or {}
    token = data.get('token')
    new_password = data.get('new_password')
    
    logger.info(f'Reset password request received with token: {token[:20]}...')
    
    if not token or not new_password:
        return jsonify({'error': 'Token and new password are required'}), 400
    
    if len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Find user by reset token
    user = User.query.filter_by(reset_token=token).first()
    logger.info(f'Looking for user with token, found: {user}')
    
    if not user:
        logger.error(f'No user found with token: {token}')
        return jsonify({'error': 'Invalid or expired token'}), 400
    
    # Check if token has expired
    if user.reset_token_expiry and user.reset_token_expiry < datetime.utcnow():
        logger.error(f'Reset token expired for user {user.email}')
        return jsonify({'error': 'Reset token has expired. Please request a new one.'}), 400
    
    try:
        # Update password
        logger.info(f'Updating password for user {user.email}')
        user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
        # Clear reset token
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        logger.info(f'Password updated and committed for user {user.email}')
        
        logger.info(f'Password reset successful for user {user.email}')
        return jsonify({'success': True, 'message': 'Password reset successful. You can now login with your new password.'}), 200
    
    except Exception as e:
        logger.error(f'Error resetting password: {str(e)}')
        db.session.rollback()
        return jsonify({'error': 'Failed to reset password'}), 500
