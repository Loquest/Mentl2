"""
Test suite for Mood-Based Dietary Suggestions feature
Tests:
- GET /api/users/me/dietary-preferences
- PUT /api/users/me/dietary-preferences
- POST /api/dietary/suggestions (quick_snack, recipe, meal_plan)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.text}")
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Return headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestDietaryPreferences:
    """Tests for dietary preferences endpoints"""
    
    def test_get_dietary_preferences_initial(self, auth_headers):
        """Test GET /api/users/me/dietary-preferences returns proper structure"""
        response = requests.get(
            f"{BASE_URL}/api/users/me/dietary-preferences",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "dietary_preferences" in data
        assert "is_configured" in data
        assert isinstance(data["dietary_preferences"], dict)
        assert isinstance(data["is_configured"], bool)
    
    def test_update_dietary_preferences_diet_type(self, auth_headers):
        """Test PUT /api/users/me/dietary-preferences with diet_type"""
        payload = {
            "diet_type": "vegetarian"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/users/me/dietary-preferences",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert "dietary_preferences" in data
        assert data["dietary_preferences"]["diet_type"] == "vegetarian"
    
    def test_update_dietary_preferences_allergies(self, auth_headers):
        """Test PUT /api/users/me/dietary-preferences with allergies"""
        payload = {
            "allergies": ["Nuts", "Dairy", "Shellfish"]
        }
        
        response = requests.put(
            f"{BASE_URL}/api/users/me/dietary-preferences",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "Nuts" in data["dietary_preferences"]["allergies"]
        assert "Dairy" in data["dietary_preferences"]["allergies"]
        assert "Shellfish" in data["dietary_preferences"]["allergies"]
    
    def test_update_dietary_preferences_full(self, auth_headers):
        """Test PUT /api/users/me/dietary-preferences with all fields"""
        payload = {
            "diet_type": "pescatarian",
            "allergies": ["Nuts"],
            "intolerances": ["Lactose"],
            "cultural_preferences": "mediterranean",
            "avoid_foods": ["Spicy food", "Raw onions"],
            "preferred_cuisines": ["Italian", "Japanese"],
            "meal_prep_time": "quick",
            "budget_preference": "moderate"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/users/me/dietary-preferences",
            headers=auth_headers,
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        prefs = data["dietary_preferences"]
        assert prefs["diet_type"] == "pescatarian"
        assert "Nuts" in prefs["allergies"]
        assert "Lactose" in prefs["intolerances"]
        assert prefs["cultural_preferences"] == "mediterranean"
        assert "Spicy food" in prefs["avoid_foods"]
        assert "Italian" in prefs["preferred_cuisines"]
        assert prefs["meal_prep_time"] == "quick"
        assert prefs["budget_preference"] == "moderate"
    
    def test_update_dietary_preferences_empty_fails(self, auth_headers):
        """Test PUT /api/users/me/dietary-preferences with empty body fails"""
        response = requests.put(
            f"{BASE_URL}/api/users/me/dietary-preferences",
            headers=auth_headers,
            json={}
        )
        
        # Should return 400 for empty update
        assert response.status_code == 400
    
    def test_get_dietary_preferences_after_update(self, auth_headers):
        """Test GET /api/users/me/dietary-preferences returns updated values"""
        response = requests.get(
            f"{BASE_URL}/api/users/me/dietary-preferences",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be configured now
        assert data["is_configured"] == True
        assert "diet_type" in data["dietary_preferences"]
    
    def test_dietary_preferences_unauthorized(self):
        """Test dietary preferences endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/users/me/dietary-preferences")
        assert response.status_code == 401
        
        response = requests.put(
            f"{BASE_URL}/api/users/me/dietary-preferences",
            json={"diet_type": "vegan"}
        )
        assert response.status_code == 401


