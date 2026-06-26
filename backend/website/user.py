from flask import Blueprint, render_template, request, flash, redirect, jsonify, current_app, make_response
import string
from .models import Profile, User, Interest, ProfileVisit, Swipe, Report
from werkzeug.security import generate_password_hash, check_password_hash
from . import db, mail
import secrets
from flask_login import login_user, logout_user, login_required, current_user as curr
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask_mail import Message
from flask_login import current_user
from .auth import token_required


user = Blueprint('user', __name__)

@user.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint to verify backend connectivity"""
    response = make_response(jsonify({"status": "ok", "message": "Backend is running"}), 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Handle preflight requests for profile visits
@user.route('/profile/visits', methods=['OPTIONS'])
def preflight_profile_visits():
    """Handle preflight requests for profile visits endpoint"""
    response = make_response('', 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Test endpoint without authentication to isolate CORS issues
@user.route('/test', methods=['GET'])
def test_endpoint():
    """Simple test endpoint without authentication"""
    response = make_response(jsonify({"message": "Test endpoint works", "cors": "enabled"}), 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Test profile visits endpoint without authentication
@user.route('/test-profile-visits', methods=['GET'])
def test_profile_visits():
    """Test profile visits endpoint without authentication to check CORS"""
    response = make_response(jsonify([{
        "message": "This is a test profile visits endpoint",
        "cors": "enabled",
        "auth": "disabled"
    }]), 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Create missing database tables
@user.route('/create-tables', methods=['GET'])
def create_missing_tables():
    """Create any missing database tables"""
    try:
        from website.models import ProfileVisit
        from website import db
        from sqlalchemy import inspect
        
        print("🔍 Checking for missing tables...")
        
        # Check if profile_visits table exists
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        result = {
            "existing_tables": existing_tables,
            "created_tables": [],
            "errors": []
        }
        
        if 'profile_visits' not in existing_tables:
            print("🏗️  Creating profile_visits table...")
            try:
                # Create only the ProfileVisit table
                ProfileVisit.__table__.create(db.engine, checkfirst=True)
                result["created_tables"].append("profile_visits")
                print("✅ profile_visits table created!")
            except Exception as e:
                error_msg = f"Error creating profile_visits: {str(e)}"
                result["errors"].append(error_msg)
                print(f"❌ {error_msg}")
        else:
            result["message"] = "profile_visits table already exists"
        
        # Create any other missing tables
        try:
            db.create_all()
            print("✅ All tables verified/created!")
            result["status"] = "success"
        except Exception as e:
            error_msg = f"Error in create_all: {str(e)}"
            result["errors"].append(error_msg)
            result["status"] = "partial_success" if not result["errors"] else "error"
        
        response = make_response(jsonify(result), 200)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
        
    except Exception as e:
        error_response = {
            "status": "error",
            "error": str(e),
            "message": "Failed to create tables"
        }
        response = make_response(jsonify(error_response), 500)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response


# Handle preflight requests for user profile endpoint
@user.route('/<int:user_id>', methods=['OPTIONS'])
def preflight_user_profile(user_id):
    """Handle preflight requests for user profile endpoint"""
    response = make_response('', 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@user.route('/<int:user_id>', methods=['PUT'])
@token_required
def update_user_profile(current_user, user_id):
    """Update user profile data"""
    if current_user.id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    user_obj = User.query.get(user_id)
    profile_obj = Profile.query.filter_by(user_id=user_id).first()
    if not user_obj or not profile_obj:
        return jsonify({"error": "User or profile not found"}), 404

    # User fields
    user_fields = ["age", "first_name", "last_name", "username", "email", "sexualPreference"]
    for key in user_fields:
        if key in data:
            setattr(user_obj, key, data[key])

    # Update location on both user and profile
    if "location" in data:
        user_obj.location = data["location"]
        profile_obj.location = data["location"]

    # Profile fields
    profile_fields = ["title", "company", "bio", "education", "experienceLevel", "industry",
                      "image1", "image2", "image3", "image4"]
    for key in profile_fields:
        if key in data:
            setattr(profile_obj, key, data[key])

    # Handle interests update
    if "interests" in data:
        new_interests = data["interests"]
        profile_obj.interests.clear()
        for interest_name in new_interests:
            interest = Interest.query.filter_by(name=interest_name).first()
            if not interest:
                interest = Interest(name=interest_name)
                db.session.add(interest)
            profile_obj.interests.append(interest)

    db.session.commit()
    response = make_response(jsonify({"message": "Profile updated successfully"}), 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response


# Geolocation endpoint - update user location from GPS coordinates
@user.route('/update-location', methods=['OPTIONS'])
def preflight_update_location():
    response = make_response('', 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@user.route('/update-location', methods=['POST'])
@token_required
def update_location(current_user):
    """Update user location from GPS coordinates or manual input"""
    data = request.get_json()
    location = data.get('location')
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if not location:
        return jsonify({"error": "Location is required"}), 400

    user_obj = User.query.get(current_user.id)
    profile_obj = Profile.query.filter_by(user_id=current_user.id).first()

    if user_obj:
        user_obj.location = location
    if profile_obj:
        profile_obj.location = location

    db.session.commit()
    response = make_response(jsonify({"message": "Location updated", "location": location}), 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@user.route('/<int:user_id>', methods=['GET'])
@token_required
def get_user_profile(current_user, user_id):
    print(f"🔍 get_user_profile called for user_id: {user_id} by user: {current_user.username}")
    
    user = User.query.get(user_id)
    if not user:
        print(f"❌ User {user_id} not found")
        response = make_response(jsonify({"error": "User not found"}), 404)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

    profile = Profile.query.filter_by(user_id=user.id).first()
    if not profile:
        print(f"❌ Profile for user {user_id} not found")
        response = make_response(jsonify({"error": "Profile not found"}), 404)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    try:
        interests = [interest.name for interest in profile.interests] if profile.interests else []

        user_data = {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "age": user.age,
                "sex": user.sex,
                "sexual_preference": user.sexualPreference,
                "location": user.location,
                "email_verified": user.emailVerified
            },
            "profile": {
                "id": profile.id,
                "title": profile.title,
                "company": profile.company,
                "bio": profile.bio,
                "education": profile.education,
                "experienceLevel": profile.experienceLevel,
                "industry": profile.industry,
                "location": profile.location,
                "image1": profile.image1,
                "image2": profile.image2,
                "image3": profile.image3,
                "image4": profile.image4,
                "verified": profile.verified,
                "online": profile.online,
                "fame_rating": profile.fame_rating,
                "interests": interests
            }
        }
        
        print(f"✅ Successfully retrieved profile for user {user_id}")
        response = make_response(jsonify(user_data), 200)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
        
    except Exception as e:
        print(f"❌ Error serializing profile data for user {user_id}: {str(e)}")
        response = make_response(jsonify({"error": f"Internal server error: {str(e)}"}), 500)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response


@user.route('/profile', methods=['POST'])
@login_required
def update_profile():
    data = request.get_json()
    print("data:", data)
    profile = Profile.query.filter_by(user_id=curr.id).first()
    if not profile:
        return jsonify({"error": "Profile not found"}), 404
    profile_list = ["title", "company", "bio", "education", "experienceLevel", "industry",
                      "image1", "image2", "image3", "image4", "location"]
    
    list = [ "username", "email", "age", "sexualPreference", "first_name", "last_name"]
    
    user = User.query.get(curr.id)
    profile = Profile.query.filter_by(user_id=curr.id).first()
    
    for key in list:
        if key in data:
            setattr(user, key, data[key])

    db.session.commit()
    
    # print("key:", key)
    for key in profile_list:
        
        if key in data:
            print("key:", key)
            setattr(profile, key, data[key])

    db.session.commit()
    db.session.refresh(profile)
    print("After commit:", profile.location)

    
    return jsonify({"message": "Profile updated successfully"}), 200



from flask_socketio import disconnect
from . import socketio
from flask import request
@socketio.on('connect')
def handle_connect():
    user_id = request.args.get('user_id')
    if user_id:
        user_id = int(user_id)
        online_users.add(user_id)
        print(f"User {user_id} is online")
        user = User.query.get(user_id)
        if user and user.profile:
            user.profile.online = True
            db.session.commit()
        # Optional: broadcast to friends
        socketio.emit('user_online', {'user_id': user_id})



@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.args.get('user_id')
    if user_id:
        user_id = int(user_id)
        online_users.discard(user_id)  # discard avoids KeyError if not present
        user = User.query.get(user_id)
        if user and user.profile:
            user.profile.online = False
            db.session.commit()
        print(f"User {user_id} went offline")
        socketio.emit('user_offline', {'user_id': user_id})

@user.route('/online_users', methods=['GET'])
def get_online_users():
    return jsonify({'online': list(online_users)}), 200


@user.route('/profile/visits', methods=['GET'])
@token_required
def get_profile_visits(current_user):
    print(f"🔍 Profile visits called for user: {current_user.username} (ID: {current_user.id})")

    try:
        visits = (
            ProfileVisit.query
            .filter_by(visited_id=current_user.id)
            .order_by(ProfileVisit.timestamp.desc())
            .all()
        )
        
        print(f"📊 Found {len(visits)} profile visits")

        results = []
        for visit in visits:
            visitor = User.query.get(visit.visitor_id)
            if visitor:  # Check if visitor exists
                print(f"  - Visit from {visitor.username} at {visit.timestamp}")
                try:
                    visitor_data = visitor.serialize()
                    results.append({
                        "visitor": visitor_data,
                        "timestamp": visit.timestamp.isoformat() if visit.timestamp else None
                    })
                except Exception as e:
                    print(f"  ❌ Error serializing visitor {visitor.username}: {str(e)}")
                    continue
            else:
                print(f"  ⚠️ Visitor with ID {visit.visitor_id} not found")

        print(f"✅ Returning {len(results)} profile visits")
        
        response = make_response(jsonify(results), 200)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
        
    except Exception as e:
        print(f"❌ Error in get_profile_visits: {str(e)}")
        response = make_response(jsonify({"error": f"Internal server error: {str(e)}"}), 500)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response



@user.route('/liked-me', methods=['OPTIONS'])
def preflight_liked_me():
    response = make_response('', 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@user.route('/liked-me', methods=['GET'])
@token_required
def get_liked(current_user):
    # Get all "like" swipes TO the current user
    liked_swipes = Swipe.query.filter_by(
        to_id=current_user.id,
        action="like"
    ).all()

    results = []
    for swipe in liked_swipes:
        # Correct: use swipe.from_id, not swipe object
        user = User.query.get(swipe.from_id)

        # Make sure User has a serialize method
        results.append({
            "user": user.serialize()
        })

    return jsonify(results)



def fame_rating(user_id):

    # user = User.query.get_or_404(user_id)
    profile = Profile.query.filter_by(user_id=user_id).first_or_404()
    likes = Swipe.query.filter_by(
        to_id=user_id,
        action="like"
    ).count()

    total = Swipe.query.filter_by(
        to_id=user_id
    ).count()

    print("total:", total)
    print("like:", likes)

    if total == 0:
        profile.fame_rating = 0
    else:
        profile.fame_rating = (likes / total) * 100 
    print("-->", profile.fame_rating)
    db.session.commit()




@user.route('/view/<int:user_id>', methods=['OPTIONS'])
def preflight_view(user_id):
    response = make_response('', 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@user.route('/view/<int:user_id>', methods=['GET'])
@token_required
def new_visit(current_user, user_id):
    target_user = User.query.get_or_404(user_id)

    # Prevent counting self-visit
    if current_user.id != user_id and not ProfileVisit.query.filter_by(visitor_id=current_user.id, visited_id=user_id).first():
        visit = ProfileVisit(
            visitor_id=current_user.id,
            visited_id=user_id
        )
        db.session.add(visit)
        db.session.commit()

    return jsonify(target_user.serialize())


import requests
from .models import UserBlock, Match, Swipe
from sqlalchemy import and_, or_
import sys

@user.route('/report', methods=['POST'])
@login_required
def report_user():
    data = request.get_json()
    reported_id = data.get("reported_id")
    reason = data.get("reason", "fake account")

    # Check if user exists
    target_user = User.query.get_or_404(reported_id)

    # Create the report
    report = Report(
        reporter_id=current_user.id,
        reported_id=reported_id,
        reason=reason
    )
    db.session.add(report)
    db.session.commit()

    from_id = current_user.id
    to_id = reported_id

    # create block if not exists
    existing_block = UserBlock.query.filter_by(blocker_id=from_id, blocked_id=to_id).first()
    if not existing_block:
        block = UserBlock(blocker_id=from_id, blocked_id=to_id)
        db.session.add(block)
    # remove any existing swipe or match between users
    Swipe.query.filter_by(from_id=from_id, to_id=to_id).delete()
    Swipe.query.filter_by(from_id=to_id, to_id=from_id).delete()
    db.session.query(Match).filter(
        or_(
            and_(Match.from_id == from_id, Match.to_id == to_id),
            and_(Match.from_id == to_id, Match.to_id == from_id),
        )
    ).delete()
    db.session.commit()
    sys.stderr.write(f"  User {to_id} blocked by {from_id}\n\n")
    sys.stderr.flush()
    return jsonify({'message': f'User {to_id} blocked by {from_id}'}), 200
    
    url = f"http://127.0.0.1:5001/api/swipe"
    payload = {"from_id": current_user.id, "to_id": reported_id, "action":"block"}
    headers = {"Content-Type": "application/json"}
    requests.post(url, json=payload, headers=headers)

    return jsonify({"message": "User reported successfully"}), 201
