from flask import Blueprint, render_template, current_app, flash, redirect, url_for, make_response
from app.helpers.auth_helpers import current_user, redirect_logged_in_users
import jwt
import nh3
import requests

from .forms import LoginForm


# Defining a blueprint
login_bp = Blueprint(
    'login_bp', __name__,
    template_folder='templates',
    static_folder='static'
)


@login_bp.route('/', methods=['GET', 'POST'])
@redirect_logged_in_users
def login():
    """Renders the login page to the frontend"""
    form = LoginForm()

    flash_msg = 'An Error occurred while completing the requested action. Please try again later.'

    # check whether the form is valid:
    if form.validate_on_submit():
        email = nh3.clean_text(form.email.data).strip().lower()
        password = nh3.clean_text(form.password.data).strip()

        data = {
            "email": email,
            "password": password,
            "app_token": current_app.config.get('CHAT_APP_TOKEN')
        }

        encoded_jwt = {
            'data': jwt.encode(data, current_app.config.get('PROJECT_SECRET'), algorithm="HS256")
        }

        try:
            response = requests.get(f"{current_app.config.get('AUTH_ENDPOINT')}/user_auth/login/", params=encoded_jwt)
        except Exception as e:
            print(e)
            flash(flash_msg)
            return render_template('login.html', form=form)

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

                current_user.login_user(f_name, l_name, email)

                # Create a response object
                response = make_response(redirect(url_for('chat_screen_bp.chat_home')))

                # Save data to cookies
                response.set_cookie('token', token)

                # Send response / Redirect
                return response
            except Exception as e:
                flash(flash_msg)
                print(e)
        elif response.status_code == 500:
            flash(flash_msg)
        elif response.status_code == 400:
            try:
                error_data = response.json()
                error_data = error_data['data']
                if error_data['reason'] in ['token not provided', 'app token missing', 'invalid app token',
                                            'app inactive']:
                    flash(flash_msg)
                elif error_data['reason'] == 'user account inactive':
                    form.email.errors.append('The user account has been suspended. Please contact the helpdesk.')
                    form.password.errors.append('The user account has been suspended. Please contact the helpdesk.')
                elif error_data['reason'] == 'email missing':
                    form.email.errors.append('Email field cannot be left blank.')
                elif error_data['reason'] == 'password missing':
                    form.password.errors.append('Password field cannot be left blank')
                elif error_data['reason'] in ['user account not created', 'incorrect password']:
                    form.email.errors.append('Email and password do not match. Please verify and try again.')
                    form.password.errors.append('Email and password do not match. Please verify and try again.')

            except Exception as e:
                flash(flash_msg)
                print(e)

    context = {'form': form}
    return render_template('login.html', **context)

