#!/usr/bin/env python
"""Migration script to add reset token fields to users table."""

import sqlite3
from pathlib import Path

# Get database path
db_path = Path(__file__).parent / 'instance' / 'life_ledger.db'

if not db_path.exists():
    print(f"Database not found at {db_path}")
    exit(1)

try:
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'reset_token' not in columns:
        print("Adding reset_token column to users table...")
        cursor.execute('ALTER TABLE users ADD COLUMN reset_token VARCHAR(255)')
        print("✓ Added reset_token column")
    else:
        print("reset_token column already exists")
    
    if 'reset_token_expiry' not in columns:
        print("Adding reset_token_expiry column to users table...")
        cursor.execute('ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME')
        print("✓ Added reset_token_expiry column")
    else:
        print("reset_token_expiry column already exists")
    
    conn.commit()
    conn.close()
    print("\n✓ Migration completed successfully!")
    
except sqlite3.Error as e:
    print(f"✗ Database error: {e}")
    exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)
