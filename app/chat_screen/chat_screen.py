from flask import Blueprint, render_template


# Defining a blueprint
chat_screen_bp = Blueprint(
    'chat_screen_bp', __name__,
    template_folder='templates',
    static_folder='static'
)


@chat_screen_bp.route('/')
def chat_home():
    return render_template('chat_screen.html')
