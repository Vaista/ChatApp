from mongoengine import connect
from flask import current_app, g


def initialize_db(app):
    """Initialize the Database Connection"""

    with app.app_context():
        if 'connection' not in g:
            g.connection = connect(app.config['DB_NAME'],
                                   host=app.config['DB_HOST'],
                                   port=app.config['DB_PORT'],
                                   alias=app.config['DB_ALIAS']
                                   )

        return g.connection
    

def close_db(e=None):
    """Close the database connection"""
    connection = g.pop('connection', None)

    if connection is not None:
        connection.close()


def reconnect(func):
    """
    Decorator to reconnect to the database if a ServerSelectionTimeoutError occurs.
    """

    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            initialize_db(current_app)
            return func(*args, **kwargs)

    return wrapper
