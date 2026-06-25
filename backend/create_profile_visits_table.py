#!/usr/bin/env python3
"""
Script to create the missing profile_visits table
"""

import os
import sys
from website import create_app, db
from website.models import ProfileVisit

def create_profile_visits_table():
    """Create the profile_visits table and any other missing tables"""
    app = create_app()
    
    with app.app_context():
        print("🔍 Checking existing tables...")
        
        # Check if profile_visits table exists
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        print(f"📋 Existing tables: {existing_tables}")
        
        if 'profile_visits' not in existing_tables:
            print("🏗️  Creating profile_visits table...")
            try:
                # Create only the ProfileVisit table
                ProfileVisit.__table__.create(db.engine, checkfirst=True)
                print("✅ profile_visits table created successfully!")
            except Exception as e:
                print(f"❌ Error creating profile_visits table: {e}")
                return False
        else:
            print("✅ profile_visits table already exists!")
        
        # Create any other missing tables
        print("🏗️  Creating any other missing tables...")
        try:
            db.create_all()
            print("✅ All tables created/verified successfully!")
            return True
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            return False

if __name__ == "__main__":
    success = create_profile_visits_table()
    if success:
        print("🎉 Database setup completed successfully!")
        sys.exit(0)
    else:
        print("💥 Database setup failed!")
        sys.exit(1)