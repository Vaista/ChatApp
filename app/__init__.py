from flask import Flask, redirect, url_for

from app.user_auth import login, signup
from app.chat_screen import chat_screen
from app.helpers.auth_helpers import current_user, login_required, redirect_logged_in_users


def create_app():
    """Function for creating a new flask app"""
    app = Flask(__name__)

    app.config.from_object('app.config.app_config')

    # Register the context processor
    @app.context_processor
    def inject_user():
        return dict(current_user=current_user)

    # Registering Blueprints

    # Chat Screen Blueprints
    app.register_blueprint(chat_screen.chat_screen_bp, url_prefix='/chat')

    # User Authentication Blueprints
    app.register_blueprint(login.login_bp, url_prefix='/login')
    app.register_blueprint(signup.signup_bp, url_prefix='/signup')

    @app.route('/')
    def home():
        """Home route, redirected to Chat page"""
        return redirect(url_for('chat_screen_bp.chat_home'))

    return app
