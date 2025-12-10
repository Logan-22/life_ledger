"""Test script to verify the Life Ledger API is working."""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000"

def test_health():
    """Test health endpoint."""
    print("1. Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    print()

def test_categories():
    """Test categories endpoint."""
    print("2. Testing categories endpoint...")
    response = requests.get(f"{BASE_URL}/api/categories")
    print(f"   Status: {response.status_code}")
    categories = response.json()
    print(f"   Found {len(categories)} categories:")
    for cat in categories:
        print(f"   - {cat['name']}: {cat['description']}")
    print()

def test_create_habit():
    """Test creating a habit."""
    print("3. Creating a test habit...")
    habit_data = {
        "name": "Morning Meditation",
        "description": "Meditate for 10 minutes every morning",
        "frequency": "daily",
        "target_count": 1
    }
    response = requests.post(
        f"{BASE_URL}/api/personal/habits",
        json=habit_data
    )
    print(f"   Status: {response.status_code}")
    habit = response.json()
    print(f"   Created habit: {habit['name']} (ID: {habit['id']})")
    print()
    return habit['id']

def test_log_habit(habit_id):
    """Test logging a habit."""
    print(f"4. Logging habit completion for ID {habit_id}...")
    log_data = {
        "notes": "Completed morning meditation session"
    }
    response = requests.post(
        f"{BASE_URL}/api/personal/habits/{habit_id}/log",
        json=log_data
    )
    print(f"   Status: {response.status_code}")
    result = response.json()
    print(f"   Current streak: {result['streak']['current_streak']} days")
    print()

def test_get_habit_with_streak(habit_id):
    """Test getting habit with streak info."""
    print(f"5. Getting habit details with streak for ID {habit_id}...")
    response = requests.get(f"{BASE_URL}/api/personal/habits/{habit_id}")
    print(f"   Status: {response.status_code}")
    habit = response.json()
    print(f"   Habit: {habit['name']}")
    print(f"   Current Streak: {habit['streak']['current_streak']} days")
    print(f"   Longest Streak: {habit['streak']['longest_streak']} days")
    print()

def test_create_diet_entry():
    """Test creating a diet entry."""
    print("6. Creating a test diet entry...")
    diet_data = {
        "meal_type": "breakfast",
        "food_item": "Greek Yogurt with Berries",
        "description": "Low-fat Greek yogurt with mixed berries",
        "calories": 250,
        "protein": 18,
        "carbs": 30,
        "fats": 4
    }
    response = requests.post(
        f"{BASE_URL}/api/personal/diet",
        json=diet_data
    )
    print(f"   Status: {response.status_code}")
    entry = response.json()
    print(f"   Created entry: {entry['food_item']} - {entry['calories']} cal")
    print()

def test_diet_summary():
    """Test getting diet summary."""
    print("7. Getting diet summary...")
    response = requests.get(f"{BASE_URL}/api/personal/diet/summary")
    print(f"   Status: {response.status_code}")
    summary = response.json()
    print(f"   Total Entries: {summary['total_entries']}")
    print(f"   Total Calories: {summary['total_calories']}")
    print(f"   Total Protein: {summary['total_protein']}g")
    print()

if __name__ == "__main__":
    print("=" * 60)
    print("Life Ledger API Test Suite")
    print("=" * 60)
    print()
    
    try:
        test_health()
        test_categories()
        habit_id = test_create_habit()
        test_log_habit(habit_id)
        test_get_habit_with_streak(habit_id)
        test_create_diet_entry()
        test_diet_summary()
        
        print("=" * 60)
        print("✅ All tests passed successfully!")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
