from flask import Blueprint, request, jsonify
from app import db
from app.models import Habit, HabitLog, DietEntry
from app.utils.helpers import calculate_streak, parse_date
from app.utils.nutrition_api import nutrition_api
from app.routes.auth import token_required
from datetime import datetime
from sqlalchemy import func, desc

personal_bp = Blueprint('personal', __name__)


# ==================== HABITS ====================

@personal_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """Get current user profile."""
    user = request.current_user
    return jsonify(user.to_dict()), 200


@personal_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Update user profile (calorie goal)."""
    data = request.get_json()
    user = request.current_user
    
    if 'calorie_goal' in data:
        calorie_goal = data['calorie_goal']
        if not isinstance(calorie_goal, int) or calorie_goal < 500 or calorie_goal > 10000:
            return jsonify({'error': 'Calorie goal must be between 500 and 10000'}), 400
        user.calorie_goal = calorie_goal
    
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200


@personal_bp.route('/habits', methods=['GET'])
@token_required
def get_habits():
    """Get all habits for the current user with optional filtering."""
    is_active = request.args.get('active', type=str)
    
    query = Habit.query.filter_by(user_id=request.current_user.id)
    if is_active is not None:
        query = query.filter_by(is_active=is_active.lower() == 'true')
    
    habits = query.order_by(desc(Habit.created_at)).all()
    return jsonify([habit.to_dict() for habit in habits])


@personal_bp.route('/habits', methods=['POST'])
@token_required
def create_habit():
    """Create a new habit."""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400
    
    habit = Habit(
        user_id=request.current_user.id,
        name=data['name'],
        acronym=data.get('acronym', ''),
        description=data.get('description', ''),
        frequency=data.get('frequency', 'daily'),
        target_count=data.get('target_count', 1),
        is_active=data.get('is_active', True)
    )
    
    db.session.add(habit)
    db.session.commit()
    
    return jsonify(habit.to_dict()), 201


@personal_bp.route('/habits/<int:id>', methods=['GET'])
@token_required
def get_habit(id):
    """Get a specific habit with streak information."""
    habit = Habit.query.filter_by(id=id, user_id=request.current_user.id).first_or_404()
    habit_data = habit.to_dict()
    
    # Calculate streak
    logs = HabitLog.query.filter_by(habit_id=id).order_by(desc(HabitLog.completed_at)).all()
    streak_info = calculate_streak(logs)
    habit_data['streak'] = streak_info
    
    # Get recent logs
    recent_logs = logs[:10]  # Last 10 logs
    habit_data['recent_logs'] = [log.to_dict() for log in recent_logs]
    
    return jsonify(habit_data)


@personal_bp.route('/habits/<int:id>', methods=['PUT'])
@token_required
def update_habit(id):
    """Update a habit."""
    habit = Habit.query.filter_by(id=id, user_id=request.current_user.id).first_or_404()
    data = request.get_json()
    
    if 'name' in data:
        habit.name = data['name']
    if 'acronym' in data:
        habit.acronym = data['acronym']
    if 'description' in data:
        habit.description = data['description']
    if 'frequency' in data:
        habit.frequency = data['frequency']
    if 'target_count' in data:
        habit.target_count = data['target_count']
    if 'is_active' in data:
        habit.is_active = data['is_active']
    
    habit.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(habit.to_dict())


@personal_bp.route('/habits/<int:id>', methods=['DELETE'])
@token_required
def delete_habit(id):
    """Delete a habit."""
    habit = Habit.query.filter_by(id=id, user_id=request.current_user.id).first_or_404()
    db.session.delete(habit)
    db.session.commit()
    
    return jsonify({'message': 'Habit deleted successfully'}), 200


@personal_bp.route('/habits/<int:id>/log', methods=['POST'])
@token_required
def log_habit(id):
    """Log a habit completion."""
    habit = Habit.query.filter_by(id=id, user_id=request.current_user.id).first_or_404()
    data = request.get_json() or {}
    
    # Parse completed_at if provided, otherwise use current time
    completed_at = parse_date(data.get('completed_at')) if data.get('completed_at') else datetime.utcnow()
    
    # Get status - default to 'completed' for backward compatibility
    status = data.get('status', 'completed')
    if status not in ['completed', 'failed', 'skipped']:
        status = 'completed'
    
    log = HabitLog(
        habit_id=id,
        completed_at=completed_at,
        notes=data.get('notes', ''),
        status=status
    )
    
    db.session.add(log)
    db.session.commit()
    
    # Return log with updated streak
    logs = HabitLog.query.filter_by(habit_id=id).order_by(desc(HabitLog.completed_at)).all()
    streak_info = calculate_streak(logs)
    
    return jsonify({
        'log': log.to_dict(),
        'streak': streak_info
    }), 201


@personal_bp.route('/habits/<int:habit_id>/logs/<int:log_id>', methods=['DELETE'])
@token_required
def delete_habit_log(habit_id, log_id):
    """Delete a habit log entry."""
    habit = Habit.query.filter_by(id=habit_id, user_id=request.current_user.id).first_or_404()
    log = HabitLog.query.filter_by(id=log_id, habit_id=habit_id).first_or_404()
    db.session.delete(log)
    db.session.commit()
    
    return jsonify({'message': 'Log deleted successfully'}), 200


@personal_bp.route('/habits/logs/<int:log_id>', methods=['DELETE'])
@token_required
def delete_habit_log_by_id(log_id):
    """Delete a habit log entry by log ID only."""
    log = HabitLog.query.filter_by(id=log_id).first_or_404()
    
    # Verify the log belongs to a habit owned by the current user
    habit = Habit.query.filter_by(id=log.habit_id, user_id=request.current_user.id).first_or_404()
    
    db.session.delete(log)
    db.session.commit()
    
    return jsonify({'message': 'Log deleted successfully'}), 200


# ==================== DIET ====================

@personal_bp.route('/diet/lookup', methods=['POST'])
@token_required
def lookup_nutrition():
    """Look up nutrition information for a food item."""
    data = request.get_json()
    
    if not data or not data.get('food_name'):
        return jsonify({'error': 'Food name is required'}), 400
    
    food_name = data['food_name']
    
    # Get nutrition data from API (returns list of results)
    result = nutrition_api.lookup_food(food_name)
    
    return jsonify(result), 200


@personal_bp.route('/diet', methods=['GET'])
@token_required
def get_diet_entries():
    """Get diet entries for the current user with optional filtering."""
    meal_type = request.args.get('meal_type')
    date = request.args.get('date')
    
    query = DietEntry.query.filter_by(user_id=request.current_user.id)
    
    if meal_type:
        query = query.filter_by(meal_type=meal_type)
    
    if date:
        try:
            target_date = datetime.fromisoformat(date).date()
            query = query.filter(func.date(DietEntry.consumed_at) == target_date)
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use ISO format (YYYY-MM-DD)'}), 400
    
    entries = query.order_by(desc(DietEntry.consumed_at)).all()
    return jsonify([entry.to_dict() for entry in entries])


@personal_bp.route('/diet', methods=['POST'])
@token_required
def create_diet_entry():
    """Create a new diet entry."""
    data = request.get_json()
    
    if not data or 'food_item' not in data:
        return jsonify({'error': 'Food item is required'}), 400
    
    # Nutrition data should be provided from frontend after user selects from dropdown
    calories = data.get('calories')
    protein = data.get('protein')
    carbs = data.get('carbs')
    fats = data.get('fats')
    
    # Parse consumed_at - use provided date or current datetime
    if data.get('date'):
        # If date is provided (from date picker), use it at current time
        date_obj = datetime.fromisoformat(data['date'])
        now = datetime.now()
        consumed_at = datetime.combine(date_obj.date(), now.time())
    elif data.get('consumed_at'):
        consumed_at = parse_date(data['consumed_at'])
    else:
        consumed_at = datetime.utcnow()
    
    # Get detailed nutrients if nutrition was looked up
    if data.get('calories') is None and nutrition_data:
        sugar = nutrition_data.get('sugar')
        fiber = nutrition_data.get('fiber')
        saturated_fat = nutrition_data.get('saturated_fat')
        unsaturated_fat = nutrition_data.get('unsaturated_fat')
        calcium = nutrition_data.get('calcium')
        iron = nutrition_data.get('iron')
        magnesium = nutrition_data.get('magnesium')
        sodium = nutrition_data.get('sodium')
        potassium = nutrition_data.get('potassium')
    else:
        sugar = data.get('sugar')
        fiber = data.get('fiber')
        saturated_fat = data.get('saturated_fat')
        unsaturated_fat = data.get('unsaturated_fat')
        calcium = data.get('calcium')
        iron = data.get('iron')
        magnesium = data.get('magnesium')
        sodium = data.get('sodium')
        potassium = data.get('potassium')
    
    entry = DietEntry(
        user_id=request.current_user.id,
        meal_type=data.get('meal_type', ''),
        food_item=data['food_item'],
        quantity=data.get('quantity'),
        unit=data.get('unit', 'g'),
        description=data.get('description', ''),
        calories=calories,
        protein=protein,
        carbs=carbs,
        fats=fats,
        sugar=sugar,
        fiber=fiber,
        saturated_fat=saturated_fat,
        unsaturated_fat=unsaturated_fat,
        calcium=calcium,
        iron=iron,
        magnesium=magnesium,
        sodium=sodium,
        potassium=potassium,
        consumed_at=consumed_at,
        notes=data.get('notes', '')
    )
    
    db.session.add(entry)
    db.session.commit()
    
    return jsonify(entry.to_dict()), 201


@personal_bp.route('/diet/<int:id>', methods=['GET'])
@token_required
def get_diet_entry(id):
    """Get a specific diet entry."""
    entry = DietEntry.query.filter_by(id=id, user_id=request.current_user.id).first_or_404()
    return jsonify(entry.to_dict())


@personal_bp.route('/diet/<int:id>', methods=['PUT'])
@token_required
def update_diet_entry(id):
    """Update a diet entry."""
    entry = DietEntry.query.filter_by(id=id, user_id=request.current_user.id).first_or_404()
    data = request.get_json()
    
    if 'meal_type' in data:
        entry.meal_type = data['meal_type']
    if 'food_item' in data:
        entry.food_item = data['food_item']
    if 'description' in data:
        entry.description = data['description']
    if 'calories' in data:
        entry.calories = data['calories']
    if 'protein' in data:
        entry.protein = data['protein']
    if 'carbs' in data:
        entry.carbs = data['carbs']
    if 'fats' in data:
        entry.fats = data['fats']
    if 'notes' in data:
        entry.notes = data['notes']
    if 'consumed_at' in data:
        entry.consumed_at = parse_date(data['consumed_at'])
    
    db.session.commit()
    
    return jsonify(entry.to_dict())


@personal_bp.route('/diet/<int:id>', methods=['DELETE'])
@token_required
def delete_diet_entry(id):
    """Delete a diet entry."""
    entry = DietEntry.query.filter_by(id=id, user_id=request.current_user.id).first_or_404()
    db.session.delete(entry)
    db.session.commit()
    
    return jsonify({'message': 'Diet entry deleted successfully'}), 200


@personal_bp.route('/diet/summary', methods=['GET'])
@token_required
def get_diet_summary():
    """Get nutritional summary for a specific date."""
    date_str = request.args.get('date', datetime.utcnow().strftime('%Y-%m-%d'))
    
    # Query entries for the specific date
    query = DietEntry.query.filter_by(user_id=request.current_user.id)
    
    if date_str:
        try:
            target_date = datetime.fromisoformat(date_str).date()
            query = query.filter(func.date(DietEntry.consumed_at) == target_date)
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    
    entries = query.all()
    
    total_calories = sum(e.calories or 0 for e in entries)
    total_protein = sum(e.protein or 0 for e in entries)
    total_carbs = sum(e.carbs or 0 for e in entries)
    total_fats = sum(e.fats or 0 for e in entries)
    total_sugar = sum(e.sugar or 0 for e in entries)
    total_fiber = sum(e.fiber or 0 for e in entries)
    total_saturated_fat = sum(e.saturated_fat or 0 for e in entries)
    total_unsaturated_fat = sum(e.unsaturated_fat or 0 for e in entries)
    total_calcium = sum(e.calcium or 0 for e in entries)
    total_iron = sum(e.iron or 0 for e in entries)
    total_magnesium = sum(e.magnesium or 0 for e in entries)
    total_sodium = sum(e.sodium or 0 for e in entries)
    total_potassium = sum(e.potassium or 0 for e in entries)
    
    # Get user's calorie goal and calculate percentage
    user = request.current_user
    calorie_goal = user.calorie_goal or 2000
    calorie_percentage = round((total_calories / calorie_goal) * 100, 1) if calorie_goal > 0 else 0
    
    return jsonify({
        'total_entries': len(entries),
        'total_calories': total_calories,
        'total_protein': round(total_protein, 1),
        'total_carbs': round(total_carbs, 1),
        'total_fats': round(total_fats, 1),
        'total_sugar': round(total_sugar, 1),
        'total_fiber': round(total_fiber, 1),
        'total_saturated_fat': round(total_saturated_fat, 1),
        'total_unsaturated_fat': round(total_unsaturated_fat, 1),
        'total_calcium': round(total_calcium, 1),
        'total_iron': round(total_iron, 1),
        'total_magnesium': round(total_magnesium, 1),
        'total_sodium': round(total_sodium, 1),
        'total_potassium': round(total_potassium, 1),
        'average_calories_per_entry': total_calories / len(entries) if entries else 0,
        'calorie_goal': calorie_goal,
        'calorie_percentage': calorie_percentage
    })

