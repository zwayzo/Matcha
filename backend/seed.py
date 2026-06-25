from website import create_app, db
from website.models import Interest

app = create_app()

interests = [
    # Hobbies & Activities
    "Traveling", "Hiking / Nature", "Camping", "Photography",
    "Reading / Books", "Writing / Journaling", "Cooking / Baking",
    "Gardening", "Painting / Drawing", "DIY / Crafts", "Dancing",
    "Singing / Music", "Playing instruments", "Gaming (Video / Board)",
    "Yoga / Meditation", "Fitness / Gym", "Sports", "Biking / Cycling",
    "Running / Marathon", "Swimming", "Adventure sports",
    "Night owl", "Early bird", "Introvert", "Extrovert",
    "Ambitious", "Funny / Humor", "Romantic", "Geek / Nerd",
    "Creative", "Intellectual / Curious", "Fashion / Style",
    "Vegan / Vegetarian", "Foodie", "Traveler",
    "Movies", "TV Series / Netflix", "Anime / Manga",
    "Comics / Graphic Novels", "Music", "Podcasts",
    "Gaming (PC, Console, Mobile)", "Theater / Performing Arts",
    "Volunteering", "Charity work", "Environmental activism",
    "Social justice / Causes", "Tech / Startups",
    "Entrepreneurship", "Networking", "Politics / Debates",
    "Casual dating", "Serious relationship", "Open-minded",
    "Polyamory", "LGBTQ+ friendly", "Kisses & cuddles",
    "Intellectual connection", "Adventure partner",
    "Memes / Internet culture", "Astrology / Zodiac", "Coffee / Tea lover",
    "Cats / Dogs / Pets", "Board games / Puzzles", "Cars / Motorcycles",
    "Travel photography", "Festivals / Concerts", "Wine / Beer tasting"
]

categories = [
    ("Hobbies & Activities", 21),
    ("Lifestyle & Personality", 14),
    ("Entertainment & Media", 8),
    ("Social & Community Interests", 8),
    ("Romantic / Dating Preferences", 8),
    ("Random / Fun Interests", 9)
]

def seed_interests():
    with app.app_context():
        # Skip if already seeded
        if Interest.query.first():
            print("⏭️  Interests already seeded, skipping.")
            return

        start = 0
        for cat_name, count in categories:
            for interest_name in interests[start:start + count]:
                db.session.add(Interest(name=interest_name, category=cat_name))
            start += count

        db.session.commit()
        print("✅ Interests seeded!")

if __name__ == '__main__':
    seed_interests()