"""Add investments table to the database."""
import sqlite3
from pathlib import Path

# Path to the database
DB_PATH = Path(__file__).parent / 'instance' / 'life_ledger.db'

def add_investments_table():
    """Add investments table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create investments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS investments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            instrument_type VARCHAR(50) NOT NULL,
            instrument_name VARCHAR(200) NOT NULL,
            symbol VARCHAR(50),
            quantity REAL NOT NULL,
            buy_price REAL NOT NULL,
            buy_date DATE NOT NULL,
            total_invested REAL NOT NULL,
            current_price REAL,
            current_value REAL,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✓ Investments table created successfully")

if __name__ == '__main__':
    add_investments_table()
