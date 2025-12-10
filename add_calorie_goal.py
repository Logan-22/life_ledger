"""
Migration script to add calorie_goal column to users table.
"""
import sqlite3
from pathlib import Path

def add_calorie_goal_column():
    """Add calorie_goal column to users table."""
    db_path = Path(__file__).parent / 'instance' / 'life_ledger.db'
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'calorie_goal' in columns:
            print("Column 'calorie_goal' already exists in users table")
        else:
            # Add calorie_goal column with default value of 2000
            cursor.execute("ALTER TABLE users ADD COLUMN calorie_goal INTEGER DEFAULT 2000")
            print("Added 'calorie_goal' column to users table")
            
            # Set default value for existing users
            cursor.execute("UPDATE users SET calorie_goal = 2000 WHERE calorie_goal IS NULL")
            print("Set default calorie goal (2000) for existing users")
        
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    add_calorie_goal_column()
