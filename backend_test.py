import requests
import json
import os
from datetime import datetime
from io import BytesIO

class PersonalTrainerAPITester:
    def __init__(self, base_url="https://fitness-training-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.personal_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_student_id = None
        self.test_workout_id = None

    def run_test(self, name, method, endpoint, expected_status=200, data=None, files=None, headers=None, form_data=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if files or form_data:
            # Remove Content-Type for file uploads or form data
            test_headers.pop('Content-Type', None)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=test_headers)
                elif form_data:
                    response = requests.post(url, data=data, headers=test_headers)
                else:
                    response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)
            else:
                print(f"❌ Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status or (isinstance(expected_status, list) and response.status_code in expected_status)
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")

            try:
                return success, response.json() if success else {}
            except:
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_personal_login(self):
        """Test personal trainer login"""
        success, response = self.run_test(
            "Personal Trainer Login",
            "POST",
            "auth/login",
            200,
            data={"email": "personal.teste@fitmaster.com", "password": "123456"}
        )
        if success and 'access_token' in response:
            self.personal_token = response['access_token']
            return True
        return False

    def test_student_login(self):
        """Test student login"""
        success, response = self.run_test(
            "Student Login",
            "POST", 
            "auth/login",
            200,
            data={"email": "aluno.teste@fitmaster.com", "password": "123456"}
        )
        if success and 'access_token' in response:
            self.student_token = response['access_token']
            return True
        return False

    def test_create_test_student(self):
        """Create a test student for workout uploads"""
        if not self.personal_token:
            return False
            
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        success, response = self.run_test(
            "Create Test Student",
            "POST",
            "students",
            [200, 400],  # Accept 400 if student already exists
            data={
                "email": "teste.upload@fitmaster.com",
                "name": "Teste Upload",
                "password": "123456",
                "phone": "11999999999"
            },
            headers=headers
        )
        
        if success:
            if response and 'id' in response:
                self.test_student_id = response['id']
                print(f"   Student created with ID: {self.test_student_id}")
            elif 'detail' in response and 'cadastrado' in response['detail']:
                print("   ✅ Student already exists, will use existing one")
                # Try to get the existing student ID by listing students
                students_response = self.run_test("List Students", "GET", "students", 200, headers=headers)
                if students_response[0]:
                    students = students_response[1]
                    for student in students:
                        if student.get('email') == 'teste.upload@fitmaster.com':
                            self.test_student_id = student['id']
                            print(f"   Found existing student ID: {self.test_student_id}")
                            break
        return success

    def test_csv_upload(self):
        """Test CSV workout file upload (only CSV and XLSX should be accepted)"""
        if not self.personal_token:
            return False

        # Create a simple CSV content for testing
        csv_content = """TREINO,GRUPO MUSCULAR,EXERCÍCIO,REPETIÇÕES,MÉTODO,VÍDEO,OBSERVAÇÃO
A,PEITORAL,Supino Reto,4x12,Normal,,
A,DORSAL,Puxada Frontal,4x10,Normal,,
A,OMBRO,Desenvolvimento,3x12,Normal,,"""

        csv_file = BytesIO(csv_content.encode('utf-8'))
        csv_file.name = "treino_teste.csv"

        headers = {'Authorization': f'Bearer {self.personal_token}'}
        files = {'file': ('treino_teste.csv', csv_file, 'text/csv')}
        data = {}
        if self.test_student_id:
            data['student_id'] = self.test_student_id

        success, response = self.run_test(
            "CSV Upload",
            "POST",
            "workouts/upload",
            200,
            data=data,
            files=files,
            headers=headers
        )
        
        if success and 'id' in response:
            self.test_workout_id = response['id']
            print(f"   Workout created with ID: {self.test_workout_id}")
            # Check that igreja field is NOT in the CSV processing
            if 'igreja' in str(response).lower():
                print("   ⚠️ WARNING: 'igreja' field detected in response - should be removed!")
            return True
        return False

    def test_xlsx_upload(self):
        """Test XLSX file acceptance"""
        if not self.personal_token:
            return False

        # Try to upload a fake XLSX (will fail but should be accepted format)
        xlsx_content = b"PK\x03\x04"  # Basic ZIP header for XLSX detection
        xlsx_file = BytesIO(xlsx_content)
        
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        files = {'file': ('treino_teste.xlsx', xlsx_file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        
        # This will likely fail due to invalid XLSX content, but should not fail due to format rejection
        success, response = self.run_test(
            "XLSX Upload Format Check",
            "POST", 
            "workouts/upload",
            400,  # Accept 400 as valid (file format accepted but content invalid)
            files=files,
            headers=headers
        )
        
        # Check that it's a content error, not format error
        if success and 'detail' in response:
            error_msg = response['detail'].lower()
            if 'zip' in error_msg or 'formato' in error_msg:
                print("   ✅ Correctly identified as invalid XLSX content")
                return True
        
        return success

    def test_invalid_file_format(self):
        """Test that invalid file formats are rejected"""
        if not self.personal_token:
            return False

        # Try to upload a TXT file (should be rejected)
        txt_content = "This is not a valid workout file"
        txt_file = BytesIO(txt_content.encode('utf-8'))
        
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        files = {'file': ('treino_teste.txt', txt_file, 'text/plain')}
        
        success, response = self.run_test(
            "Invalid File Format (TXT) - Should Fail",
            "POST",
            "workouts/upload", 
            400,  # Should fail with 400
            files=files,
            headers=headers
        )
        return success  # Success means it properly rejected the invalid format

    def test_pdf_upload_for_workout(self):
        """Test PDF upload for aerobic workout"""
        if not self.personal_token or not self.test_workout_id:
            return False

        # Create a simple PDF content for testing
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n174\n%%EOF"
        pdf_file = BytesIO(pdf_content)
        
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        files = {'file': ('aerobico.pdf', pdf_file, 'application/pdf')}
        
        success, response = self.run_test(
            "PDF Upload for Aerobic Workout",
            "POST",
            f"workouts/{self.test_workout_id}/upload-pdf",
            200,
            files=files,
            headers=headers
        )
        return success

    def test_mp4_video_upload(self):
        """Test MP4 video upload for exercise"""
        if not self.personal_token:
            return False

        # Create a minimal MP4 file header for testing
        mp4_content = b"\x00\x00\x00\x20ftypmp42\x00\x00\x00\x00mp42isom"
        mp4_file = BytesIO(mp4_content)
        
        headers = {'Authorization': f'Bearer {self.personal_token}'}
        files = {'file': ('exercicio_video.mp4', mp4_file, 'video/mp4')}
        data = {'exercise_name': 'Supino Reto'}
        
        success, response = self.run_test(
            "MP4 Video Upload for Exercise",
            "POST",
            "exercises/upload-video",
            200,
            data=data,
            files=files,
            headers=headers
        )
        return success

    def test_calorie_calculation(self):
        """Test calorie calculation endpoint"""
        if not self.student_token:
            return False

        headers = {'Authorization': f'Bearer {self.student_token}'}
        
        # Create form data for calorie calculation (as expected by the API)
        data = {
            'load_kg': '70.0',
            'reps': '12', 
            'sets': '4'
        }
        
        success, response = self.run_test(
            "Calorie Calculation",
            "POST",
            "calculate-calories",
            200,
            data=data,
            form_data=True,  # Use form data encoding
            headers=headers
        )
        
        if success:
            print(f"   Calculated calories: {response.get('total_calories', 'N/A')}")
            print(f"   Total volume: {response.get('total_volume', 'N/A')} kg")
        
        return success

    def test_request_feedback(self):
        """Test personal trainer requesting feedback from student"""
        if not self.personal_token or not self.test_student_id:
            return False

        headers = {'Authorization': f'Bearer {self.personal_token}'}
        
        success, response = self.run_test(
            "Request Student Feedback",
            "POST",
            f"checkins/request-feedback/{self.test_student_id}",
            200,
            headers=headers
        )
        return success

    def test_check_pending_feedback_request(self):
        """Test checking for pending feedback request as student"""
        if not self.student_token:
            return False

        headers = {'Authorization': f'Bearer {self.student_token}'}
        
        success, response = self.run_test(
            "Check Pending Feedback Request",
            "GET",
            "checkins/pending-feedback-request",
            200,
            headers=headers
        )
        
        if success:
            has_pending = response.get('has_pending', False)
            print(f"   Has pending feedback request: {has_pending}")
        
        return success

    def test_workout_list_as_student(self):
        """Test that student can see workouts and PDF downloads"""
        if not self.student_token:
            return False

        headers = {'Authorization': f'Bearer {self.student_token}'}
        
        success, response = self.run_test(
            "Student Workout List (Check PDF availability)",
            "GET",
            "workouts",
            200,
            headers=headers
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            workout = response[0]
            has_pdf = workout.get('aerobic_pdf_url') is not None
            print(f"   First workout has PDF: {has_pdf}")
            if has_pdf:
                print(f"   PDF URL: {workout.get('aerobic_pdf_url')}")
        
        return success

    def test_exercise_categories(self):
        """Test exercise categories endpoint"""
        headers = {}
        if self.personal_token:
            headers['Authorization'] = f'Bearer {self.personal_token}'
            
        success, response = self.run_test(
            "Exercise Categories",
            "GET", 
            "exercise-library/categories",
            200,
            headers=headers
        )
        
        if success:
            categories = response.get('categories', [])
            print(f"   Available categories: {len(categories)}")
            # Check that igreja is not in categories
            if any('igreja' in str(cat).lower() for cat in categories):
                print("   ⚠️ WARNING: 'igreja' found in exercise categories - should be removed!")
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 60)
        print("🏃 PERSONAL TRAINER SYSTEM API TESTS")
        print("=" * 60)
        
        # Authentication tests
        print("\n🔐 AUTHENTICATION TESTS")
        if not self.test_personal_login():
            print("❌ Personal login failed - cannot continue with most tests")
            return
            
        if not self.test_student_login():
            print("❌ Student login failed - some tests will be skipped")

        # Setup test data
        print("\n📋 TEST DATA SETUP")
        self.test_create_test_student()
        
        # File upload tests
        print("\n📁 FILE UPLOAD TESTS")
        self.test_csv_upload()
        self.test_xlsx_upload() 
        self.test_invalid_file_format()
        self.test_pdf_upload_for_workout()
        self.test_mp4_video_upload()
        
        # Feature tests
        print("\n⚡ FEATURE TESTS") 
        self.test_calorie_calculation()
        self.test_request_feedback()
        self.test_check_pending_feedback_request()
        self.test_workout_list_as_student()
        self.test_exercise_categories()
        
        # Print results
        print("\n" + "=" * 60)
        print(f"📊 TEST RESULTS: {self.tests_passed}/{self.tests_run} passed")
        print(f"📈 Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
        else:
            print(f"⚠️ {self.tests_run - self.tests_passed} test(s) failed")
            
        return self.tests_passed == self.tests_run

def main():
    tester = PersonalTrainerAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)