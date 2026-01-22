"""
Test Advanced Analytics Endpoint for Enhanced Visual Analytics Feature
Tests: GET /api/mood-logs/analytics/advanced
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER = {"email": "test@example.com", "password": "test123"}


class TestAdvancedAnalytics:
    """Test suite for Advanced Analytics endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code == 200:
            token = response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.user = response.json().get("user")
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_advanced_analytics_endpoint_exists(self):
        """Test that advanced analytics endpoint returns 200"""
        response = self.session.get(f"{BASE_URL}/api/mood-logs/analytics/advanced?days=30")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_advanced_analytics_response_structure(self):
        """Test that response has all required fields"""
        response = self.session.get(f"{BASE_URL}/api/mood-logs/analytics/advanced?days=30")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check all required fields exist
        required_fields = [
            "patterns",
            "triggers",
            "day_of_week_analysis",
            "mood_distribution",
            "sleep_mood_correlation",
            "medication_impact",
            "symptom_mood_correlation"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
    
    def test_advanced_analytics_patterns_structure(self):
        """Test patterns field structure"""
        response = self.session.get(f"{BASE_URL}/api/mood-logs/analytics/advanced?days=30")
        assert response.status_code == 200
        
        data = response.json()
        patterns = data.get("patterns", [])
        
        # Patterns should be a list
        assert isinstance(patterns, list), "patterns should be a list"
        
        # If patterns exist, check structure
        if patterns:
            for pattern in patterns:
                assert "type" in pattern, "Pattern missing 'type' field"
                assert "pattern" in pattern, "Pattern missing 'pattern' field"
                assert "description" in pattern, "Pattern missing 'description' field"
    
    def test_advanced_analytics_triggers_structure(self):
        """Test triggers field structure"""
        response = self.session.get(f"{BASE_URL}/api/mood-logs/analytics/advanced?days=30")
        assert response.status_code == 200
        
        data = response.json()
        triggers = data.get("triggers", [])
        
        # Triggers should be a list
        assert isinstance(triggers, list), "triggers should be a list"
        
        # If triggers exist, check structure
        if triggers:
            for trigger in triggers:
                assert "trigger" in trigger, "Trigger missing 'trigger' field"
                assert "type" in trigger, "Trigger missing 'type' field"
                assert "impact" in trigger, "Trigger missing 'impact' field"
    
    def test_advanced_analytics_mood_distribution_structure(self):
        """Test mood_distribution field structure"""
        response = self.session.get(f"{BASE_URL}/api/mood-logs/analytics/advanced?days=30")
        assert response.status_code == 200
        
        data = response.json()
        mood_distribution = data.get("mood_distribution", [])
        
        # Should be a list
        assert isinstance(mood_distribution, list), "mood_distribution should be a list"
        
        # If data exists, check structure
        if mood_distribution:
            for item in mood_distribution:
                assert "rating" in item, "mood_distribution item missing 'rating'"
                assert "count" in item, "mood_distribution item missing 'count'"
                assert "percentage" in item, "mood_distribution item missing 'percentage'"
    
    def test_advanced_analytics_day_of_week_structure(self):
        """Test day_of_week_analysis field structure"""
        response = self.session.get(f"{BASE_URL}/api/mood-logs/analytics/advanced?days=30")
        assert response.status_code == 200
        
        data = response.json()
        day_analysis = data.get("day_of_week_analysis", [])
        
        # Should be a list
        assert isinstance(day_analysis, list), "day_of_week_analysis should be a list"
        
        # If data exists, check structure
        if day_analysis:
            for item in day_analysis:
                assert "day" in item, "day_of_week_analysis item missing 'day'"
                assert "average_mood" in item, "day_of_week_analysis item missing 'average_mood'"
                assert "log_count" in item, "day_of_week_analysis item missing 'log_count'"
    
    def test_advanced_analytics_time_range_7_days(self):
        """Test analytics with 7 days time range"""
        response = self.session.get(f"{BASE_URL}/api/mood-logs/analytics/advanced?days=7")
        assert response.status_code == 200
        
        data = response.json()
        assert "patterns" in data
        assert "triggers" in data
    
    def test_advanced_analytics_time_range_90_days(self):
        """Test analytics with 90 days time range"""
        response = self.session.get(f"{BASE_URL}/api/mood-logs/analytics/advanced?days=90")
        assert response.status_code == 200
        
        data = response.json()
        assert "patterns" in data
        assert "triggers" in data
    
    def test_advanced_analytics_unauthorized(self):
        """Test that unauthorized access is denied"""
        # Create new session without auth
        unauth_session = requests.Session()
        unauth_session.headers.update({"Content-Type": "application/json"})
        
        response = unauth_session.get(f"{BASE_URL}/api/mood-logs/analytics/advanced?days=30")
        # Accept both 401 (Unauthorized) and 403 (Forbidden) as valid denial responses
        assert response.status_code in [401, 403], f"Expected 401 or 403 for unauthorized, got {response.status_code}"


class TestSummaryAnalytics:
    """Test suite for Summary Analytics endpoint (existing)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code == 200:
            token = response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_summary_analytics_endpoint(self):
        """Test summary analytics endpoint returns 200"""
        response = self.session.get(f"{BASE_URL}/api/mood-logs/analytics/summary?days=30")
        assert response.status_code == 200
    
    def test_summary_analytics_response_structure(self):
        """Test summary analytics response structure"""
        response = self.session.get(f"{BASE_URL}/api/mood-logs/analytics/summary?days=30")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check required fields
        assert "average_mood" in data
        assert "total_logs" in data
        assert "mood_trend" in data
        assert "most_common_symptoms" in data
        assert "insights" in data


class TestMoodLogsEndpoint:
    """Test mood logs endpoint for chart data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        if response.status_code == 200:
            token = response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_mood_logs_with_date_filter(self):
        """Test mood logs endpoint with date filter"""
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        response = self.session.get(f"{BASE_URL}/api/mood-logs?start_date={start_date}&limit=1000")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_mood_logs_structure(self):
        """Test mood log entry structure"""
        response = self.session.get(f"{BASE_URL}/api/mood-logs?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        if data:
            log = data[0]
            assert "date" in log
            assert "mood_rating" in log
            assert "user_id" in log


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
