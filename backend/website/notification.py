from flask import Blueprint, request, jsonify
from . import db
from .models import Notification, User, Profile
import sys

notification = Blueprint('notification', __name__)


def create_notification(user_id, from_user_id, notif_type, content=None):
    """Helper function to create a notification"""
    try:
        notification = Notification(
            user_id=user_id,
            from_user_id=from_user_id,
            type=notif_type,
            content=content
        )
        db.session.add(notification)
        db.session.commit()
        sys.stderr.write(f"  ✅ Notification created: user_id={user_id}, type={notif_type}, from_user_id={from_user_id}\n")
        sys.stderr.flush()
        return notification
    except Exception as e:
        sys.stderr.write(f"  ❌ Error creating notification: {e}\n")
        sys.stderr.flush()
        db.session.rollback()
        return None


@notification.route('/notifications', methods=['GET'])
def get_notifications():
    """Get all notifications for a user"""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400

        # Ensure table exists
        try:
            # Try to query first
            notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
        except Exception as query_error:
            # If table doesn't exist, try to create it
            error_msg = str(query_error)
            sys.stderr.write(f"Query error (table might not exist): {error_msg}\n")
            sys.stderr.flush()
            
            if 'does not exist' in error_msg.lower() or 'relation' in error_msg.lower():
                try:
                    sys.stderr.write("Attempting to create notifications table...\n")
                    sys.stderr.flush()
                    db.create_all()
                    # Try query again
                    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
                    sys.stderr.write("✅ Notifications table created successfully!\n")
                    sys.stderr.flush()
                except Exception as create_error:
                    sys.stderr.write(f"❌ Error creating table: {create_error}\n")
                    import traceback
                    traceback.print_exc()
                    return jsonify({
                        'error': f'Database table does not exist. Please restart your backend server or run: cd backend && python create_notifications_table.py',
                        'details': str(create_error)
                    }), 500
            else:
                # Some other error
                raise query_error
        
        result = []
        for notif in notifications:
            notif_dict = notif.to_dict()
            
            # Get from_user data
            from_user = User.query.get(notif.from_user_id)
            if from_user:
                from_user_dict = from_user.to_dict()
                if from_user.profile:
                    from_user_dict['profile'] = from_user.profile.to_dict()
                notif_dict['fromUser'] = from_user_dict
            
            result.append(notif_dict)
        
        return jsonify({'notifications': result}), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        sys.stderr.write(f"Error getting notifications: {e}\n")
        sys.stderr.write(f"Traceback: {error_trace}\n")
        sys.stderr.flush()
        return jsonify({'error': str(e)}), 500


@notification.route('/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_as_read(notification_id):
    """Mark a notification as read"""
    try:
        notification = Notification.query.get(notification_id)
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.read = True
        db.session.commit()
        
        return jsonify({'message': 'Notification marked as read'}), 200
    except Exception as e:
        sys.stderr.write(f"Error marking notification as read: {e}\n")
        return jsonify({'error': str(e)}), 500


@notification.route('/notifications/read-all', methods=['PUT'])
def mark_all_notifications_as_read():
    """Mark all notifications as read for a user"""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        Notification.query.filter_by(user_id=user_id, read=False).update({'read': True})
        db.session.commit()
        
        return jsonify({'message': 'All notifications marked as read'}), 200
    except Exception as e:
        sys.stderr.write(f"Error marking all notifications as read: {e}\n")
        return jsonify({'error': str(e)}), 500


@notification.route('/notifications/unread-count', methods=['GET'])
def get_unread_count():
    """Get unread notification count for a user"""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        count = Notification.query.filter_by(user_id=user_id, read=False).count()
        
        return jsonify({'count': count}), 200
    except Exception as e:
        sys.stderr.write(f"Error getting unread count: {e}\n")
        return jsonify({'error': str(e)}), 500
