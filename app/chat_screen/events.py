from datetime import datetime
from flask import session, request
from flask_socketio import join_room, leave_room
import json

from app.chat_screen.helpers import get_chat_list
from app.extensions.socket_ext import socketio
from app.database.models import ChatGroup, User, Message, ConnectedUser
from app.helpers.auth_helpers import login_required


MESSAGES_PER_PAGE = 20


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

    # Update last active time of user
    User.update_last_active(email)

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

    messages = Message.fetch_messages(chat_id, email, max_timestamp=None, item_count=MESSAGES_PER_PAGE)

    # Emit the 'chatMessages' event to the specific socket ID
    socketio.emit('chatMessages', {'messages': messages, 'chat_id': str(chat_id)},
                  room=request.sid)

    # Mark the messages as read
    Message.mark_chat_read(str(chat_id), email)


@socketio.on('fetch-more-messages')
@login_required
def fetch_more_paginated_messages(data):
    """Fetch more paginated messages for a chat"""
    chat_id = data.get('chatId')
    email = session.get('email')

    # Update last active time of user
    User.update_last_active(email)

    oldest_msg_time = data.get('oldest_msg_time')
    if oldest_msg_time is not None:
        oldest_msg_time = datetime.strptime(oldest_msg_time, '%Y-%m-%d %H:%M:%S.%f')
        messages = Message.fetch_messages(chat_id, email, max_timestamp=oldest_msg_time, item_count=MESSAGES_PER_PAGE)
        socketio.emit('more_messages', {'messages': messages, 'chat_id': str(chat_id)},
                      room=request.sid)


@socketio.on('sendMessage')
@login_required
def handle_send_message(data):
    """Sending Message through SocketIO"""
    chat_group_id = data.get('chat_id')

    message_content = data.get('message')
    message_content = message_content.strip() if message_content is not None else message_content
    email = session['email']

    # Update last active time of user
    User.update_last_active(email)

    sender = User.fetch_user(email)
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
    message_id = data.get('message_id').strip()
    email = data.get('email').strip()
    if message_id and email:
        Message.mark_message_read(message_id, email)


@socketio.on('refresh-chat-list')
@login_required
def refresh_chat_list(data):
    email = data.get('email').strip()
    chat_id = data.get('chat_id').strip()

    # Emit the 'chatList' event to the specific socket ID
    socketio.emit('chatList', {'chatList': get_chat_list(email), 'chatId': str(chat_id), 'source': 'refresh_chat_list'},
                  room=request.sid)


# Call Events

@socketio.on('initiateCall')
@login_required
def handle_initiate_call(data):
    """Initiating a call event"""
    caller_email = data.get('caller').strip()
    caller = User.fetch_user(caller_email)
    chat_id = data.get('chat_id')
    call_type = data.get('type').strip()
    action = data.get('call_type').strip()
    if call_type != 'audio':
        call_type = 'video'
    offer = data.get('offer')
    connected_users = ChatGroup.fetch_group_participants(chat_id)
    for user in connected_users:
        if user.email != caller_email:
            for connection in ConnectedUser.fetch_sockets_for_users(user):
                if action != 'renegotiate':
                    socketio.emit('incomingCall', {
                        'type': call_type,
                        'caller_name': f'{caller.first_name} {caller.last_name}',
                        'chat_id': chat_id,
                        'offer': offer
                    }, room=connection.socket_id)
                else:
                    socketio.emit('acceptNegotiation', {
                        'type': call_type,
                        'caller_name': f'{caller.first_name} {caller.last_name}',
                        'chat_id': chat_id,
                        'offer': offer
                    }, room=connection.socket_id)
    if action != 'renegotiate':
        chat_group = ChatGroup.fetch_group_by_id(chat_id)
        Message.initiate_call(caller, chat_group, call_type, json.dumps(offer))
        print('initiating a call event')


@socketio.on('phone-line-busy')
@login_required
def handle_phone_line_busy(data):
    """Handle the phone line of callee being busy"""
    chat_id = data.get('chat_id')
    email = data.get('user_email')
    connected_users = ChatGroup.fetch_group_participants(chat_id)
    for user in connected_users:
        if user.email != email:
            for connection in ConnectedUser.fetch_sockets_for_users(user):
                socketio.emit('phoneLineBusy', room=connection.socket_id)


@socketio.on('answer-call')
@login_required
def handle_call_answered_by_callee(data):
    """Handle Call Answered. Emit the answer back to caller"""
    chat_id = data.get('chat_id')
    action = data.get('action')
    chat_group = ChatGroup.fetch_group_by_id(chat_id)
    callee = ''
    for user in chat_group.participants:
        if user.email != session['email']:
            callee = f'{user.first_name} {user.last_name}'
    data['other_user'] = callee
    if action != 'renegotiate':
        Message.update_call_status(chat_id, 'ongoing')
    call = Message.fetch_last_call_in_chat(chat_id)
    caller = call.sender
    for connection in ConnectedUser.fetch_sockets_for_users(caller):
        socketio.emit('callGotAnswered', data, room=connection.socket_id)


@socketio.on('newIceCandidate')
@login_required
def handle_ice_candidate(data):
    """Emitting ICE Candidate Event"""
    chat_id = data.get('chat_id')
    connected_users = ChatGroup.fetch_group_participants(chat_id)
    for user in connected_users:
        for connection in ConnectedUser.fetch_sockets_for_users(user):
            socketio.emit('ice_candidate', {'candidate': data.get('candidate')}, room=connection.socket_id)


@socketio.on('camera-toggled')
@login_required
def handle_toggle_camera(data):
    """Sends the toggle camera to other user, to update their UI with placeholder"""
    chat_id = data.get('chat_id')
    email = data.get('sender_email')
    camera_status = data.get('camera_status')
    connected_users = ChatGroup.fetch_group_participants(chat_id)
    for user in connected_users:
        if user.email != email:
            for connection in ConnectedUser.fetch_sockets_for_users(user):
                socketio.emit('toggleCamera', {'camera_status': camera_status}, room=connection.socket_id)


@socketio.on('cancel-outgoing-call')
@login_required
def handle_cancel_outgoing_call(data):
    """Emits the notification of incoming call getting cancelled by the caller"""
    chat_id = data.get('chat_id')
    email = data.get('caller_email')
    connected_users = ChatGroup.fetch_group_participants(chat_id)
    for user in connected_users:
        if user.email != email:
            for connection in ConnectedUser.fetch_sockets_for_users(user):
                socketio.emit('incomingCallCancelled', room=connection.socket_id)


@socketio.on('changeCallStatus')
@login_required
def handle_change_call_status(data):
    """Update the status of the call made."""
    chat_id = data.get('chat_id')
    status = data.get('status')
    if status in ["calling", "declined", "missed", "ongoing", "ended", "crashed"]:
        Message.update_call_status(chat_id, status)
    if status == 'declined':
        # Update the frontend of the caller.
        call = Message.fetch_last_call_in_chat(chat_id)
        caller = call.sender
        for connection in ConnectedUser.fetch_sockets_for_users(caller):
            socketio.emit('callGotRejected', room=connection.socket_id)


@socketio.on('endCall')
@login_required
def handle_end_call(data):
    """Handle the call end"""
    chat_id = data.get('chat_id')
    Message.update_call_status(chat_id, 'ended')
    email = data.get('caller_email')
    connected_users = ChatGroup.fetch_group_participants(chat_id)
    for user in connected_users:
        if user.email != email:
            for connection in ConnectedUser.fetch_sockets_for_users(user):
                socketio.emit('call_ended', room=connection.socket_id)
