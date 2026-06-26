import requests
import random

# ─── CONFIG ───────────────────────────────────────────────────────────────────
API_URL = "https://matcha-2.onrender.com/api/auth/sign-up"

def get_images(sex: str, seed: int):
    """Return 4 image URLs. image1 = realistic profile photo, 2-4 = lifestyle extras."""
    gender = "women" if sex == "female" else "men"
    num = (seed % 99) + 1  # randomuser.me has 0–99 per gender (100 photos)
    return {
        "profile_image": f"https://i.pravatar.cc/400?img={num}",
        "image1": f"https://i.pravatar.cc/400?img={num}",
        "image2": f"https://picsum.photos/seed/{seed}a/400/400",
        "image3": f"https://picsum.photos/seed/{seed}b/400/400",
        "image4": f"https://picsum.photos/seed/{seed}c/400/400",
    }

# ─── DATA POOLS ───────────────────────────────────────────────────────────────
INDUSTRIES = ["technologie", "finance", "healthcare", "education", "marketing", "consulting"]

EXPERIENCE_LEVELS = ["Entry-level", "Mid-level", "Senior", "Manager", "Director", "Executive", "Founder"]

EDUCATIONS = [
    "Bachelor's in Computer Science", "Master's in Computer Science",
    "Bachelor's in Business", "Master's in Business", "MBA",
    "Bachelor's in Design", "Bachelor's in Fine Arts",
    "Master's in Statistics", "PhD in Machine Learning",
    "Bachelor's in Journalism", "Bachelor's in Communications",
    "Master's in Software Engineering", "Bachelor's in IT",
    "Master's in HR Management", "Bachelor's in Network Security",
    "Bachelor's in Fashion Design", "PhD in Engineering",
    "Bachelor's in Marketing", "Master's in Finance",
    "Bachelor's in Psychology", "Master's in Data Science",
]

ALL_INTERESTS = [
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
    "LGBTQ+ friendly", "Kisses & cuddles",
    "Intellectual connection", "Adventure partner",
    "Memes / Internet culture", "Astrology / Zodiac", "Coffee / Tea lover",
    "Cats / Dogs / Pets", "Board games / Puzzles", "Cars / Motorcycles",
    "Travel photography", "Festivals / Concerts", "Wine / Beer tasting"
]

FIRST_NAMES_MALE = [
    "James", "Oliver", "Noah", "Liam", "Ethan", "Lucas", "Mason", "Logan",
    "Aiden", "Jackson", "Sebastian", "Alexander", "Benjamin", "William",
    "Elijah", "Henry", "Daniel", "Matthew", "Joseph", "David", "Samuel",
    "Ryan", "Nathan", "Adam", "Dylan", "Tyler", "Jordan", "Justin",
    "Brandon", "Kevin", "Brian", "Eric", "Steven", "Timothy", "Patrick",
    "Ahmed", "Mohamed", "Ali", "Omar", "Youssef", "Khalid", "Hassan",
    "Carlos", "Miguel", "Diego", "Luis", "Juan", "Pedro", "Rafael",
    "Luca", "Marco", "Matteo", "Lorenzo", "Giovanni", "Francesco",
    "Felix", "Leon", "Paul", "Jan", "Lukas", "Maximilian", "Tobias",
    "Ryo", "Kenji", "Hiroshi", "Takeshi", "Yuki", "Daiki", "Sota",
    "Min", "Jae", "Hyun", "Sung", "Jin", "Tae", "Young",
    "Wei", "Jun", "Hao", "Chen", "Yang", "Lei", "Feng",
    "Arjun", "Raj", "Vikram", "Rohan", "Aditya", "Siddharth",
    "Tom", "Jack", "George", "Charlie", "Harry", "Alfie", "Archie",
    "Pierre", "Jean", "Louis", "Hugo", "Gabriel", "Antoine", "Maxime",
]

