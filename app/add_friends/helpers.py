from flask import current_app
import requests

from app.helpers.tokens import encrypt_token, decrypt_token


def get_received_requests(email):
    """Returns the received requests of the user"""
    endpoint = f"{current_app.config['FRIEND_CONNECTION_ENDPOINT']}/users/add_friends/received_requests/"

    data = {'email': email}
    token_data = {"token": f"{encrypt_token(data)}"}

    # Send a GET request with the token in the headers
    response = requests.get(endpoint, params=token_data)
    received_requests = []
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        if token:
            data = decrypt_token(token)

        received_requests = data.get('data')

    received_requests = [] if received_requests is None else received_requests
    return received_requests


def get_sent_requests(email):
    """Returns the received requests of the user"""
    endpoint = f"{current_app.config['FRIEND_CONNECTION_ENDPOINT']}/users/add_friends/sent_requests/"

    data = {'email': email}
    token_data = {"token": f"{encrypt_token(data)}"}

    # Send a GET request with the token in the headers
    response = requests.get(endpoint, params=token_data)
    sent_requests = []
    if response.status_code == 200:
        data = response.json()
        token = data.get('token')
        if token:
            data = decrypt_token(token)

        sent_requests = data.get('data')

    sent_requests = [] if sent_requests is None else sent_requests
    return sent_requests


def get_user_friends(email):
    """Get a list of user friends"""
    endpoint = f"{current_app.config['FRIEND_CONNECTION_ENDPOINT']}/users/user_details/friend_list/"

    data = {'email': email}
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

    return friend_list
