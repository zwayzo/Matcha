from asyncio import sleep
from flask import Blueprint, request, jsonify, current_app
from .models import Match, User, Profile, Swipe, UserBlock, Conversation, ConversationParticipant
from . import db
from sqlalchemy.orm import aliased
from sqlalchemy import and_
from .chat import create_conversation, get_existing_conversation
from sqlalchemy import select, or_
from .notification import create_notification
import sys
from .user import fame_rating

match = Blueprint('match', __name__)

@match.route('/reset-swipes/<int:user_id>', methods=['DELETE'])
def reset_swipes(user_id):
    """⚠️ DEVELOPMENT ONLY: Clear all swipes for a user to test discover again"""
    try:
        # Delete all swipes from this user
        Swipe.query.filter(Swipe.from_id == user_id).delete()
        db.session.commit()
        sys.stderr.write(f"\n🔄 RESET: Cleared all swipes for user {user_id}\n\n")
        sys.stderr.flush()
        return jsonify({'message': f'Cleared all swipes for user {user_id}'}), 200
    except Exception as e:
        sys.stderr.write(f"❌ ERROR in reset_swipes: {str(e)}\n")
        sys.stderr.flush()
        return jsonify({'error': str(e)}), 500


# @match.route('/dislike', methods=['POST'])
# def dislike():
#     data = request.get_json()
#     from_id = data.get('from_id')
#     to_id = data.get('to_id')

#     print(f"Received dislike from {from_id} to {to_id}")

    
#     match = Match.query.filter(
#         or_(
#             and_(Match.from_id == from_id, Match.to_id == to_id),
#             and_(Match.from_id == to_id, Match.to_id == from_id)
#         )
#     ).first()
#     conversation_id = match.conversation_id
#     if conversation_id:
        # conversation = Conversation.query.filter(Conversation.id == conversation_id).first()
        # if conversation:
        #     db.session.delete(conversation)
        # swipe = Swipe.query.filter(from_id = from_id, to_id=to_id).first()

        # if match:
        #     db.session.delete(match)  # Supprime la ligne du match
        #     db.session.delete(conversation)
        #     db.session.delete(swipe)
        #     db.session.commit()       # Applique le changement dans la DB
        #     print(f"Match between {from_id} and {to_id} deleted!")
        # else:
        #     print("No match found between these two users.")






