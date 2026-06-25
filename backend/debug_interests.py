#!/usr/bin/env python3
"""
Debug script to check interests and signup process
"""
import os
import sys
from flask import Flask

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from website import create_app, db
from website.models import Interest, Profile, User

def check_interests():
    """Check if interests exist in database"""
    app = create_app()
    
    with app.app_context():
        print("🔍 Checking interests in database...")
        
        # Count total interests
        total_interests = Interest.query.count()
        print(f"📊 Total interests in database: {total_interests}")
        
        if total_interests == 0:
            print("❌ No interests found! Run seed_interests.py first")
            return False
            
        # Show some sample interests
        sample_interests = Interest.query.limit(10).all()
        print("📋 Sample interests:")
        for interest in sample_interests:
            print(f"   - {interest.name} ({interest.category})")
            
        # Check specific interests from your test
        test_interests = [
            "Traveling", "Reading / Books", "Music", 
            "Sports", "Cooking", "Movies"
        ]
        
        print("\n🎯 Checking test interests:")
        missing_interests = []
        for interest_name in test_interests:
            interest = Interest.query.filter_by(name=interest_name).first()
            if interest:
                print(f"   ✅ Found: {interest_name}")
            else:
                print(f"   ❌ Missing: {interest_name}")
                missing_interests.append(interest_name)
                
        if missing_interests:
            print(f"\n⚠️  Missing interests: {missing_interests}")
            print("💡 Available interests that match:")
            for missing in missing_interests:
                # Try to find similar interests
                similar = Interest.query.filter(Interest.name.ilike(f"%{missing.split(' ')[0]}%")).all()
                if similar:
                    for s in similar:
                        print(f"      - {s.name}")
        
        return len(missing_interests) == 0

def check_profiles():
    """Check existing profiles and their interests"""
    app = create_app()
    
    with app.app_context():
        print("\n👤 Checking profiles...")
        
        profiles = Profile.query.all()
        print(f"📊 Total profiles: {len(profiles)}")
        
        for profile in profiles:
            user = User.query.get(profile.user_id)
            interests = [i.name for i in profile.interests]
            print(f"   Profile {profile.id} (User: {user.username if user else 'N/A'})")
            print(f"      Interests: {interests if interests else 'No interests'}")

if __name__ == '__main__':
    print("🔧 Debug: Interests and Profiles")
    print("=" * 40)
    
    interests_ok = check_interests()
    check_profiles()
    
    if not interests_ok:
        print("\n🚀 To fix missing interests, run:")
        print("   python seed_interests.py")