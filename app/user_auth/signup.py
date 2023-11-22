from flask import Blueprint, render_template, current_app, flash, make_response, redirect, url_for
import jwt
import nh3
import requests

from app.database.models import User
from app.user_auth.forms import SignupForm
from app.helpers.auth_helpers import current_user, redirect_logged_in_users
from app.helpers.tokens import encrypt_token


# Defining a blueprint
signup_bp = Blueprint(
    'signup_bp', __name__,
    template_folder='templates',
    static_folder='static'
)


@signup_bp.route('/', methods=['GET', 'POST'])
@redirect_logged_in_users
def signup():
    """Renders the login page to the frontend"""
    form = SignupForm()

    flash_msg = 'An Error occurred while completing the requested action. Please try again later.'
    # check whether the form is valid:
    if form.validate_on_submit():
        first_name = nh3.clean_text(form.first_name.data).strip().title()
        last_name = nh3.clean_text(form.last_name.data).strip().title()
        email = nh3.clean_text(form.email.data).strip().lower()
        password = nh3.clean_text(form.password1.data).strip()

        data = {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": password,
            "app_token": current_app.config.get('CHAT_APP_TOKEN')
        }

        encoded_jwt = {
            'data': jwt.encode(data, current_app.config.get('PROJECT_SECRET'), algorithm="HS256")
        }

        try:
            response = requests.get(f"{current_app.config.get('AUTH_ENDPOINT')}/user_auth/signup/", params=encoded_jwt)
        except Exception as e:
            print(e)
            flash(flash_msg)
            return render_template('signup.html', form=form)

        if response.status_code == 200:
            try:
                # Fetch response data
                res = response.json()
                data = res.get('data')
                token = data.get('token')
                if not token:
                    # If token is missing
                    flash(flash_msg)
                # Decode the JWT Token with Project Secret Key
                user_data = jwt.decode(token, current_app.config.get('PROJECT_SECRET'), algorithms=["HS256"])

                token = user_data['token']
                email = user_data['email']
                f_name = user_data['first_name']
                l_name = user_data['last_name']

                # Save the data in neo4j
                endpoint = f"{current_app.config['FRIEND_CONNECTION_ENDPOINT']}/users/create/"
                data = {
                    'email': email,
                    'first_name': f_name,
                    'last_name': l_name
                }

                token_data = {
                    "token": f"{encrypt_token(data)}"
                }

                response = requests.post(endpoint, json=token_data)

                # Save the data in mongodb
                User.create_user(email=email, first_name=f_name, last_name=l_name)

                # Logs the user in
                current_user.login_user(f_name, l_name, email)

                # Create a response object
                response = make_response(redirect(url_for('chat_screen_bp.chat_home')))

                # Save data to cookies
                response.set_cookie('token', token)

                # Send response / Redirect
                return response
            except Exception as e:
                print(e)
        elif response.status_code == 500:
            flash(flash_msg)
        elif response.status_code == 400:
            try:
                error_data = response.json()
                error_data = error_data['data']
                if error_data['reason'] == 'token not provided':
                    flash(flash_msg)
                elif error_data['reason'] == 'invalid app token':
                    flash(flash_msg)
                elif error_data['reason'] == 'first name missing':
                    form.first_name.errors.append('First Name is missing.')
                elif error_data['reason'] == 'last name missing':
                    form.last_name.errors.append('Last Name is missing.')
                elif error_data['reason'] == 'email missing':
                    form.email.errors.append('Email is missing.')
                elif error_data['reason'] == 'invalid email':
                    form.email.errors.append('Invalid email provided. Please check and try again.')
                elif error_data['reason'] == 'password missing':
                    form.password1.errors.append('Password is missing.')
                elif error_data['reason'] == 'invalid password':
                    form.password1.errors.append(
                        'Password should be min. 8 characters long, containing at least 1 lowercase, 1 uppercase, '
                        '1 numeric and 1 special character.')
                elif error_data['reason'] == 'account already exists':
                    form.email.errors.append('The email entered is already taken. Login instead!')
            except Exception as e:
                print(e)

    context = {'form': form}
    return render_template('signup.html', **context)


