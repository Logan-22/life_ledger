"""
Script to add detailed nutrient columns to diet_entries table.
Run this to add sugar, fiber, saturated_fat, unsaturated_fat, calcium, iron, magnesium, sodium, potassium columns.
"""
from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Add new columns to diet_entries table
        with db.engine.connect() as conn:
            # Check if columns exist before adding
            columns_to_add = {
                'sugar': 'FLOAT',
                'fiber': 'FLOAT',
                'saturated_fat': 'FLOAT',
                'unsaturated_fat': 'FLOAT',
                'calcium': 'FLOAT',
                'iron': 'FLOAT',
                'magnesium': 'FLOAT',
                'sodium': 'FLOAT',
                'potassium': 'FLOAT'
            }
            
            for column_name, column_type in columns_to_add.items():
                try:
                    conn.execute(text(f'ALTER TABLE diet_entries ADD COLUMN {column_name} {column_type}'))
                    conn.commit()
                    print(f"✓ Added column: {column_name}")
                except Exception as e:
                    if 'duplicate column name' in str(e).lower() or 'already exists' in str(e).lower():
                        print(f"• Column {column_name} already exists, skipping")
                    else:
                        print(f"✗ Error adding {column_name}: {e}")
        
        print("\n✅ Database migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
