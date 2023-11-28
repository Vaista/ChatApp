$(document).ready (() => {

    // Function to check if the browser supports emoji rendering
    function supportsEmojiRendering() {
        // Create a test div
        let $testElement = $('<div>').html('😀');

        // Append the test div to the body
        $('body').append($testElement);

        // Check if the HTML content of the test div is equal to the expected emoji
        let isSupported = $testElement.html() === '😀';

        // Remove the test div from the body
        $testElement.remove();

        return isSupported;
    }

    const currentUserEmail = $("#currentUserEmail").val();
    var morePageAvailable = true;

    function updateChatList(chatList) {

        let html = '<ul class="list-unstyled mb-0">';
        let activeChatId = $("#activeChatId").val();

        chatList.forEach(function (chat) {
            let unreadBadge = '';
            let is_active = ''

             if ((chat.unread_count > 0) && (chat.id !== activeChatId)) {
                unreadBadge = `<span class="badge bg-danger float-end">${chat.unread_count}</span>`;
             }

             if (chat.is_active === 'group') {
                is_active = 'group-chat';
             } else if (chat.is_active === 'true') {
                is_active = 'logged-in';
             } else if (chat.is_active === 'false') {
                is_active = 'logged-out';
             }

            html += `<li class="p-2 border-bottom" id="chat_${chat.id}" data-chatId="${chat.id}">
                        <a class="d-flex text-decoration-none justify-content-between">
                            <div class="d-flex flex-row">
                                <div class="profile-pic-container">
                                    <img src="https://w7.pngwing.com/pngs/340/946/png-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes-thumbnail.png" alt="avatar"
                                      class="rounded-circle d-flex align-self-center me-3 shadow-1-strong" width="55">
                                    <div class="indicator ${is_active}"></div>
                                </div>
                                <div class="pt-1">
                                    <p class="fw-bold mb-0"> ${chat.name} </p>
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

        let emojiSupport = supportsEmojiRendering();

        if (messages.length === 0) {
            // No messages present
            let html = '<div class="chatHistoryNotificationDiv" id="noMsgAvailable"><p class="chatHistoryNotification"><span>No message history found. Start a New Conversation here.</span></p></div>';
            $('#chat-messages').html(html);
            morePageAvailable = false;
        } else {
            // Messages present
            let unreadMsgStart = false;
            let unreadMsgReached = false;

            let html = '';
            messages.forEach(function (msg) {

                let content = '';

                if (emojiSupport) {
                    content = msg.content;
                } else {
                    content = twemoji.parse(msg.content);
                }

                if (msg.read === false) {
                    unreadMsgStart = true;
                }

                if ((unreadMsgStart === true) && (unreadMsgReached === false)) {
                    html += '<div class="chatHistoryNotificationDiv" id="newMessageNotification"><p class="chatHistoryNotification"><span>New unread messages below</span></p></div>';
                    unreadMsgReached = true;
                }

                let isSenderClass = 'msgReceiverClass';
                if (currentUserEmail.trim() === msg.sender.trim()) {
                    isSenderClass = 'msgSenderClass';
                }

                html += `<div class="${isSenderClass} individualMsgDiv my-1">
                            <p class="mb-0 rounded-2">${content}</p><br/>
                            <span class="text-muted timeDetailsDiv" data-timestamp="${msg.str_timestamp}"><sub>${msg.timestamp}</sub></span>
                        </div>`;
            });
            $('#chat-messages').html(html);
            if (unreadMsgReached === true) {
                // Calculate the offset of the target div relative to the parent container
                var offset = $("#newMessageNotification").offset().top - $("#chat-messages").offset().top;
                // Bring the target div into view by setting the scrollTop property of the parent container
                $("#chat-messages").scrollTop(offset - 100);
            } else {
                $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
            }
        }
    }

    function appendChatMessage(data) {

        let emojiSupport = supportsEmojiRendering();

        let messages = data.messages;
        if (messages.length > 0) {

            let html = '';
            messages.forEach(function (msg) {

                let content;

                if (emojiSupport) {
                    content = msg.content;
                } else {
                    content = twemoji.parse(msg.content);
                }

                let isSenderClass = 'msgReceiverClass';
                if (currentUserEmail.trim() === msg.sender.trim()) {
                    isSenderClass = 'msgSenderClass';
                }

                html += `<div class="${isSenderClass} individualMsgDiv my-1">
                            <p class="mb-0 rounded-2">${content}</p><br/>
                            <span class="text-muted timeDetailsDiv" data-timestamp="${msg.str_timestamp}"><sub>${msg.timestamp}</sub></span>
                        </div>`;
            });

            $('#chat-messages').prepend(html);

        } else {
            morePageAvailable = false;
            html = '<div class="chatHistoryNotificationDiv"><p class="chatHistoryNotification"><span>Reached end of chat history.</span></p></div>';
            $('#chat-messages').prepend(html);
        }

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

    function updateSentReceivedMessage(data) {
        let html = '';
        let isSenderClass = 'msgReceiverClass';
        if (currentUserEmail.trim() === data.sender.trim()) {
            isSenderClass = 'msgSenderClass';
        }

        html += `<div class="${isSenderClass} individualMsgDiv my-1">
                    <p class="mb-0 rounded-2">${twemoji.parse(data.message)}</p><br/>
                    <span class="text-muted timeDetailsDiv" data-timestamp="${data.str_timestamp}"><sub>${data.timestamp}</sub></span>
                </div>`;

        $('#chat-messages').append(html);

        if (currentUserEmail.trim() === data.sender.trim()) {
            // Scroll to bottom
            $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
        }

    }

    function updateActiveChat(chatId) {
        $("#chat-list li").removeClass('active_chat');
        $("#chat_"+chatId).addClass('active_chat');
    }


    var socket = io({autoConnect: false});

    socket.connect();

    // Handle New Connection - Login or Reload
    socket.on('connect', function() {
        morePageAvailable = true;
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
        } else {
            $("#notificationSound")[0].play();
        }
    });

    socket.on('chatList', function (data) {
        let chatId = '';
        updateChatList(data.chatList);
        if ((data.chatId !== null) && (data.source === 'join')) {
            chatId = data.chatId;
        } else if ((data.source === 'send_message') || (data.source === 'refresh_chat_list')) {
            chatId = $("#activeChatId").val();
        }
        updateActiveChat(chatId);
    });

    socket.on('chatMessages', function (data) {
        $("#activeChatId").val(data.chat_id);
        updateChatMessages(data.messages);
    });

    socket.on('more_messages', function (data) {
        var topMessageDiv = $("#chat-messages .individualMsgDiv:first");
        appendChatMessage(data);
        // Calculate the offset of the target div relative to the parent container
        var offset = topMessageDiv.offset().top - $("#chat-messages").offset().top;
        // Bring the target div into view by setting the scrollTop property of the parent container
        $("#chat-messages").scrollTop(offset - 16);
    })

    // Join the Chat
    $(document).on('click', '#chat-list li', function(e){
        e.preventDefault();
        let chatId = $(this).attr('data-chatId');
        let previousChatId = $("#activeChatId").val();
        morePageAvailable = true;
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

    // Fetch more messages when scrolling to the top
    $('#chat-messages').on('scroll', function () {
        if (($(this).scrollTop() === 0) && (morePageAvailable === true)) {
            let chat_id = $("#activeChatId").val();
            let oldest_msg_time = $("#chat-messages .timeDetailsDiv:first").data('timestamp');
            socket.emit('fetch-more-messages', { chatId: chat_id, oldest_msg_time: oldest_msg_time });
        }
    });

    // Socket Disconnect
    $(window).on('beforeunload', function() {
        socket.disconnect();
    });

    // Reload Chat List every 2 minutes, to refresh the active status of the chat
    setInterval(function () {
        let chat_id = $("#activeChatId").val();
        socket.emit('refresh-chat-list', { email: currentUserEmail, chat_id: chat_id });
    }, 120000);

});