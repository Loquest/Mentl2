"""
Backend tests for Caregiver Module
Tests: Invitation flow, Accept/Reject, Patient data access, Permissions, Notifications
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_1 = {"email": "test@example.com", "password": "test123"}
TEST_USER_2_EMAIL = f"caregiver_test_{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_2 = {"email": TEST_USER_2_EMAIL, "password": "test123", "name": "Test Caregiver"}


class TestCaregiverAuth:
    """Test authentication for caregiver endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for test user 1"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_1)
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_caregiver_endpoints_require_auth(self):
        """Test that caregiver endpoints require authentication"""
        endpoints = [
            ("GET", "/api/caregivers"),
            ("GET", "/api/caregivers/patients"),
            ("GET", "/api/caregivers/invitations/sent"),
            ("GET", "/api/caregivers/invitations/received"),
            ("POST", "/api/caregivers/invite"),
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            
            assert response.status_code == 401, f"{endpoint} should require auth, got {response.status_code}"
            print(f"✓ {method} {endpoint} requires authentication")


class TestCaregiverInvitation:
    """Test caregiver invitation flow"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for test user 1"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_1)
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_send_invitation_success(self, auth_headers):
        """Test sending a caregiver invitation"""
        unique_email = f"test_caregiver_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/caregivers/invite",
            headers=auth_headers,
            json={
                "caregiver_email": unique_email,
                "permissions": {
                    "view_mood_logs": True,
                    "view_analytics": True,
                    "receive_alerts": False
                }
            }
        )
        
        assert response.status_code == 200, f"Failed to send invitation: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "id" in data
        assert data["caregiver_email"] == unique_email
        assert data["status"] == "pending"
        assert data["permissions"]["view_mood_logs"] == True
        assert data["permissions"]["view_analytics"] == True
        assert data["permissions"]["receive_alerts"] == False
        
        print(f"✓ Invitation sent successfully to {unique_email}")
        return data["id"]
    
    def test_send_invitation_invalid_email(self, auth_headers):
        """Test sending invitation with invalid email"""
        response = requests.post(
            f"{BASE_URL}/api/caregivers/invite",
            headers=auth_headers,
            json={
                "caregiver_email": "invalid-email",
                "permissions": {"view_mood_logs": True}
            }
        )
        
        assert response.status_code == 422, f"Should reject invalid email, got {response.status_code}"
        print("✓ Invalid email rejected correctly")
    
    def test_send_duplicate_invitation(self, auth_headers):
        """Test sending duplicate invitation to same email"""
        unique_email = f"test_dup_{uuid.uuid4().hex[:8]}@example.com"
        
        # First invitation
        response1 = requests.post(
            f"{BASE_URL}/api/caregivers/invite",
            headers=auth_headers,
            json={"caregiver_email": unique_email}
        )
        assert response1.status_code == 200
        
        # Duplicate invitation
        response2 = requests.post(
            f"{BASE_URL}/api/caregivers/invite",
            headers=auth_headers,
            json={"caregiver_email": unique_email}
        )
        
        assert response2.status_code == 400, f"Should reject duplicate, got {response2.status_code}"
        assert "already sent" in response2.json().get("detail", "").lower()
        print("✓ Duplicate invitation rejected correctly")
    
    def test_get_sent_invitations(self, auth_headers):
        """Test getting sent invitations"""
        response = requests.get(
            f"{BASE_URL}/api/caregivers/invitations/sent",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "invitations" in data
        assert isinstance(data["invitations"], list)
        print(f"✓ Retrieved {len(data['invitations'])} sent invitations")
    
    def test_get_received_invitations(self, auth_headers):
        """Test getting received invitations"""
        response = requests.get(
            f"{BASE_URL}/api/caregivers/invitations/received",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "invitations" in data
        assert isinstance(data["invitations"], list)
        print(f"✓ Retrieved {len(data['invitations'])} received invitations")
    
    def test_cancel_invitation(self, auth_headers):
        """Test cancelling a pending invitation"""
        # First create an invitation
        unique_email = f"test_cancel_{uuid.uuid4().hex[:8]}@example.com"
        
        create_response = requests.post(
            f"{BASE_URL}/api/caregivers/invite",
            headers=auth_headers,
            json={"caregiver_email": unique_email}
        )
        assert create_response.status_code == 200
        invitation_id = create_response.json()["id"]
        
        # Cancel the invitation
        cancel_response = requests.delete(
            f"{BASE_URL}/api/caregivers/invitations/{invitation_id}",
            headers=auth_headers
        )
        
        assert cancel_response.status_code == 200, f"Failed to cancel: {cancel_response.text}"
        print(f"✓ Invitation {invitation_id} cancelled successfully")


class TestCaregiverRelationship:
    """Test caregiver relationship management"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for test user 1"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_1)
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_my_caregivers(self, auth_headers):
        """Test getting list of caregivers"""
        response = requests.get(
            f"{BASE_URL}/api/caregivers",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "caregivers" in data
        assert isinstance(data["caregivers"], list)
        print(f"✓ Retrieved {len(data['caregivers'])} caregivers")
    
    def test_get_my_patients(self, auth_headers):
        """Test getting list of patients (as caregiver)"""
        response = requests.get(
            f"{BASE_URL}/api/caregivers/patients",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "patients" in data
        assert isinstance(data["patients"], list)
        print(f"✓ Retrieved {len(data['patients'])} patients")


class TestCaregiverPatientAccess:
    """Test caregiver access to patient data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for test user 1"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_1)
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_access_patient_mood_logs_unauthorized(self, auth_headers):
        """Test accessing mood logs for non-patient returns 403"""
        fake_patient_id = str(uuid.uuid4())
        
        response = requests.get(
            f"{BASE_URL}/api/caregivers/patients/{fake_patient_id}/mood-logs",
            headers=auth_headers
        )
        
        assert response.status_code == 403, f"Should return 403, got {response.status_code}"
        print("✓ Unauthorized patient access correctly denied")
    
    def test_access_patient_analytics_unauthorized(self, auth_headers):
        """Test accessing analytics for non-patient returns 403"""
        fake_patient_id = str(uuid.uuid4())
        
        response = requests.get(
            f"{BASE_URL}/api/caregivers/patients/{fake_patient_id}/analytics",
            headers=auth_headers
        )
        
        assert response.status_code == 403, f"Should return 403, got {response.status_code}"
        print("✓ Unauthorized analytics access correctly denied")


class TestNotifications:
    """Test notification system for caregivers"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for test user 1"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_1)
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_get_notifications(self, auth_headers):
        """Test getting notifications"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert isinstance(data["notifications"], list)
        print(f"✓ Retrieved {len(data['notifications'])} notifications")


class TestCaregiverPermissions:
    """Test permission management for caregivers"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for test user 1"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_1)
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_invitation_default_permissions(self, auth_headers):
        """Test that invitations have default permissions"""
        unique_email = f"test_perm_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/caregivers/invite",
            headers=auth_headers,
            json={"caregiver_email": unique_email}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check default permissions
        assert data["permissions"]["view_mood_logs"] == True
        assert data["permissions"]["view_analytics"] == True
        assert data["permissions"]["receive_alerts"] == True
        print("✓ Default permissions set correctly")


