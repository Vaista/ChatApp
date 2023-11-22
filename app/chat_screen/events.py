from app.chat_screen.socket_extension import socketio
from app.helpers.auth_helpers import login_required
from flask import session, request
from flask_socketio import join_room, leave_room
from app.chat_screen.helpers import get_chat_list
from app.database.models import ChatGroup, User, Message, ConnectedUser


@socketio.on('connect')
@login_required
def handle_connect():
    print('Client connected')


@socketio.on('disconnect')
def handle_disconnect():
    """Handle Socket.IO disconnect event"""
    user_sid = request.sid

    # Remove the disconnected user from MongoDB
    ConnectedUser.remove_connected_user(user_sid)

    print(f"User disconnected. Socket ID: {user_sid}")


@socketio.on('join')
@login_required
def handle_join(data):
    """Join Chat Room"""
    chat_id = data.get('chatId')
    email = session['email']
    if chat_id is None:
        chat_id = ChatGroup.fetch_recent_chat_id(email)

    previous_chat_id = data.get('previousChatId')
    if previous_chat_id is not None:
        leave_room(request.sid)

    join_room(request.sid)
    print(f'Client joined room: {chat_id}')

    # Emit the 'chatList' event to the specific socket ID
    socketio.emit('chatList', {'chatList': get_chat_list(email), 'chatId': str(chat_id), 'source': 'join'},
                  room=request.sid)

    # Save connected user to MongoDB using the ConnectedUser model
    ConnectedUser.create_connected_user(request.sid, email, chat_id)

    # Emit the 'chatMessages' event to the specific socket ID
    socketio.emit('chatMessages', {'messages': Message.fetch_messages(chat_id, email), 'chat_id': str(chat_id)},
                  room=request.sid)

    # Mark the messages as read
    Message.mark_chat_read(str(chat_id), email)


@socketio.on('sendMessage')
@login_required
def handle_send_message(data):
    """Sending Message through SocketIO"""
    chat_group_id = data.get('chat_id')

    room = request.sid

    message_content = data.get('message')

    sender = User.fetch_user(session['email'])
    chat_group = ChatGroup.fetch_group_by_id(chat_group_id)

    if sender and chat_group:
        # Save the message
        message = Message.save_message(sender=sender, chat_group=chat_group, content=message_content)
        ChatGroup.update_last_activity(chat_group_id)

        # Update the chat list and unread count for all participants
        for connected_user in ConnectedUser.fetch_connected_users(chat_group):
            participant_email = connected_user.user.email

            # Emit the message to all participants in the room
            socketio.emit('message', {'message': message_content,
                                      'sender': sender.email,
                                      'chat_id': chat_group_id,
                                      'message_id': str(message.id),
                                      'timestamp': message.timestamp.strftime('%b %d, %Y %I:%M %p')},
                          room=connected_user.socket_id)

            # Emit the 'chatList' event for each participant
            socketio.emit('chatList', {'chatList': get_chat_list(participant_email),
                                       'chatId': chat_group_id,
                                       'source': 'send_message'}, room=connected_user.socket_id)


@socketio.on('mark-as-read')
@login_required
def handle_mark_msg_read(data):
    """Mark message as read for the user"""
    message_id = data.get('message_id')
    email = data.get('email')
    if message_id and email:
        Message.mark_message_read(message_id, email)