FIRST_NAMES_FEMALE = [
    "Emma", "Olivia", "Sophia", "Ava", "Isabella", "Mia", "Charlotte",
    "Amelia", "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth",
    "Sofia", "Avery", "Ella", "Scarlett", "Grace", "Chloe", "Victoria",
    "Riley", "Aria", "Lily", "Zoey", "Hannah", "Lillian", "Addison",
    "Aubrey", "Eleanor", "Natalie", "Luna", "Savannah", "Brooklyn",
    "Leah", "Zoe", "Stella", "Hazel", "Ellie", "Paisley", "Audrey",
    "Sarah", "Jessica", "Ashley", "Amanda", "Megan", "Lauren", "Rachel",
    "Fatima", "Aisha", "Noor", "Layla", "Yasmin", "Mariam", "Rania",
    "Sofia", "Valentina", "Camila", "Gabriela", "Lucia", "Daniela",
    "Giulia", "Chiara", "Francesca", "Martina", "Sara", "Elena",
    "Anna", "Laura", "Maria", "Nina", "Lisa", "Julia", "Lena",
    "Yuki", "Hana", "Sakura", "Rin", "Miku", "Ayaka", "Nana",
    "Ji", "Soo", "Eun", "Hyun", "Min", "Yeon", "Hye",
    "Priya", "Ananya", "Neha", "Pooja", "Divya", "Riya", "Shreya",
    "Alice", "Sophie", "Isabelle", "Camille", "Manon", "Lea", "Clara",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Martinez", "Wilson", "Anderson", "Taylor", "Thomas", "Jackson",
    "White", "Harris", "Martin", "Thompson", "Young", "Robinson", "Lewis",
    "Walker", "Hall", "Allen", "King", "Wright", "Scott", "Torres",
    "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker",
    "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell",
    "Parker", "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris",
    "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey",
    "Rivera", "Cooper", "Richardson", "Cox", "Howard", "Ward", "Torres",
    "Peterson", "Gray", "Ramirez", "James", "Watson", "Brooks", "Kelly",
    "Sanders", "Price", "Bennett", "Wood", "Barnes", "Ross", "Henderson",
    "Coleman", "Jenkins", "Perry", "Powell", "Long", "Patterson", "Hughes",
    # European
    "Dubois", "Laurent", "Bernard", "Petit", "Leroy", "Moreau", "Simon",
    "Ferrari", "Rossi", "Russo", "Esposito", "Bianchi", "Romano", "Ricci",
    "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner",
    # Asian
    "Kim", "Lee", "Park", "Choi", "Jung", "Kang", "Yoon",
    "Chen", "Wang", "Liu", "Zhang", "Yang", "Huang", "Zhao",
    "Tanaka", "Suzuki", "Sato", "Watanabe", "Ito", "Yamamoto",
    "Patel", "Shah", "Singh", "Kumar", "Sharma", "Verma", "Gupta",
    # Others
    "Ali", "Hassan", "Mohamed", "Ahmed", "Khan", "Malik", "Raza",
    "Silva", "Santos", "Oliveira", "Souza", "Costa", "Ferreira",
    "O'Connor", "Murphy", "Walsh", "O'Brien", "Byrne", "Ryan",
    "Nakamura", "Kobayashi", "Kato", "Ito", "Hayashi", "Yamaguchi",
]

TITLES = [
    "Software Engineer", "Senior Software Engineer", "Frontend Developer",
    "Backend Developer", "Full-Stack Developer", "DevOps Engineer",
    "Data Scientist", "Data Analyst", "ML Engineer", "AI Researcher",
    "Product Manager", "Project Manager", "Engineering Manager",
    "UX Designer", "UI Designer", "Graphic Designer",
    "Marketing Manager", "Digital Marketing Specialist", "SEO Specialist",
    "Content Writer", "Copywriter", "Social Media Manager",
    "Business Analyst", "Financial Analyst", "Investment Banker",
    "HR Manager", "HR Director", "Recruiter", "Talent Acquisition",
    "Sales Manager", "Account Executive", "Business Development Manager",
    "CTO", "CIO", "CEO", "COO", "CFO",
    "Cybersecurity Analyst", "Network Engineer", "Cloud Architect",
    "Game Developer", "Mobile Developer", "QA Engineer",
    "Startup Founder", "Entrepreneur", "Consultant",
    "Teacher", "Professor", "Researcher",
    "Doctor", "Nurse", "Healthcare Specialist",
    "Lawyer", "Paralegal", "Legal Counsel",
    "Architect", "Civil Engineer", "Mechanical Engineer",
    "Fashion Designer", "Interior Designer", "Brand Strategist",
    "Photographer", "Videographer", "Film Director",
    "Chef", "Pastry Chef", "Restaurant Manager",
    "Journalist", "Editor", "Publisher",
    "Financial Advisor", "Accountant", "Tax Consultant",
]

