$(document).ready (() => {

    const currentUserEmail = $("#currentUserEmail").val();

    function updateChatList(chatList) {

        let html = '<ul class="list-unstyled mb-0">';
        let activeChatId = $("#activeChatId").val();

        chatList.forEach(function (chat) {
            let unreadBadge = '';
             if ((chat.unread_count > 0) && (chat.id !== activeChatId)) {
                unreadBadge = `<span class="badge bg-danger float-end">${chat.unread_count}</span>`;
             }

            html += `<li class="p-2 border-bottom" id="chat_${chat.id}" data-chatId="${chat.id}">
                        <a class="d-flex text-decoration-none justify-content-between">
                            <div class="d-flex flex-row">
                                <img src="https://w7.pngwing.com/pngs/340/946/png-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes-thumbnail.png" alt="avatar"
                                  class="rounded-circle d-flex align-self-center me-3 shadow-1-strong" width="55">
                                <div class="pt-1">
                                    <p class="fw-bold mb-0">${chat.name}</p>
                                    <p class="small text-muted">${chat.message}</p>
                                </div>
                            </div>
                            <div class="pt-1">
                                <p class="small text-muted mb-1">${chat.last_activity}</p>
                                ${unreadBadge}
                            </div>
                        </a>
                    </li>`;
        });
        html += '</ul>';
        $("#chat-list").empty().html(html);
    }

    function updateChatMessages(messages) {

        $('#chat-messages').empty();
        let unreadMsgStart = false;
        let unreadMsgReached = false;

        let html = '';
        messages.forEach(function (msg) {

            if (msg.read === false) {
                unreadMsgStart = true;
            }

            if ((unreadMsgStart === true) && (unreadMsgReached === false)) {
                html += '<div class="unreadBelowTextDiv"><p class="unreadBelowText"><span>New unread messages below</span></p></div>';
                unreadMsgReached = true;
            }

            let isSenderClass = 'msgReceiverClass';
            if (currentUserEmail.trim() === msg.sender.trim()) {
                isSenderClass = 'msgSenderClass';
            }

            html += `<div class="${isSenderClass} my-1">
                        <p class="mb-0 rounded-2">${msg.content}</p><br/>
                        <span class="text-muted timeDetailsDiv"><sub>${msg.timestamp}</sub></span>
                    </div>`;
        });
        $('#chat-messages').html(html);
    }

    function sendMessage() {
        var messageContent = $('#message-input').val();

        if (messageContent.trim() !== '') {
            let chatGroupId = $("#activeChatId").val();

            var data = {
                chat_id: chatGroupId,
                message: messageContent
            };

            // Emit the 'sendMessage' event to the server
            socket.emit('sendMessage', data);

            // Clear the textarea after sending the message
            $("#message-input").val("");
        }
    }

    function updateActiveChat(chatId) {
        $("#chat-list li").removeClass('active_chat');
        $("#chat_"+chatId).addClass('active_chat');
    }

    function updateSentReceivedMessage(data) {
        let html = '';
        let isSenderClass = 'msgReceiverClass';
        if (currentUserEmail.trim() === data.sender.trim()) {
            isSenderClass = 'msgSenderClass';
        }

        html += `<div class="${isSenderClass} my-1">
                    <p class="mb-0 rounded-2">${data.message}</p><br/>
                    <span class="text-muted timeDetailsDiv"><sub>${data.timestamp}</sub></span>
                </div>`;

        $('#chat-messages').append(html);
    }


    var socket = io({autoConnect: false});

    socket.connect();

    // Handle New Connection - Login or Reload
    socket.on('connect', function() {
        socket.emit('join', {});
    });

    // Socket.io events

    // Updates the sender's chat message screen with new sent messages
    socket.on('message', function (data) {
        let received_chat_id = data.chat_id;
        let activeChatId = $("#activeChatId").val();
        if (received_chat_id.trim() === activeChatId.trim()) {
            socket.emit('mark-as-read', { message_id: data.message_id, email: currentUserEmail });
            updateSentReceivedMessage(data);
        }
    });

    socket.on('chatList', function (data) {
        let chatId = '';
        updateChatList(data.chatList);
        if ((data.chatId !== null) && (data.source === 'join')) {
            chatId = data.chatId;
        } else if (data.source === 'send_message') {
            chatId = $("#activeChatId").val();
        }
        updateActiveChat(chatId);
    });

    socket.on('chatMessages', function (data) {
        $("#activeChatId").val(data.chat_id);
        updateChatMessages(data.messages);
    });

    // Join the Chat
    $(document).on('click', '#chat-list li', function(e){
        e.preventDefault();
        let chatId = $(this).attr('data-chatId');
        let previousChatId = $("#activeChatId").val();
        socket.emit('join', { chatId: chatId, previousChatId: previousChatId });
    })

    // Send a new Message
    $('#sendMessageBtn').click(function () {
        sendMessage();
    });

    // Enter Pressed in Message
    $("#message-input").keyup(function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Socket Disconnect
    $(window).on('beforeunload', function() {
        socket.disconnect();
    });

});