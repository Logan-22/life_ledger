#!/usr/bin/env python3
"""Test if Python@12 password matches the stored hash."""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User
from flask_bcrypt import Bcrypt

app = create_app()
bcrypt = Bcrypt(app)

with app.app_context():
    user = User.query.filter_by(email='admin@lifeledger.com').first()
    
    if user:
        print(f"Testing password: Python@12")
        print(f"Stored hash: {user.password_hash}")
        result = bcrypt.check_password_hash(user.password_hash, 'Python@12')
        if result:
            print("✓ PASSWORD MATCHES - Login should work!")
        else:
            print("✗ Password does not match - There's a hashing issue")
    else:
        print("Admin user not found")
