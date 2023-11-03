from dotenv import load_dotenv
import os


load_dotenv()

env = os.getenv('ENV', 'production').strip().lower()


class Config(object):
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET').strip()
    CHAT_APP_TOKEN = os.environ.get('CHAT_APP_TOKEN').strip()
    PROJECT_SECRET = os.environ.get('PROJECT_SECRET').strip()
    AUTH_ENDPOINT = os.environ.get('AUTH_ENDPOINT').strip()


class ProductionConfig(Config):
    pass


class DevelopmentConfig(Config):
    DEBUG = True


if env == 'production':
    app_config = ProductionConfig
else:
    app_config = DevelopmentConfig
