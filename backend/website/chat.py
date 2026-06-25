from .block import is_blocked
from flask import Blueprint
from flask_socketio import join_room, emit
from . import socketio, db
from .models import Conversation, ConversationParticipant
from flask import Blueprint, render_template, request, flash, redirect, jsonify, current_app
import string

from website import user
from .models import Profile, User, Interest, Message
from werkzeug.security import generate_password_hash, check_password_hash
from . import db, mail
from flask_login import login_user, logout_user, login_required, current_user as curr
import jwt
from datetime import datetime, timedelta
from functools import wraps
import secrets
from .notification import create_notification



chat = Blueprint("chat", __name__)


def conversation_room(conversation_id):
    return f"conversation_{conversation_id}"


def conversation_room(conversation_id):
    return f"conversation_{conversation_id}"


@socketio.on("join_conversation")
def join_conversation(data):
    conversation_id = data.get("conversation_id")
    user_id = data.get("user_id")

    # Security check
    participant = ConversationParticipant.query.filter_by(
        conversation_id=conversation_id,
        user_id=user_id
    ).first()

    if is_blocked(user_id, participant.user_id):
        emit("error", {"error": "You are blocked"})
        return
    
    if not participant:
        emit("error", {"error": "Not allowed"})
        return

    join_room(conversation_room(conversation_id))

    emit("joined", {
        "conversation_id": conversation_id
    })


def create_conversation(user1_id, user2_id):
    convo = Conversation()
    db.session.add(convo)
    db.session.flush()  # get convo.id

    db.session.add_all([
        ConversationParticipant(conversation_id=convo.id, user_id=user1_id),
        ConversationParticipant(conversation_id=convo.id, user_id=user2_id)
    ])

    db.session.commit()
    return convo.id



def get_existing_conversation(user1_id, user2_id):
    return (
        db.session.query(Conversation)
        .join(ConversationParticipant)
        .filter(ConversationParticipant.user_id.in_([user1_id, user2_id]))
        .group_by(Conversation.id)
        .having(db.func.count(Conversation.id) == 2)
        .first()
    )


@chat.route('/messages', methods=['POST'])
def send_message():
    data = request.get_json()

    conversation_id = data.get('conversation_id')
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    content = data.get('content')
    if is_blocked(sender_id, receiver_id):
        return jsonify({"error": "Messaging not allowed"}), 403

    participant = ConversationParticipant.query.filter_by(
        conversation_id=conversation_id,
        user_id=sender_id
    ).first()

    if not participant:
        return jsonify({'error': 'Not allowed'}), 403

    msg = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content
    )

    db.session.add(msg)
    db.session.commit()

    # Create notification for receiver
    sender = User.query.get(sender_id)
    if sender:
        sender_name = f"{sender.first_name} {sender.last_name}".strip() or sender.username
        # Truncate message content for notification
        notification_content = content[:50] + "..." if len(content) > 50 else content
        create_notification(receiver_id, sender_id, 'message', notification_content)

    # 🔥 REAL-TIME UPDATE
    socketio.emit(
        "new_message",
        {
            "id": msg.id,
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "content": content,
            "timestamp": msg.timestamp.isoformat()
        },
        room=conversation_room(conversation_id)
    )

    return jsonify({'message': 'Sent'}), 201


@socketio.on("send_message")
def send_message_socket(data):
    conversation_id = data["conversation_id"]
    sender_id = data["sender_id"]
    receiver_id = data["receiver_id"]
    content = data["content"]
    if is_blocked(sender_id, receiver_id):
        emit("error", {"error": "Messaging not allowed"})
        return

    participant = ConversationParticipant.query.filter_by(
        conversation_id=conversation_id,
        user_id=sender_id
    ).first()

    if not participant:
        emit("error", {"error": "Not allowed"})
        return

    msg = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content
    )

    db.session.add(msg)
    db.session.commit()

    # Create notification for receiver
    sender = User.query.get(sender_id)
    if sender:
        sender_name = f"{sender.first_name} {sender.last_name}".strip() or sender.username
        # Truncate message content for notification
        notification_content = content[:50] + "..." if len(content) > 50 else content
        create_notification(receiver_id, sender_id, 'message', notification_content)

    emit(
        "new_message",
        {
            "id": msg.id,
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "content": content,
            "timestamp": msg.timestamp.isoformat()
        },
        room=conversation_room(conversation_id)
    )



@chat.route('/messages/<int:conversation_id>/', methods=['GET'])
def get_messages(conversation_id):
    messages = (
        Message.query
        .filter_by(conversation_id=conversation_id)
        .order_by(Message.timestamp)
        .all()
    )

    return jsonify([
        {
            'id': m.id,
            'sender_id': m.sender_id,
            'receiver_id': m.receiver_id,
            'content': m.content,
            'timestamp': m.timestamp.isoformat()
        }
        for m in messages
    ])


@chat.route('/conversations/<int:user_id>/', methods=['GET'])
def get_conversations(user_id):
    conversations = (
        db.session.query(Conversation)
        .join(ConversationParticipant)
        .filter(ConversationParticipant.user_id == user_id)
        .all()
    )

    result = []
    for convo in conversations:
        participants = ConversationParticipant.query.filter_by(
            conversation_id=convo.id
        ).all()
        participant_ids = [p.user_id for p in participants]

        result.append({
            'conversation_id': convo.id,
            'participant_ids': participant_ids,
            'created_at': convo.created_at.isoformat()
        })

    return jsonify(result)