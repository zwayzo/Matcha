#!/usr/bin/env python3
"""
Script to manually add the fame_rating column to the profile table
Run this if you can't use migrations properly
"""
import os
import psycopg2
import sys

# Database connection parameters from .env
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "flaskdb"
DB_USER = "flaskuser"
DB_PASSWORD = "flaskpass"

try:
    # Connect to database
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()
    
    # Add the fame_rating column if it doesn't exist
    cursor.execute("""
        ALTER TABLE profile 
        ADD COLUMN IF NOT EXISTS fame_rating INTEGER DEFAULT 0;
    """)
    
    # Update any existing records to have fame_rating = 0 if NULL
    cursor.execute("""
        UPDATE profile 
        SET fame_rating = 0 
        WHERE fame_rating IS NULL;
    """)
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("✅ Successfully added fame_rating column to profile table!")
    
except psycopg2.Error as e:
    print(f"❌ Database error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")