from flask import Blueprint, render_template, current_app, flash, redirect, url_for
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
                print(user_data)

                # Redirect to home page
                return redirect(url_for('chat_screen_bp.chat_home'))

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
                elif error_data['reason'] == 'email missing':
                    form.email.errors.append('Email is missing.')

            except Exception as e:
                print(e)

    context = {'form': form}
    return render_template('login.html', **context)


