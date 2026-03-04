"""
ADHD Tools API Tests
Tests for Task Chunking, Pomodoro Timer, and Dopamine Menu features
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials for ADHD user
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123"


class TestADHDToolsAuth:
    """Authentication for ADHD tools testing"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for test user with ADHD condition"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access token in response"
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }


class TestTaskChunking(TestADHDToolsAuth):
    """Task Chunking Engine API Tests"""
    
    def test_create_task_with_ai_chunking(self, auth_headers):
        """Test creating a task with AI-generated chunks"""
        response = requests.post(
            f"{BASE_URL}/api/tools/tasks",
            headers=auth_headers,
            json={
                "title": "TEST_Clean my room",
                "description": "Need to organize and clean my bedroom",
                "auto_chunk": True
            }
        )
        assert response.status_code in [200, 201], f"Create task failed: {response.text}"
        data = response.json()
        assert "task" in data, "No task in response"
        task = data["task"]
        assert task["title"] == "TEST_Clean my room"
        assert "id" in task
        assert "chunks" in task
        # AI should generate chunks
        print(f"Task created with {len(task.get('chunks', []))} chunks")
        return task["id"]
    
    def test_get_tasks(self, auth_headers):
        """Test getting all tasks"""
        response = requests.get(
            f"{BASE_URL}/api/tools/tasks",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get tasks failed: {response.text}"
        data = response.json()
        assert "tasks" in data
        print(f"Found {len(data['tasks'])} tasks")
    
    def test_create_and_toggle_chunk(self, auth_headers):
        """Test creating a task and toggling chunk completion"""
        # Create task
        create_response = requests.post(
            f"{BASE_URL}/api/tools/tasks",
            headers=auth_headers,
            json={
                "title": "TEST_Write a report",
                "description": "Write a short report",
                "auto_chunk": True
            }
        )
        assert create_response.status_code in [200, 201], f"Create task failed: {create_response.text}"
        task = create_response.json()["task"]
        task_id = task["id"]
        
        # Wait for AI to generate chunks
        time.sleep(2)
        
        # Get task to see chunks
        get_response = requests.get(
            f"{BASE_URL}/api/tools/tasks/{task_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        task = get_response.json()["task"]
        
        if task.get("chunks") and len(task["chunks"]) > 0:
            chunk_id = task["chunks"][0]["id"]
            
            # Toggle chunk completion
            toggle_response = requests.put(
                f"{BASE_URL}/api/tools/tasks/{task_id}/chunks/{chunk_id}",
                headers=auth_headers,
                json={"is_completed": True}
            )
            assert toggle_response.status_code == 200, f"Toggle chunk failed: {toggle_response.text}"
            updated_task = toggle_response.json()["task"]
            
            # Verify chunk is completed
            updated_chunk = next((c for c in updated_task["chunks"] if c["id"] == chunk_id), None)
            assert updated_chunk is not None
            assert updated_chunk["is_completed"] == True
            print(f"Chunk '{updated_chunk['title']}' marked as completed")
        else:
            print("No chunks generated - AI may have failed")
    
    def test_delete_task(self, auth_headers):
        """Test deleting a task"""
        # Create task first
        create_response = requests.post(
            f"{BASE_URL}/api/tools/tasks",
            headers=auth_headers,
            json={
                "title": "TEST_Task to delete",
                "auto_chunk": False
            }
        )
        assert create_response.status_code in [200, 201]
        task_id = create_response.json()["task"]["id"]
        
        # Delete task
        delete_response = requests.delete(
            f"{BASE_URL}/api/tools/tasks/{task_id}",
            headers=auth_headers
        )
        assert delete_response.status_code in [200, 204], f"Delete task failed: {delete_response.text}"
        
        # Verify task is deleted
        get_response = requests.get(
            f"{BASE_URL}/api/tools/tasks/{task_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404
        print("Task deleted successfully")


class TestPomodoroTimer(TestADHDToolsAuth):
    """Pomodoro Timer API Tests"""
    
    def test_get_pomodoro_settings(self, auth_headers):
        """Test getting pomodoro settings"""
        response = requests.get(
            f"{BASE_URL}/api/tools/pomodoro/settings",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get settings failed: {response.text}"
        data = response.json()
        assert "settings" in data
        settings = data["settings"]
        assert "default_focus_duration" in settings
        assert "default_short_break" in settings
        print(f"Pomodoro settings: {settings['default_focus_duration']}min focus, {settings['default_short_break']}min break")
    
    def test_create_pomodoro_session(self, auth_headers):
        """Test creating a pomodoro session"""
        response = requests.post(
            f"{BASE_URL}/api/tools/pomodoro/sessions",
            headers=auth_headers,
            json={
                "task_title": "TEST_Focus Session",
                "planned_duration_minutes": 25,
                "break_duration_minutes": 5
            }
        )
        assert response.status_code in [200, 201], f"Create session failed: {response.text}"
        data = response.json()
        assert "session" in data
        session = data["session"]
        assert session["task_title"] == "TEST_Focus Session"
        assert session["planned_duration_minutes"] == 25
        print(f"Pomodoro session created: {session['id']}")
        return session["id"]
    
    def test_get_pomodoro_stats(self, auth_headers):
        """Test getting pomodoro statistics"""
        response = requests.get(
            f"{BASE_URL}/api/tools/pomodoro/stats?days=7",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        data = response.json()
        assert "total_sessions" in data
        assert "total_focus_minutes" in data
        print(f"Pomodoro stats: {data['total_sessions']} sessions, {data['total_focus_minutes']} minutes")
    
    def test_update_pomodoro_session(self, auth_headers):
        """Test updating a pomodoro session (complete/abandon)"""
        # Create session first
        create_response = requests.post(
            f"{BASE_URL}/api/tools/pomodoro/sessions",
            headers=auth_headers,
            json={
                "task_title": "TEST_Session to complete",
                "planned_duration_minutes": 25
            }
        )
        assert create_response.status_code in [200, 201]
        session_id = create_response.json()["session"]["id"]
        
        # Complete session
        update_response = requests.put(
            f"{BASE_URL}/api/tools/pomodoro/sessions/{session_id}",
            headers=auth_headers,
            json={
                "status": "completed",
                "actual_duration_minutes": 25
            }
        )
        assert update_response.status_code == 200, f"Update session failed: {update_response.text}"
        session = update_response.json()["session"]
        assert session["status"] == "completed"
        print("Pomodoro session completed successfully")


class TestDopamineMenu(TestADHDToolsAuth):
    """Dopamine Menu API Tests"""
    
    def test_get_dopamine_items(self, auth_headers):
        """Test getting dopamine menu items (should include pre-seeded items)"""
        response = requests.get(
            f"{BASE_URL}/api/tools/dopamine",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get dopamine items failed: {response.text}"
        data = response.json()
        assert "items" in data
        items = data["items"]
        print(f"Found {len(items)} dopamine items")
        
        # Check for pre-seeded items
        if items:
            categories = set(item.get("category") for item in items)
            print(f"Categories found: {categories}")
    
    def test_get_dopamine_items_by_category(self, auth_headers):
        """Test filtering dopamine items by category"""
        response = requests.get(
            f"{BASE_URL}/api/tools/dopamine?category=micro",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get filtered items failed: {response.text}"
        data = response.json()
        items = data.get("items", [])
        # All items should be micro category
        for item in items:
            assert item.get("category") == "micro", f"Item {item['title']} has wrong category"
        print(f"Found {len(items)} micro category items")
    
    def test_get_random_dopamine_item(self, auth_headers):
        """Test getting a random dopamine item (Surprise Me feature)"""
        response = requests.get(
            f"{BASE_URL}/api/tools/dopamine/random",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get random item failed: {response.text}"
        data = response.json()
        if "item" in data and data["item"]:
            item = data["item"]
            print(f"Random item: {item['title']} ({item['category']})")
        else:
            print("No random item returned (may need items first)")
    
    def test_create_custom_dopamine_item(self, auth_headers):
        """Test creating a custom dopamine menu item"""
        response = requests.post(
            f"{BASE_URL}/api/tools/dopamine",
            headers=auth_headers,
            json={
                "title": "TEST_Play guitar for 5 minutes",
                "description": "Quick jam session",
                "category": "short",
                "energy_level": "medium"
            }
        )
        assert response.status_code in [200, 201], f"Create item failed: {response.text}"
        data = response.json()
        assert "item" in data
        item = data["item"]
        assert item["title"] == "TEST_Play guitar for 5 minutes"
        assert item["is_custom"] == True
        print(f"Custom dopamine item created: {item['id']}")
        return item["id"]
    
    def test_toggle_favorite(self, auth_headers):
        """Test marking an item as favorite"""
        # First get items
        get_response = requests.get(
            f"{BASE_URL}/api/tools/dopamine",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        items = get_response.json().get("items", [])
        
        if items:
            item_id = items[0]["id"]
            current_favorite = items[0].get("is_favorite", False)
            
            # Toggle favorite
            update_response = requests.put(
                f"{BASE_URL}/api/tools/dopamine/{item_id}",
                headers=auth_headers,
                json={"is_favorite": not current_favorite}
            )
            assert update_response.status_code == 200, f"Toggle favorite failed: {update_response.text}"
            updated_item = update_response.json()["item"]
            assert updated_item["is_favorite"] == (not current_favorite)
            print(f"Item favorite toggled to: {updated_item['is_favorite']}")
        else:
            print("No items to toggle favorite")
    
    def test_mark_item_used(self, auth_headers):
        """Test marking a dopamine item as used"""
        # Get items
        get_response = requests.get(
            f"{BASE_URL}/api/tools/dopamine",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        items = get_response.json().get("items", [])
        
        if items:
            item_id = items[0]["id"]
            initial_times_used = items[0].get("times_used", 0)
            
            # Mark as used
            use_response = requests.post(
                f"{BASE_URL}/api/tools/dopamine/{item_id}/use",
                headers=auth_headers
            )
            assert use_response.status_code == 200, f"Mark used failed: {use_response.text}"
            updated_item = use_response.json()["item"]
            assert updated_item["times_used"] == initial_times_used + 1
            print(f"Item used count: {updated_item['times_used']}")
        else:
            print("No items to mark as used")


class TestCleanup(TestADHDToolsAuth):
    """Cleanup test data"""
    
    def test_cleanup_test_tasks(self, auth_headers):
        """Clean up TEST_ prefixed tasks"""
        response = requests.get(
            f"{BASE_URL}/api/tools/tasks",
            headers=auth_headers
        )
        if response.status_code == 200:
            tasks = response.json().get("tasks", [])
            for task in tasks:
                if task.get("title", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/tools/tasks/{task['id']}",
                        headers=auth_headers
                    )
                    print(f"Deleted test task: {task['title']}")
    
    def test_cleanup_test_dopamine_items(self, auth_headers):
        """Clean up TEST_ prefixed dopamine items"""
        response = requests.get(
            f"{BASE_URL}/api/tools/dopamine",
            headers=auth_headers
        )
        if response.status_code == 200:
            items = response.json().get("items", [])
            for item in items:
                if item.get("title", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/tools/dopamine/{item['id']}",
                        headers=auth_headers
                    )
                    print(f"Deleted test dopamine item: {item['title']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
