"""Backend API tests for O Level Quiz app."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://mcq-timer-test.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Subjects ---
class TestSubjects:
    def test_list_subjects(self, session):
        r = session.get(f"{API}/subjects", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        codes = sorted([s["code"] for s in data])
        assert codes == ["M1", "M2", "M3", "M4"]
        for s in data:
            for k in ("name", "color", "duration_min", "num_questions", "desc"):
                assert k in s


# --- Mock info ---
class TestMockInfo:
    def test_mock_info(self, session):
        r = session.get(f"{API}/mock-test-info", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["num_questions"] == 50
        assert data["duration_min"] == 60


# --- Start quiz ---
class TestStartQuiz:
    @pytest.mark.parametrize("code", ["M1", "M2", "M3", "M4"])
    def test_start_subject_quiz(self, session, code):
        r = session.get(f"{API}/quiz/start/{code}", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "session_id" in data and len(data["session_id"]) > 0
        assert data["subject_code"] == code
        assert len(data["questions"]) == 20
        # public model: no 'a' or 'exp'
        for q in data["questions"]:
            assert set(q.keys()) == {"id", "q", "options"}
            assert isinstance(q["options"], list) and len(q["options"]) >= 2

    def test_start_mock_quiz(self, session):
        r = session.get(f"{API}/quiz/start/MOCK", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["subject_code"] == "MOCK"
        assert len(data["questions"]) == 50

    def test_start_lowercase_code(self, session):
        r = session.get(f"{API}/quiz/start/m1", timeout=20)
        assert r.status_code == 200
        assert r.json()["subject_code"] == "M1"

    def test_start_invalid_code(self, session):
        r = session.get(f"{API}/quiz/start/INVALID", timeout=20)
        assert r.status_code == 404


# --- Submit quiz ---
class TestSubmitQuiz:
    def test_submit_valid_session(self, session):
        # start
        start = session.get(f"{API}/quiz/start/M1", timeout=20).json()
        sid = start["session_id"]
        questions = start["questions"]
        # answer first option for all
        answers = {q["id"]: 0 for q in questions}
        # leave one unattempted
        answers[questions[0]["id"]] = None

        r = session.post(f"{API}/quiz/submit", json={
            "session_id": sid,
            "answers": answers,
            "time_taken_sec": 120,
        }, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["session_id"] == sid
        assert data["total"] == 20
        assert data["correct_count"] + data["wrong_count"] + data["unattempted"] == 20
        assert data["unattempted"] >= 1
        assert isinstance(data["review"], list) and len(data["review"]) == 20
        for item in data["review"]:
            for k in ("id", "q", "options", "correct", "selected", "is_correct", "explanation"):
                assert k in item
            assert isinstance(item["is_correct"], bool)

    def test_submit_invalid_session(self, session):
        r = session.post(f"{API}/quiz/submit", json={
            "session_id": "non-existent-uuid",
            "answers": {},
            "time_taken_sec": 0,
        }, timeout=20)
        assert r.status_code == 404
