from functools import wraps
from flask import redirect, url_for, request, current_app
import jwt
import requests


class CurrentUser:
    def __init__(self, first_name=None, last_name=None, email=None, is_logged_in=False):
        self.first_name = first_name
        self.last_name = last_name
        self.email = email
        self.is_logged_in = is_logged_in

    def login_user(self, first_name, last_name, email):
        """Change login status"""
        self.first_name = first_name.title()
        self.last_name = last_name.title()
        self.email = email.lower()
        self.is_logged_in = True

    def logout_user(self):
        """Logs user out"""
        self.first_name = None
        self.last_name = None
        self.email = None
        self.is_logged_in = False


current_user = CurrentUser()


def authenticate_user(user, token):
    """Function to authenticate the user. Returns true if the user is logged in."""

    data = {
        "user_token": token,
        "app_token": current_app.config.get('CHAT_APP_TOKEN')
    }

    encoded_jwt = {
        'data': jwt.encode(data, current_app.config.get('PROJECT_SECRET'), algorithm="HS256")
    }

    try:
        response = requests.get(f"{current_app.config.get('AUTH_ENDPOINT')}/user_auth/authenticate_user/",
                                params=encoded_jwt)

        if response.status_code == 200:
            try:
                # Fetch response data
                res = response.json()
                data = res.get('data')
                if data['status'] == 'token_expired':
                    return False
                token = data.get('token')
                if token:
                    # Decode the JWT Token with Project Secret Key
                    user_data = jwt.decode(token, current_app.config.get('PROJECT_SECRET'), algorithms=["HS256"])

                    email = user_data['email']
                    first_name = user_data['first_name']
                    last_name = user_data['last_name']

                    user.login_user(first_name, last_name, email)

                    return True
            except Exception as e:
                print(e)

    except Exception as e:
        print(e)

    return False


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.cookies.get('token')
        if not token or not authenticate_user(current_user, token):
            return redirect(url_for('login_bp.login'))
        return f(*args, **kwargs)
    return decorated_function


def redirect_logged_in_users(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.cookies.get('token')
        if token and authenticate_user(current_user, token):
            return redirect(url_for('chat_screen_bp.chat_home'))
        return f(*args, **kwargs)
    return decorated_function
