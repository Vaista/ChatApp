from flask import Blueprint, current_app, redirect, url_for, make_response, request
from app.helpers.auth_helpers import current_user, login_required
import jwt
import requests


# Defining a blueprint
logout_bp = Blueprint(
    'logout_bp', __name__
)


@logout_bp.route('/')
@login_required
def logout():
    """Logout the logged-in users"""
    current_user.logout_user()

    token = request.cookies.get('token')

    data = {
        "user_token": token,
        "app_token": current_app.config.get('CHAT_APP_TOKEN')
    }

    encoded_jwt = {
        'data': jwt.encode(data, current_app.config.get('PROJECT_SECRET'), algorithm="HS256")
    }

    try:
        response = requests.get(f"{current_app.config.get('AUTH_ENDPOINT')}/user_auth/logout_user/",
                                params=encoded_jwt)
    except Exception as e:
        print(e)

    # Create a response object
    response = make_response(redirect(url_for('login_bp.login')))

    # Save data to cookies
    response.set_cookie('token', '', expires=0)

    # Send response / Redirect
    return response
