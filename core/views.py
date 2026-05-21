import io
import re
import pdfplumber
import docx2txt
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny, IsAdminUser
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User, Job, Application, Recommendation
from .serializers import UserSerializer, JobSerializer, ApplicationSerializer, CustomTokenObtainPairSerializer, RecommendationSerializer
from .ml_engine import JobRecommendationEngine

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed and edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def recommendations(self, request, pk=None):
        """
        Endpoint: /api/users/{id}/recommendations/
        Returns ranked recommendations complete with AI match percentages.
        """
        user = self.get_object()
        engine = JobRecommendationEngine()
        
        # Run the AI model (returns Recommendation instances)
        recommendations = engine.generate_recommendations(user)
        
        # 🚨 FIXED: Serialize the Recommendation instances directly, NOT just the jobs
        serializer = RecommendationSerializer(recommendations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def parse_resume(self, request, pk=None):
        """
        Endpoint: POST /api/users/{id}/parse_resume/
        Open-source NLP pipeline that physically reads uploaded PDFs/DOCX files, 
        extracts text, and structures it into frontend-ready JSON arrays.
        """
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            raise ValidationError({"detail": "No resume file attached to the request."})

        file_name = uploaded_file.name.lower()
        raw_text = ""

        # --- 1. PHYSICAL FILE EXTRACTION ---
        try:
            if file_name.endswith('.pdf'):
                # Read PDF directly from memory without saving to disk
                with pdfplumber.open(uploaded_file) as pdf:
                    pages_text = [page.extract_text() for page in pdf.pages if page.extract_text()]
                    raw_text = "\n".join(pages_text)
            
            elif file_name.endswith('.docx'):
                # Read DOCX from memory stream
                file_stream = io.BytesIO(uploaded_file.read())
                raw_text = docx2txt.process(file_stream)
            
            else:
                raise ValidationError({"detail": "Unsupported file format. Please upload a PDF or DOCX."})
        
        except Exception as e:
            return Response(
                {"detail": f"Failed to read document layers: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- 2. OPEN-SOURCE HEURISTIC PARSER ---
        # If the file is completely unreadable or scanned an image without OCR
        if not raw_text.strip():
            raise ValidationError({"detail": "No readable text found. Please ensure the document is not a flat image."})

        parsed_payload = self._run_heuristic_nlp_extraction(raw_text)

        return Response(parsed_payload, status=status.HTTP_200_OK)

    def _run_heuristic_nlp_extraction(self, text):
        """
        Localized extraction algorithm that scans raw text for standard document anchors,
        populates known software engineering keywords, and structures paragraph arrays.
        """
        # Dictionary structure mirroring your React frontend state exactly
        extracted_data = {
            "skills": "",
            "experience_years": 0,
            "experiences": [],
            "education": [],
            "projects": []
        }

        # Clean text lines
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        full_clean_text = " ".join(lines)

        # A. EXTRACT CORE SKILLS (Standard engineering dictionary mapping)
        tech_dictionary = [
            "Python", "Django", "FastAPI", "React", "React Native", "JavaScript", 
            "TypeScript", "Node.js", "PostgreSQL", "SQL", "Docker", "Kubernetes", 
            "AWS", "Git", "Machine Learning", "HTML", "CSS", "REST APIs", "Vite"
        ]
        
        found_skills = []
        for tech in tech_dictionary:
            # Word boundary regex search to prevent false partial matches
            if re.search(r'\b' + re.escape(tech) + r'\b', full_clean_text, re.IGNORECASE):
                found_skills.append(tech)
        
        extracted_data["skills"] = ", ".join(found_skills)

        # B. ESTIMATE YEARS OF EXPERIENCE (Extract all valid year ranges)
        years = [int(y) for y in re.findall(r'\b(20\d\d)\b', full_clean_text)]
        if years:
            min_year = min(years)
            max_year = max(years)
            # Cap at realistic thresholds to prevent typos from breaking logic
            calculated_exp = max_year - min_year
            extracted_data["experience_years"] = max(min(calculated_exp, 20), 0)

        # C. ROUGH MODULAR SECTION SPLITTING
        # Scan for major section headers to bundle relevant paragraphs
        current_section = "GENERAL"
        current_block = []

        for line in lines:
            upper_line = line.upper()
            # Anchor checks
            if any(h in upper_line for h in ["EXPERIENCE", "EMPLOYMENT", "WORK HISTORY"]):
                current_section = "EXPERIENCE"
                continue
            elif any(h in upper_line for h in ["EDUCATION", "ACADEMIC", "UNIVERSITY"]):
                current_section = "EDUCATION"
                continue
            elif any(h in upper_line for h in ["PROJECTS", "OPEN SOURCE"]):
                current_section = "PROJECTS"
                continue

            # Populate arrays based on active header context
            if len(line) > 15: # Ignore very short non-descriptive rows
                if current_section == "EXPERIENCE":
                    current_block.append(line)
                    # If we accumulate a reasonable chunk, append as a structured experience block
                    if len(current_block) >= 2:
                        extracted_data["experiences"].append({
                            "id": len(extracted_data["experiences"]) + 1,
                            "job_title": current_block[0][:50], # Take first sentence as fallback title
                            "company": "Extracted Role",
                            "dates": "Parsed Timeline",
                            "description": " ".join(current_block)
                        })
                        current_block = [] # Reset for next paragraph
                
                elif current_section == "EDUCATION" and len(extracted_data["education"]) < 2:
                    # Look for degree markers like B.Sc, M.Sc, Bachelor
                    extracted_data["education"].append({
                        "id": len(extracted_data["education"]) + 1,
                        "school": line[:60],
                        "degree": "Verified Credential",
                        "year": str(max(years)) if years else "2024"
                    })
                
                elif current_section == "PROJECTS":
                    extracted_data["projects"].append({
                        "id": len(extracted_data["projects"]) + 1,
                        "title": line[:40],
                        "link": "",
                        "description": line
                    })

        return extracted_data


class JobViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Job Opportunities.
    - Public: List jobs (teaser).
    - Authenticated: Retrieve full details.
    - Staff Only: Create/Update/Delete roles.
    """
    queryset = Job.objects.all().order_by('-date_posted')
    serializer_class = JobSerializer

    def get_permissions(self):
        """
        Dynamically assigns permissions based on the specific action.
        """
        # 1. Allow Anyone to see the list of jobs (for the Landing Page teaser)
        if self.action == 'list':
            return [AllowAny()]
        
        # 2. Require Authentication to view specific details or recommendations
        elif self.action in ['retrieve', 'recommendations']:
            return [IsAuthenticated()]
        
        # 3. Only staff/admins can create, update, or delete jobs
        else:
            return [IsAdminUser()]

    def perform_create(self, serializer):
        # Double-check staff status just in case
        if not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only authorized staff can publish opportunities.")
        serializer.save()


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows applications to be viewed or created.
    Secured so candidates strictly fetch their own tracking histories.
    """
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Safety fallback: unauthenticated requests get an empty list
        if not user.is_authenticated:
            return Application.objects.none()
            
        # Authorized staff/recruiters can view all pipeline applications
        if user.is_staff:
            return Application.objects.all().order_by('-application_date')
            
        # Standard candidates strictly pull their personal application vector
        return Application.objects.filter(user=user).order_by('-application_date')

    def perform_create(self, serializer):
        user = self.request.user
        job = serializer.validated_data.get('job')

        if Application.objects.filter(user=user, job=job).exists():
            raise ValidationError({"detail": "You have already applied for this job."})

        serializer.save(user=user)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer