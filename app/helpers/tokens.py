from flask import current_app
import jwt


def encrypt_token(data):
    """Encrypt the data to JWT Token"""
    encoded_jwt = jwt.encode(data, current_app.config.get('PROJECT_SECRET'), algorithm="HS256")

    return encoded_jwt


def decrypt_token(received_token):
    """Decrypt the token and return data"""
    # Get JWT Token
    token = received_token
    if not token:
        # If token is missing
        return None
    # Decode the JWT Token with Project Secret Key
    data = jwt.decode(token, current_app.config.get('PROJECT_SECRET'), algorithms=["HS256"])
    return data
