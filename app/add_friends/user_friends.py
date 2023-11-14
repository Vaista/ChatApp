from flask import Blueprint, jsonify, request, current_app
import requests

from app.helpers.auth_helpers import login_required, current_user
from app.add_friends.helpers import get_sent_requests, get_received_requests, get_user_friends, encrypt_token


# Defining a blueprint
user_friends_bp = Blueprint(
    'user_friends', __name__
)


@user_friends_bp.route('/sent_requests/')
@login_required
def get_user_sent_requests():
    """Fetch sent requests of the logged-in user"""

    sent_requests = get_sent_requests(current_user.email)

    res_type = request.args.get('response_type')

    if res_type == 'email':
        sent_requests = [x['email'] for x in sent_requests]

    return jsonify({'status': 'success', 'data': sent_requests}), 200


@user_friends_bp.route('/received_requests/')
@login_required
def get_user_received_requests():
    """Fetch sent requests of the logged-in user"""

    received_requests = get_received_requests(current_user.email)

    res_type = request.args.get('response_type')

    if res_type == 'email':
        received_requests = [x['email'] for x in received_requests]

    return jsonify({'status': 'success', 'data': received_requests}), 200


@user_friends_bp.route('/friend_list/')
@login_required
def get_user_friend_list():
    """Fetch sent requests of the logged-in user"""

    user_friends = get_user_friends(current_user.email)
    friends_email = []

    res_type = request.args.get('response_type')

    if res_type == 'email':
        friends_email = [x['email'] for x in user_friends]

    return jsonify({'status': 'success', 'user_friends': user_friends, 'friends_email': friends_email}), 200


@user_friends_bp.route('/remove_friend/', methods=['POST'])
@login_required
def remove_user_friend():
    """Remove user friend from friend list"""
    email_id = request.form.get('email_id')

    if email_id is None:
        return jsonify({'status': 'error', 'reason': 'email not provided'}), 400

    data = {
        'email1': email_id.strip(),
        'email2': current_user.email
    }

    endpoint = f"{current_app.config['FRIEND_CONNECTION_ENDPOINT']}/users/friends/delete_friend/"
    token_data = {"token": f"{encrypt_token(data)}"}
    response = requests.post(endpoint, params=token_data)

    return jsonify({'status': 'success'})