@match.route('/swipe', methods=['POST'])
def record_action():
    try:
        data = request.get_json()

        from_id = data.get('from_id')
        to_id = data.get('to_id')
        raw_action = data.get('action')

        # normalize IDs
        try:
            from_id = int(from_id)
            to_id = int(to_id)
        except Exception:
            return jsonify({'error': 'Invalid user ids'}), 400

        # Normalize action values coming from various clients
        if not isinstance(raw_action, str):
            return jsonify({'error': 'Invalid action value'}), 400
        action = raw_action.strip().lower()
        # support frontend 'pass' as backend 'dislike'
        if action == 'dislike':
            print("dislike\n")
            match = Match.query.filter(
                or_(
                    and_(Match.from_id == from_id, Match.to_id == to_id),
                    and_(Match.from_id == to_id, Match.to_id == from_id)
                )
            ).first()

            if match:
                if match.conversation_id:
                    conversation = Conversation.query.filter_by(id=match.conversation_id).first()
                    if conversation:
                        print("inside conversation\n")
                        # Delete participants FIRST, then the conversation
                        ConversationParticipant.query.filter_by(conversation_id=conversation.id).delete()
                        db.session.delete(match)
                        db.session.flush()
                        db.session.delete(conversation)

                
                print(f"Match between {from_id} and {to_id} deleted!")
            else:
                print("No match found between these two users.")

            # Always delete the swipe regardless of match
            swipe = Swipe.query.filter_by(from_id=from_id, to_id=to_id).first()
            if swipe:
                db.session.delete(swipe)

            db.session.commit()
    # Always delete the swipe, regardless of whether a match existed
            swipe = Swipe.query.filter_by(from_id=from_id, to_id=to_id).first()
            if swipe:
                db.session.delete(swipe)

            db.session.commit()
            # sys.stderr.write(f"\n📍 SWIPE: {from_id} -> {to_id} : {action}\n")
            # sys.stderr.flush()

        # 1️⃣ Validation
        if not all([from_id, to_id, action]):
            return jsonify({'error': 'Missing required fields'}), 400
        if from_id == to_id:
            return jsonify({'error': 'You cannot act on yourself'}), 400
        if action not in ['like', 'dislike', 'block']:
            return jsonify({'error': 'Invalid action'}), 400
        # Handle block action separately (don't store as Swipe because enum doesn't include 'block')
        if action == 'block':
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

        # 2️⃣ Check if action already exists (for like/dislike)
        existing = Swipe.query.filter_by(from_id=from_id, to_id=to_id).first()
        if existing:
            existing.action = action
            sys.stderr.write(f"  Updated existing swipe\n")
        else:
            swipe = Swipe(from_id=from_id, to_id=to_id, action=action)
            db.session.add(swipe)
            sys.stderr.write(f"  Created new swipe\n")

        db.session.commit()
        db.session.flush()  # Ensure the swipe is in the database before checking for reciprocal

        # 3️⃣ Check mutual like
        if action == 'like':
            sys.stderr.write(f"  Checking for reciprocal like...\n")
            sys.stderr.write(f"    Query: from_id={to_id} (type: {type(to_id).__name__}), to_id={from_id} (type: {type(from_id).__name__})\n")
            
            # Debug: list all swipes for this user
            all_swipes = Swipe.query.filter_by(to_id=from_id).all()
            sys.stderr.write(f"    All swipes TO {from_id}: {len(all_swipes)} found\n")
            for s in all_swipes:
                sys.stderr.write(f"      - {s.from_id} -> {s.to_id}: {s.action} (from_id type: {type(s.from_id).__name__})\n")
            
            # Check for reciprocal like - ensure we query after the commit
            # Check for reciprocal like - ensure IDs are integers
            reciprocal = Swipe.query.filter_by(
                from_id=int(to_id),
                to_id=int(from_id),
                action='like'
            ).first()
            
            sys.stderr.write(f"    Reciprocal match check: from_id={to_id} (int: {int(to_id)}), to_id={from_id} (int: {int(from_id)}), action='like'\n")
            sys.stderr.write(f"    Reciprocal match found: {reciprocal is not None}\n")
            if reciprocal:
                sys.stderr.write(f"    Found reciprocal: {reciprocal.from_id} -> {reciprocal.to_id}: {reciprocal.action}\n")
                sys.stderr.write(f"    Reciprocal types: from_id type={type(reciprocal.from_id).__name__}, to_id type={type(reciprocal.to_id).__name__}\n")

            if reciprocal:
                sys.stderr.write(f"  ✅ MUTUAL LIKE FOUND!\n")
                # Create Match if it doesn't already exist (either orientation)
                existing_match = db.session.query(Match).filter(
                    or_(
                        and_(Match.from_id == from_id, Match.to_id == to_id),
                        and_(Match.from_id == to_id, Match.to_id == from_id),
                    )
                ).first()

                if existing_match:
                    sys.stderr.write(f"  Match already exists with ID {existing_match.id}\n")
                else:
                    sys.stderr.write(f"  Creating new match...\n")
                
                existing_convo = get_existing_conversation(from_id, to_id)
                if not existing_convo:
                    sys.stderr.write(f"  Creating new conversation...\n")
                    convo_id = create_conversation(from_id, to_id)
                    sys.stderr.write(f"  ✅ Conversation created: {convo_id}\n")
                else:
                    convo_id = existing_convo.id
                    sys.stderr.write(f"  Using existing conversation: {convo_id}\n")

                if not existing_match:
                    Match1 = Match(from_id=from_id, to_id=to_id, action='like', conversation_id=convo_id)
                    db.session.add(Match1)
                    db.session.commit()
                    sys.stderr.write(f"  ✅ Match created with ID {Match1.id}\n\n")
                    
                    # Create notifications for both users
                    from_user = User.query.get(from_id)
                    to_user = User.query.get(to_id)
                    if from_user and to_user:
                        from_name = f"{from_user.first_name} {from_user.last_name}".strip() or from_user.username
                        to_name = f"{to_user.first_name} {to_user.last_name}".strip() or to_user.username
                        
                        # Notify the person who received the like (to_id)
                        create_notification(to_id, from_id, 'match', f"You matched with {from_name}!")
                        # Notify the person who sent the like (from_id)
                        create_notification(from_id, to_id, 'match', f"You matched with {to_name}!")
                else:
                    existing_match.conversation_id = convo_id
                    db.session.commit()
                    sys.stderr.write(f"  ✅ Match updated with conversation_id\n\n")
                fame_rating(to_id)
                
                db.session.commit()
                sys.stderr.flush()
                return jsonify({
                    'message': "It's a match!",
                    'conversation_id': convo_id
                }), 200
            else:
                sys.stderr.write(f"  No reciprocal like yet\n\n")
                sys.stderr.flush()
        fame_rating(to_id)
        return jsonify({
            'message': f'Action {action} recorded from {from_id} to {to_id}'
        }), 200
    
    except Exception as e:
        sys.stderr.write(f"  ❌ ERROR in record_action: {str(e)}\n")
        import traceback
        sys.stderr.write(traceback.format_exc())
        sys.stderr.flush()
        fame_rating(to_id)
        return jsonify({'error': str(e)}), 500

    
    

