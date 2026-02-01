#!/usr/bin/env python3
"""Test password verification with the database."""

import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User
from flask_bcrypt import Bcrypt

app = create_app()

with app.app_context():
    # Get admin user
    user = User.query.filter_by(email='admin@lifeledger.com').first()
    
    if user:
        print(f"User found: {user.email}")
        print(f"Password hash in DB: {user.password_hash}")
        
        # Test with different passwords
        test_passwords = [
            "test123",
            "password123",
            "admin123",
            "lifeledger123",
        ]
        
        bcrypt = Bcrypt(app)
        for pwd in test_passwords:
            try:
                result = bcrypt.check_password_hash(user.password_hash, pwd)
                status = "✓ MATCH" if result else "✗ no match"
                print(f"  Testing '{pwd}': {status}")
            except Exception as e:
                print(f"  Testing '{pwd}': ERROR - {str(e)}")
    else:
        print("Admin user not found")
