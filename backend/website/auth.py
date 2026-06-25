from flask import Blueprint, render_template, request, flash, redirect, jsonify, current_app, make_response
import string

from .models import Profile, User, Interest
from werkzeug.security import generate_password_hash, check_password_hash
from . import db, mail
from flask_login import login_user, logout_user, login_required, current_user as curr
import jwt
from datetime import datetime, timedelta
from functools import wraps
import secrets
from flask_mail import Message

auth = Blueprint('auth', __name__)


def generate_token(user_id, expires_in=86400):  # 24 hours for better UX 
    """Generate a JWT token for a user"""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(seconds=expires_in)
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    return token


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            print(f"🔍 Authorization header found: {auth_header[:50]}...")
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                print(f"🎟️  Token extracted: {token[:30]}...")
            else:
                print(f"❌ Invalid Authorization format - missing 'Bearer ' prefix")
        else:
            print(f"❌ No Authorization header found")
            print(f"📋 Available headers: {list(request.headers.keys())}")

        # Helper function to create CORS-enabled error responses
        def cors_error_response(message, status_code):
            response = make_response(jsonify({"error": message}), status_code)
            response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            return response

        if not token:
            print("❌ Token missing in request")
            return cors_error_response("Token is missing", 401)

        try:
            print(f"🔍 Validating token: {token[:20]}...")
            # ✅ Use current_app here
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            print(f"🎯 Token payload: {data}")
            current_user = User.query.get(data['user_id'])
            
            if not current_user:
                print(f"❌ User not found for ID: {data['user_id']}")
                return cors_error_response("User not found", 401)
                
            print(f"✅ Token validated for user: {current_user.username} (ID: {current_user.id})")
            
        except jwt.ExpiredSignatureError:
            print("❌ Token expired")
            return cors_error_response("Token expired", 401)
        except jwt.InvalidTokenError as e:
            print(f"❌ Invalid token: {str(e)}")
            return cors_error_response(f"Invalid token: {str(e)}", 401)
        except Exception as e:
            print(f"❌ Token validation error: {str(e)}")
            return cors_error_response(f"Token validation error: {str(e)}", 401)

        return f(current_user, *args, **kwargs)
    return decorated



def send_mail(user, token):
    # token = secrets.token_urlsafe(32)
    # user.email_token_hash = generate_password_hash(token)
    # user.email_token_expiry = datetime.utcnow() + timedelta(hours=24)  # link valid 24h
    # db.session.commit()
    # print("user token hash:", user.email_token_hash)
    # print("user token expiry:", user.email_token_expiry)
    
    
    confirm_link = f"http://localhost:3000/verify-email?token={token}"

    msg = Message(
        subject="Confirm your email - Linder",
        recipients=[user.email]
    )
    msg.body = f"""
Hi {user.first_name},

Welcome to Linder! Please click the link below to verify your email address and activate your account:

{confirm_link}

This link expires in 24 hours.

If you did not create this account, please ignore this email.

Best regards,
The Linder Team
"""
    mail.send(msg)
    return "✅ Verification email sent!"
    



@auth.route('/confirm-email', methods=['GET'])
def confirm_email():
    token = request.args.get('token')
    print("Received token:", token)
    if not token:
        return jsonify({"error": "Invalid confirmation link"}), 400

    # First check if user is already verified with this token pattern
    # (In case of duplicate requests after successful verification)
    all_users = User.query.all()
    for user in all_users:
        if user.emailVerified and user.reset_token_hash is None:
            # This could be a user who was already verified - don't show error
            continue

    users = User.query.filter(User.reset_token_expiry > datetime.utcnow()).all()
    print(f"Found {len(users)} users with valid token expiry")
    
    matched_user = None
    for u in users:
        print(f"Checking user {u.email} - Token hash: {u.reset_token_hash[:50]}...")
        if check_password_hash(u.reset_token_hash, token):
            print(f"Token matched for user: {u.email}")
            matched_user = u
            break
        else:
            print(f"Token did not match for user: {u.email}")

    if not matched_user:
        print("No matching user found for token")
        # Check if there's a user who might already be verified
        return jsonify({
            "error": "Invalid or expired token", 
            "message": "This verification link has already been used or has expired. If you already verified your email, you can proceed to login."
        }), 400

    # Mark email as verified
    matched_user.emailVerified = True
    matched_user.reset_token_hash = None
    matched_user.reset_token_expiry = None
    db.session.commit()

    print(f"Email verified successfully for user: {matched_user.email}")
    return jsonify({
        "message": "✅ Your email has been confirmed!", 
        "verified": True,
        "redirect": "/login"
    }), 200



