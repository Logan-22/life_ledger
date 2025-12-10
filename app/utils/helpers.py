from datetime import datetime, timedelta


def calculate_streak(logs):
    """
    Calculate current streak and longest streak for habit logs.
    
    Args:
        logs: List of HabitLog objects ordered by completed_at DESC
        
    Returns:
        dict with current_streak, longest_streak, and last_completed
    """
    if not logs:
        return {
            'current_streak': 0,
            'longest_streak': 0,
            'last_completed': None
        }
    
    # Get unique dates from logs
    dates = []
    for log in logs:
        log_date = log.completed_at.date()
        if log_date not in dates:
            dates.append(log_date)
    
    # Sort dates in descending order
    dates.sort(reverse=True)
    
    if not dates:
        return {
            'current_streak': 0,
            'longest_streak': 0,
            'last_completed': None
        }
    
    # Calculate current streak
    current_streak = 0
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    
    # Check if streak is still active (completed today or yesterday)
    if dates[0] == today or dates[0] == yesterday:
        current_streak = 1
        expected_date = dates[0] - timedelta(days=1)
        
        for i in range(1, len(dates)):
            if dates[i] == expected_date:
                current_streak += 1
                expected_date = dates[i] - timedelta(days=1)
            else:
                break
    
    # Calculate longest streak
    longest_streak = 1
    temp_streak = 1
    
    for i in range(1, len(dates)):
        if dates[i] == dates[i-1] - timedelta(days=1):
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 1
    
    return {
        'current_streak': current_streak,
        'longest_streak': max(longest_streak, current_streak),
        'last_completed': dates[0].isoformat() if dates else None
    }


def parse_date(date_string):
    """
    Parse date string to datetime object.
    Supports ISO format and common date formats.
    
    Args:
        date_string: String representation of date
        
    Returns:
        datetime object
    """
    if isinstance(date_string, datetime):
        return date_string
    
    try:
        # Try ISO format first
        return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        pass
    
    # Try common formats
    formats = [
        '%Y-%m-%d',
        '%Y-%m-%d %H:%M:%S',
        '%Y/%m/%d',
        '%d-%m-%Y',
        '%d/%m/%Y'
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_string, fmt)
        except ValueError:
            continue
    
    # If all else fails, return current time
    return datetime.utcnow()


def validate_habit_data(data):
    """
    Validate habit creation/update data.
    
    Args:
        data: Dictionary with habit data
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not data:
        return False, "No data provided"
    
    if 'name' in data and (not data['name'] or not data['name'].strip()):
        return False, "Name cannot be empty"
    
    if 'frequency' in data and data['frequency'] not in ['daily', 'weekly', 'custom']:
        return False, "Frequency must be 'daily', 'weekly', or 'custom'"
    
    if 'target_count' in data:
        try:
            count = int(data['target_count'])
            if count < 1:
                return False, "Target count must be at least 1"
        except (ValueError, TypeError):
            return False, "Target count must be a valid integer"
    
    return True, None


def validate_diet_data(data):
    """
    Validate diet entry data.
    
    Args:
        data: Dictionary with diet entry data
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not data:
        return False, "No data provided"
    
    if 'food_item' in data and (not data['food_item'] or not data['food_item'].strip()):
        return False, "Food item cannot be empty"
    
    numeric_fields = ['calories', 'protein', 'carbs', 'fats']
    for field in numeric_fields:
        if field in data and data[field] is not None:
            try:
                value = float(data[field])
                if value < 0:
                    return False, f"{field.capitalize()} cannot be negative"
            except (ValueError, TypeError):
                return False, f"{field.capitalize()} must be a valid number"
    
    return True, None
