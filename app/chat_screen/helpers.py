from datetime import datetime
from app.database.models import ChatGroup, Message, User
import pytz


def calculate_time_ago(from_datetime):
    """Calculate the amount of time passed from given time till now"""
    from_datetime = from_datetime.replace(tzinfo=pytz.timezone('UTC'))
    to_datetime = datetime.now(pytz.timezone('UTC'))

    delta = to_datetime - from_datetime
    seconds = delta.total_seconds()

    if seconds < 0:
        text_response = "In the future"
    elif seconds < 60:
        text_response = "Just now"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        text_response = "{} minute{} ago".format(minutes, "s" if minutes > 1 else "")
    elif seconds < 86400:
        hours = int(seconds // 3600)
        text_response = "{} hour{} ago".format(hours, "s" if hours > 1 else "")
    elif seconds < 31536000:
        days = int(seconds // 86400)
        text_response = "{} day{} ago".format(days, "s" if days > 1 else "")
    else:
        years = int(seconds // 31536000)
        text_response = "{} year{} ago".format(years, "s" if years > 1 else "")

    return text_response


def fetch_chat_group_name(group, active_user):
    """Returns the name of chat to be rendered on the basis of the type of chat"""
    if group.type == 'one-on-one':
        participants = group.participants
        group_name = None
        for participant in participants:
            if participant.email.strip() != active_user.email.strip():
                group_name = f'{participant.first_name.title()} {participant.last_name.title()}'
    else:
        group_name = group.name.title()
    return group_name


def fetch_user_last_active(group, active_user):
    """Returns the name of chat to be rendered on the basis of the type of chat"""
    if group.type == 'one-on-one':
        participants = group.participants
        is_active = None
        for participant in participants:
            if participant.email.strip() != active_user.email.strip():
                time_active = participant.last_active.replace(tzinfo=pytz.timezone('UTC')).astimezone(pytz.timezone('Asia/Kolkata'))
                time_passed = (datetime.now(tz=pytz.timezone('Asia/Kolkata')) - time_active).seconds
                if time_passed < 180:
                    is_active = 'true'
                else:
                    is_active = 'false'
    else:
        is_active = 'group'
    return is_active


def get_chat_list(email):
    """Get the Chat List to be rendered to the screen in the requested format"""
    user = User.fetch_user(email)
    chat_list = []
    user_chats = ChatGroup.fetch_all_chat_groups(email)
    for chat in user_chats:
        last_message = Message.fetch_last_message(chat)
        unread_message_count = Message.fetch_unread_count(chat, email)
        chat_list.append({
            'id': str(chat.id),
            'name': fetch_chat_group_name(chat, user),
            'message': last_message,
            'unread_count': unread_message_count,
            'last_activity': calculate_time_ago(chat.last_activity),
            'is_active': fetch_user_last_active(chat, user)
        })
    return chat_list
