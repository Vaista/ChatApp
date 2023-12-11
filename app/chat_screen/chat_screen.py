from flask import Blueprint, render_template, current_app, request, jsonify
import requests
import json

from app.helpers.auth_helpers import login_required, current_user
from app.helpers.tokens import encrypt_token, decrypt_token
from app.add_friends.helpers import get_received_requests
from app.database.models import User, ChatGroup, Message


# Defining a blueprint
chat_screen_bp = Blueprint(
    'chat_screen_bp', __name__,
    template_folder='templates',
    static_folder='static'
)


@chat_screen_bp.route('/')
@login_required
def chat_home():
    """Renders the Chat Screen Home Page"""
    # Fetch received Requests
    received_requests = get_received_requests(email=current_user.email)

    endpoint = f"{current_app.config['FRIEND_CONNECTION_ENDPOINT']}/users/user_details/friend_list/"

    data = {'email': current_user.email}
    token_data = {"token": f"{encrypt_token(data)}"}

    # Send a GET request with the token in the headers
    response = requests.get(endpoint, params=token_data)
    friend_list = []
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        data = decrypt_token(token)
        friend_list = data.get('data')

    friend_list = [] if friend_list is None else friend_list

    context = {'received_requests': received_requests, 'friend_list': friend_list,
               'friend_list_emails': []}
    return render_template('chat_screen.html', **context)


@chat_screen_bp.route('/one-on-chat/new_chat/', methods=['POST'])
@login_required
def start_new_one_on_one_chat():
    """Start a new chat conversation"""
    email = request.form.get('email_id')
    ChatGroup.create_one_on_one_chat(current_user.email, email)
    return jsonify({'status': 'success'}), 200


@chat_screen_bp.route('/audio_video_call/rtc_offers/get_offer/')
@login_required
def fetch_rtc_offer():
    """Fetch RTC Offer for a call"""
    chat_id = request.args.get('chat_id')
    if chat_id:
        message = Message.fetch_last_call_in_chat(chat_id)
        caller_obj = message.sender
        caller = f'{caller_obj.first_name.title()} {caller_obj.last_name.title()}'
        return jsonify({'status': 'success', 'offer': json.loads(message.content), 'other_user': caller}), 200
