from asyncio import sleep
from flask import Blueprint, request, jsonify, make_response
from .models import Match, User, Profile, Swipe, UserBlock
from flask import Blueprint, render_template, request, flash, redirect, jsonify, current_app
import string

from website import user
from .models import Profile, User, Interest, Report
from . import db, mail
from flask_login import  login_required, current_user as curr
import jwt
from datetime import datetime, timedelta
from functools import wraps
import secrets
from flask_mail import Message
from flask_login import current_user
from .auth import token_required

block = Blueprint('block', __name__)


def is_blocked(user_a, user_b):
    """
    Returns True if either user blocked the other
    """
    return db.session.query(UserBlock).filter(
        db.or_(
            db.and_(
                UserBlock.blocker_id == user_a,
                UserBlock.blocked_id == user_b
            ),
            db.and_(
                UserBlock.blocker_id == user_b,
                UserBlock.blocked_id == user_a
            )
        )
    ).first() is not None


@block.route("/block", methods=["OPTIONS"])
def preflight_block():
    """Handle preflight requests for block endpoint"""
    response = make_response('', 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@block.route("/block", methods=["POST"])
@token_required
def block_user(current_user):
    try:
        data = request.get_json()
        print(f"🚫 Block request from user {current_user.username}:", data)
        blocked_id = data.get("blocked_id")

        if not blocked_id:
            response = make_response(jsonify({"error": "blocked_id is required"}), 400)
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            return response

        if str(blocked_id) == str(current_user.id):
            response = make_response(jsonify({"error": "You cannot block yourself"}), 400)
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            return response

        print(f"Blocking user ID: {blocked_id}")
        print(f"Current user ID: {current_user.id}")
        
        # Check if already blocked
        if is_blocked(current_user.id, blocked_id):
            print(f"User {blocked_id} already blocked by {current_user.id}")
            response = make_response(jsonify({"message": "Already blocked"}), 200)
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            return response
        
        # Create block relationship
        block = UserBlock(
            blocker_id=current_user.id,
            blocked_id=blocked_id
        )
        db.session.add(block)
        
        # Remove any existing matches between these users
        matches_to_remove = Match.query.filter(
            db.or_(
                db.and_(Match.from_id == current_user.id, Match.to_id == blocked_id),
                db.and_(Match.from_id == blocked_id, Match.to_id == current_user.id)
            )
        ).all()
        
        for match in matches_to_remove:
            print(f"Removing match: {match.id}")
            db.session.delete(match)
        
        db.session.commit()
        print(f"✅ Successfully blocked user {blocked_id} and removed {len(matches_to_remove)} matches")

        response = make_response(jsonify({
            "message": "User blocked successfully",
            "matches_removed": len(matches_to_remove)
        }), 201)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
        
    except Exception as e:
        print(f"❌ Error blocking user: {str(e)}")
        db.session.rollback()
        response = make_response(jsonify({"error": f"Failed to block user: {str(e)}"}), 500)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response


