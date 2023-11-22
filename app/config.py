from dotenv import load_dotenv
import os


load_dotenv()

env = os.getenv('ENV', 'Production').strip().lower()


class Config(object):
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET').strip()
    CHAT_APP_TOKEN = os.environ.get('CHAT_APP_TOKEN').strip()
    PROJECT_SECRET = os.environ.get('PROJECT_SECRET').strip()
    AUTH_ENDPOINT = os.environ.get('AUTH_ENDPOINT').strip()
    FRIEND_CONNECTION_ENDPOINT = os.environ.get('FRIEND_CONNECTION_ENDPOINT').strip()
    DB_NAME = os.environ.get('DB_NAME', 'ChatApp').strip()
    DB_HOST = os.environ.get('DB_HOST', 'localhost').strip()
    DB_PORT = int(os.environ.get('DB_PORT', 27017).strip())
    DB_ALIAS = os.environ.get('DB_ALIAS', 'default').strip()
    SESSION_TYPE = os.environ.get('SESSION_TYPE').strip().lower()


class ProductionConfig(Config):
    pass


class DevelopmentConfig(Config):
    DEBUG = True


if env == 'Production':
    app_config = ProductionConfig
else:
    app_config = DevelopmentConfig
