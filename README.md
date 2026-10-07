# Recruitment Platform

A full-stack job board with AI-assisted matching. Candidates build a profile
(or import it from a résumé), browse jobs, apply, and get ranked job
recommendations; staff publish jobs and review every application.

- **Backend:** Django 6 + Django REST Framework, JWT auth (SimpleJWT), PostgreSQL
- **Frontend:** React 19 + Vite, React Router, Axios
- **Matching:** scikit-learn TF-IDF + cosine similarity

## Features

- **Job recommendations.** `JobRecommendationEngine` (`core/ml_engine.py`) builds
  one text document from a candidate's skills, experience, projects, education
  and preferences, and one per job from its title, required skills,
  description, type and location. Skills are weighted double. It vectorizes
  them with TF-IDF, ranks jobs by cosine similarity, and stores every match
  that scores above 0.05 as a `Recommendation`.
- **Résumé import.** Upload a PDF or DOCX and the backend extracts the text
  (`pdfplumber` / `docx2txt`) and turns it into profile fields.
- **Applications.** Candidates can apply to each job once. Staff see the whole
  pipeline (`APPLIED` → `SHORTLISTED` / `REJECTED`).
- **Role-based access.** Anyone can register and list jobs. Job details require
  login. A user can only see and change their own account and
  recommendations. Staff manage jobs and can see all users and applications.

## Project layout

```
core/                  Django app: models, serializers, views, ML engine, tests
  management/commands/ seed_jobs: populate the database with sample roles
recruitment_platform/  Django project settings and root URLs
frontend/              React + Vite single-page app
```

## Getting started

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL

### Backend

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then fill in your values
createdb recruitment_db

python manage.py migrate
python manage.py seed_jobs      # optional sample data
python manage.py createsuperuser
python manage.py runserver      # http://127.0.0.1:8000
```

Settings are read from environment variables. See `.env.example` for the full
list (`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `POSTGRES_*`).
Django does not load `.env` on its own, so export the variables in your shell
or use a tool such as `direnv`.

### Frontend

```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

The frontend calls the API at `http://127.0.0.1:8000/api/`
(`frontend/src/services/api.js`), and the backend allows CORS from
`http://localhost:5173`.

## API

All endpoints are under `/api/`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/token/` | public | Log in, returns access + refresh JWT |
| POST | `/token/refresh/` | public | Refresh an access token |
| POST | `/users/` | public | Register |
| GET | `/users/` | staff | List all users |
| GET / PATCH / DELETE | `/users/{id}/` | self or staff | Read / update / delete a user and nested profile |
| GET | `/users/{id}/recommendations/` | self or staff | Ranked job matches |
| POST | `/users/{id}/parse_resume/` | self or staff | Upload a PDF/DOCX résumé (`file`) |
| GET | `/jobs/` | public | List jobs, newest first |
| GET | `/jobs/{id}/` | authenticated | Job detail |
| POST / PUT / PATCH / DELETE | `/jobs/` … | staff | Manage jobs |
| GET / POST | `/applications/` | authenticated | Your applications (staff: all) / apply |

## Tests

```bash
python manage.py test core
```

The suite covers recommendation ranking, unauthenticated access, registration
validation, duplicate-application prevention, cascade deletes, nested profile
updates, per-user access control, and a performance check that ranks 100
jobs.

## License

[MIT](LICENSE)
