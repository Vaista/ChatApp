from flask import Blueprint, current_app, jsonify, request
import requests

from app.helpers.auth_helpers import login_required, current_user
from app.helpers.tokens import encrypt_token, decrypt_token


# Defining a blueprint
add_friend_bp = Blueprint(
    'add_friends_bp', __name__
)


@add_friend_bp.route('/search/', methods=['POST'])
@login_required
def search_users():
    """Search Users on the basis of search query"""
    items_per_page = 10
    page = request.form.get('page')
    if page is None:
        page = 1
    else:
        page = int(page)
    search_query = request.form.get('search_query')
    if search_query:
        endpoint = f"{current_app.config['FRIEND_CONNECTION_ENDPOINT']}/users/user_list/search/"
        token_data = {"token": f"{encrypt_token({'search_query': search_query})}"}
        response = requests.get(endpoint, params=token_data)

        data = {}
        # Send a GET request
        if response.status_code == 200:
            token = response.json().get('data')
            if token:
                data = decrypt_token(token)

        start_idx = (page - 1) * items_per_page
        end_idx = start_idx + items_per_page
        paginated_data = data['data'][start_idx:end_idx]

        # Remove the user search result of they are the logged-in user
        for ind in reversed(range(len(paginated_data))):
            if paginated_data[ind]['email'] == current_user.email:
                paginated_data.pop(ind)

        # Determine if there are more items to load
        has_more = end_idx < len(data['data'])

        return_data = {
            'data': paginated_data,
            'has_more': has_more
        }

        return jsonify({'status': 'success', 'data': return_data}), 200
    return jsonify({'error': 'empty_search'}), 400


@add_friend_bp.route('/send_request/', methods=['POST'])
@login_required
def send_request():
    """Send Friend Request to the users"""
    email_id = request.form.get('email_id')
    if email_id is None:
        return jsonify({'status': 'error', 'reason': 'email not provided'}), 400

    data = {
        'receiver_email': email_id.strip(),
        'sender_email': current_user.email
    }

    endpoint = f"{current_app.config['FRIEND_CONNECTION_ENDPOINT']}/users/add_friends/send_request/"
    token_data = {"token": f"{encrypt_token(data)}"}
    response = requests.post(endpoint, params=token_data)

    return jsonify({'status': 'success'})


@add_friend_bp.route('/delete_request/', methods=['POST'])
@login_required
def delete_requests():
    """Delete sent friend requests"""
    email_id = request.form.get('email_id')
    if email_id is None:
        return jsonify({'status': 'error', 'reason': 'email not provided'}), 400

    data = {
        'email1': email_id.strip(),
        'email2': current_user.email
    }

    endpoint = f"{current_app.config['FRIEND_CONNECTION_ENDPOINT']}/users/add_friends/delete_request/"
    token_data = {"token": f"{encrypt_token(data)}"}
    response = requests.post(endpoint, params=token_data)

    return jsonify({'status': 'success'})


@add_friend_bp.route('/accept_request/', methods=['POST'])
def accept_request():
    """Accept the received Friend Request"""
    email_id = request.form.get('email_id')
    if email_id is None:
        return jsonify({'status': 'error', 'reason': 'email not provided'}), 400

    data = {
        'email1': email_id.strip(),
        'email2': current_user.email
    }

    endpoint = f"{current_app.config['FRIEND_CONNECTION_ENDPOINT']}/users/add_friends/accept_request/"
    token_data = {"token": f"{encrypt_token(data)}"}
    response = requests.post(endpoint, params=token_data)

    return jsonify({'status': 'success'})
