# Backend Setup Guide

## Prerequisites
- Python 3.10+
- PostgreSQL database
- pip (Python package manager)

## Setup Steps

### 1. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` directory with the following variables:

```env
SECRET_KEY=your-secret-key-here-change-this-in-production
DATABASE_URL=postgresql://username:password@localhost:5432/flaskdb
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
```

### 3. Setup Database
Make sure PostgreSQL is running and the database exists. The app will create tables automatically on first run.

### 4. Run Database Migrations (if needed)
```bash
cd backend
flask db upgrade
```

### 5. Start the Backend Server
```bash
cd backend
python main.py
```

The backend will start on `http://localhost:5001`

## API Endpoints

### Authentication
- `POST /api/auth/sign-up` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires Bearer token)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/` - Reset password with token

### Users
- `GET /api/users/:id` - Get user profile by ID
- `POST /api/users/profile` - Update user profile (requires authentication)

## Frontend Configuration

The frontend is configured to use the backend API. Make sure:

1. Backend is running on `http://localhost:5001`
2. Frontend environment variable `NEXT_PUBLIC_API_BASE_URL` is set to `http://localhost:5001` (or update in `lib/auth-context.tsx`)

## Testing the Connection

1. Start the backend: `python backend/main.py`
2. Start the frontend: `npm run dev`
3. Try registering a new account at `http://localhost:3000/register`
4. Check the backend console for API requests

## Troubleshooting

### CORS Errors
- Make sure Flask-Cors is installed: `pip install Flask-Cors`
- Check that CORS is configured in `backend/website/__init__.py`

### Database Connection Errors
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env` file
- Ensure database exists: `createdb flaskdb`

### Port Already in Use
- Change the port in `backend/main.py` (line 80)
- Update `NEXT_PUBLIC_API_BASE_URL` in frontend accordingly
