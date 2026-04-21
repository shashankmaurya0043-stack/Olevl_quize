"""Backend API tests for O Level Quiz app (bilingual schema)."""
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Subjects (bilingual) ---
class TestSubjects:
    def test_list_subjects(self, session):
        r = session.get(f"{API}/subjects", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        codes = sorted([s["code"] for s in data])
        assert codes == ["M1", "M2", "M3", "M4"]
        # Every subject must have bilingual fields
        required = ("code", "name", "name_hi", "color", "duration_min",
                    "num_questions", "desc", "desc_hi")
        for s in data:
            for k in required:
                assert k in s, f"missing {k} in subject {s.get('code')}"
            assert isinstance(s["name_hi"], str) and len(s["name_hi"]) > 0
            assert isinstance(s["desc_hi"], str) and len(s["desc_hi"]) > 0
        # Spot-check specific Hindi subject name mentioned in spec
        m1 = next(s for s in data if s["code"] == "M1")
        assert "आई.टी" in m1["name_hi"] or "आईटी" in m1["name_hi"]


# --- Mock info ---
class TestMockInfo:
    def test_mock_info(self, session):
        r = session.get(f"{API}/mock-test-info", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["num_questions"] == 50
        assert data["duration_min"] == 60
        assert data.get("name_hi") == "पूर्ण मॉक टेस्ट"


# --- Start quiz (bilingual) ---
class TestStartQuiz:
    @pytest.mark.parametrize("code", ["M1", "M2", "M3", "M4"])
    def test_start_subject_quiz(self, session, code):
        r = session.get(f"{API}/quiz/start/{code}", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert "session_id" in data and len(data["session_id"]) > 0
        assert data["subject_code"] == code
        assert isinstance(data.get("subject_name_hi"), str) and len(data["subject_name_hi"]) > 0
        assert len(data["questions"]) == 20
        for q in data["questions"]:
            # new bilingual public schema
            assert set(q.keys()) == {"id", "q_en", "q_hi", "options_en", "options_hi"}
            assert isinstance(q["q_en"], str) and len(q["q_en"]) > 0
            assert isinstance(q["q_hi"], str) and len(q["q_hi"]) > 0
            assert isinstance(q["options_en"], list) and len(q["options_en"]) == 4
            assert isinstance(q["options_hi"], list) and len(q["options_hi"]) == 4

    def test_start_mock_quiz(self, session):
        r = session.get(f"{API}/quiz/start/MOCK", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["subject_code"] == "MOCK"
        assert len(data["questions"]) == 50
        for q in data["questions"]:
            assert "q_en" in q and "q_hi" in q
            assert len(q["options_en"]) == 4 and len(q["options_hi"]) == 4

    def test_start_lowercase_code(self, session):
        r = session.get(f"{API}/quiz/start/m1", timeout=20)
        assert r.status_code == 200
        assert r.json()["subject_code"] == "M1"

    def test_start_invalid_code(self, session):
        r = session.get(f"{API}/quiz/start/INVALID", timeout=20)
        assert r.status_code == 404


# --- Submit quiz (bilingual review) ---
class TestSubmitQuiz:
    def test_submit_valid_session(self, session):
        start = session.get(f"{API}/quiz/start/M1", timeout=20).json()
        sid = start["session_id"]
        questions = start["questions"]
        answers = {q["id"]: 0 for q in questions}
        answers[questions[0]["id"]] = None  # unattempted

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
        assert isinstance(data.get("subject_name_hi"), str) and len(data["subject_name_hi"]) > 0
        assert isinstance(data["review"], list) and len(data["review"]) == 20
        required_keys = {"id", "q_en", "q_hi", "options_en", "options_hi",
                         "correct", "selected", "is_correct",
                         "explanation_en", "explanation_hi"}
        for item in data["review"]:
            missing = required_keys - set(item.keys())
            assert not missing, f"review item missing keys: {missing}"
            assert isinstance(item["is_correct"], bool)
            assert isinstance(item["options_en"], list) and len(item["options_en"]) == 4
            assert isinstance(item["options_hi"], list) and len(item["options_hi"]) == 4

    def test_submit_mock_session_returns_50(self, session):
        start = session.get(f"{API}/quiz/start/MOCK", timeout=20).json()
        sid = start["session_id"]
        answers = {q["id"]: 1 for q in start["questions"]}
        r = session.post(f"{API}/quiz/submit", json={
            "session_id": sid, "answers": answers, "time_taken_sec": 0,
        }, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 50
        assert len(data["review"]) == 50

    def test_submit_invalid_session(self, session):
        r = session.post(f"{API}/quiz/submit", json={
            "session_id": "non-existent-uuid",
            "answers": {},
            "time_taken_sec": 0,
        }, timeout=20)
        assert r.status_code == 404