class TestDietarySuggestions:
    """Tests for AI-powered dietary suggestions endpoint"""
    
    def test_dietary_suggestion_quick_snack(self, auth_headers):
        """Test POST /api/dietary/suggestions with quick_snack type"""
        payload = {
            "suggestion_type": "quick_snack",
            "current_mood": 6,
            "current_energy": "moderate",
            "time_of_day": "afternoon"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dietary/suggestions",
            headers=auth_headers,
            json=payload,
            timeout=60  # AI may take time
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "suggestion" in data
        assert "context" in data
        
        suggestion = data["suggestion"]
        assert suggestion["suggestion_type"] == "quick_snack"
        assert "title" in suggestion
        assert "description" in suggestion
        assert "reasoning" in suggestion
        assert isinstance(suggestion.get("ingredients", []), list)
        assert isinstance(suggestion.get("mood_benefits", []), list)
        
        # Verify context
        context = data["context"]
        assert context["time_of_day"] == "afternoon"
        assert context["current_mood"] == 6
        assert context["current_energy"] == "moderate"
    
    def test_dietary_suggestion_recipe(self, auth_headers):
        """Test POST /api/dietary/suggestions with recipe type"""
        payload = {
            "suggestion_type": "recipe",
            "current_mood": 5,
            "current_energy": "low",
            "time_of_day": "evening"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dietary/suggestions",
            headers=auth_headers,
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        suggestion = data["suggestion"]
        assert suggestion["suggestion_type"] == "recipe"
        assert "title" in suggestion
        assert "description" in suggestion
        assert "reasoning" in suggestion
        
        # Recipe should have preparation steps
        assert isinstance(suggestion.get("preparation_steps", []), list)
        assert isinstance(suggestion.get("ingredients", []), list)
    
    def test_dietary_suggestion_meal_plan(self, auth_headers):
        """Test POST /api/dietary/suggestions with meal_plan type"""
        payload = {
            "suggestion_type": "meal_plan",
            "current_mood": 7,
            "current_energy": "high",
            "time_of_day": "morning"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dietary/suggestions",
            headers=auth_headers,
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        suggestion = data["suggestion"]
        assert suggestion["suggestion_type"] == "meal_plan"
        assert "title" in suggestion
        assert "description" in suggestion
        assert "reasoning" in suggestion
    
    def test_dietary_suggestion_auto_time_of_day(self, auth_headers):
        """Test POST /api/dietary/suggestions auto-detects time of day"""
        payload = {
            "suggestion_type": "quick_snack",
            "current_mood": 6
            # time_of_day not provided - should be auto-detected
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dietary/suggestions",
            headers=auth_headers,
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have auto-detected time_of_day
        assert "time_of_day" in data["context"]
        assert data["context"]["time_of_day"] in ["morning", "midday", "afternoon", "evening", "night"]
    
    def test_dietary_suggestion_with_symptoms(self, auth_headers):
        """Test POST /api/dietary/suggestions with current symptoms"""
        payload = {
            "suggestion_type": "quick_snack",
            "current_mood": 4,
            "current_energy": "very_low",
            "current_symptoms": ["anxious", "brain_fog", "low_energy"],
            "time_of_day": "afternoon"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dietary/suggestions",
            headers=auth_headers,
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Suggestion should be personalized for symptoms
        suggestion = data["suggestion"]
        assert "title" in suggestion
        assert "reasoning" in suggestion
    
    def test_dietary_suggestion_default_type(self, auth_headers):
        """Test POST /api/dietary/suggestions defaults to quick_snack"""
        payload = {
            "current_mood": 6
            # suggestion_type not provided - should default to quick_snack
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dietary/suggestions",
            headers=auth_headers,
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should default to quick_snack
        assert data["suggestion"]["suggestion_type"] == "quick_snack"
    
    def test_dietary_suggestion_unauthorized(self):
        """Test dietary suggestions endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/dietary/suggestions",
            json={"suggestion_type": "quick_snack"}
        )
        assert response.status_code == 401
    
    def test_dietary_suggestion_includes_user_conditions(self, auth_headers):
        """Test that suggestions consider user's mental health conditions"""
        payload = {
            "suggestion_type": "quick_snack",
            "current_mood": 5,
            "time_of_day": "afternoon"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dietary/suggestions",
            headers=auth_headers,
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Context should include user's conditions
        assert "conditions" in data["context"]
        assert isinstance(data["context"]["conditions"], list)


class TestDietaryIntegration:
    """Integration tests for dietary feature"""
    
    def test_preferences_affect_suggestions(self, auth_headers):
        """Test that dietary preferences are considered in suggestions"""
        # First, set specific preferences
        prefs_payload = {
            "diet_type": "vegan",
            "allergies": ["Gluten", "Soy"],
            "meal_prep_time": "quick"
        }
        
        prefs_response = requests.put(
            f"{BASE_URL}/api/users/me/dietary-preferences",
            headers=auth_headers,
            json=prefs_payload
        )
        assert prefs_response.status_code == 200
        
        # Now get a suggestion
        suggestion_payload = {
            "suggestion_type": "quick_snack",
            "current_mood": 6,
            "time_of_day": "afternoon"
        }
        
        suggestion_response = requests.post(
            f"{BASE_URL}/api/dietary/suggestions",
            headers=auth_headers,
            json=suggestion_payload,
            timeout=60
        )
        
        assert suggestion_response.status_code == 200
        data = suggestion_response.json()
        
        # Suggestion should exist and be personalized
        assert "suggestion" in data
        assert data["suggestion"]["title"]
        assert data["suggestion"]["reasoning"]


# Cleanup: Reset preferences after tests
@pytest.fixture(scope="module", autouse=True)
def cleanup(auth_headers):
    """Reset dietary preferences after all tests"""
    yield
    # Reset to default
    try:
        requests.put(
            f"{BASE_URL}/api/users/me/dietary-preferences",
            headers=auth_headers,
            json={"diet_type": "omnivore", "allergies": [], "intolerances": []}
        )
    except:
        pass
