from flask import Blueprint, render_template

from app.helpers.auth_helpers import login_required


# Defining a blueprint
chat_screen_bp = Blueprint(
    'chat_screen_bp', __name__,
    template_folder='templates',
    static_folder='static'
)


@chat_screen_bp.route('/')
@login_required
def chat_home():
    return render_template('chat_screen.html')
