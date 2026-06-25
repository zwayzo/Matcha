#!/usr/bin/env python3
"""
Debug script to test JWT token authentication
"""
import requests
import json
from datetime import datetime

def test_authentication_flow():
    """Test the complete authentication flow"""
    base_url = "http://127.0.0.1:5001/api"
    
    print("🔧 Authentication Flow Debug")
    print("=" * 40)
    
    # Test 1: Login to get token  
    login_data = {
        "email": "azzeddine.siammed@gmail.com", 
        "password": "12345678"
    }
    
    print("🔑 Step 1: Testing Login...")
    try:
        login_response = requests.post(f"{base_url}/auth/login", json=login_data)
        print(f"   Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get("token")
            user_data = login_result.get("user", {})
            
            print(f"   ✅ Login successful!")
            print(f"   📝 User ID: {user_data.get('id')}")
            print(f"   🎟️  Token: {token[:40]}..." if token else "   ❌ No token received")
            
            if token:
                # Test 2: Use token to access protected endpoint
                print(f"\n🛡️  Step 2: Testing Protected Endpoint...")
                user_id = user_data.get("id", 117)  # Use logged in user's ID or fallback
                
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                
                try:
                    profile_response = requests.get(f"{base_url}/users/{user_id}", headers=headers)
                    print(f"   Status: {profile_response.status_code}")
                    
                    if profile_response.status_code == 200:
                        print(f"   ✅ Protected endpoint access successful!")
                        profile_data = profile_response.json()
                        print(f"   👤 Profile loaded for: {profile_data.get('user', {}).get('username', 'Unknown')}")
                    else:
                        print(f"   ❌ Protected endpoint failed: {profile_response.text}")
                        
                        # Check if it's a token issue
                        error_data = profile_response.json() if profile_response.status_code != 500 else {}
                        error_msg = error_data.get("error", "Unknown error")
                        print(f"   🔍 Error details: {error_msg}")
                        
                except Exception as e:
                    print(f"   ❌ Request failed: {e}")
                    
            else:
                print("   ❌ Cannot test protected endpoint - no token received")
                
        else:
            print(f"   ❌ Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"   ❌ Login request failed: {e}")
    
    # Test 3: Token validation info
    print(f"\n🕐 Step 3: Token Info...")
    print(f"   ⏰ Current token expiry: 24 hours (86400 seconds)")
    print(f"   🕒 Current time: {datetime.now().strftime('%H:%M:%S')}")
    
    # Test 4: Check required headers
    print(f"\n📋 Step 4: Required Headers for Protected Routes:")
    print(f"   Authorization: Bearer <token>")
    print(f"   Content-Type: application/json")
    
    # Test 5: Common issues
    print(f"\n🚨 Common Authentication Issues:")
    print(f"   1. Token expired (1 hour limit)")
    print(f"   2. Token not sent with 'Bearer ' prefix")
    print(f"   3. Frontend localStorage cleared")
    print(f"   4. CORS issues preventing header sending")
    print(f"   5. Token stored incorrectly in frontend")

if __name__ == '__main__':
    test_authentication_flow()