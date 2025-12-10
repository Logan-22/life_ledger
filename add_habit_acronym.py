"""Migration script to add acronym column to habits table."""
import sqlite3
from pathlib import Path

# Get database path
db_path = Path(__file__).parent / 'instance' / 'life_ledger.db'

print(f"Adding acronym column to habits table in {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("PRAGMA table_info(habits)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'acronym' not in columns:
        # Add the acronym column
        cursor.execute("""
            ALTER TABLE habits 
            ADD COLUMN acronym VARCHAR(10)
        """)
        
        # Generate default acronyms for existing habits
        cursor.execute("SELECT id, name FROM habits")
        habits = cursor.fetchall()
        
        for habit_id, name in habits:
            # Generate acronym from name
            words = name.strip().split()
            if len(words) == 1:
                acronym = name[:2].upper()
            else:
                acronym = ''.join(w[0] for w in words[:2]).upper()
            
            cursor.execute("UPDATE habits SET acronym = ? WHERE id = ?", (acronym, habit_id))
        
        conn.commit()
        print(f"✅ Successfully added acronym column and generated acronyms for {len(habits)} existing habits")
    else:
        print("⚠️ Column 'acronym' already exists in habits table")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
