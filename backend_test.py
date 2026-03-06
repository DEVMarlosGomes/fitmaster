#!/usr/bin/env python3

import requests
import json
import sys
from pathlib import Path
import tempfile
from datetime import datetime

class ExerciseLibraryTester:
    def __init__(self, base_url="https://workout-removal-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        # Remove Content-Type for file uploads
        if files:
            headers.pop('Content-Type', None)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response sample: {str(response_data)[:200]}...")
                    return True, response_data
                except:
                    print(f"   Response: {response.text[:200]}...")
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:500]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status, 
                    "actual": response.status_code,
                    "response": response.text[:300]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_login(self):
        """Test login with personal trainer credentials"""
        success, response = self.run_test(
            "Personal Trainer Login",
            "POST",
            "auth/login",
            200,
            data={"email": "personal@teste.com", "password": "teste123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Logged in as: {response.get('user', {}).get('name', 'Unknown')}")
            return True
        return False

    def test_exercise_library_categories(self):
        """Test getting exercise categories"""
        success, response = self.run_test(
            "Get Exercise Categories",
            "GET", 
            "exercise-library/categories",
            200
        )
        if success and 'categories' in response:
            categories = response['categories']
            print(f"   Found {len(categories)} categories: {categories[:3]}...")
            return True, categories
        return False, []

    def test_get_exercise_library(self):
        """Test getting all exercises from the library"""
        success, response = self.run_test(
            "Get All Exercises",
            "GET",
            "exercise-library",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} exercises in library")
            # Check if we have the expected 41 system exercises
            system_exercises = [ex for ex in response if ex.get('is_system') or ex.get('personal_id') is None]
            print(f"   System exercises: {len(system_exercises)}")
            if len(system_exercises) >= 40:  # Should be around 41
                print(f"✅ Expected system exercises found (~41)")
            else:
                print(f"⚠️  Expected ~41 system exercises, found {len(system_exercises)}")
            return True, response
        return False, []

    def test_exercise_library_filtering(self):
        """Test filtering exercises by category and search"""
        print("\n📋 Testing Exercise Library Filtering...")
        
        # Test category filter
        success, response = self.run_test(
            "Filter by PEITORAL category",
            "GET",
            "exercise-library?category=PEITORAL",
            200
        )
        if success:
            print(f"   PEITORAL category exercises: {len(response)}")
        
        # Test search filter
        success, response = self.run_test(
            "Search 'supino' exercises", 
            "GET",
            "exercise-library?search=supino",
            200
        )
        if success:
            print(f"   'supino' search results: {len(response)}")
            
        return success

    def test_update_exercise_library(self, exercise_id):
        """Test updating an exercise in the library"""
        update_data = {
            "description": f"Updated description at {datetime.now()}",
            "instructions": "New instructions for test exercise"
        }
        
        success, response = self.run_test(
            f"Update Exercise {exercise_id}",
            "PUT",
            f"exercise-library/{exercise_id}",
            200,
            data=update_data
        )
        return success, response

    def test_video_upload_exercise_library(self, exercise_id):
        """Test uploading MP4 video to an exercise"""
        # Create a dummy MP4 file for testing
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_file:
            # Write minimal MP4 header (this is a fake but valid-looking file)
            tmp_file.write(b'\x00\x00\x00\x20ftypmp42\x00\x00\x00\x00mp42isom')
            tmp_file.write(b'\x00' * 1000)  # Add some padding
            tmp_file_path = tmp_file.name

        try:
            with open(tmp_file_path, 'rb') as f:
                files = {'file': ('test_video.mp4', f, 'video/mp4')}
                success, response = self.run_test(
                    f"Upload Video to Exercise {exercise_id}",
                    "POST",
                    f"exercise-library/{exercise_id}/upload-video", 
                    200,
                    files=files
                )
            return success, response
        finally:
            # Clean up temp file
            Path(tmp_file_path).unlink(missing_ok=True)

    def test_delete_video_exercise_library(self, exercise_id):
        """Test deleting video from an exercise"""
        success, response = self.run_test(
            f"Delete Video from Exercise {exercise_id}",
            "DELETE",
            f"exercise-library/{exercise_id}/video",
            200
        )
        return success, response

    def run_comprehensive_tests(self):
        """Run all exercise library tests"""
        print("🚀 Starting Exercise Library API Tests...")
        print(f"Backend URL: {self.base_url}")
        
        # Step 1: Login
        if not self.test_login():
            print("❌ Login failed, stopping tests")
            return False

        # Step 2: Test Categories
        categories_success, categories = self.test_exercise_library_categories()
        if not categories_success:
            print("❌ Categories test failed")
        
        # Step 3: Test Get All Exercises
        exercises_success, exercises = self.test_get_exercise_library()
        if not exercises_success:
            print("❌ Get exercises failed")
            return False
            
        # Step 4: Test Filtering
        self.test_exercise_library_filtering()
        
        if exercises:
            # Pick first exercise for testing updates and video upload
            test_exercise = exercises[0]
            exercise_id = test_exercise['id']
            print(f"\n🎯 Using exercise '{test_exercise['name']}' (ID: {exercise_id}) for detailed tests...")
            
            # Step 5: Test Update Exercise
            update_success, _ = self.test_update_exercise_library(exercise_id)
            
            # Step 6: Test Video Upload
            video_upload_success, upload_response = self.test_video_upload_exercise_library(exercise_id)
            
            # Step 7: Test Video Delete (only if upload succeeded)
            if video_upload_success:
                self.test_delete_video_exercise_library(exercise_id)
        
        # Print summary
        print(f"\n📊 Test Results Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests ({len(self.failed_tests)}):")
            for i, failure in enumerate(self.failed_tests[:5], 1):
                print(f"  {i}. {failure.get('test', 'Unknown')}")
                if 'error' in failure:
                    print(f"     Error: {failure['error']}")
                else:
                    print(f"     Expected {failure.get('expected')}, got {failure.get('actual')}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ExerciseLibraryTester("https://workout-removal-fix.preview.emergentagent.com")
    
    success = tester.run_comprehensive_tests()
    
    if success:
        print("\n🎉 All exercise library tests passed!")
        return 0
    else:
        print(f"\n💥 Some tests failed. Passed: {tester.tests_passed}/{tester.tests_run}")
        return 1

if __name__ == "__main__":
    sys.exit(main())