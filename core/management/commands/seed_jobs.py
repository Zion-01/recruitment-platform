import random
from django.core.management.base import BaseCommand
from core.models import Job

class Command(BaseCommand):
    help = 'Populates the database with a diverse variety of technical roles'

    def handle(self, *args, **options):
        job_templates = [
            {
                "title": "Senior Full-Stack Engineer",
                "company": "Nexus FinTech",
                "loc": "Lagos, Nigeria (Hybrid)",
                "skills": "Python, Django, React, PostgreSQL, AWS",
                "desc": "We are looking for a product-minded engineer to lead our core transaction engine. You will be responsible for scaling microservices that handle millions of requests daily.",
                "type": "FULL_TIME"
            },
            {
                "title": "React Native Developer",
                "company": "SwiftMove",
                "loc": "Remote (Worldwide)",
                "skills": "React Native, TypeScript, Redux, Firebase",
                "desc": "Join our mobile-first team building the next generation of logistics software. Experience with native modules and performance optimization is a plus.",
                "type": "CONTRACT"
            },
            {
                "title": "AI/ML Research Engineer",
                "company": "NeuralPath AI",
                "loc": "San Francisco, CA (Remote Friendly)",
                "skills": "Python, PyTorch, Scikit-Learn, FastAPI, Machine Learning",
                "desc": "Work on the cutting edge of LLM orchestration. You will help build our proprietary vector-matching algorithms and deploy them into production.",
                "type": "FULL_TIME"
            },
            {
                "title": "DevOps & Infrastructure Architect",
                "company": "CloudScale Systems",
                "loc": "Abuja, Nigeria",
                "skills": "Docker, Kubernetes, Terraform, AWS, Bash",
                "desc": "Manage our multi-cloud infrastructure. We need someone who can automate everything and ensure 99.9% uptime for our global client base.",
                "type": "FULL_TIME"
            },
            {
                "title": "Backend Systems Engineer (Rust)",
                "company": "IronSafe Security",
                "loc": "Berlin, Germany",
                "skills": "Rust, C++, Linux Systems, Cryptography",
                "desc": "Build high-performance security protocols. If you love low-level systems and memory safety, this is the role for you.",
                "type": "FULL_TIME"
            },
            {
                "title": "Junior Frontend Developer",
                "company": "CreativePulse",
                "loc": "London, UK (Remote)",
                "skills": "JavaScript, CSS, React, Vite, Tailwind",
                "desc": "A perfect role for a recent graduate or bootcamp alum. You will work closely with designers to build pixel-perfect user interfaces.",
                "type": "INTERNSHIP"
            },
            {
                "title": "Data Scientist",
                "company": "EcoMetrics",
                "loc": "Nairobi, Kenya",
                "skills": "Python, Pandas, SQL, Tableau, Statistics",
                "desc": "Analyze climate data to provide actionable insights for NGOs. You should be comfortable cleaning messy datasets and presenting findings.",
                "type": "PART_TIME"
            }
        ]

        self.stdout.write(self.style.NOTICE('Cleaning existing jobs...'))
        # Optional: Uncomment the next line to clear out old data before seeding
        # Job.objects.all().delete()

        count = 0
        for template in job_templates:
            # We use get_or_create to avoid duplicates if you run this twice
            job, created = Job.objects.get_or_create(
                job_title=template['title'],
                company_name=template['company'],
                defaults={
                    'job_location': template['loc'],
                    'required_skills': template['skills'],
                    'job_description': template['desc'],
                    'job_type': template['type'],
                }
            )
            if created:
                count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully added {count} new diverse roles!'))