COMPANIES = [
    "Google", "Apple", "Microsoft", "Amazon", "Meta", "Netflix", "Spotify",
    "Airbnb", "Uber", "Tesla", "OpenAI", "Anthropic", "DeepMind", "Palantir",
    "Stripe", "Shopify", "Slack", "Zoom", "Salesforce", "Oracle", "SAP",
    "TechNova", "CloudBase", "FinEdge", "Pixelcraft", "BrandWave", "MediaHub",
    "InsightAI", "LaunchPad", "SecureNet", "NinjaStudio", "OceanTech",
    "PeopleFirst", "VinGroup", "Kakao", "Trendify", "SAPNext",
    "StartupXYZ", "DigitalEdge", "DataSphere", "NexTech", "FutureLab",
    "Freelance", "Self-employed", "Consulting Group", "Ventures Co.",
    "GlobalTech", "EuroFinance", "AsiaConnect", "AfricaRise",
    "BlueHorizon", "RedRock", "GreenLeaf", "SilverCloud", "GoldPath",
]

LOCATIONS = [
    "Paris, France", "London, UK", "New York, USA", "Los Angeles, USA",
    "San Francisco, USA", "Chicago, USA", "Austin, USA", "Seattle, USA",
    "Miami, USA", "Boston, USA", "Toronto, Canada", "Vancouver, Canada",
    "Montreal, Canada", "Berlin, Germany", "Munich, Germany", "Hamburg, Germany",
    "Madrid, Spain", "Barcelona, Spain", "Rome, Italy", "Milan, Italy",
    "Amsterdam, Netherlands", "Brussels, Belgium", "Zurich, Switzerland",
    "Stockholm, Sweden", "Copenhagen, Denmark", "Oslo, Norway", "Helsinki, Finland",
    "Warsaw, Poland", "Prague, Czech Republic", "Vienna, Austria",
    "Lisbon, Portugal", "Athens, Greece", "Budapest, Hungary",
    "Tokyo, Japan", "Osaka, Japan", "Seoul, South Korea", "Beijing, China",
    "Shanghai, China", "Shenzhen, China", "Hong Kong", "Singapore",
    "Bangkok, Thailand", "Kuala Lumpur, Malaysia", "Jakarta, Indonesia",
    "Manila, Philippines", "Ho Chi Minh City, Vietnam", "Hanoi, Vietnam",
    "Mumbai, India", "Delhi, India", "Bangalore, India", "Chennai, India",
    "Dubai, UAE", "Abu Dhabi, UAE", "Riyadh, Saudi Arabia", "Cairo, Egypt",
    "Cape Town, South Africa", "Johannesburg, South Africa", "Nairobi, Kenya",
    "Lagos, Nigeria", "Accra, Ghana", "Casablanca, Morocco",
    "Buenos Aires, Argentina", "São Paulo, Brazil", "Rio de Janeiro, Brazil",
    "Bogotá, Colombia", "Lima, Peru", "Santiago, Chile", "Mexico City, Mexico",
    "Sydney, Australia", "Melbourne, Australia", "Auckland, New Zealand",
    "Dublin, Ireland", "Edinburgh, UK", "Manchester, UK",
    "Lyon, France", "Marseille, France", "Bordeaux, France",
    "Istanbul, Turkey", "Tel Aviv, Israel", "Beirut, Lebanon",
    "Moscow, Russia", "Saint Petersburg, Russia",
]