from sqlalchemy import func


@auth.route('/login', methods=['GET', 'POST'])
def login():
    data = request.get_json()
    email = data.get('email').strip().lower()
    password = data.get('password')
    print(f"Login attempt for email: {email}")
    print(f"Password provided: {'Yes' if password else 'No'}")
    # user = User.query.filter(
    #         (User.email == email)).first()

    # user = User.query.filter_by(email=email).first()
    user = User.query.filter(func.lower(User.email) == email).first()


    if not user:
        print(f"User not found for email: {email}")
        return jsonify({"error": "User not found"}), 404
    
    print(f"User found: {user.email}")
    print(f"User emailVerified status: {user.emailVerified}")
    print(f"Password check: {check_password_hash(user.password, password)}")
    
    if not check_password_hash(user.password, password):
        print("Password check failed")
        return jsonify({"error": "Wrong password"}), 401
    
    # Check if email is verified
    if not user.emailVerified:
        print("Email not verified - blocking login")
        return jsonify({
            "error": "Please verify your email before logging in. Check your inbox for the verification link."
        }), 403
    
    print("All checks passed - logging in user")
    login_user(user, remember=True)
    token = generate_token(user.id)
    if user.profile:
        user.profile.online = True
        db.session.commit()
    flash(f"Welcome back, {user.first_name}!", category='success')
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user_id": user.id,
        "email": user.email
    }), 200 

@login_required
@auth.route('/logout')
def logout():
    user = request.user()
    user.profile.online = False

    logout_user()
    return jsonify({
        "message": "Successfully logged out"
    }), 200 




@auth.route('/sign-up', methods=['GET', 'POST'])
def sign_up():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    print("Received data:", data)
    
    if request.method == 'POST':
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        age = data.get('age')
        location = data.get('location')
        sexual_preference = data.get('sexualPreference')
        # Map frontend values ('men', 'women', 'everyone') to backend enum values ('male', 'female', 'everyone')
        if sexual_preference == 'men':
            sexual_preference = 'male'
        elif sexual_preference == 'women':
            sexual_preference = 'female'
        # 'everyone' stays the same, already matches

        # Map frontend sex values to backend enum ('male', 'female', 'n/o')
        sex_raw = data.get('sex', '')
        if sex_raw in ('non-binary', 'other'):
            sex = 'n/o'
        else:
            sex = sex_raw  # 'male' or 'female' pass through unchanged
        title = data.get('title')
        company = data.get('company')
        bio = data.get('bio')
        interests_list = data.get('interests', [])  # List of interest names
        print("Interests received:", interests_list)
        education = data.get('education')
        experience_level = data.get('experienceLevel')
        industry = data.get('industry')
        location = data.get('location', '')
        image1 = data.get('image1')
        image2 = data.get('image2')
        image3 = data.get('image3')
        image4 = data.get('image4')
        
        if len(interests_list) < 6:
            return jsonify({"error": "Select at least 6 interests"}), 400

        try:
            mail_token = secrets.token_urlsafe(32)
            user = User(email=email.strip().lower(), username=username, location=location, emailVerified=True,
                        password=generate_password_hash(password, method='pbkdf2:sha256'), 
                        first_name=first_name, last_name=last_name, age=age, sex=sex, 
                        sexualPreference=sexual_preference, 
                        reset_token_hash=generate_password_hash(mail_token),
                        reset_token_expiry=datetime.utcnow() + timedelta(hours=24))
            db.session.add(user)
            db.session.commit()
            
            # Create the profile linked to the user
            profile = Profile(
                user_id=user.id,
                title=title,
                company=company,
                bio=bio,
                education=education,
                experienceLevel=experience_level,
                industry=industry,
                location=location if 'location' in data else "",
                image1=image1,
                image2=image2,
                image3=image3,
                image4=image4,
                fame_rating=0,
            )
            db.session.add(profile)
            
            for interest_name in interests_list:
                print("Looking up interest:", interest_name)
                interest = Interest.query.filter_by(name=interest_name).first()
                if interest:
                    print("Adding interest:", interest)
                    profile.interests.append(interest)
            
            db.session.commit()
            
            return jsonify({
                "message": "Registration successful! Please check your email to verify your account before logging in.",
                "email_sent": True,
                "email": user.email
            }), 201

        except Exception as e:
            db.session.rollback()
            error_message = str(e)
            print(f"Registration error: {error_message}")
            
            if 'InvalidTextRepresentation' in error_message or 'invalid input value for enum' in error_message:
                return jsonify({"error": "Invalid value for sexual preference. Please use 'men', 'women', or 'everyone'."}), 400
            if 'UniqueViolation' in error_message or 'unique constraint' in error_message.lower():
                if 'email' in error_message:
                    return jsonify({"error": "An account with this email already exists."}), 409
                if 'username' in error_message:
                    return jsonify({"error": "This username is already taken."}), 409
            return jsonify({"error": f"Registration failed: {error_message}"}), 500



