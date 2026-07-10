"""
Authentication module tests.
Tests for user registration, login, and token generation.
"""
import pytest
from fastapi import status


def test_register_new_user(client):
    """Test successful user registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "Password123!",
            "first_name": "New",
            "last_name": "User",
            "phone_number": "+1234567890",
            "user_type": "client"
        },
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data


def test_register_duplicate_email(client, test_user):
    """Test registration with duplicate email fails."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email,  # Use existing user email
            "password": "securepass123",
            "first_name": "Another",
            "last_name": "User",
        },
    )
    
    assert response.status_code == status.HTTP_409_CONFLICT


def test_login_success(client, test_user):
    """Test successful login with correct credentials."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword123",
        },
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "expires_in" in data


def test_login_wrong_password(client, test_user):
    """Test login with wrong password fails."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "wrongpassword",
        },
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_login_nonexistent_user(client):
    """Test login with non-existent user fails."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "anypassword",
        },
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_current_user(client, test_user):
    """Test getting current user info with valid token."""
    # First login to get token
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword123",
        },
    )
    
    token = login_response.json()["access_token"]
    
    # Get current user
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == test_user.email
    assert data["first_name"] == test_user.first_name
    assert data["last_name"] == test_user.last_name


def test_get_current_user_without_token(client):
    """Test getting current user without token fails."""
    response = client.get("/api/v1/auth/me")
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_register_new_carrier(client):
    """Test successful carrier registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "carrier2@example.com",
            "password": "Password123!",
            "first_name": "New",
            "last_name": "Carrier",
            "phone_number": "+1234567890",
            "user_type": "carrier"
        },
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["user"]["user_type"] == "carrier"


def test_forgot_and_reset_password_flow(client, test_user):
    """Test the complete forgot and reset password flow."""
    # 1. Request forgot password
    # By default, tests don't run in debug mode, but we can check if it returns 200
    forgot_response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": test_user.email}
    )
    assert forgot_response.status_code == status.HTTP_200_OK
    
    # We need the token. In debug mode, it's returned. Let's enable debug for the test.
    from src.app.core.config import settings
    original_debug = settings.debug
    settings.debug = True
    
    try:
        forgot_response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": test_user.email}
        )
        assert forgot_response.status_code == status.HTTP_200_OK
        token = forgot_response.json()["debug_token"]
        assert token is not None

        # 2. Reset password using the token
        reset_response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": token,
                "new_password": "NewSecurePassword123!"
            }
        )
        assert reset_response.status_code == status.HTTP_200_OK

        # 3. Verify we can login with the NEW password
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "NewSecurePassword123!"
            }
        )
        assert login_response.status_code == status.HTTP_200_OK
        
        # 4. Verify we CANNOT login with the OLD password
        old_login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "testpassword123"
            }
        )
        assert old_login_response.status_code == status.HTTP_401_UNAUTHORIZED
    finally:
        settings.debug = original_debug
