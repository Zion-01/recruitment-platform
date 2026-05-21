from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .models import Job, Recommendation

class JobRecommendationEngine:
    def __init__(self):
        # We use standard English stop words to filter out connective language ("and", "the", etc.)
        self.vectorizer = TfidfVectorizer(stop_words='english')

    def compile_candidate_document(self, profile):
        """
        Compiles all natural language descriptions from the user's complete professional 
        history into one highly dense text document to maximize match fidelity.
        """
        if not profile:
            return ""
        
        text_blocks = []

        # 1. Heavily weight core verified skills
        if profile.skills:
            # Repeating core skills ensures they maintain dominant priority during feature extraction
            text_blocks.append(f"{profile.skills} " * 2)

        # 2. Extract rich descriptive paragraphs from modular Work Experience blocks
        if isinstance(profile.experiences, list):
            for exp in profile.experiences:
                if isinstance(exp, dict) and 'description' in exp:
                    text_blocks.append(exp['description'])

        # 3. Extract technical implementation details from featured Portfolio Projects
        if isinstance(profile.projects, list):
            for proj in profile.projects:
                if isinstance(proj, dict) and 'description' in proj:
                    text_blocks.append(proj['description'])

        # 4. Append baseline parameters (Education, Job Type, Geography)
        text_blocks.append(f"{profile.education_level or ''} {profile.preferred_job_type} {profile.preferred_location}")

        # Merge all extracted layers into a single comprehensive professional narrative
        return " ".join(text_blocks)

    def compile_opportunity_document(self, job):
        """
        Compiles job requirements and responsibilities into a target alignment document.
        """
        weighted_skills = f"{job.required_skills} " * 2
        return f"{job.job_title} {weighted_skills} {job.job_description} {job.job_type} {job.job_location}"

    def generate_recommendations(self, user):
        """
        The core pipeline: Compile Documents -> Extract Features -> Analyze Alignment -> Rank Matches
        """
        try:
            profile = user.profile
        except AttributeError:
            return []  # Abort analysis if the developer has not initialized an onboarding profile

        jobs = Job.objects.all()
        if not jobs.exists():
            return []

        # 1. Document Compilation
        profile_document = self.compile_candidate_document(profile)
        opportunity_documents = [self.compile_opportunity_document(job) for job in jobs]
        opportunity_ids = [job.id for job in jobs]

        # Combine candidate and opportunities for feature extraction (Candidate is always index 0)
        full_document_set = [profile_document] + opportunity_documents

        # 2. Feature Extraction
        alignment_matrix = self.vectorizer.fit_transform(full_document_set)

        # 3. Match Fidelity Computation
        # Analyze cosine similarity between the Candidate narrative (index 0) and all Opportunities (index 1+)
        candidate_features = alignment_matrix[0:1]
        opportunity_features = alignment_matrix[1:]
        
        fidelity_scores = cosine_similarity(candidate_features, opportunity_features).flatten()

        # 4. Match Ranking
        # Zip the opportunity IDs with their computed fidelity strength and sort descending
        ranked_opportunities = list(zip(opportunity_ids, fidelity_scores))
        ranked_opportunities.sort(key=lambda x: x[1], reverse=True)

        # 5. Commit to Database
        # Flush outdated matches for this developer to maintain state integrity
        Recommendation.objects.filter(user=user).delete()
        
        committed_matches = []
        for job_id, score in ranked_opportunities:
            # Strict threshold filter to prevent completely misaligned roles from populating the UI
            if score > 0.05:  
                job_instance = Job.objects.get(id=job_id)
                match_record = Recommendation.objects.create(
                    user=user,
                    job=job_instance,
                    recommendation_score=round(score, 4)
                )
                committed_matches.append(match_record)

        return committed_matches