BIOS = [
    "Passionate about building things that matter.",
    "Living life one adventure at a time.",
    "Turning coffee into code since 2015.",
    "Foodie, traveler, and weekend hiker.",
    "Making the world a slightly better place.",
    "Lifelong learner with a love for music.",
    "Data enthusiast who loves a good story.",
    "Creative mind, analytical heart.",
    "Building products people actually love.",
    "Words are my superpower.",
    "Crafting visuals that speak louder than words.",
    "On a mission to connect people.",
    "Explorer of cities, cultures, and cuisines.",
    "Automating everything so humans don't have to.",
    "Bridging the gap between code and people.",
    "React enthusiast and dark-mode advocate.",
    "Making machines smarter, one model at a time.",
    "Serial entrepreneur obsessed with solving problems.",
    "Style is a way of saying who you are without speaking.",
    "Keeping the bad guys out since 2015.",
    "Growing communities one post at a time.",
    "Crafting worlds where players get lost for hours.",
    "People are the most valuable asset in any company.",
    "Leading teams to build scalable systems.",
    "Turning raw data into meaningful stories.",
    "Full-stack developer who loves open source.",
    "Brand storyteller and coffee addict.",
    "Passionate about creating beautiful user experiences.",
    "Always learning, always growing.",
    "Chasing sunsets and deadlines.",
    "Dog person. Pizza enthusiast. Amateur chef.",
    "Introvert who codes, extrovert who travels.",
    "On a perpetual quest for the perfect cup of coffee.",
    "Gym in the morning, hackathon at night.",
    "Finding patterns in chaos.",
    "Helping startups find their voice.",
    "Obsessed with clean architecture and good design.",
    "If it can be automated, it will be.",
    "Making data accessible to everyone.",
    "Believer in the power of community.",
    "Music lover by day, coder by night.",
    "Hiking mountains and solving problems.",
    "Designing experiences, not just interfaces.",
    "One commit closer to the dream.",
    "Work hard, travel harder.",
    "Minimalist in design, maximalist in ambition.",
    "Connecting dots across industries.",
    "Storytelling through data and design.",
    "The intersection of tech and humanity fascinates me.",
    "Building the future, one line at a time.",
]

SEXUAL_PREFERENCES = ["male", "female", "everyone"]
SEXUAL_PREF_WEIGHTS = [0.40, 0.40, 0.20]


# ─── GENERATOR ────────────────────────────────────────────────────────────────
def generate_users(n=500, seed=42):
    random.seed(seed)
    users = []
    used_usernames = set()
    used_emails = set()

    for i in range(n):
        sex = random.choice(["male", "female"])
        first_names = FIRST_NAMES_MALE if sex == "male" else FIRST_NAMES_FEMALE
        first = random.choice(first_names)
        last = random.choice(LAST_NAMES)

        # Unique username
        base = f"{first.lower()}_{last.lower()[:4]}"
        username = base
        suffix = 1
        while username in used_usernames:
            username = f"{base}{suffix}"
            suffix += 1
        used_usernames.add(username)

        # Unique email
        base_email = f"{first.lower()}.{last.lower()}@example.com"
        email = base_email
        suffix = 1
        while email in used_emails:
            email = f"{first.lower()}.{last.lower()}{suffix}@example.com"
            suffix += 1
        used_emails.add(email)

        pref = random.choices(SEXUAL_PREFERENCES, weights=SEXUAL_PREF_WEIGHTS)[0]

        users.append({
            "email": email,
            "username": username,
            "password": "Password123!",
            "first_name": first,
            "last_name": last,
            "age": str(random.randint(18, 50)),
            "sex": sex,
            "sexualPreference": pref,
            "location": random.choice(LOCATIONS),
            "emailVerified": "t",
            "title": random.choice(TITLES),
            "company": random.choice(COMPANIES),
            "industry": random.choice(INDUSTRIES),
            "experienceLevel": random.choice(EXPERIENCE_LEVELS),
            "education": random.choice(EDUCATIONS),
            "bio": random.choice(BIOS),
            "interests": random.sample(ALL_INTERESTS, k=random.randint(6, 6)),
        })

    return users


# ─── SEND REQUESTS ────────────────────────────────────────────────────────────
def seed_users():
    users = generate_users(500)
    total = len(users)
    print(f"🚀 Seeding {total} users to {API_URL}\n")
    success, failed = 0, 0

    for i, user in enumerate(users, 1):
        payload = {**user, **get_images(user["sex"], i)}

        print(f"[{i:03d}/{total}] {user['username']} ({user['email']}) ...", end=" ")

        try:
            resp = requests.post(API_URL, json=payload, timeout=15)
            if resp.status_code in (200, 201):
                print(f"✅  {resp.status_code}")
                success += 1
            else:
                print(f"❌  {resp.status_code}  {resp.text[:120]}")
                failed += 1
        except requests.exceptions.ConnectionError:
            print("❌  Connection refused — is the server running?")
            failed += 1
        except Exception as e:
            print(f"❌  {e}")
            failed += 1

    print(f"\n{'─'*40}")
    print(f"Done!  ✅ {success} created   ❌ {failed} failed")


if __name__ == "__main__":
    seed_users()