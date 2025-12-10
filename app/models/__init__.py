from datetime import datetime
from app import db
from flask_login import UserMixin


class User(db.Model, UserMixin):
    """User model for authentication."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    calorie_goal = db.Column(db.Integer, default=2000)  # Daily calorie goal
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    habits = db.relationship('Habit', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    diet_entries = db.relationship('DietEntry', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'calorie_goal': self.calorie_goal,
            'created_at': self.created_at.isoformat()
        }


class Category(db.Model):
    """Category model for organizing different tracking types."""
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Habit(db.Model):
    """Habit tracking model."""
    __tablename__ = 'habits'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    acronym = db.Column(db.String(10), nullable=True)  # Short acronym for calendar display
    description = db.Column(db.Text)
    frequency = db.Column(db.String(50), default='daily')  # daily, weekly, custom
    target_count = db.Column(db.Integer, default=1)  # times per frequency period
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationship to logs
    logs = db.relationship('HabitLog', backref='habit', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'acronym': self.acronym,
            'description': self.description,
            'frequency': self.frequency,
            'target_count': self.target_count,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class HabitLog(db.Model):
    """Log entries for habit completion."""
    __tablename__ = 'habit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habits.id'), nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='completed')  # 'completed', 'failed', 'skipped'
    
    def to_dict(self):
        return {
            'id': self.id,
            'habit_id': self.habit_id,
            'completed_at': self.completed_at.isoformat(),
            'notes': self.notes,
            'status': self.status or 'completed'
        }


class DietEntry(db.Model):
    """Diet tracking model."""
    __tablename__ = 'diet_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    meal_type = db.Column(db.String(50))  # breakfast, lunch, dinner, snack
    food_item = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Float)  # quantity/serving size
    unit = db.Column(db.String(50))  # g, oz, cup, etc.
    description = db.Column(db.Text)
    calories = db.Column(db.Integer)
    protein = db.Column(db.Float)
    carbs = db.Column(db.Float)
    fats = db.Column(db.Float)
    sugar = db.Column(db.Float)
    fiber = db.Column(db.Float)
    saturated_fat = db.Column(db.Float)
    unsaturated_fat = db.Column(db.Float)
    calcium = db.Column(db.Float)
    iron = db.Column(db.Float)
    magnesium = db.Column(db.Float)
    sodium = db.Column(db.Float)
    potassium = db.Column(db.Float)
    consumed_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'meal_type': self.meal_type,
            'food_item': self.food_item,
            'description': self.description,
            'calories': self.calories,
            'protein': self.protein,
            'carbs': self.carbs,
            'fats': self.fats,
            'sugar': self.sugar,
            'fiber': self.fiber,
            'saturated_fat': self.saturated_fat,
            'unsaturated_fat': self.unsaturated_fat,
            'calcium': self.calcium,
            'iron': self.iron,
            'magnesium': self.magnesium,
            'sodium': self.sodium,
            'potassium': self.potassium,
            'consumed_at': self.consumed_at.isoformat(),
            'notes': self.notes
        }


class Investment(db.Model):
    """Investment tracking model."""
    __tablename__ = 'investments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    instrument_type = db.Column(db.String(50), nullable=False)  # stock, mutual_fund, fd, rd, gold, crypto, etc.
    instrument_name = db.Column(db.String(200), nullable=False)  # Name or ticker symbol
    symbol = db.Column(db.String(50))  # Stock symbol (optional)
    quantity = db.Column(db.Float, nullable=False)  # Number of units
    buy_price = db.Column(db.Float, nullable=False)  # Price per unit at purchase
    buy_date = db.Column(db.Date, nullable=False)  # Date of purchase
    total_invested = db.Column(db.Float, nullable=False)  # Total amount invested
    current_price = db.Column(db.Float)  # Current price per unit (updated)
    current_value = db.Column(db.Float)  # Current total value
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'instrument_type': self.instrument_type,
            'instrument_name': self.instrument_name,
            'symbol': self.symbol,
            'quantity': self.quantity,
            'buy_price': self.buy_price,
            'buy_date': self.buy_date.isoformat() if self.buy_date else None,
            'total_invested': self.total_invested,
            'current_price': self.current_price,
            'current_value': self.current_value,
            'returns': round((self.current_value - self.total_invested) if self.current_value else 0, 2),
            'returns_percent': round(((self.current_value - self.total_invested) / self.total_invested * 100) if self.current_value and self.total_invested > 0 else 0, 2),
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }
