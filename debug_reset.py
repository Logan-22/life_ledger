#!/usr/bin/env python
"""Debug script to check password hash updates."""
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / 'instance' / 'life_ledger.db'

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# List all users with password hashes
print("--- Users in database with password hashes ---")
cursor.execute("SELECT id, username, email, password_hash, reset_token FROM users")
for row in cursor.fetchall():
    user_id, username, email, pwd_hash, token = row
    pwd_preview = pwd_hash[:30] + '...' if pwd_hash else 'None'
    token_preview = token[:20] + '...' if token else 'None'
    print(f"ID: {user_id}")
    print(f"  Username: {username}")
    print(f"  Email: {email}")
    print(f"  Password Hash: {pwd_preview}")
    print(f"  Reset Token: {token_preview}")
    print()

conn.close()
