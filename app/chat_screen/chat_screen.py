from flask import Blueprint, render_template, current_app
import requests

from app.helpers.auth_helpers import login_required
from app.helpers.tokens import decrypt_token


# Defining a blueprint
chat_screen_bp = Blueprint(
    'chat_screen_bp', __name__,
    template_folder='templates',
    static_folder='static'
)


@chat_screen_bp.route('/')
@login_required
def chat_home():
    endpoint = f"{current_app.config['FRIEND_CONNECTION_ENDPOINT']}/users/user_list/"

    # Send a GET request with the token in the headers
    response = requests.get(endpoint)
    if response.status_code == 200:
        token = response.json().get('data')
        if token:
            data = decrypt_token(token)
    return render_template('chat_screen.html')
