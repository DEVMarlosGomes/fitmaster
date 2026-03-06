#!/usr/bin/env python3

import requests
import sys
from datetime import datetime
import json

class FitMasterAPITester:
    def __init__(self, base_url="https://workout-removal-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, passed, details=""):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
        
        result = {
            "test": test_name,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status} - {test_name}")
        if details:
            print(f"   Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token and not headers:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)
            else:
                self.log_result(name, False, f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            try:
                response_data = response.json() if response.text else {}
            except:
                response_data = {"raw_response": response.text}
            
            if not success:
                details += f", Response: {response.text[:200]}"
            
            self.log_result(name, success, details)
            return success, response_data

        except requests.exceptions.Timeout:
            self.log_result(name, False, "Request timeout")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_result(name, False, "Connection error")
            return False, {}
        except Exception as e:
            self.log_result(name, False, f"Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test personal trainer login - create account if needed"""
        print("\n🔐 Testing Authentication...")
        
        # Try to login as personal trainer
        personal_email = "testpersonal@test.com"
        personal_password = "testpass123"
        
        success, response = self.run_test(
            "Personal Trainer Login",
            "POST",
            "auth/login",
            200,
            data={"email": personal_email, "password": personal_password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   ✅ Successfully authenticated as {response.get('user', {}).get('name', 'Unknown')}")
            return True
        else:
            # Try to register personal trainer
            print("   Personal trainer not found, registering new one...")
            reg_success, reg_response = self.run_test(
                "Register Personal Trainer",
                "POST", 
                "auth/register",
                200,
                data={
                    "email": personal_email,
                    "name": "Test Personal",
                    "password": personal_password,
                    "role": "personal"
                }
            )
            
            if reg_success:
                print("   ✅ Personal trainer registered, now need admin approval...")
                # Login as admin to approve the personal trainer
                admin_success, admin_response = self.run_test(
                    "Admin Login for Approval",
                    "POST",
                    "auth/login", 
                    200,
                    data={"email": "Personal@admin.com", "password": "admin123"}
                )
                
                if admin_success and 'access_token' in admin_response:
                    admin_token = admin_response['access_token']
                    personal_id = reg_response.get('user', {}).get('id')
                    
                    if personal_id:
                        # Approve the personal trainer
                        approval_headers = {'Authorization': f'Bearer {admin_token}'}
                        approve_success, _ = self.run_test(
                            "Approve Personal Trainer",
                            "POST",
                            f"admin/personals/{personal_id}/approve",
                            200,
                            headers=approval_headers
                        )
                        
                        if approve_success:
                            # Now try to login as personal trainer again
                            success, response = self.run_test(
                                "Personal Trainer Login After Approval",
                                "POST",
                                "auth/login",
                                200,
                                data={"email": personal_email, "password": personal_password}
                            )
                            
                            if success and 'access_token' in response:
                                self.token = response['access_token']
                                print(f"   ✅ Successfully authenticated as {response.get('user', {}).get('name', 'Unknown')}")
                                return True
            
            print("   ❌ Could not set up personal trainer authentication")
            return False

    def test_basic_endpoints(self):
        """Test basic endpoints that should work"""
        print("\n📋 Testing Basic Endpoints...")
        
        # Test getting students (should work for admin)
        self.run_test("Get Students", "GET", "students", 200)
        
        # Test getting workouts 
        self.run_test("Get Workouts", "GET", "workouts", 200)

    def test_delete_workout_endpoint(self):
        """Test the DELETE /api/workouts/{workout_id} endpoint"""
        print("\n🗑️  Testing DELETE Workout Endpoint...")
        
        # First, try to get workouts to find one to delete
        success, workouts_response = self.run_test("Get Workouts for Deletion Test", "GET", "workouts", 200)
        
        if success and workouts_response:
            workouts = workouts_response if isinstance(workouts_response, list) else workouts_response.get('data', [])
            
            if workouts and len(workouts) > 0:
                # Try to delete the first workout
                workout_id = workouts[0].get('id')
                if workout_id:
                    print(f"   Found workout ID: {workout_id}")
                    self.run_test(
                        "DELETE Workout Endpoint", 
                        "DELETE", 
                        f"workouts/{workout_id}", 
                        200  # Expecting 200 for successful deletion
                    )
                else:
                    self.log_result("DELETE Workout Endpoint", False, "No workout ID found in response")
            else:
                # Test with a fake ID to ensure the endpoint exists and returns proper 404
                self.run_test(
                    "DELETE Workout Endpoint (Fake ID)", 
                    "DELETE", 
                    "workouts/fake-workout-id", 
                    404  # Should return 404 for non-existent workout
                )
        else:
            # Test with a fake ID to ensure the endpoint exists
            self.run_test(
                "DELETE Workout Endpoint (No Workouts Found)", 
                "DELETE", 
                "workouts/test-workout-id", 
                404  # Should return 404 for non-existent workout
            )

    def test_feedback_endpoints(self):
        """Test feedback related endpoints"""
        print("\n💬 Testing Feedback Endpoints...")
        
        # First create a student to test with
        success, create_response = self.run_test(
            "Create Test Student", 
            "POST", 
            "students", 
            200,
            data={
                "email": "teststudent@test.com",
                "name": "Test Student",
                "password": "testpass123",
                "phone": "123456789"
            }
        )
        
        if success and create_response:
            student_id = create_response.get('id')
            if student_id:
                print(f"   Created test student with ID: {student_id}")
                
                # Test feedback plan endpoint  
                self.run_test("Get Feedback Plan", "GET", f"checkins/feedback-plan/{student_id}", 404)  # Should be 404 initially
                
                # Test creating feedback plan
                self.run_test(
                    "Create Feedback Plan", 
                    "PUT", 
                    f"checkins/feedback-plan/{student_id}",
                    200,
                    data={
                        "mode": "weekly",
                        "weekly_days": [1, 3, 5],
                        "monthly_days": [],
                        "active": True,
                        "reminder_enabled": True
                    }
                )
                
                # Test feedback submissions
                self.run_test("Get Feedback Submissions", "GET", f"checkins/feedback-submissions?student_id={student_id}", 200)
                
                # Test request feedback endpoint
                self.run_test("Request Feedback", "POST", f"checkins/request-feedback/{student_id}", 200)
        else:
            # Test with existing students if creation failed
            success, students_response = self.run_test("Get Students for Feedback Test", "GET", "students", 200)
            
            if success and students_response:
                students = students_response if isinstance(students_response, list) else students_response.get('data', [])
                
                if students and len(students) > 0:
                    student_id = students[0].get('id')
                    if student_id:
                        # Test feedback plan endpoint
                        self.run_test("Get Feedback Plan", "GET", f"checkins/feedback-plan/{student_id}", 200)
                        
                        # Test feedback submissions
                        self.run_test("Get Feedback Submissions", "GET", f"checkins/feedback-submissions?student_id={student_id}", 200)
                        
                        # Test request feedback endpoint
                        self.run_test("Request Feedback", "POST", f"checkins/request-feedback/{student_id}", 200)

    def save_results(self):
        """Save test results to JSON file"""
        report = {
            "test_summary": {
                "total_tests": self.tests_run,
                "passed_tests": self.tests_passed,
                "failed_tests": self.tests_run - self.tests_passed,
                "success_rate": f"{(self.tests_passed / self.tests_run * 100):.1f}%" if self.tests_run > 0 else "0%",
                "timestamp": datetime.now().isoformat()
            },
            "test_results": self.results
        }
        
        with open("/app/backend_test_results.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📊 Test results saved to /app/backend_test_results.json")

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print(f"📊 TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_run - self.tests_passed > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.results:
                if not result["passed"]:
                    print(f"   - {result['test']}: {result['details']}")
        
        print(f"{'='*60}")

def main():
    print("🚀 Starting FitMaster API Tests")
    print("Testing 3 specific bug fixes:")
    print("1. DELETE /api/workouts/{workout_id} endpoint")
    print("2. Submit report button functionality")
    print("3. FAQ chatbot refinements")
    print("-" * 60)
    
    tester = FitMasterAPITester()
    
    # Test authentication first
    if not tester.test_login():
        print("❌ Cannot proceed without authentication")
        return 1
    
    # Test basic functionality
    tester.test_basic_endpoints()
    
    # Test the specific DELETE workout endpoint (Bug Fix #1)
    tester.test_delete_workout_endpoint()
    
    # Test feedback functionality (Bug Fix #2)
    tester.test_feedback_endpoints()
    
    # Save results and show summary
    tester.save_results()
    tester.print_summary()
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())