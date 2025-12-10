"""Initialize the database with tables and seed data."""
from app import create_app, db
from app.models import Category

def init_database():
    """Create all database tables and add initial data."""
    app = create_app('development')
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        
        # Check if categories already exist
        if Category.query.count() == 0:
            print("Adding initial categories...")
            
            # Add Personal category
            personal = Category(
                name='Personal',
                description='Track personal habits, diet, and daily activities'
            )
            db.session.add(personal)
            
            # Add placeholder for future categories
            categories_to_add = [
                Category(name='Finance', description='Track income, expenses, and financial goals'),
                Category(name='Fitness', description='Track workouts, exercises, and physical activities'),
                Category(name='Work', description='Track tasks, projects, and professional development'),
            ]
            
            for cat in categories_to_add:
                db.session.add(cat)
            
            db.session.commit()
            print("Initial categories added successfully!")
        else:
            print("Categories already exist, skipping seed data.")
        
        print("\nDatabase initialization complete!")
        print("You can now run the app with: python run.py")


if __name__ == '__main__':
    init_database()
