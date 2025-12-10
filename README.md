# Life Ledger

A modern, scalable Flask application for tracking everything in your life. Features user authentication, automatic nutrition lookup, and a beautiful dark-themed UI with multi-category support.

## ✨ Key Features

- **🔐 User Authentication**: Secure registration and login with JWT tokens
- **🎨 Modern UI**: Dark theme with vibrant gradients and sidebar navigation
- **🍎 Smart Nutrition**: Automatic calorie and macro lookup via USDA/Nutritionix APIs
- **📊 Dashboard**: Real-time statistics and progress tracking
- **🎯 Habits**: Track daily habits with automatic streak calculation
- **🍽️ Diet**: Log meals with intelligent nutrition data
- **🚀 Multi-Category**: Personal tracking active, Finance/Fitness/Work coming soon
- **📱 Responsive**: Works perfectly on desktop, tablet, and mobile

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
copy .env.example .env
# Edit .env with your configuration
```

4. Initialize the database:
```bash
python init_db.py
```

5. Run the application:
```bash
python run.py
```

The app will be available at `http://localhost:5000`

## API Endpoints

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create a new category
- `GET /api/categories/<id>` - Get category details
- `PUT /api/categories/<id>` - Update category
- `DELETE /api/categories/<id>` - Delete category

### Habits
- `GET /api/personal/habits` - List all habits
- `POST /api/personal/habits` - Create a new habit
- `GET /api/personal/habits/<id>` - Get habit details with streak info
- `PUT /api/personal/habits/<id>` - Update habit
- `DELETE /api/personal/habits/<id>` - Delete habit
- `POST /api/personal/habits/<id>/log` - Log habit completion

### Diet
- `GET /api/personal/diet` - List diet entries
- `POST /api/personal/diet` - Create diet entry
- `GET /api/personal/diet/<id>` - Get diet entry details
- `PUT /api/personal/diet/<id>` - Update diet entry
- `DELETE /api/personal/diet/<id>` - Delete diet entry

## Project Structure

```
life_ledger/
├── app/
│   ├── __init__.py          # App factory
│   ├── models/              # Database models
│   ├── routes/              # API blueprints
│   └── utils/               # Helper functions
├── config.py                # Configuration
├── requirements.txt         # Dependencies
├── run.py                   # Application entry point
└── init_db.py              # Database initialization
```

## Future Enhancements

- Authentication and user management
- Additional categories (Finance, Fitness, Work, etc.)
- Data visualization and analytics
- Export/import functionality
- Reminders and notifications