class TestCaregiverRemoval:
    """Test removing caregiver relationships"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for test user 1"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_1)
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_remove_nonexistent_caregiver(self, auth_headers):
        """Test removing a non-existent caregiver returns 404"""
        fake_relationship_id = str(uuid.uuid4())
        
        response = requests.delete(
            f"{BASE_URL}/api/caregivers/{fake_relationship_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Should return 404, got {response.status_code}"
        print("✓ Non-existent caregiver removal returns 404")


class TestInvitationAcceptReject:
    """Test accepting and rejecting invitations"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for test user 1"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_1)
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_accept_nonexistent_invitation(self, auth_headers):
        """Test accepting non-existent invitation returns 404"""
        fake_invitation_id = str(uuid.uuid4())
        
        response = requests.post(
            f"{BASE_URL}/api/caregivers/invitations/{fake_invitation_id}/accept",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Should return 404, got {response.status_code}"
        print("✓ Non-existent invitation accept returns 404")
    
    def test_reject_nonexistent_invitation(self, auth_headers):
        """Test rejecting non-existent invitation returns 404"""
        fake_invitation_id = str(uuid.uuid4())
        
        response = requests.post(
            f"{BASE_URL}/api/caregivers/invitations/{fake_invitation_id}/reject",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Should return 404, got {response.status_code}"
        print("✓ Non-existent invitation reject returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
