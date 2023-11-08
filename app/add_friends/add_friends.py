from flask import Blueprint, current_app, jsonify, request
import requests

from app.helpers.auth_helpers import login_required
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

        token_data = {
            "token": f"{encrypt_token({'search_query': search_query})}"
        }

        data = {}

        # Send a GET request
        response = requests.get(endpoint, params=token_data)
        if response.status_code == 200:
            token = response.json().get('data')
            if token:
                data = decrypt_token(token)

                # Test Data
                test_data = [{'email': 'test@email.com', 'first_name': 'Test', 'last_name': 'User'}]
                for x in range(20):
                    test_data.append(test_data[0])
                data['data'] = test_data

        start_idx = (page - 1) * items_per_page
        end_idx = start_idx + items_per_page
        paginated_data = data['data'][start_idx:end_idx]

        # Determine if there are more items to load
        has_more = end_idx < len(data['data'])
        print(has_more)

        return jsonify({'status': 'success', 'data': {'data': paginated_data, 'has_more': has_more}}), 200
    return jsonify({'error': 'empty_search'}), 400
