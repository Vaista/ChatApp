from gevent import monkey
monkey.patch_all()

from flask import Flask, redirect, url_for
from flask_cors import CORS

from app.database.database import initialize_db, close_db

from app.user_auth import login, signup, logout
from app.chat_screen import chat_screen
from app.add_friends import add_friends, user_friends
from app.helpers.auth_helpers import current_user, login_required, redirect_logged_in_users

from app.chat_screen.events import socketio
from app.extensions.celery_ext import celery_init_app
from app.tasks.celery_run import run_scheduled_tasks


def create_app():
    """Function for creating a new flask app"""
    app = Flask(__name__)
    CORS(app)

    app.config.from_object('app.config.app_config')

    app.debug = app.config['DEBUG']

    # Initialize Database
    initialize_db(app)

    # Register the context processor
    @app.context_processor
    def inject_user():
        return dict(current_user=current_user)

    # Registering Blueprints

    # Chat Screen Blueprints
    app.register_blueprint(chat_screen.chat_screen_bp, url_prefix='/chat')

    # Add Users Blueprint
    app.register_blueprint(add_friends.add_friend_bp, url_prefix='/users/add_friends')
    app.register_blueprint(user_friends.user_friends_bp, url_prefix='/users/friends')

    # User Authentication Blueprints
    app.register_blueprint(login.login_bp, url_prefix='/login')
    app.register_blueprint(signup.signup_bp, url_prefix='/signup')
    app.register_blueprint(logout.logout_bp, url_prefix='/logout')

    # Celery Initialization
    celery = celery_init_app(app)

    celery.autodiscover_tasks(run_scheduled_tasks)

    @app.route('/')
    def home():
        """Home route, redirected to Chat page"""
        return redirect(url_for('chat_screen_bp.chat_home'))

    # Register teardown function
    # @app.teardown_appcontext
    # def teardown_db(exception=None):
    #     close_db(exception)

    # Initialize Socket-IO
    socketio.init_app(app, async_mode='gevent')

    return app
