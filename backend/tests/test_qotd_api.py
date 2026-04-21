"""Tests for Question of the Day (QotD) and basic regression on quiz start."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend env file if env isn't propagated
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.strip().split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- QotD feature ----
class TestQotd:
    def test_qotd_shape_and_fields(self, client):
        r = client.get(f"{API}/qotd", timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        # required keys
        for key in ["date", "id", "subject_code", "q_en", "q_hi",
                    "options_en", "options_hi", "a", "exp_en", "exp_hi"]:
            assert key in d, f"Missing key: {key}"
        # date format YYYY-MM-DD
        assert re.match(r"^\d{4}-\d{2}-\d{2}$", d["date"]), d["date"]
        # options 4 each
        assert isinstance(d["options_en"], list) and len(d["options_en"]) == 4
        assert isinstance(d["options_hi"], list) and len(d["options_hi"]) == 4
        # a in 0..3
        assert isinstance(d["a"], int) and 0 <= d["a"] <= 3
        # q fields non-empty
        assert isinstance(d["q_en"], str) and d["q_en"].strip()
        assert isinstance(d["q_hi"], str) and d["q_hi"].strip()

    def test_qotd_hindi_is_devanagari(self, client):
        d = client.get(f"{API}/qotd", timeout=15).json()
        # Must have at least one Devanagari character (U+0900..U+097F)
        assert re.search(r"[\u0900-\u097F]", d["q_hi"]), f"q_hi not Devanagari: {d['q_hi']!r}"
        # At least one option also in Devanagari
        joined_hi = " ".join(d["options_hi"])
        assert re.search(r"[\u0900-\u097F]", joined_hi), "options_hi not Devanagari"

    def test_qotd_deterministic_same_day(self, client):
        d1 = client.get(f"{API}/qotd", timeout=15).json()
        d2 = client.get(f"{API}/qotd", timeout=15).json()
        assert d1["date"] == d2["date"]
        assert d1["id"] == d2["id"], "QotD not deterministic on same UTC day"
        assert d1["q_en"] == d2["q_en"]
        assert d1["a"] == d2["a"]


# ---- Regression: confirm quiz start still works ----
class TestQuizStartRegression:
    def test_start_m1_quiz(self, client):
        r = client.get(f"{API}/quiz/start/M1", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "session_id" in data
        assert "questions" in data and isinstance(data["questions"], list)
        assert len(data["questions"]) > 0

    def test_start_mock_quiz(self, client):
        r = client.get(f"{API}/quiz/start/MOCK", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "session_id" in data
        assert len(data.get("questions", [])) > 0
