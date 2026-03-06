import requests
import sys
from datetime import datetime

class FAQTestAPITester:
    def __init__(self, base_url="https://workout-removal-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_student_email = None
        self.created_student_password = "StudentPass123!"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "Personal@admin.com", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   Admin token obtained successfully")
            return True, response['user']
        return False, {}

    def test_create_personal(self):
        """Create a personal trainer as admin"""
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        timestamp = datetime.now().strftime('%H%M%S')
        
        # First register a personal trainer
        personal_data = {
            "name": f"Personal Test {timestamp}",
            "email": f"personal_{timestamp}@test.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "Register Personal Trainer",
            "POST",
            "auth/register",
            200,
            data=personal_data
        )
        
        if success and 'user' in response:
            personal_id = response['user']['id']
            
            # Approve the personal trainer
            success, approval_response = self.run_test(
                "Approve Personal Trainer",
                "POST",
                f"admin/personals/{personal_id}/approve",
                200,
                headers=headers
            )
            
            if success:
                # Now login as the approved personal trainer
                success, login_response = self.run_test(
                    "Personal Trainer Login",
                    "POST",
                    "auth/login",
                    200,
                    data={"email": personal_data["email"], "password": personal_data["password"]}
                )
                
                if success and 'access_token' in login_response:
                    self.personal_token = login_response['access_token']
                    print(f"   Personal trainer ready for student creation")
                    return True, login_response['user']
        
        return False, {}

    def test_create_student(self):
        """Create a student via approved personal trainer"""
        if not hasattr(self, 'personal_token') or not self.personal_token:
            print("❌ No personal trainer token available")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        timestamp = datetime.now().strftime('%H%M%S')
        
        self.created_student_email = f"student_{timestamp}@test.com"
        
        student_data = {
            "name": f"Student Test {timestamp}",
            "email": self.created_student_email,
            "password": self.created_student_password,
            "phone": "(11) 99999-9999",
            "notes": "Student for FAQ testing"
        }
        
        success, response = self.run_test(
            "Create Student",
            "POST",
            "students",
            200,
            data=student_data,
            headers=headers
        )
        
        if success and 'id' in response:
            print(f"   Student created: {self.created_student_email}")
            return True, response
        return False, {}

    def test_student_login(self):
        """Test student login"""
        if not self.created_student_email:
            print("❌ No student email available")
            return False, {}
            
        success, response = self.run_test(
            "Student Login",
            "POST",
            "auth/login",
            200,
            data={"email": self.created_student_email, "password": self.created_student_password}
        )
        
        if success and 'access_token' in response:
            self.student_token = response['access_token']
            print(f"   Student login successful")
            return True, response['user']
        return False, {}

    def test_student_basic_apis(self):
        """Test basic APIs that student will use"""
        if not self.student_token:
            print("❌ No student token available")
            return False, {}
            
        headers = {'Authorization': f'Bearer {self.student_token}'}
        
        # Test workouts endpoint
        success1, _ = self.run_test(
            "Student Get Workouts",
            "GET",
            "workouts",
            200,
            headers=headers
        )
        
        # Test stats endpoint
        success2, _ = self.run_test(
            "Student Get Stats",
            "GET",
            "stats/student",
            200,
            headers=headers
        )
        
        return success1 and success2, {}

def main():
    print("🏋️ FAQ Backend API Testing Started")
    print("=" * 40)
    
    tester = FAQTestAPITester()
    
    # Test admin login
    print("\n👑 TESTING ADMIN LOGIN")
    success, admin_user = tester.test_admin_login()
    if not success:
        print("❌ Admin login failed, stopping tests")
        return 1
    
    # Create and approve personal trainer
    print("\n🏋️ CREATING PERSONAL TRAINER")
    success, personal_user = tester.test_create_personal()
    if not success:
        print("❌ Personal trainer creation/approval failed, stopping tests")
        return 1
    
    # Create student
    print("\n🎓 CREATING STUDENT")
    success, student_data = tester.test_create_student()
    if not success:
        print("❌ Student creation failed, stopping tests")
        return 1
    
    # Test student login
    print("\n🔐 TESTING STUDENT LOGIN")
    success, student_user = tester.test_student_login()
    if not success:
        print("❌ Student login failed, stopping tests")
        return 1
    
    # Test basic student APIs
    print("\n📊 TESTING STUDENT APIS")
    success, _ = tester.test_student_basic_apis()
    if not success:
        print("❌ Student API access failed")
    
    # Print results
    print("\n" + "=" * 40)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    print(f"\n✅ STUDENT CREDENTIALS FOR FAQ TESTING:")
    print(f"   Email: {tester.created_student_email}")
    print(f"   Password: {tester.created_student_password}")
    
    if success_rate >= 70:
        print("✅ Backend APIs ready for FAQ testing")
        return 0
    else:
        print("❌ Backend APIs not ready")
        return 1

if __name__ == "__main__":
    sys.exit(main())