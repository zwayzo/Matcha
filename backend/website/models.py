from . import db
from flask_login import UserMixin
from datetime import datetime

profile_interests = db.Table(
    'profile_interests',
    db.Column('profile_id', db.Integer, db.ForeignKey('profile.id'), primary_key=True),
    db.Column('interest_id', db.Integer, db.ForeignKey('interest.id'), primary_key=True)
)


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True)
    password = db.Column(db.String(500))
    first_name = db.Column(db.String(150))
    last_name = db.Column(db.String(150))
    username = db.Column(db.String(150), unique=True)
    age = db.Column(db.Integer)
    emailVerified = db.Column(db.Boolean, default=False)
    sex = db.Column(db.Enum('male', 'female', 'n/o', name='sex'))
    sexualPreference = db.Column(db.Enum('male', 'female', 'everyone', name='sexual_preference'), default='everyone')
    profile = db.relationship("Profile", backref="user", uselist=False)

    reset_token_hash = db.Column(db.String(500), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    location = db.Column(db.String(150), nullable=True)
    def serialize(self):

        profile = self.profile

        if not profile:
            profile_data = None
        else:
            # Example if interests is a relationship
            interests = [interest.name for interest in profile.interests]

            profile_data = {
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

        return {
            "user": {
                "id": self.id,
                "username": self.username,
                "email": self.email,
                "first_name": self.first_name,
                "last_name": self.last_name,
                "age": self.age,
                "sex": self.sex,
                "sexualPreference": self.sexualPreference,
                "emailVerified": self.emailVerified,
                "location": self.location
            },
            "profile": profile_data
        }
    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "username": self.username,
            "age": self.age,
            "emailVerified": self.emailVerified,
            "sex": self.sex,
            "sexualPreference": self.sexualPreference,
            "location": self.location
        }
        
    def __repr__(self):
        return f"<User {self.username}>"


class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Link to user

    title = db.Column(db.String(150))
    company = db.Column(db.String(150))
    industry = db.Column(db.String(150))
    experienceLevel = db.Column(
        db.Enum('Entry-level', 'Mid-level', 'Senior', 'Manager', 'Director', 'Executive', 'Founder', name='experience_level')
    )
    education = db.Column(db.String(150))
    bio = db.Column(db.String(500))

    # Many-to-many relationship with interests
    interests = db.relationship(
        "Interest",
        secondary=profile_interests,
        backref=db.backref('profiles', lazy='dynamic')
    )
    
    profile_image = db.Column(db.Text)
    
    image1 = db.Column(db.Text)
    image2 = db.Column(db.Text)
    image3 = db.Column(db.Text)
    image4 = db.Column(db.Text)

    verified = db.Column(db.Boolean, default=False)
    online = db.Column(db.Boolean, default=False)
    location = db.Column(db.String(150))
    fame_rating = db.Column(db.Integer)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "company": self.company,
            "industry": self.industry,
            "experienceLevel": self.experienceLevel,
            "education": self.education,
            "bio": self.bio,
            "interests": [interest.name for interest in self.interests],
            "profile_image": self.profile_image,
            "image1": self.image1,
            "image2": self.image2,
            "image3": self.image3,
            "image4": self.image4,
            "verified": self.verified,
            "online": self.online,
            "location": self.location,
            "fame_rating": self.fame_rating
        }
    
    
    def __repr__(self):
        return f"<Profile {self.title} of User {self.user_id}>"
    


class Interest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    category = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f"<Interest {self.name}>"



class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ConversationParticipant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer, db.ForeignKey('conversation.id'), nullable=False
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey('user.id'), nullable=False
    )

    __table_args__ = (
        db.UniqueConstraint('conversation_id', 'user_id'),
    )


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer, db.ForeignKey('conversation.id'), nullable=False
    )
    sender_id = db.Column(
        db.Integer, db.ForeignKey('user.id'), nullable=False
    )
    receiver_id = db.Column(
        db.Integer, db.ForeignKey('user.id'), nullable=False
    )
    
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    
    
    
class Match(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    from_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    to_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.Enum('like',name='match_action'), nullable=False, default='like')
    nothing = db.Column(db.Boolean, default=False)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversation.id'), nullable=True)
    
class Swipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    from_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    to_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.Enum('like', 'dislike', name='swipe_action'), nullable=False)
    
    
    
class UserBlock(db.Model):
    __tablename__ = "user_blocks"

    id = db.Column(db.Integer, primary_key=True)
    blocker_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    blocked_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint("blocker_id", "blocked_id", name="unique_block"),
    )


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    from_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    type = db.Column(db.Enum('like', 'view', 'message', 'match', 'unlike', name='notification_type'), nullable=False)
    content = db.Column(db.Text, nullable=True)
    read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship("User", foreign_keys=[user_id], backref="notifications")
    from_user = db.relationship("User", foreign_keys=[from_user_id])
    
    def to_dict(self):
        return {
            "id": self.id,
            "userId": str(self.user_id),
            "fromUserId": str(self.from_user_id),
            "type": self.type,
            "content": self.content or "",
            "read": self.read,
            "createdAt": self.created_at.isoformat()
        }


class ProfileVisit(db.Model):
    __tablename__ = "profile_visits"

    id = db.Column(db.Integer, primary_key=True)

    visitor_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    visited_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    visitor = db.relationship('User', foreign_keys=[visitor_id])

    timestamp = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )


class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reported_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reason = db.Column(db.String(255))   # optional, like "fake account"
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
