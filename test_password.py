#!/usr/bin/env python
"""Test script to verify password works."""
import bcrypt
import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / 'instance' / 'life_ledger.db'

# Get the password hash from database
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()
cursor.execute("SELECT password_hash FROM users WHERE email='admin@lifeledger.com'")
result = cursor.fetchone()
conn.close()

if not result:
    print("User not found!")
    exit(1)

password_hash = result[0]
print(f"Current password hash in DB: {password_hash[:40]}...")

# Test password
test_password = input("\nEnter the password you just set during reset: ")

try:
    if bcrypt.checkpw(test_password.encode('utf-8'), password_hash.encode('utf-8')):
        print("\n✓ Password is CORRECT! Login should work.")
    else:
        print("\n✗ Password is INCORRECT. The hash doesn't match.")
except Exception as e:
    print(f"\nError checking password: {e}")
