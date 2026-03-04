"""
ADHD Tools Phase 2 Backend Tests
Tests for: Time Blindness Guard, Energy-Aware Scheduling, Rewards Center
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestADHDToolsPhase2:
    """Test Phase 2 ADHD Tools APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(
            f"{self.base_url}/api/auth/login",
            json={"email": "test@example.com", "password": "test123"}
        )
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Authentication failed - skipping tests")
    
    # ===== Time Blindness Guard Tests =====
    
    def test_time_blindness_stats_endpoint(self):
        """Test GET /api/tools/time-blindness/stats returns valid response"""
        response = self.session.get(f"{self.base_url}/api/tools/time-blindness/stats?days=30")
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "days_analyzed" in data
        assert "tasks_completed" in data
        assert "task_estimates" in data
        assert "average_accuracy" in data
        assert "total_focus_time_minutes" in data
        assert "pomodoro_sessions" in data
        assert "estimation_trend" in data
        
        # Verify data types
        assert isinstance(data["days_analyzed"], int)
        assert isinstance(data["tasks_completed"], int)
        assert isinstance(data["task_estimates"], list)
        assert isinstance(data["average_accuracy"], (int, float))
        assert isinstance(data["total_focus_time_minutes"], int)
        assert isinstance(data["pomodoro_sessions"], int)
        assert data["estimation_trend"] in ["improving", "needs_work"]
    
    def test_time_blindness_stats_with_different_days(self):
        """Test time blindness stats with different day ranges"""
        for days in [7, 14, 30, 90]:
            response = self.session.get(f"{self.base_url}/api/tools/time-blindness/stats?days={days}")
            assert response.status_code == 200
            data = response.json()
            assert data["days_analyzed"] == days
    
    def test_time_blindness_task_estimates_structure(self):
        """Test task estimates have correct structure"""
        response = self.session.get(f"{self.base_url}/api/tools/time-blindness/stats?days=30")
        assert response.status_code == 200
        
        data = response.json()
        if data["task_estimates"]:
            estimate = data["task_estimates"][0]
            assert "title" in estimate
            assert "estimated" in estimate
            assert "actual" in estimate
            assert "accuracy" in estimate
            assert isinstance(estimate["accuracy"], (int, float))
            assert 0 <= estimate["accuracy"] <= 100
    
    # ===== Energy-Aware Scheduling Tests =====
    
    def test_energy_patterns_endpoint(self):
        """Test GET /api/tools/energy/patterns returns valid response"""
        response = self.session.get(f"{self.base_url}/api/tools/energy/patterns?days=30")
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "days_analyzed" in data
        assert "hourly_patterns" in data
        assert "peak_hours" in data
        assert "low_energy_hours" in data
        assert "peak_periods" in data
        assert "recommendation" in data
        
        # Verify data types
        assert isinstance(data["days_analyzed"], int)
        assert isinstance(data["hourly_patterns"], list)
        assert isinstance(data["peak_hours"], list)
        assert isinstance(data["low_energy_hours"], list)
        assert isinstance(data["peak_periods"], list)
        assert isinstance(data["recommendation"], str)
    
    def test_energy_patterns_recommendation_exists(self):
        """Test that energy patterns returns a recommendation"""
        response = self.session.get(f"{self.base_url}/api/tools/energy/patterns?days=30")
        assert response.status_code == 200
        
        data = response.json()
        assert data["recommendation"]
        assert len(data["recommendation"]) > 10  # Should be a meaningful recommendation
    
    def test_energy_patterns_peak_periods_valid(self):
        """Test that peak periods contain valid time periods"""
        response = self.session.get(f"{self.base_url}/api/tools/energy/patterns?days=30")
        assert response.status_code == 200
        
        data = response.json()
        valid_periods = ["morning", "afternoon", "evening", "night"]
        for period in data["peak_periods"]:
            assert period in valid_periods
    
    def test_energy_patterns_hourly_structure(self):
        """Test hourly patterns have correct structure"""
        response = self.session.get(f"{self.base_url}/api/tools/energy/patterns?days=30")
        assert response.status_code == 200
        
        data = response.json()
        if data["hourly_patterns"]:
            pattern = data["hourly_patterns"][0]
            assert "hour" in pattern
            assert "avg_energy" in pattern
            assert "avg_mood" in pattern
            assert "focus_sessions" in pattern
            assert "productivity_score" in pattern
    
    # ===== Rewards Center Tests =====
    
    def test_rewards_stats_endpoint(self):
        """Test GET /api/tools/rewards/stats returns valid response"""
        response = self.session.get(f"{self.base_url}/api/tools/rewards/stats")
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "current_streak" in data
        assert "total_tasks_completed" in data
        assert "total_chunks_completed" in data
        assert "total_focus_minutes" in data
        assert "total_sessions" in data
        assert "badges" in data
        assert "weekly_tasks" in data
        assert "weekly_sessions" in data
        assert "level" in data
        assert "xp" in data
        
        # Verify data types
        assert isinstance(data["current_streak"], int)
        assert isinstance(data["total_tasks_completed"], int)
        assert isinstance(data["total_chunks_completed"], int)
        assert isinstance(data["total_focus_minutes"], int)
        assert isinstance(data["total_sessions"], int)
        assert isinstance(data["badges"], list)
        assert isinstance(data["level"], int)
        assert isinstance(data["xp"], int)
    
    def test_rewards_level_calculation(self):
        """Test that level is calculated correctly"""
        response = self.session.get(f"{self.base_url}/api/tools/rewards/stats")
        assert response.status_code == 200
        
        data = response.json()
        # Level should be at least 1
        assert data["level"] >= 1
    
    def test_rewards_xp_calculation(self):
        """Test that XP is calculated correctly"""
        response = self.session.get(f"{self.base_url}/api/tools/rewards/stats")
        assert response.status_code == 200
        
        data = response.json()
        # XP should be non-negative
        assert data["xp"] >= 0
    
    def test_rewards_badges_structure(self):
        """Test badges have correct structure"""
        response = self.session.get(f"{self.base_url}/api/tools/rewards/stats")
        assert response.status_code == 200
        
        data = response.json()
        if data["badges"]:
            badge = data["badges"][0]
            assert "id" in badge
            assert "name" in badge
            assert "description" in badge
            assert "icon" in badge
    
    def test_rewards_streak_non_negative(self):
        """Test that streak is non-negative"""
        response = self.session.get(f"{self.base_url}/api/tools/rewards/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["current_streak"] >= 0
    
    def test_rewards_weekly_stats(self):
        """Test weekly stats are returned"""
        response = self.session.get(f"{self.base_url}/api/tools/rewards/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["weekly_tasks"] >= 0
        assert data["weekly_sessions"] >= 0
    
    # ===== Integration Tests =====
    
    def test_all_phase2_endpoints_accessible(self):
        """Test all Phase 2 endpoints are accessible"""
        endpoints = [
            "/api/tools/time-blindness/stats?days=30",
            "/api/tools/energy/patterns?days=30",
            "/api/tools/rewards/stats"
        ]
        
        for endpoint in endpoints:
            response = self.session.get(f"{self.base_url}{endpoint}")
            assert response.status_code == 200, f"Endpoint {endpoint} failed with status {response.status_code}"
    
    def test_unauthorized_access_denied(self):
        """Test that unauthorized access is denied"""
        # Create a new session without auth
        unauth_session = requests.Session()
        unauth_session.headers.update({"Content-Type": "application/json"})
        
        endpoints = [
            "/api/tools/time-blindness/stats?days=30",
            "/api/tools/energy/patterns?days=30",
            "/api/tools/rewards/stats"
        ]
        
        for endpoint in endpoints:
            response = unauth_session.get(f"{self.base_url}{endpoint}")
            assert response.status_code in [401, 403], f"Endpoint {endpoint} should require auth"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
