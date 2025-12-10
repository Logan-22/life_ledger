# Quick Start Guide - Life Ledger

## 🚀 Your app is ready!

The Flask server is now running at: **http://localhost:5000**

## Project Structure
```
life_ledger/
├── app/
│   ├── __init__.py              # App factory
│   ├── models/
│   │   └── __init__.py          # Database models (Category, Habit, DietEntry)
│   ├── routes/
│   │   ├── categories.py        # Category management API
│   │   └── personal.py          # Personal tracking API (habits, diet)
│   └── utils/
│       └── helpers.py           # Utility functions (streak calculation, etc.)
├── config.py                    # Configuration settings
├── run.py                       # Application entry point
├── init_db.py                   # Database initialization script
├── requirements.txt             # Python dependencies
└── README.md                    # Full documentation
```

## Quick Test

Open a new PowerShell terminal and try these commands:

### 1. Check the API is running
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health"
```

### 2. View all categories
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/categories"
```

### 3. Create your first habit
```powershell
$habit = @{
    name = "Daily Reading"
    description = "Read for 30 minutes"
    frequency = "daily"
    target_count = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/personal/habits" -Method Post -Body $habit -ContentType "application/json"
```

### 4. Log habit completion
```powershell
$log = @{
    notes = "Finished chapter 3"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/personal/habits/1/log" -Method Post -Body $log -ContentType "application/json"
```

### 5. Check your streak
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/personal/habits/1"
```

### 6. Add a diet entry
```powershell
$diet = @{
    meal_type = "lunch"
    food_item = "Chicken Salad"
    calories = 450
    protein = 35
    carbs = 25
    fats = 15
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/personal/diet" -Method Post -Body $diet -ContentType "application/json"
```

## Key Features

### ✅ Implemented (Personal Category)
- **Habits Tracking**: Create, track, and log daily habits
- **Streak Calculation**: Automatic current and longest streak tracking
- **Diet Logging**: Track meals with nutritional information
- **Diet Summary**: Get nutritional summaries for date ranges
- **Category Management**: Organize tracking types

### 🔮 Ready for Extension
The architecture supports easy addition of new categories:
- Finance (income, expenses, budgets)
- Fitness (workouts, exercises)
- Work (tasks, projects)
- Learning (books, courses)
- And any custom category you want!

## API Endpoints Reference

### Root & Health
- `GET /` - API info
- `GET /health` - Health check

### Categories
- `GET /api/categories` - List all
- `POST /api/categories` - Create
- `GET /api/categories/<id>` - Get one
- `PUT /api/categories/<id>` - Update
- `DELETE /api/categories/<id>` - Delete

### Habits
- `GET /api/personal/habits` - List all
- `POST /api/personal/habits` - Create
- `GET /api/personal/habits/<id>` - Get with streak
- `PUT /api/personal/habits/<id>` - Update
- `DELETE /api/personal/habits/<id>` - Delete
- `POST /api/personal/habits/<id>/log` - Log completion
- `DELETE /api/personal/habits/<habit_id>/logs/<log_id>` - Delete log

### Diet
- `GET /api/personal/diet` - List all (filter: ?meal_type=breakfast&date=2025-11-16)
- `POST /api/personal/diet` - Create
- `GET /api/personal/diet/<id>` - Get one
- `PUT /api/personal/diet/<id>` - Update
- `DELETE /api/personal/diet/<id>` - Delete
- `GET /api/personal/diet/summary` - Nutritional summary (filter: ?start_date=...&end_date=...)

## Development Tips

### Stop the server
Press `Ctrl+C` in the terminal where the server is running

### View database
The SQLite database is at: `life_ledger.db`
You can view it with any SQLite browser

### Reset database
```powershell
Remove-Item life_ledger.db
C:/Users/logan/Documents/life_ledger/.venv/Scripts/python.exe init_db.py
```

### Add a new category blueprint
1. Create new file in `app/routes/`
2. Define blueprint and routes
3. Register in `app/__init__.py`
4. Create models in `app/models/`

## Next Steps

1. **Test the API** - Use the examples above or `examples.ps1`
2. **Build a frontend** - Create a web UI or mobile app
3. **Add authentication** - Implement user accounts
4. **Extend categories** - Add Finance, Fitness, etc.
5. **Deploy** - Use Gunicorn + Nginx for production

Happy tracking! 📊
