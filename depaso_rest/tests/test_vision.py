"""
Tests for the vision module.

Unit tests: VisionService in stub mode (no TF installed in dev).
Integration tests: /api/v1/vision/* endpoints via TestClient.

Covers: src/app/modules/vision/service.py
        src/app/modules/vision/router.py
"""
import pytest
from fastapi.testclient import TestClient

from src.app.modules.vision.service import VisionService, CATEGORIES


# --- Unit tests for VisionService (no DB, no TF) ----------------------------

def test_model_not_loaded_by_default():
    svc = VisionService("/nonexistent/model.keras")
    assert svc.model_loaded is False


def test_load_model_returns_false_without_tf(tmp_path):
    """In dev, TF is absent: load_model() falls back to stub mode."""
    svc = VisionService(str(tmp_path / "model.keras"))
    result = svc.load_model()
    assert result is False
    assert svc.model_loaded is False


def test_classify_stub_returns_all_required_keys():
    svc = VisionService("/nonexistent/model.keras")
    result = svc.classify(b"some image bytes")
    for key in ("category", "confidence", "needs_manual", "model_loaded"):
        assert key in result, f"Missing key: {key}"


def test_classify_stub_category_is_valid_enum_value():
    svc = VisionService("/nonexistent/model.keras")
    result = svc.classify(b"test image content here")
    assert result["category"] in CATEGORIES


def test_classify_stub_confidence_is_05():
    """Stub always returns 0.50 confidence (below default threshold of 0.70)."""
    svc = VisionService("/nonexistent/model.keras")
    result = svc.classify(b"bytes")
    assert result["confidence"] == pytest.approx(0.50, abs=0.01)


def test_classify_stub_sets_needs_manual_true():
    """0.50 confidence < 0.70 default threshold -> needs_manual must be True."""
    svc = VisionService("/nonexistent/model.keras")
    result = svc.classify(b"bytes")
    assert result["needs_manual"] is True


def test_classify_stub_model_loaded_false():
    svc = VisionService("/nonexistent/model.keras")
    result = svc.classify(b"bytes")
    assert result["model_loaded"] is False


def test_stub_predict_deterministic_same_bytes():
    """Same bytes must always yield the same (category, confidence) pair."""
    svc = VisionService("/nonexistent/model.keras")
    payload = b"x" * 1337
    r1 = svc._stub_predict(payload)
    r2 = svc._stub_predict(payload)
    assert r1 == r2


def test_custom_confidence_threshold_disables_manual():
    """With threshold=0.0, confidence 0.50 never triggers needs_manual."""
    svc = VisionService("/nonexistent/model.keras", confidence_threshold=0.0)
    result = svc.classify(b"img bytes")
    assert result["needs_manual"] is False


def test_custom_confidence_threshold_high_forces_manual():
    """With threshold=1.0, any result triggers needs_manual."""
    svc = VisionService("/nonexistent/model.keras", confidence_threshold=1.0)
    result = svc.classify(b"img bytes")
    assert result["needs_manual"] is True


def test_categories_list_has_four_entries():
    assert len(CATEGORIES) == 4
    assert set(CATEGORIES) == {"s", "m", "l", "xl"}


# --- Integration tests via TestClient ----------------------------------------

def _register_and_get_token(client: TestClient, email: str) -> dict:
    """Register a user and return auth headers."""
    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "Password123!",
        "first_name": "Vision",
        "last_name": "Tester",
        "phone_number": "123456789",
        "user_type": "client",
    })
    assert res.status_code == 201, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_classify_requires_authentication(client: TestClient):
    res = client.post(
        "/api/v1/vision/classify",
        files={"image": ("test.jpg", b"fake bytes", "image/jpeg")},
        data={"has_reference_object": "false"},
    )
    assert res.status_code == 401


