from app.database.database import reconnect
from app.database.models import ConnectedUser
from celery import shared_task
from datetime import datetime, timedelta
import pytz


USER_INACTIVE_TIMEOUT = timedelta(minutes=5)


@shared_task
@reconnect
def delete_idle_sessions():
    """Delete idle sessions from ConnectedUser Collection in the database"""
    current_time = datetime.now(tz=pytz.utc)

    for connected_user in ConnectedUser.objects:
        last_activity = connected_user.user.last_active
        last_activity = last_activity.replace(tzinfo=pytz.timezone('UTC'))

        if current_time - last_activity > USER_INACTIVE_TIMEOUT:
            # Remove the disconnected user from MongoDB
            ConnectedUser.remove_connected_user(connected_user.socket_id)
            print(f"Inactive user removed. Socket ID: {connected_user.socket_id}")
