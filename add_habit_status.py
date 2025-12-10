"""Add status column to habit_logs table."""
import sqlite3

def add_status_column():
    conn = sqlite3.connect('instance/life_ledger.db')
    cursor = conn.cursor()
    
    try:
        # Add status column with default 'completed' for existing records
        cursor.execute("""
            ALTER TABLE habit_logs 
            ADD COLUMN status TEXT DEFAULT 'completed'
        """)
        
        conn.commit()
        print("✅ Successfully added 'status' column to habit_logs table")
        
        # Verify the change
        cursor.execute("PRAGMA table_info(habit_logs)")
        columns = cursor.fetchall()
        print("\nCurrent habit_logs columns:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
            
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("⚠️  'status' column already exists")
        else:
            print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    add_status_column()
