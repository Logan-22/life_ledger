# Life Ledger - Complete Flask Application

## ✅ Project Successfully Created!

Your scalable Flask application for tracking life activities is fully set up and ready to use.

## 📁 Project Structure

```
life_ledger/
├── app/
│   ├── __init__.py              # Application factory with blueprints
│   ├── models/
│   │   └── __init__.py          # Database models (Category, Habit, DietEntry, HabitLog)
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── categories.py        # Category management API
│   │   └── personal.py          # Personal tracking API (habits & diet)
│   └── utils/
│       ├── __init__.py
│       └── helpers.py           # Utility functions (streak calculation, date parsing)
├── .venv/                       # Python virtual environment
├── config.py                    # Configuration for dev/prod/test environments
├── run.py                       # Application entry point
├── init_db.py                   # Database initialization script
├── test_api.py                  # API test suite
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables
├── .gitignore                   # Git ignore file
├── README.md                    # Full documentation
├── QUICKSTART.md                # Quick start guide
└── examples.ps1                 # PowerShell API examples
```

## 🚀 How to Run

### 1. Start the Server

Open a PowerShell terminal and run:

```powershell
cd c:\Users\logan\Documents\life_ledger
.\.venv\Scripts\python.exe run.py
```

The server will start at `http://localhost:5000`

### 2. Test the API (in a separate terminal)

Open a NEW PowerShell terminal and try these commands:

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:5000/health"

# View all categories
Invoke-RestMethod -Uri "http://localhost:5000/api/categories"

# Create a habit
$habit = @{
    name = "Daily Exercise"
    description = "30 minutes of cardio"
    frequency = "daily"
    target_count = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/personal/habits" -Method Post -Body $habit -ContentType "application/json"

# Log habit completion
$log = @{ notes = "Completed morning run" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/personal/habits/1/log" -Method Post -Body $log -ContentType "application/json"

# Check streak
Invoke-RestMethod -Uri "http://localhost:5000/api/personal/habits/1"
```

## 🎯 Key Features Implemented

### Personal Category (Fully Implemented)
- ✅ **Habits Tracking**: Create, update, delete, and track habits
- ✅ **Automatic Streak Calculation**: Current and longest streaks
- ✅ **Habit Logging**: Log completion with timestamps and notes
- ✅ **Diet Tracking**: Log meals with nutritional information
- ✅ **Diet Summaries**: Get nutritional totals for date ranges
- ✅ **Date Filtering**: Filter entries by date and meal type

### Architecture (Scalable Design)
- ✅ **Blueprint Pattern**: Easy to add new categories
- ✅ **Factory Pattern**: Clean application initialization
- ✅ **SQLAlchemy ORM**: Database abstraction
- ✅ **Flask-Migrate**: Database migration support
- ✅ **CORS Enabled**: Ready for frontend integration
- ✅ **Environment-based Config**: Dev, prod, test configurations

## 📊 Database Schema

### Categories Table
- `id`: Primary key
- `name`: Unique category name
- `description`: Category description
- `created_at`, `updated_at`: Timestamps

### Habits Table
- `id`: Primary key
- `name`: Habit name
- `description`: Details about the habit
- `frequency`: daily, weekly, or custom
- `target_count`: Times to complete per frequency period
- `is_active`: Boolean flag
- `created_at`, `updated_at`: Timestamps

### HabitLogs Table
- `id`: Primary key
- `habit_id`: Foreign key to habits
- `completed_at`: Completion timestamp
- `notes`: Optional notes

### DietEntries Table
- `id`: Primary key
- `meal_type`: breakfast, lunch, dinner, snack
- `food_item`: Name of the food
- `description`: Details
- `calories`, `protein`, `carbs`, `fats`: Nutritional data
- `consumed_at`: Timestamp
- `notes`: Optional notes

## 🔧 API Endpoints

### Root & Health
- `GET /` - API information
- `GET /health` - Health check

### Categories (`/api/categories`)
- `GET /` - List all categories
- `POST /` - Create category
- `GET /<id>` - Get specific category
- `PUT /<id>` - Update category
- `DELETE /<id>` - Delete category

### Habits (`/api/personal/habits`)
- `GET /` - List habits (filter: `?active=true`)
- `POST /` - Create habit
- `GET /<id>` - Get habit with streak info
- `PUT /<id>` - Update habit
- `DELETE /<id>` - Delete habit
- `POST /<id>/log` - Log habit completion
- `DELETE /<habit_id>/logs/<log_id>` - Delete log entry

### Diet (`/api/personal/diet`)
- `GET /` - List entries (filter: `?meal_type=breakfast&date=2025-11-16`)
- `POST /` - Create entry
- `GET /<id>` - Get specific entry
- `PUT /<id>` - Update entry
- `DELETE /<id>` - Delete entry
- `GET /summary` - Get nutritional summary (filter: `?start_date=...&end_date=...`)

## 🎨 How to Extend with New Categories

Adding a new category (e.g., Finance) is simple:

1. **Add models** in `app/models/__init__.py`:
```python
class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100))
    # ... more fields
```

2. **Create blueprint** in `app/routes/finance.py`:
```python
from flask import Blueprint
finance_bp = Blueprint('finance', __name__)

@finance_bp.route('/transactions', methods=['GET'])
def get_transactions():
    # Implementation
    pass
```

3. **Register blueprint** in `app/__init__.py`:
```python
from app.routes.finance import finance_bp
app.register_blueprint(finance_bp, url_prefix='/api/finance')
```

## 📦 Dependencies Installed
- Flask 3.0.0 - Web framework
- Flask-SQLAlchemy 3.1.1 - Database ORM
- Flask-Migrate 4.0.5 - Database migrations
- Flask-CORS 4.0.0 - Cross-origin support
- python-dotenv 1.0.0 - Environment variables
- marshmallow 3.20.1 - Serialization
- requests - HTTP client (for testing)

## 🔐 Security Notes

For production deployment:
1. Change `SECRET_KEY` in `.env`
2. Use a production database (PostgreSQL, MySQL)
3. Use a production WSGI server (Gunicorn, uWSGI)
4. Add authentication/authorization
5. Enable HTTPS
6. Add rate limiting

## 🚀 Next Steps

1. **Frontend**: Build a web UI with React/Vue/Angular
2. **Authentication**: Add user accounts and JWT auth
3. **More Categories**: Finance, Fitness, Work, Learning
4. **Analytics**: Add charts and statistics
5. **Notifications**: Add reminders and alerts
6. **Mobile App**: Build with React Native or Flutter
7. **Export**: Add CSV/JSON export functionality
8. **Deploy**: Deploy to Heroku, AWS, or DigitalOcean

## 📝 Notes

- The database is automatically created when you run `init_db.py`
- Initial categories (Personal, Finance, Fitness, Work) are seeded
- Flask debug mode is enabled for development
- The server auto-reloads when code changes
- All timestamps use UTC
- Streak calculation runs from most recent to oldest logs

## 🎉 Success!

Your Life Ledger application is ready! You can now:
- Track daily habits with automatic streak calculation
- Log diet with nutritional information
- Add new tracking categories as needed
- Build a frontend or mobile app
- Extend the API with new features

**Start the server and begin tracking your life!**