def test_classify_endpoint_succeeds_with_valid_token(client: TestClient):
    headers = _register_and_get_token(client, "vis_basic@example.com")
    res = client.post(
        "/api/v1/vision/classify",
        files={"image": ("pkg.jpg", b"tiny image content", "image/jpeg")},
        data={"has_reference_object": "false"},
        headers=headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert "category" in body
    assert body["category"] in {"s", "m", "l", "xl"}
    assert "confidence" in body
    assert "needs_manual" in body
    assert "model_loaded" in body
    assert "classification_id" in body
    # La foto se persiste para adjuntarla al envío como photo_url.
    assert body["photo_url"] is not None
    assert "/media/packages/" in body["photo_url"]


def test_classify_logs_returns_classification_id(client: TestClient):
    headers = _register_and_get_token(client, "vis_log@example.com")
    res = client.post(
        "/api/v1/vision/classify",
        files={"image": ("x.jpg", b"another fake image", "image/jpeg")},
        data={"has_reference_object": "false"},
        headers=headers,
    )
    assert res.status_code == 200
    cid = res.json()["classification_id"]
    assert isinstance(cid, int)
    assert cid > 0


def test_classify_with_reference_object_flag(client: TestClient):
    headers = _register_and_get_token(client, "vis_ref@example.com")
    res = client.post(
        "/api/v1/vision/classify",
        files={"image": ("pkg.jpg", b"ref image", "image/jpeg")},
        data={"has_reference_object": "true"},
        headers=headers,
    )
    # Stub mode: has_reference_object is a hint for the real model; stub ignores it
    assert res.status_code == 200


def test_list_classifications_empty_for_new_user(client: TestClient):
    headers = _register_and_get_token(client, "vis_empty@example.com")
    res = client.get("/api/v1/vision/classifications", headers=headers)
    assert res.status_code == 200
    assert res.json() == []


def test_list_classifications_after_classify(client: TestClient):
    headers = _register_and_get_token(client, "vis_list@example.com")
    # Perform two classifications
    for _ in range(2):
        client.post(
            "/api/v1/vision/classify",
            files={"image": ("x.jpg", b"bytes", "image/jpeg")},
            data={"has_reference_object": "false"},
            headers=headers,
        )
    res = client.get("/api/v1/vision/classifications", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_list_classifications_requires_auth(client: TestClient):
    res = client.get("/api/v1/vision/classifications")
    assert res.status_code == 401


def test_feedback_accepted_updates_record(client: TestClient):
    headers = _register_and_get_token(client, "vis_fb_accept@example.com")
    classify_res = client.post(
        "/api/v1/vision/classify",
        files={"image": ("x.jpg", b"bytes", "image/jpeg")},
        data={"has_reference_object": "false"},
        headers=headers,
    )
    assert classify_res.status_code == 200
    cid = classify_res.json()["classification_id"]

    patch_res = client.patch(
        f"/api/v1/vision/classifications/{cid}",
        json={"accepted": True, "manual_category": None},
        headers=headers,
    )
    assert patch_res.status_code == 200
    body = patch_res.json()
    assert body["accepted"] is True
    assert body["manual_category"] is None


def test_feedback_manual_correction_updates_record(client: TestClient):
    headers = _register_and_get_token(client, "vis_fb_manual@example.com")
    classify_res = client.post(
        "/api/v1/vision/classify",
        files={"image": ("x.jpg", b"bytes", "image/jpeg")},
        data={"has_reference_object": "false"},
        headers=headers,
    )
    cid = classify_res.json()["classification_id"]

    patch_res = client.patch(
        f"/api/v1/vision/classifications/{cid}",
        json={"accepted": False, "manual_category": "l"},
        headers=headers,
    )
    assert patch_res.status_code == 200
    body = patch_res.json()
    assert body["accepted"] is False
    assert body["manual_category"] == "l"


def test_feedback_wrong_user_returns_404(client: TestClient):
    """A different user cannot access another user's classification."""
    owner_headers = _register_and_get_token(client, "vis_owner@example.com")
    other_headers = _register_and_get_token(client, "vis_other@example.com")

    classify_res = client.post(
        "/api/v1/vision/classify",
        files={"image": ("x.jpg", b"bytes", "image/jpeg")},
        data={"has_reference_object": "false"},
        headers=owner_headers,
    )
    cid = classify_res.json()["classification_id"]

    patch_res = client.patch(
        f"/api/v1/vision/classifications/{cid}",
        json={"accepted": True},
        headers=other_headers,
    )
    assert patch_res.status_code == 404


# --- Robustez de la subida (auditoría: superficie de archivos) ----------------

def test_classify_rejects_non_image(client: TestClient):
    """Un archivo que no es imagen -> 415 (antes: 500 o basura clasificada)."""
    headers = _register_and_get_token(client, "vis_pdf@example.com")
    res = client.post(
        "/api/v1/vision/classify",
        files={"image": ("malware.pdf", b"%PDF-1.4 fake", "application/pdf")},
        data={"has_reference_object": "false"},
        headers=headers,
    )
    assert res.status_code == 415


def test_classify_rejects_empty_image(client: TestClient):
    headers = _register_and_get_token(client, "vis_empty@example.com")
    res = client.post(
        "/api/v1/vision/classify",
        files={"image": ("empty.jpg", b"", "image/jpeg")},
        data={"has_reference_object": "false"},
        headers=headers,
    )
    assert res.status_code == 422


def test_classify_rejects_oversized_image(client: TestClient):
    """Un archivo > 10 MB -> 413 sin cargarlo entero en RAM."""
    headers = _register_and_get_token(client, "vis_big@example.com")
    big = b"x" * (10 * 1024 * 1024 + 100)
    res = client.post(
        "/api/v1/vision/classify",
        files={"image": ("huge.jpg", big, "image/jpeg")},
        data={"has_reference_object": "false"},
        headers=headers,
    )
    assert res.status_code == 413