@match.route('/matches', methods=['GET'])
def get_matches():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    # Get all matches where the user is either the sender or the receiver
    matches = db.session.query(Match).filter(
        or_(
            Match.from_id == user_id,
            Match.to_id == user_id
        )
    ).all()
    
    # Get blocked user IDs
    blocked_ids = set()
    blocks = UserBlock.query.filter(
        or_(
            UserBlock.blocker_id == user_id,
            UserBlock.blocked_id == user_id
        )
    ).all()
    for block in blocks:
        if block.blocker_id == user_id:
            blocked_ids.add(block.blocked_id)
        else:
            blocked_ids.add(block.blocker_id)
    
    # Collect the other user for each match with their conversation_id
    match_data = {}
    for m in matches:
        if m.from_id == user_id:
            other_id = m.to_id
        else:
            other_id = m.from_id
        # Ensure conversation_id exists
        convo_id = m.conversation_id
        if not convo_id:
            existing_convo = get_existing_conversation(user_id, other_id)
            if not existing_convo:
                convo_id = create_conversation(user_id, other_id)
            else:
                convo_id = existing_convo.id
            m.conversation_id = convo_id
            db.session.commit()
        if other_id not in blocked_ids:
            match_data[other_id] = {
                'user_id': other_id,
                'conversation_id': convo_id
            }

    # Get User objects
    user_ids = list(match_data.keys())
    if not user_ids:
        return jsonify({'matches': []}), 200
        
    users = db.session.query(User).filter(User.id.in_(user_ids)).all()

    result = []
    for user in users:
        data = user.to_dict()
        if user.profile:
            data['profile'] = user.profile.to_dict()
        # Add conversation_id from match data
        if user.id in match_data:
            data['conversation_id'] = match_data[user.id].get('conversation_id')
        result.append(data)

    return jsonify({'matches': result}), 200


@match.route('/locations', methods=['GET'])
def get_locations():
    """Return distinct locations from user profiles for filter dropdowns."""
    try:
        # Gather non-empty locations from both User and Profile tables
        user_locations = db.session.query(User.location).filter(
            User.location.isnot(None),
            User.location != ''
        ).distinct().all()

        profile_locations = db.session.query(Profile.location).filter(
            Profile.location.isnot(None),
            Profile.location != ''
        ).distinct().all()

        # Merge and deduplicate (case-insensitive), keep original casing
        seen = set()
        locations = []
        for (loc,) in user_locations + profile_locations:
            loc_stripped = loc.strip()
            if loc_stripped and loc_stripped.lower() not in seen:
                seen.add(loc_stripped.lower())
                locations.append(loc_stripped)

        locations.sort(key=str.lower)
        return jsonify({'locations': locations}), 200
    except Exception as e:
        return jsonify({'error': str(e), 'locations': []}), 500


