"""Script to create the notifications table if it doesn't exist"""
from website import create_app, db
from website.models import Notification
import sys

app = create_app()

with app.app_context():
    try:
        # Create all tables
        db.create_all()
        print("✅ Notifications table created successfully!")
    except Exception as e:
        print(f"❌ Error creating notifications table: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
