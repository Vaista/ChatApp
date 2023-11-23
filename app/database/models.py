from mongoengine import Document, StringField, DateTimeField, ReferenceField, ListField, Q

from datetime import datetime
from dotenv import load_dotenv
import os
import pytz

from app.database.database import reconnect


load_dotenv()

alias = os.environ.get('DB_ALIAS')


class User(Document):
    """Model for User"""
    email = StringField(required=True, unique=True)
    first_name = StringField(required=True)
    last_name = StringField(required=True)
    created_on = DateTimeField(default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    last_active = DateTimeField(default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

    meta = {"db_alias": alias, "collection": "user"}

    @staticmethod
    @reconnect
    def create_user(email, first_name, last_name):
        """Saving the user to the MongoDB Database"""
        user = User.objects(email=email)
        if len(user) == 0:
            User(email=email.strip(), first_name=first_name.strip(), last_name=last_name.strip()).save()

    @staticmethod
    @reconnect
    def fetch_user(email):
        """Fetching the user as per email address"""
        user = User.objects(email=email)
        if len(user) > 0:
            return user[0]

    @staticmethod
    @reconnect
    def update_last_active(email):
        """Update the last active time of user"""
        user = User.fetch_user(email)
        if user is not None:
            user.last_active = datetime.now(pytz.timezone('Asia/Kolkata'))
            user.save()


class ChatGroup(Document):
    """Model for chat group"""
    name = StringField(required=True)
    type = StringField(choices=("one-on-one", "group"), required=True)
    participants = ListField(ReferenceField(User, reverse_delete_rule=4), default=[])
    created_on = DateTimeField(default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    last_activity = DateTimeField(default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))

    meta = {"db_alias": alias, "collection": "chat_group"}

    @staticmethod
    @reconnect
    def create_one_on_one_chat(email1=None, email2=None):
        """Create the chat group on the basis of participant email and type. Creates a chat group, if not exist"""
        if email1 is None or email2 is None:
            return
        user1 = User.objects(email=email1).first()
        user2 = User.objects(email=email2).first()
        if user1 is not None and user2 is not None:
            # Check if a chat group already exists for the one-on-one chat
            existing_chat = ChatGroup.objects(participants__all=[user1, user2], type="one-on-one").first()

            if existing_chat:
                # Use the existing chat group
                return existing_chat
            else:
                # Create a new chat group for the one-on-one chat
                new_chat = ChatGroup(name="One-on-One Chat", type="one-on-one", participants=[user1, user2])
                new_chat.save()
                return new_chat

    @staticmethod
    @reconnect
    def fetch_all_chat_groups(email=None):
        """Fetches all the recent chat groups"""
        if email is None:
            return
        user = User.objects(email=email).first()
        if user is not None:
            chat_groups = ChatGroup.objects(participants=user).order_by('-last_activity')
            return chat_groups

    @staticmethod
    @reconnect
    def fetch_recent_chat_id(email=None):
        """Fetch the chat group id of latest chat"""
        if email is None:
            return
        user = User.objects(email=email).first()
        if user is not None:
            chat_group = ChatGroup.objects(participants=user).order_by('-last_activity').first()
            return chat_group.id

    @staticmethod
    @reconnect
    def fetch_group_by_id(chat_id):
        """Fetch chat group by ID"""
        chat = ChatGroup.objects.get(id=chat_id)
        if chat is None:
            return None
        return chat

    @staticmethod
    @reconnect
    def update_last_activity(chat_id):
        """Update the last activity of the chat"""
        chat = ChatGroup.objects.get(id=chat_id)
        if chat is not None:
            chat.last_activity = datetime.now(pytz.timezone('Asia/Kolkata'))
            chat.save()


class Message(Document):
    """Model for chat messages"""
    sender = ReferenceField(User, required=True)
    chat_group = ReferenceField(ChatGroup, required=True)
    content = StringField(required=True)
    timestamp = DateTimeField(default=lambda: datetime.now(pytz.timezone('Asia/Kolkata')))
    read = ListField(ReferenceField(User, reverse_delete_rule=4), default=[])

    meta = {"db_alias": alias, "collection": "message"}

    @staticmethod
    @reconnect
    def save_message(sender, chat_group, content):
        """Saving new messages"""
        message = Message(sender=sender, chat_group=chat_group, content=content.strip())
        message.save()
        return message

    @staticmethod
    @reconnect
    def fetch_last_message(chat_group):
        """Fetch the last message in a chat group"""
        message = Message.objects(chat_group=chat_group).order_by('-timestamp').first()
        message = '' if message is None else message.content
        return message

    @staticmethod
    @reconnect
    def fetch_messages(chat_group_id, email, max_timestamp=None, item_count=20):
        """Fetch the messages in a chat group"""
        user = User.fetch_user(email)
        chat_group = ChatGroup.objects.get(id=chat_group_id)
        if max_timestamp is None:
            messages = Message.objects(chat_group=chat_group).order_by('-timestamp').limit(
                int(item_count))
        else:
            messages = Message.objects(chat_group=chat_group, timestamp__lt=max_timestamp).order_by('-timestamp').limit(
                int(item_count))
        messages = sorted(messages, key=lambda x: x.timestamp)
        return_data = []
        for msg in messages:
            sent_time = msg.timestamp.replace(tzinfo=pytz.timezone('UTC')).astimezone(pytz.timezone('Asia/Kolkata'))
            data = {
                'sender': msg.sender.email, 'content': msg.content,
                'timestamp': sent_time.strftime('%b %d, %Y %I:%M %p'),
                'str_timestamp': str(msg.timestamp),
                'read': user in msg.read
            }
            return_data.append(data)
        return return_data

    @staticmethod
    @reconnect
    def fetch_unread_count(chat_group, email):
        """Fetch unread message count"""
        user = User.objects(email=email).first()
        if user is None:
            return
        # Query for unread messages in the specified chat_group for the participant
        unread_messages = Message.objects(
            Q(chat_group=chat_group) &
            Q(read__ne=user)
        )

        # Count the number of unread messages
        unread_message_count = unread_messages.count()

        return unread_message_count

    @staticmethod
    @reconnect
    def mark_chat_read(chat_group_id, email):
        """Mark messages as read for the user"""
        user = User.fetch_user(email)
        chat = ChatGroup.fetch_group_by_id(chat_group_id)
        messages = Message.objects(chat_group=chat)
        for msg in messages:
            if user not in msg.read:
                msg.read.append(user)
                msg.save()

    @staticmethod
    @reconnect
    def mark_message_read(message_id, email):
        """Mark a message read for the user"""
        user = User.fetch_user(email)
        message = Message.objects(id=message_id).first()
        if user not in message.read:
            message.read.append(user)
            message.save()


class ConnectedUser(Document):
    socket_id = StringField(required=True)
    user = ReferenceField(User)
    chat_group = ReferenceField(ChatGroup)

    meta = {"db_alias": alias, "collection": "connected_users"}

    @staticmethod
    @reconnect
    def fetch_connected_users(chat_group):
        """Fetch connected users to a chat group"""
        return ConnectedUser.objects(chat_group=chat_group)

    @staticmethod
    @reconnect
    def create_connected_user(socket_id, user_email, chat_group_id):
        user = User.objects(email=user_email).first()
        chat_group = ChatGroup.objects(id=chat_group_id).first()

        if user and chat_group:
            ConnectedUser.objects(socket_id=socket_id, user=user, chat_group=chat_group).delete()
            ConnectedUser(socket_id=socket_id, user=user, chat_group=chat_group).save()

    @staticmethod
    @reconnect
    def remove_connected_user(socket_id):
        connected_user = ConnectedUser.objects(socket_id=socket_id).first()
        if connected_user:
            connected_user.delete()
