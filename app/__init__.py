from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_login import LoginManager
from flask_bcrypt import Bcrypt
from config import config

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
bcrypt = Bcrypt()


def create_app(config_name='default'):
    """Application factory pattern."""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    login_manager.init_app(app)
    bcrypt.init_app(app)
    
    # Login manager config
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page'
    
    # Import models
    from app.models import User, Category, Habit, HabitLog, DietEntry, Investment
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.categories import categories_bp
    from app.routes.personal import personal_bp
    from app.routes.finance import finance_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(personal_bp, url_prefix='/api/personal')
    app.register_blueprint(finance_bp, url_prefix='/api/finance')
    
    # Root endpoint - serve web UI
    @app.route('/')
    def index():
        return app.send_static_file('index.html')
    
    # Health check
    @app.route('/health')
    def health():
        return {'status': 'healthy'}
    
    return app
