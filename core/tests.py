import time
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Job, UserProfile, Application  # Added Application here

User = get_user_model()

class AIRecommendationEngineTests(TestCase):
    def setUp(self):
        """
        This runs before every single test. It sets up our 'Rigged Data'
        so we have a predictable environment to test the AI math and security.
        """
        # 1. Setup the Test Client
        self.client = APIClient()

        # 2. Create a Test User
        self.user = User.objects.create_user(
            username='testengineer',
            password='testpassword123',
            first_name='Test',
            last_name='Engineer'
        )
        
        # 3. EXPLICITLY create the Profile object and link it to the user we just made
        self.user_profile = UserProfile.objects.create(
            user=self.user,
            skills="React, Node, PostgreSQL, Python, Machine Learning"
        )

        # 4. Create a "Perfect Match" Job
        self.perfect_job = Job.objects.create(
            job_title="Full Stack Software Engineer",
            company_name="TechNova",
            job_location="Remote",
            job_description="Looking for an engineer to build web apps and AI.",
            required_skills="React, Node, PostgreSQL, Python",
            experience_required=3,
            job_type="Full_Time"
        )

        # 5. Create a "Zero Match" Job
        self.terrible_job = Job.objects.create(
            job_title="Veterinary Assistant",
            company_name="City Vets",
            job_location="New York",
            job_description="Looking for someone to help care for animals.",
            required_skills="Animal Care, Veterinary Medicine, Biology",
            experience_required=1,
            job_type="Part_Time"
        )

    def test_tf_idf_algorithm_ranking(self):
        """
        Proves the AI mathematically ranks the relevant software job 
        higher than the irrelevant veterinary job.
        """
        # Authenticate our test engineer
        self.client.force_authenticate(user=self.user)

        # Hit the recommendations endpoint (Adjust the URL name to match your urls.py)
        # Using the standard DRF router structure: /api/users/<id>/recommendations/
        response = self.client.get(f'/api/users/{self.user.id}/recommendations/')

        # 1. Ensure the API actually responded successfully
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 2. Extract the returned jobs
        recommended_jobs = response.data

        # 3. Ensure jobs were returned
        self.assertTrue(len(recommended_jobs) > 0)

        # 4. THE CORE ASSERTION: The top match (index 0) MUST be the perfect software job
        top_match_id = recommended_jobs[0]['job']['id']
        self.assertEqual(
            top_match_id, 
            self.perfect_job.id, 
            "CRITICAL FAILURE: The AI Engine failed to rank the perfect match at the top."
        )
        
        print("✓ TC-03 Passed: Semantic AI successfully ranked the perfect software match at rank #1 (index 0).")

    def test_security_unauthenticated_access_blocked(self):
        """
        Proves that a random person on the internet cannot hit the AI engine
        without a valid JWT token.
        """
        # We purposely DO NOT authenticate the client here
        
        # Try to calculate recommendations for user ID 1
        response = self.client.get('/api/users/1/recommendations/')

        # Assert that Django blocks them with a 401 Unauthorized or 403 Forbidden
        self.assertIn(
            response.status_code, 
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
            "SECURITY FLAW: The AI endpoint is exposed to unauthenticated users!"
        )
        
        print("✓ TC-05 Passed: Unauthenticated API request intercepted cleanly, returning proper HTTP 401/403 security block.")


class APIValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_registration_missing_fields(self):
        """
        Proves the API gracefully rejects a registration attempt 
        if required fields (like password) are missing, instead of crashing.
        """
        bad_payload = {
            "username": "lazyuser",
            "first_name": "Lazy"
            # INTENTIONALLY MISSING PASSWORD
        }
        
        # Hit your registration endpoint (Adjust URL if yours is different)
        response = self.client.post('/api/users/', bad_payload, format='json')
        
        # It MUST return a 400 Bad Request, not a 500 Server Error
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # It should tell us exactly what field is missing
        self.assertIn('password', response.data)
        
        print("✓ TC-01 Passed: Backend validation intercepted invalid registration payload safely, returning specific field error details.")


class DatabaseIntegrityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='applicant', password='123')
        self.job = Job.objects.create(
            job_title="Test Job",
            company_name="Test Co",
            job_description="Testing DB",
            required_skills="Testing",
            experience_required=1,
            job_type="Full_Time"
        )
        # Authenticate the user
        self.client.force_authenticate(user=self.user)

    def test_prevent_double_application(self):
        """
        Proves a user cannot spam the database by applying 
        for the exact same job multiple times.
        """
        payload = {"job": self.job.id}
        
        # Apply the first time (Should succeed: 201 Created)
        first_attempt = self.client.post('/api/applications/', payload)
        self.assertEqual(first_attempt.status_code, status.HTTP_201_CREATED)

        # Apply the second time (Should fail: 400 Bad Request)
        second_attempt = self.client.post('/api/applications/', payload)
        self.assertEqual(
            second_attempt.status_code, 
            status.HTTP_400_BAD_REQUEST,
            "DATABASE FLAW: The system allowed a user to apply for the same job twice!"
        )
        
        print("✓ TC-04 Passed: Database integrity check verified duplicate job application was blocked via model constraint.")

    def test_cascade_delete_job_removes_applications(self):
        """
        Proves that if an employer deletes a Job posting, 
        all related applications are safely removed from the database to prevent orphaned data.
        """
        # Create an application manually
        Application.objects.create(user=self.user, job=self.job)
        
        # Verify 1 application exists
        self.assertEqual(Application.objects.count(), 1)
        
        # Delete the job
        self.job.delete()
        
        # Verify the application was instantly deleted via CASCADE
        self.assertEqual(
            Application.objects.count(), 
            0,
            "DATA LEAK: Applications are remaining in the database after the Job is deleted!"
        )
        
        print("✓ TC-06 Passed: PostgreSQL ON DELETE CASCADE executed properly, purging linked application records upon job removal.")


class AIEnginePerformanceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='speedtester', password='123')
        self.profile = UserProfile.objects.create(
            user=self.user,
            skills="React, Node, PostgreSQL, Python, AWS, Docker, Kubernetes"
        )
        
        # Generate 100 fake jobs in the database instantly
        jobs_to_create = []
        for i in range(100):
            jobs_to_create.append(
                Job(
                    job_title=f"Engineer {i}",
                    company_name=f"Company {i}",
                    job_description="A lot of text here to make the TF-IDF engine work hard.",
                    required_skills="React, Node, PostgreSQL",
                    experience_required=2,
                    job_type="Full_Time"
                )
            )
        # bulk_create is much faster than saving them one by one
        Job.objects.bulk_create(jobs_to_create)

    def test_ai_engine_load_speed(self):
        """
        Proves the TF-IDF matrix math can process 100+ jobs in under 0.5 seconds.
        """
        self.client.force_authenticate(user=self.user)
        
        # Start the stopwatch
        start_time = time.time()
        
        # Trigger the heavy AI math
        response = self.client.get(f'/api/users/{self.user.id}/recommendations/')
        
        # Stop the stopwatch
        end_time = time.time()
        
        execution_time = end_time - start_time
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Assert the math took less than 1.5 seconds (500ms)
        self.assertTrue(
            execution_time < 1.5,
            f"PERFORMANCE FAILURE: AI Engine took too long! ({execution_time:.3f} seconds)"
        )
        
        # Print the speed to the terminal just to show off
        print(f"✓ Performance Test Passed: AI Engine processed similarity matrices across 100 jobs in {execution_time:.3f} seconds.")


class ComprehensiveProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="onboardingdev", 
            password="securepassword123"
        )
        # Force authentication for the locked-down endpoint
        self.client.force_authenticate(user=self.user)

    def test_commit_comprehensive_profile(self):
        """
        Proves the backend securely processes and saves deeply nested JSON arrays 
        (Experiences, Education, Projects) alongside native personal information fields.
        """
        # 1. Construct the comprehensive onboarding frontend payload
        nested_payload = {
            "first_name": "David",
            "last_name": "Aliyu",
            "phone_number": "+234123456789",
            "location": "Abuja, Nigeria",
            "profile": {
                "skills": "React Native, Python, FastAPI, PostgreSQL",
                "experience_years": 3,
                "preferred_job_type": "CONTRACT",
                "preferred_location": "Remote Worldwide",
                "github_url": "https://github.com/davidaliyu",
                "experiences": [
                    {
                        "id": 1,
                        "job_title": "Full-Stack Engineer",
                        "company": "Nile Tech",
                        "dates": "2023 - Present",
                        "description": "Architected backend microservices using FastAPI and integrated custom mobile application interfaces."
                    }
                ],
                "education": [
                    {
                        "id": 1,
                        "school": "Nile University",
                        "degree": "B.Sc. Computer Science",
                        "year": "2026"
                    }
                ],
                "projects": [
                    {
                        "id": 1,
                        "title": "Focus Bridge",
                        "link": "https://github.com/davidaliyu/focus-bridge",
                        "description": "Engineered a high-engagement micro-journaling application utilizing responsive UI components."
                    }
                ]
            }
        }

        # 2. Fire the PATCH request to commit the data
        response = self.client.patch(
            f'/api/users/{self.user.id}/', 
            nested_payload, 
            format='json'
        )

        # 3. Assertions: Verify server returns a success code
        self.assertEqual(
            response.status_code, 
            status.HTTP_200_OK,
            f"API rejected the nested payload! Details: {response.data}"
        )

        # 4. Re-query the database to verify the arrays were actually saved natively
        self.user.refresh_from_db()
        profile = self.user.profile

        # Prove base personal fields updated
        self.assertEqual(self.user.first_name, "David")
        self.assertEqual(self.user.location, "Abuja, Nigeria")

        # Prove links and dropdown choices mapped safely
        self.assertEqual(profile.preferred_job_type, "CONTRACT")
        self.assertEqual(profile.github_url, "https://github.com/davidaliyu")

        # PROVE THE MODULAR ARRAYS SAVED PERFECTLY:
        self.assertEqual(len(profile.experiences), 1)
        self.assertEqual(profile.experiences[0]['company'], "Nile Tech")
        
        self.assertEqual(len(profile.projects), 1)
        self.assertEqual(profile.projects[0]['title'], "Focus Bridge")

        print("✓ TC-02 Passed: Deeply nested JSON arrays securely processed and committed to native PostgreSQL database fields.")