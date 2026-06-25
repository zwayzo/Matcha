#!/usr/bin/env python3
"""
Script to seed interests into the database
"""
import os
import sys

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from website import create_app, db
from website.models import Interest

def seed_interests():
    \"\"\"Seed interests and categories into the database\"\"\"
    app = create_app()
    
    with app.app_context():
        # Ensure tables exist before querying
        db.create_all()
        
        # Use separate transaction for seeding to prevent conflicts
        try:
            # Check if interests already exist
            existing_interests = Interest.query.count()
            if existing_interests > 0:
                print(f\"✅ Interests already seeded ({existing_interests} entries found)\")
                return

            interests = [
                # Hobbies & Activities
                \"Traveling\", \"Hiking / Nature\", \"Camping\", \"Photography\",
                \"Reading / Books\", \"Writing / Journaling\", \"Cooking / Baking\",
                \"Gardening\", \"Painting / Drawing\", \"DIY / Crafts\", \"Dancing\",
                \"Singing / Music\", \"Playing instruments\", \"Gaming (Video / Board)\",
                \"Yoga / Meditation\", \"Fitness / Gym\", \"Sports\", \"Biking / Cycling\",
                \"Running / Marathon\", \"Swimming\", \"Adventure sports\",

                # Lifestyle & Personality
                \"Night owl\", \"Early bird\", \"Introvert\", \"Extrovert\",
                \"Ambitious\", \"Funny / Humor\", \"Romantic\", \"Geek / Nerd\",
                \"Creative\", \"Intellectual / Curious\", \"Fashion / Style\",
                \"Vegan / Vegetarian\", \"Foodie\", \"Traveler\",

                # Entertainment & Media
                \"Movies\", \"TV Series / Netflix\", \"Anime / Manga\",
                \"Comics / Graphic Novels\", \"Music\", \"Podcasts\",
                \"Gaming (PC, Console, Mobile)\", \"Theater / Performing Arts\",

                # Social & Community Interests
                \"Volunteering\", \"Charity work\", \"Environmental activism\",
                \"Social justice / Causes\", \"Tech / Startups\",
                \"Entrepreneurship\", \"Networking\", \"Politics / Debates\",

                # Romantic / Dating Preferences
                \"Casual dating\", \"Serious relationship\", \"Open-minded\",
                \"Polyamory\", \"LGBTQ+ friendly\", \"Kisses & cuddles\",
                \"Intellectual connection\", \"Adventure partner\",

                # Random / Fun Interests
                \"Memes / Internet culture\", \"Astrology / Zodiac\", \"Coffee / Tea lover\",
                \"Cats / Dogs / Pets\", \"Board games / Puzzles\", \"Cars / Motorcycles\",
                \"Travel photography\", \"Festivals / Concerts\", \"Wine / Beer tasting\"
            ]

            categories = [
                (\"Hobbies & Activities\", 21),
                (\"Lifestyle & Personality\", 14),
                (\"Entertainment & Media\", 8),
                (\"Social & Community Interests\", 8),
                (\"Romantic / Dating Preferences\", 8),
                (\"Random / Fun Interests\", 9)
            ]

            print(\"🌱 Seeding interests...\")
            
            # ✅ Use nested transaction for safer seeding
            with db.session.begin_nested():
                start = 0
                for cat_name, count in categories:
                    for interest_name in interests[start:start+count]:
                        interest = Interest(name=interest_name, category=cat_name)
                        db.session.add(interest)
                    start += count
            
            # ✅ Commit the seeding transaction
            db.session.commit()
            print(\"✅ Interests seeded successfully!\")
            print(f\"📊 Added {len(interests)} interests across {len(categories)} categories\")
            
        except Exception as e:
            print(f\"❌ Error seeding interests: {e}\")
            db.session.rollback()
            raise

if __name__ == '__main__':
    seed_interests()