@auth.route('/verify-user-dev/<email>', methods=['POST'])
def verify_user_dev(email):
    """DEVELOPMENT ONLY - manually verify user email"""
    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user.emailVerified = True
        db.session.commit()
        
        return jsonify({
            "message": f"✅ User {email} manually verified for development",
            "emailVerified": True
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to verify user: {str(e)}"}), 500


@auth.route('/me', methods=['GET'])
# @login_required
@token_required
def get_current_user(current_user):
    user = current_user
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = user.profile
    interests = [interest.name for interest in profile.interests]

    return jsonify({
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "age": user.age,
            "location": user.location
        },
        "profile": {
            "id": profile.id,
            "title": profile.title,
            "company": profile.company,
            "bio": profile.bio,
            "education": profile.education,
            "experienceLevel": profile.experienceLevel,
            "industry": profile.industry,
            "image1": profile.image1,
            "image2": profile.image2,
            "image3": profile.image3,
            "image4": profile.image4,
            "interests": interests,
            "fame_rating": profile.fame_rating
        }
    }), 200
    



@auth.route('/forgot-password', methods=['POST'])
def request_reset_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()

    token = None
    if user:
        # Generate token
        token = secrets.token_urlsafe(32)
        user.reset_token_hash = generate_password_hash(token)
        user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=15)
        db.session.commit()

        # Create clickable reset link pointing to frontend
        reset_link = f"http://localhost:3000/reset-password?token={token}"

        # Send email
        msg = Message(
            subject="Reset Your Password",
            recipients=[user.email]
        )
        msg.body = f"""
Hello,

You requested a password reset. Click the link below to reset your password:

{reset_link}

This link expires in 15 minutes.

If you did not request this, ignore this email.
"""
        try:
            mail.send(msg)
            print("✅ Reset email sent successfully!")
        except Exception as e:
            print("❌ Error sending email:", e)

    # Always return generic message (don't reveal if user exists)
    response = {"message": "If this account exists, a reset link has been sent."}
    if token:
        response["token"] = token
    return jsonify(response)




@auth.route('/reset-password/', methods=['POST'])
def confirm_reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    if not token or not new_password:
        return jsonify({"error": "Token and new password are required"}), 400

    # Find user with valid token
    users = User.query.filter(User.reset_token_expiry > datetime.utcnow()).all()
    matched_user = None
    for u in users:
        if check_password_hash(u.reset_token_hash, token):
            matched_user = u
            break

    if not matched_user:
        return jsonify({"error": "Invalid or expired token"}), 400

    # Update password
    matched_user.password = generate_password_hash(new_password)

    # Invalidate token
    matched_user.reset_token_hash = None
    matched_user.reset_token_expiry = None

    db.session.commit()

    return jsonify({"message": "Password has been reset successfully"}), 200



