import pytest
from backend.website.models import db, Profile
from backend.website import create_app

@pytest.fixture
def app():
    app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_valid_industry(app):
    """Test valid industry values."""
    with app.app_context():
        valid_industries = [
            'technologie',
            'finance',
            'healthcare', 
            'education',
            'marketing',
            'consulting'
        ]
        
        for industry in valid_industries:
            profile = Profile(
                user_id=1,
                industry=industry
            )
            db.session.add(profile)
            db.session.commit()
            assert profile.industry == industry

def test_invalid_industry(app):
    """Test that invalid industries are rejected."""
    with app.app_context():
        invalid_industries = [
            'invalid',
            '',
            None,
            123
        ]
        
        for industry in invalid_industries:
            profile = Profile(user_id=1, industry=industry)
            db.session.add(profile)
            with pytest.raises(Exception):
                db.session.commit()
            db.session.rollback()
