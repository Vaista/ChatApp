from app.tasks.idle_session import delete_idle_sessions
from celery import shared_task


@shared_task
def run_scheduled_tasks():
    """Run All the celery scheduled periodically repeating tasks"""
    delete_idle_sessions()