@match.route('/discover', methods=['GET'])
def discover_users():
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        sys.stderr.write(f"\n🔍 DISCOVER: Starting for user_id={user_id}\n")
        sys.stderr.flush()

        # Get all user IDs that are blocked (either I blocked them or they blocked me)
        blocked_ids = set()
        blocks = UserBlock.query.filter(
            or_(
                UserBlock.blocker_id == user_id,
                UserBlock.blocked_id == user_id
            )
        ).all()
        for block in blocks:
            if block.blocker_id == user_id:
                blocked_ids.add(block.blocked_id)
            else:
                blocked_ids.add(block.blocker_id)
        sys.stderr.write(f"  Blocked users: {blocked_ids} (count: {len(blocked_ids)})\n")

        # Get all user IDs that have matched with me
        matched_user_ids = set()
        try:
            matches = Match.query.filter(
                or_(
                    Match.from_id == user_id,
                    Match.to_id == user_id
                )
            ).all()
            for m in matches:
                if m.from_id == user_id:
                    matched_user_ids.add(m.to_id)
                else:
                    matched_user_ids.add(m.from_id)
        except Exception as e:
            sys.stderr.write(f"  ⚠️ Error querying matches: {e}\n")
            # Continue without match query if it fails
        sys.stderr.write(f"  Already matched: {matched_user_ids}\n")

        # Get all users that have been swiped (liked or disliked) by current user
        swiped_user_ids = set()
        try:
            swipes = Swipe.query.filter_by(from_id=user_id).all()
            for swipe in swipes:
                swiped_user_ids.add(swipe.to_id)
        except Exception as e:
            sys.stderr.write(f"  ⚠️ Error querying swipes: {e}\n")
        sys.stderr.write(f"  Already swiped: {swiped_user_ids}\n")

        # Exclude: self, blocked users, matched users, and already swiped users
        search_mode = request.args.get('search_mode') == 'true'
        if search_mode:
            # In search mode, show all except blocked and self (including already swiped)
            excluded_ids = blocked_ids | {user_id}
        else:
            # In discover mode, exclude: self, blocked, matched, and already swiped
            excluded_ids = blocked_ids | matched_user_ids | swiped_user_ids | {user_id}
        sys.stderr.write(f"  Total excluded IDs count: {len(excluded_ids)}\n")
        sys.stderr.write(f"  Excluded IDs: {excluded_ids}\n")

        # Get all users with profiles, excluding the current user and excluded IDs
        # Use join to ensure profile relationship is loaded and exists
        sys.stderr.write(f"  Querying users with profiles...\n")
        all_users_count = User.query.count()
        sys.stderr.write(f"  Total users in DB: {all_users_count}\n")
        
        # Ensure user_id is always excluded (convert to int to match DB type)
        excluded_ids.add(int(user_id))
        
        # Convert all to ints and to list for SQLAlchemy
        excluded_list = [int(x) for x in excluded_ids]
        sys.stderr.write(f"  Final excluded list (all ints): {excluded_list}\n")
        sys.stderr.write(f"  Current user_id: {user_id} (type: {type(user_id).__name__})\n")
        
        # Query with explicit exclusion
        eligible_users = User.query.join(Profile).filter(
            User.id.notin_(excluded_list)
        ).all()
        
        # Double-check: filter out current user in Python as well (safety check)
        eligible_users = [u for u in eligible_users if u.id != int(user_id)]
        sys.stderr.write(f"  ✅ Found {len(eligible_users)} eligible users with profiles\n")
        sys.stderr.write(f"  Eligible user IDs: {[u.id for u in eligible_users]}\n")

        # ──────────────────────────────────────────────
        # Sexual orientation / preference filtering
        # If not specified, default to 'everyone' (bisexual)
        # ──────────────────────────────────────────────
        current_user = User.query.get(user_id)
        my_sex = current_user.sex  # 'male', 'female', or 'n/o'
        my_pref = current_user.sexualPreference or 'everyone'

        def is_sexually_compatible(candidate):
            """Check bidirectional sexual compatibility."""
            c_sex = candidate.sex  # 'male', 'female', or 'n/o'
            c_pref = candidate.sexualPreference or 'everyone'

            # 1) Does the current user want to see this candidate?
            if my_pref == 'male' and c_sex != 'male':
                return False
            if my_pref == 'female' and c_sex != 'female':
                return False
            # my_pref == 'everyone' -> accept any gender

            # 2) Would the candidate want to see the current user?
            if c_pref == 'male' and my_sex != 'male':
                return False
            if c_pref == 'female' and my_sex != 'female':
                return False
            # c_pref == 'everyone' -> accepts anyone

            return True

        eligible_users = [u for u in eligible_users if is_sexually_compatible(u)]
        sys.stderr.write(f"  ✅ After sexuality filter: {len(eligible_users)} users\n")

        # ──────────────────────────────────────────────
        # Apply optional filters (age, location, industry, etc.)
        # ──────────────────────────────────────────────
        request_params = request.args.to_dict()
        sys.stderr.write(f"  Filters requested: {request_params}\n")

        filtered_users = []
        for u in eligible_users:
            user_valid = True
            
            # Check min_age
            min_age = request.args.get('min_age')
            if min_age:
                try:
                    if u.age is None or u.age < int(min_age):
                        user_valid = False
                except ValueError:
                    pass
            
            # Check max_age
            if user_valid:
                max_age = request.args.get('max_age')
                if max_age:
                    try:
                        if u.age is None or u.age > int(max_age):
                            user_valid = False
                    except ValueError:
                        pass
            
            # Check profile filters
            # Map query param names to actual model attribute names
            profile_filters = {
                'industry': ('industry', 'ilike'),
                'company': ('company', 'ilike'),
                'experienceLevel': ('experienceLevel', '=='),
                'title': ('title', 'ilike'),
                'localisation': ('location', 'ilike'),
                'education': ('education', 'ilike'),
            }
            
            for param_name, (attr_name, op) in profile_filters.items():
                if user_valid:
                    value = request.args.get(param_name)
                    if value and value.strip():
                        # Check both profile and user-level location
                        profile_val = getattr(u.profile, attr_name, None) if u.profile else None
                        user_val = getattr(u, attr_name, None) if attr_name == 'location' else None
                        
                        # Use profile value first, fall back to user value for location
                        check_val = profile_val or user_val
                        
                        if check_val is None:
                            user_valid = False
                            break
                        if op == 'ilike' and value.lower() not in str(check_val).lower():
                            user_valid = False
                            break
                        if op == '==' and str(value) != str(check_val):
                            user_valid = False
                            break
            
            if user_valid:
                filtered_users.append(u)

        sys.stderr.write(f"  ✅ After filtering: {len(filtered_users)} users match criteria\n")

        # ──────────────────────────────────────────────
        # Weighted scoring & sorting
        # Criteria:
        #   1. Same geographic area  (+50 points)
        #   2. Common interests/tags (+10 points each)
        #   3. Fame rating           (+0-100 points)
        # ──────────────────────────────────────────────
        my_location = (current_user.location or '').strip().lower()
        my_profile = current_user.profile
        my_interest_names = set()
        if my_profile and my_profile.interests:
            my_interest_names = {i.name.lower() for i in my_profile.interests}
        # Also consider profile-level location
        my_profile_location = ''
        if my_profile and my_profile.location:
            my_profile_location = my_profile.location.strip().lower()

        scored_users = []
        for u in filtered_users:
            score = 0

            # 1) Geographic area: compare user.location and profile.location
            u_location = (u.location or '').strip().lower()
            u_profile_location = ''
            if u.profile and u.profile.location:
                u_profile_location = u.profile.location.strip().lower()

            location_match = False
            if my_location and u_location and my_location == u_location:
                location_match = True
            elif my_profile_location and u_profile_location and my_profile_location == u_profile_location:
                location_match = True
            elif my_location and u_profile_location and my_location == u_profile_location:
                location_match = True
            elif my_profile_location and u_location and my_profile_location == u_location:
                location_match = True

            if location_match:
                score += 50

            # 2) Common interests/tags
            if u.profile and u.profile.interests and my_interest_names:
                candidate_interests = {i.name.lower() for i in u.profile.interests}
                common_count = len(my_interest_names & candidate_interests)
                score += common_count * 10

            # 3) Fame rating (0-100)
            if u.profile and u.profile.fame_rating:
                score += u.profile.fame_rating

            scored_users.append((score, u))

        # Sort by score descending (highest relevance first)
        scored_users.sort(key=lambda x: x[0], reverse=True)

        sys.stderr.write(f"  ✅ Scored and sorted {len(scored_users)} users\n")
        if scored_users:
            top_scores = [(s, u.id) for s, u in scored_users[:5]]
            sys.stderr.write(f"  Top scores: {top_scores}\n")

        # Configurable limit via query param, default 200, capped at 1000
        try:
            limit = min(int(request.args.get('limit', 200)), 1000)
        except (ValueError, TypeError):
            limit = 200

        result = []
        for score, u in scored_users[:limit]:
            data = u.to_dict()
            data['profile'] = u.profile.to_dict() if u.profile else None
            data['suggestion_score'] = score
            result.append(data)

        sys.stderr.write(f"  ✅ Returning {len(result)} ranked profiles to frontend (limit={limit})\n\n")
        sys.stderr.flush()
        return jsonify({'results': result}), 200
        
    except Exception as e:
        sys.stderr.write(f"  ❌ ERROR in discover_users: {str(e)}\n")
        import traceback
        sys.stderr.write(traceback.format_exc())
        sys.stderr.flush()
        return jsonify({'error': str(e), 'results': []}), 500