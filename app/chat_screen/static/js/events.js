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
                                    <p class="fw-bold mb-0 group_name"> ${chat.name} </p>
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

    function calculateTimeDuration(seconds) {

        if ((!Number.isInteger(seconds) )|| (seconds % 1 !== 0) || (seconds == 0)) {
            return "";
        }
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds % 3600) / 60);
        var remainingSeconds = seconds % 60;

        var durationStr = "";

        if (hours > 0) {
            durationStr += hours + " " + (hours === 1 ? "hour" : "hours");
            if (minutes > 0) {
                durationStr += " " + minutes + " " + (minutes === 1 ? "minute" : "minutes");
            }
        } else if (minutes > 0) {
            durationStr += minutes + " " + (minutes === 1 ? "minute" : "minutes");
        } else {
            durationStr += remainingSeconds + " " + (remainingSeconds === 1 ? "second" : "seconds");
        }

        return durationStr;
    }

    function getCallHTML(msg, isRecentCall) {

        let call_text = '';
        let duration_text = '';
        let svg_fill = '#3C717D';

        if (msg.call_status === 'calling') {
            call_text = 'Calling';
        } else if (msg.call_status === 'declined') {
            call_text = 'Call Declined';
        } else if (msg.call_status === 'missed') {
            call_text = 'Missed Call';
        } else if ((msg.call_status === 'ongoing') && (isRecentCall === true)) {
            call_text = 'Ongoing Call';
        } else if (msg.call_status === 'ongoing') {
            call_text = 'Call Ended';
        } else if (msg.call_status === 'ended') {
            call_text = 'Call Ended';
            duration_text = calculateTimeDuration(+msg.call_duration);
        }

        let isSenderClass = 'msgReceiverClass';
        if (currentUserEmail.trim() === msg.sender.trim()) {
            isSenderClass = 'msgSenderClass';
            svg_fill = '#496B49';
        }

        let html = `<div class="${isSenderClass} individualMsgDiv my-1">
                        <div class="content rounded-2 d-inline-block">
                            <div class="row m-1 msgCallRow rounded-2">
                                <div class="col-3 svgContainerParent">
                                    <div class="svgContainer">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M21 16.42V19.9561C21 20.4811 20.5941 20.9167 20.0705 20.9537C19.6331 20.9846 19.2763 21 19 21C10.1634 21 3 13.8366 3 5C3 4.72371 3.01545 4.36687 3.04635 3.9295C3.08337 3.40588 3.51894 3 4.04386 3H7.5801C7.83678 3 8.05176 3.19442 8.07753 3.4498C8.10067 3.67907 8.12218 3.86314 8.14207 4.00202C8.34435 5.41472 8.75753 6.75936 9.3487 8.00303C9.44359 8.20265 9.38171 8.44159 9.20185 8.57006L7.04355 10.1118C8.35752 13.1811 10.8189 15.6425 13.8882 16.9565L15.4271 14.8019C15.5572 14.6199 15.799 14.5573 16.001 14.6532C17.2446 15.2439 18.5891 15.6566 20.0016 15.8584C20.1396 15.8782 20.3225 15.8995 20.5502 15.9225C20.8056 15.9483 21 16.1633 21 16.42Z" fill="${svg_fill}"></path>
                                    </svg>
                                    </div>
                                </div>
                                <div class="col pb-1">
                                    <p class="mb-0 mt-1 text-nowrap">${call_text}</p><br/>
                                    <small class="mb-0 call_duration_text text-muted">${duration_text}</small>
                                </div>
                            </div>
                        </div>
                        <span class="text-muted timeDetailsDiv d-block" data-timestamp="${msg.str_timestamp}"><sub>${msg.timestamp}</sub></span>
                    </div>`;

        return html;
    }

    function updateChatMessages(messages) {

        $('#chat-messages').empty();

        let emojiSupport = supportsEmojiRendering();

        if (messages.length === 0) {
            // No messages present
            let html = '<div class="chatHistoryNotificationDiv individualMsgDiv" id="noMsgAvailable"><p class="chatHistoryNotification"><span>No message history found. Start a New Conversation here.</span></p></div>';
            $('#chat-messages').html(html);
            morePageAvailable = false;
        } else {
            // Messages present
            let unreadMsgStart = false;
            let unreadMsgReached = false;
            let isRecentCall = true

            let html = '';
            messages.forEach(function (msg) {

                if (msg.message_type === 'call') {
                    html += getCallHTML(msg, isRecentCall);
                    isRecentCall = false;
                } else {
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
                        html += '<div class="chatHistoryNotificationDiv individualMsgDiv" id="newMessageNotification"><p class="chatHistoryNotification"><span>New unread messages below</span></p></div>';
                        unreadMsgReached = true;
                    }

                    let isSenderClass = 'msgReceiverClass';
                    if (currentUserEmail.trim() === msg.sender.trim()) {
                        isSenderClass = 'msgSenderClass';
                    }

                    html += `<div class="${isSenderClass} individualMsgDiv my-1">
                                <p class="mb-0 rounded-2 content">${content}</p><br/>
                                <span class="text-muted timeDetailsDiv" data-timestamp="${msg.str_timestamp}"><sub>${msg.timestamp}</sub></span>
                            </div>`;
                }
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
                if (msg.message_type === 'call') {
                    html += getCallHTML(msg, 'false');
                } else {
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
                                <p class="mb-0 content rounded-2">${content}</p><br/>
                                <span class="text-muted timeDetailsDiv" data-timestamp="${msg.str_timestamp}"><sub>${msg.timestamp}</sub></span>
                            </div>`;
                }
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
            var chatGroupId = $("#activeChatId").val();

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
                    <p class="mb-0 content rounded-2">${twemoji.parse(data.message)}</p><br/>
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
        var chatId = '';
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
        var chatId = $(this).attr('data-chatId');
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
            var chat_id = $("#activeChatId").val();
            let oldest_msg_time = $("#chat-messages .timeDetailsDiv:first").data('timestamp');
            socket.emit('fetch-more-messages', { chatId: chat_id, oldest_msg_time: oldest_msg_time });
        }
    });

    // Reload Chat List every 2 minutes, to refresh the active status of the chat
    setInterval(function () {
        var chat_id = $("#activeChatId").val();
        socket.emit('refresh-chat-list', { email: currentUserEmail, chat_id: chat_id });
    }, 120000);


    // Audio and Video Call Functionalities

    var localVideo = document.getElementById('localVideo');
    var remoteVideo = document.getElementById('remoteVideo');
    var peerConnection = undefined;
    var RTCConfiguration = {
        iceServers: [
            {
                urls: ['stun:stun.l.google.com:19302',
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302',
                        'stun:stun3.l.google.com:19302'
                    ]
            },
        ]
    };
    var callConstraints = {
        'video': true,
        'audio': true,
    }

    let incomingCallTimeout;
    let outgoingCallTimeout;
    let callingTone = document.getElementById("callingSound");

    function playRingTone() {
        callingTone.play();
    }

    function stopRingTone() {
        callingTone.pause();
        callingTone.currentTime = 0;
    }

    $('#startAudioCall').click(function() {
        initiateCall('audio', 'new');
    });

    $('#startVideoCall').click(function() {
        initiateCall('video', 'new');
    });

    function initiateCall(type, call_type, isMicEnabled=true) {
        if (call_type === 'renegotiate') {
            peerConnection.removeStream(localVideo.srcObject);
        }
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Define Constraints for getting Media

            if (type === 'audio') {
                callConstraints['video'] = false;
            }

            // Fetch User Media
            navigator.mediaDevices.getUserMedia(callConstraints)
            .then(stream => {
                // Assign Stream to localVideo
                localVideo.srcObject = stream;

                // Establishing Peer Connection
                if (call_type !== 'renegotiate') {
                    peerConnection = new RTCPeerConnection(RTCConfiguration);
                }

                stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

                if (call_type !== 'renegotiate') {
                    peerConnection.addEventListener('track', async (event) => {
                        const [remoteStream] = event.streams;
                        remoteVideo.srcObject = remoteStream;
                    });
                }

                if (isMicEnabled === false) {
                    var audioTracks = localVideo.srcObject.getAudioTracks();
                    audioTracks.forEach(track => {
                        track.enabled = !track.enabled;
                    });
                }

                // Create Offer
                peerConnection.createOffer()
                //Set Local Description
                .then(offer => peerConnection.setLocalDescription(offer))
                .then(() => {
                    // Send Offer Via Emit
                    var chat_id;
                    let receiver_name;
                    if (call_type === 'reconnect') {
                        chat_id = $("#crashedCallChatId").val();
                        receiver_name = $("#crashedCallOtherUser").val();
                    } else {
                        chat_id = $("#activeChatId").val();
                        receiver_name = $(".active_chat .group_name").text();
                    }

                    socket.emit('initiateCall', { type, call_type, chat_id: chat_id, caller: currentUserEmail, offer: peerConnection.localDescription });

                    if (call_type !== 'renegotiate') {
                        // Update Frontend
                        let timestamp = new Date().getTime();
                        localStorage.setItem('outgoingCall', JSON.stringify({ receiver_name, chat_id, timestamp, type }));
                        showOutGoingCall(receiver_name, chat_id, timestamp, type);
                    }
                })
                .catch(error => {
                    console.log('Error creating offer:', error);
                });

            })
            .catch(error => {
                console.log('Error accessing media devices.', error);
            });
        } else {
            console.log('getUserMedia is not supported in this environment.');
            alert('camera not supported');
        }
    }

    socket.on('incomingCall', function(data) {
        // Store the incoming call details in local storage
        let timestamp = new Date().getTime();
        data['timestamp'] = timestamp;
        localStorage.setItem('incomingCall', JSON.stringify(data));

        // Display the incoming call
        showIncomingCall(data['caller_name'], data['chat_id'], timestamp, data['type']);
    });

    function showIncomingCall(caller_name, chat_id, timestamp, call_type) {
        $("#incomingCallChatId").val(chat_id);
        $("#inCallMsg").html('Incoming call from ' + caller_name);
        $("#incomingCallModal").modal('show');
        playRingTone();

        // Update UI for received call type
        if (call_type === 'audio') {
            $("#remoteVideoPlaceholder").removeClass('d-none');
            $("#remoteVideo").addClass('d-none');
        } else {
            $("#remoteVideoPlaceholder").addClass('d-none');
            $("#remoteVideo").removeClass('d-none');
        }
        $("#callEndedDiv").addClass('d-none');

        let now = new Date().getTime();
        let remainingTime = Math.max(0, 30000 - (now - timestamp));

        // Set a timeout for 30 seconds
        incomingCallTimeout = setTimeout(function() {
            // Close the modal after 30 seconds
            $("#inCallMsg").html('You missed a call from ' + caller_name);
            setInterval(function() {
                // Close the modal after 30 seconds
                $("#incomingCallModal").modal('hide');
                // Change Call Status
                socket.emit('changeCallStatus', {'chat_id': chat_id, 'status': 'missed'});
            }, 2000);
        }, remainingTime);
    }

    function showOutGoingCall(receiver_name, chat_id, timestamp, call_type) {
        $("#outgoingCallChatId").val(chat_id);
        $("#outCallMsg").html('Calling ' + receiver_name);
        $("#outgoingCallModal").modal('show');
        playRingTone();

        if (call_type === 'audio') {
            $("#camera_on_svg").addClass("d-none");
            $("#camera_off_svg").removeClass("d-none");
            $("#localVideoPlaceholder").removeClass('d-none');
            $("#localVideo").addClass('d-none');
        } else {
            $("#camera_on_svg").removeClass("d-none");
            $("#camera_off_svg").addClass("d-none");
            $("#localVideoPlaceholder").addClass('d-none');
            $("#localVideo").removeClass('d-none');
        }
        $("#callEndedDiv").addClass('d-none');

        let now = new Date().getTime();
        let remainingTime = Math.max(0, 30000 - (now - timestamp));

        // Set a timeout for 30 seconds
        outgoingCallTimeout = setTimeout(function() {
            // Update the message if call not answered
            $("#outCallMsg").html(receiver_name + ' did not answer the call!');
            setInterval(function() {
                // Close the modal after 30 seconds
                $("#outgoingCallModal").modal('hide');
                // Change Call Status
                socket.emit('changeCallStatus', {'chat_id': chat_id, 'status': 'missed'});
                closePeerConnection();
            }, 2000);
        }, remainingTime);
        localStorage.removeItem('incomingCall');
    }

    function isRecentCallAttempt(timestamp) {
        let now = new Date().getTime();
        return now - timestamp < 30000; // 30 seconds in milliseconds
    }

    $("#cancelOutgoingCall").on('click', function(e) {
        stopRingTone();
        clearTimeout(outgoingCallTimeout);
        $("#outCallMsg").html('Outgoing Call Canceled!');
        setInterval(function() {
            // Close the modal after 30 seconds
            $("#outgoingCallModal").modal('hide');
        }, 2000);
        localStorage.removeItem('outgoingCall');
        let call_chat_id = $("#outgoingCallChatId").val();
        socket.emit('changeCallStatus', {'chat_id': call_chat_id, 'status': 'missed'});
        socket.emit('cancel-outgoing-call', {'chat_id': call_chat_id, 'caller_email': currentUserEmail});
        closePeerConnection();
        socket.emit('join', { chatId: call_chat_id });
        $("#outgoingCallChatId").val('');
    });

    socket.on('incomingCallCancelled', function () {
        stopRingTone();
        $("#inCallMsg").html('Missed Call!');
        setInterval(function() {
            // Close the modal after 30 seconds
            $("#incomingCallModal").modal('hide');
        }, 2000);
        localStorage.removeItem('incomingCall');
        let call_chat_id = $("#incomingCallChatId").val();
        let active_chat_id = $("#activeChatId").val();
        if (call_chat_id === active_chat_id) {
            socket.emit('join', { chatId: call_chat_id });
        }
        $("#incomingCallChatId").val('');
    })

    $("#acceptIncomingCall").on('click', function(e) {
        stopRingTone();
        answerCall('audio');
        $("#camera_on_svg").addClass("d-none");
        $("#camera_off_svg").removeClass("d-none");
        $("#localVideo").addClass("d-none");
        $("#localVideoPlaceholder").removeClass("d-none");
    });

    $("#acceptIncomingCallwithVideo").on('click', function(e) {
        stopRingTone();
        answerCall('video');
        $("#camera_on_svg").removeClass("d-none");
        $("#camera_off_svg").addClass("d-none");
        $("#localVideo").removeClass("d-none");
        $("#localVideoPlaceholder").addClass("d-none");
    });

    $("#rejectIncomingCall").on('click', function(e) {
        stopRingTone();
        $("#inCallMsg").html('Incoming Call Declined!');
        setInterval(function() {
            // Close the modal after 2 seconds
            $("#incomingCallModal").modal('hide');
        }, 2000);
        localStorage.removeItem('incomingCall');
        let call_chat_id = $("#incomingCallChatId").val();
        let active_chat_id = $("#activeChatId").val();
        socket.emit('changeCallStatus', {'chat_id': call_chat_id, 'status': 'declined'});
        if (call_chat_id === active_chat_id) {
            socket.emit('join', { chatId: call_chat_id });
        }
        $("#incomingCallChatId").val('');
    });

    socket.on('callGotRejected', function() {
        stopRingTone();
        clearTimeout(outgoingCallTimeout);
        closePeerConnection();
        $("#outCallMsg").html('The call was declined!');
        setInterval(function() {
            // Close the modal after 30 seconds
            $("#outgoingCallModal").modal('hide');
        }, 2000);
        localStorage.removeItem('outgoingCall');
        let call_chat_id = $("#outgoingCallChatId").val();
        socket.emit('join', { chatId: call_chat_id });
        $("#outgoingCallChatId").val('');
    });

    function answerCall(call_type) {
        clearTimeout(incomingCallTimeout);
        localStorage.removeItem('incomingCall');
        $("#incomingCallModal").modal('hide');

        var chat_id = $("#incomingCallChatId").val();

        $.ajax({
            'url': '/chat/audio_video_call/rtc_offers/get_offer/',
            'method': 'GET',
            'data': {
                'chat_id': chat_id
            },
            'success': function(response) {
                if (response['status'] === 'success') {
                    createRTCAnswer(response['offer'], call_type, response['other_user'], 'reply');
                }
            },
            'error': function(xhr) {
                console.log(xhr)
            }
        });
    }

    socket.on('acceptNegotiation', function (data) {
        let offer = data['offer'];
        let call_type = 'video';

        if (callConstraints['video'] === false) {
            call_type = 'audio';
        }

        let other_user = data['caller_name'];

        var audioTrack = localVideo.srcObject.getAudioTracks()[0];
        var isMicEnabled = audioTrack.enabled;

        createRTCAnswer(offer, call_type, other_user, 'renegotiate', isMicEnabled);
    });

    function createRTCAnswer(offer, call_type, caller, action, isMicEnabled=true) {

        var chat_id = $("#incomingCallChatId").val();
        // Define Constraints for getting Media

        if (call_type === 'audio') {
            callConstraints['video'] = false;
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(callConstraints)
            .then(async function(stream) {
                localVideo.srcObject = stream;

                if (action !== 'renegotiate') {
                    peerConnection = new RTCPeerConnection(RTCConfiguration);
                }

                stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

                if (action !== 'renegotiate') {
                    peerConnection.addEventListener('track', async (event) => {
                        const [remoteStream] = event.streams;
                        remoteVideo.srcObject = remoteStream;
                    });
                }

                if (isMicEnabled === false) {
                    var audioTracks = localVideo.srcObject.getAudioTracks();
                    audioTracks.forEach(track => {
                        track.enabled = !track.enabled;
                    });
                }

                var remoteDescription = await new RTCSessionDescription(offer);
                await peerConnection.setRemoteDescription(remoteDescription);

                if (action !== 'renegotiate') {
                    peerConnection.onicecandidate = handleICECandidate;
                }

                peerConnection.createAnswer()
                    .then(answer => peerConnection.setLocalDescription(answer))
                    .then(() => {
                        socket.emit('answer-call', { answer: peerConnection.localDescription, chat_id: chat_id, action: action, call_answer_type: call_type });
                    })
                    .catch(error => {
                        console.error('Error creating answer:', error);
                    });

                if (action !== 'renegotiate') {
                    $("#activeCallChatId").val(chat_id);
                    $("#activeCallModal").modal('show');
                    localStorage.setItem('activeCall', JSON.stringify({ chat_id, other_user: caller }));
                }
            })
            .catch(error => {
                console.error('Error accessing media devices:', error);
            });
        } else {
            console.error('getUserMedia is not supported in this environment.');
            alert('cameras not accessible');
        }
    }

    function handleICECandidate(event) {
        var chat_id = $("#incomingCallChatId").val();
        if (event.candidate) {
            socket.emit('newIceCandidate', {'candidate': event.candidate, 'chat_id': chat_id, 'email': currentUserEmail});
        }
    }

    socket.on('callGotAnswered', async function(data) {

        stopRingTone();
        clearTimeout(outgoingCallTimeout);
        localStorage.removeItem('outgoingCall');
        $("#outgoingCallModal").modal('hide');

        var chat_id = $("#outgoingCallChatId").val();
        let action = data['action'];

        var RTCAnswer = await new RTCSessionDescription(data.answer);
        await peerConnection.setRemoteDescription(RTCAnswer);

        if (action !== 'renegotiate') {
            // Listen for local ICE candidates on the local RTCPeerConnection
            peerConnection.onicecandidate = handleICECandidate;

            // Check Remote Call Type
            if (data['call_answer_type'] === 'audio') {
                $("#remoteVideoPlaceholder").removeClass('d-none');
                $("#remoteVideo").addClass('d-none');
            } else {
                $("#remoteVideoPlaceholder").addClass('d-none');
                $("#remoteVideo").removeClass('d-none');
            }

            $("#activeCallChatId").val(chat_id);
            $("#activeCallModal").modal('show');
            socket.emit('changeCallStatus', {'chat_id': chat_id, 'status': 'ongoing'});
            localStorage.setItem('activeCall', JSON.stringify({ chat_id, other_user: data['other_user'] }));
        }
    });

    socket.on('ice_candidate', async function(data) {
        if (data.candidate) {
            setTimeout(async function() {
                try {
                    let candidate_to_add = await new RTCIceCandidate(data.candidate)
                    await peerConnection.addIceCandidate(data.candidate);
                    console.log('added');
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }, 3000);
        }
    });

    function closePeerConnection () {
        if (peerConnection !== undefined) {
            peerConnection.close();
            peerConnection = undefined;
        }
        if (localVideo) {
            if ((localVideo.srcObject.getTracks()).length > 0) {
                localVideo.srcObject.getTracks().forEach(track => track.stop());
            }
            localVideo.srcObject = null;
        }
    }

    // Toggle Mic
    $('#ToggleMic').click(function() {
        var audioTracks = localVideo.srcObject.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        $('#mic_on_svg').toggleClass('d-none');
        $('#mic_off_svg').toggleClass('d-none');
    });

    // Toggle Camera
    $('#toggleCamera').click(function() {
        var turnCameraActive;
        var videoTracks = localVideo.srcObject.getVideoTracks();
        if (videoTracks.length > 0) {
            var videoTrack = videoTracks[0];
            let cameraReadyState = videoTrack.readyState;
            if (cameraReadyState === 'live') {
                turnCameraActive = false;
            } else if (cameraReadyState === 'ended') {
                turnCameraActive = true;
            }
            if (turnCameraActive === true) {
                // Enable camera
                startCamera(true);
            } else if (turnCameraActive === false) {
                // Disable Camera
                localVideo.srcObject.getVideoTracks().forEach(track => track.stop());
                startCamera(false);
            }
        } else {
            // Camera is Disabled, enabling the camera
            turnCameraActive = true;
            startCamera(true);
        }
        var chat_id = $("#activeCallChatId").val();
        socket.emit('camera-toggled', {'camera_status': turnCameraActive, 'chat_id': chat_id, 'sender_email': currentUserEmail});
        $('#camera_on_svg, #camera_off_svg, #localVideo, #localVideoPlaceholder').toggleClass('d-none');
    });

    function startCamera(turnCameraActive) {
        var call_mode;
        var audioTrack = localVideo.srcObject.getAudioTracks()[0];
        var isMicEnabled = audioTrack.enabled;
        if (turnCameraActive === true) {
            call_mode = 'video';
            callConstraints['video'] = true
            initiateCall(call_mode, 'renegotiate', isMicEnabled);
        } else if (turnCameraActive === false) {
            call_mode = 'audio';
            callConstraints['video'] = false
        }
    }

    socket.on('toggleCamera', function(data) {
        let received_camera_status = data['camera_status'];
        if (received_camera_status === true) {
            $("#remoteVideo").removeClass('d-none');
            $("#remoteVideoPlaceholder").addClass('d-none');
        } else if (received_camera_status === false) {
            $("#remoteVideo").addClass('d-none');
            $("#remoteVideoPlaceholder").removeClass('d-none');
        }
    });

    function closeActiveCallModal() {
        var chat_id = $("#activeCallChatId").val();
        $("#remoteVideo, #localVideo").addClass('d-none');
        $("#callEndedDiv").removeClass('d-none');
        $("#remoteVideoPlaceholder, #localVideoPlaceholder").removeClass('d-none');
        setInterval(function() {
            // Close the modal after 2 seconds
            $("#activeCallModal").modal('hide');
        }, 2000);
        socket.emit('join', { chatId: chat_id });
        $("#activeCallChatId").val('');
    }

    // Add this inside your document ready or initialization code
    $('#endActiveCall').click(function() {
        // Close the connection and stop local media
        closePeerConnection();

        // Emit a signal to inform the other party about ending the call
        var chat_id = $("#activeCallChatId").val();

        socket.emit('endCall', { chat_id: chat_id, 'user_email': currentUserEmail });
        closeActiveCallModal();
        localStorage.removeItem('activeCall');
    });

    socket.on('call_ended', function() {
        closePeerConnection();
        closeActiveCallModal();
        localStorage.removeItem('activeCall');
    });

    // Check any last active Calls that were made before browser closed
    let activeOngoingCall = localStorage.getItem('activeCall');
    if (activeOngoingCall) {
        localStorage.removeItem('incomingCall');
        localStorage.removeItem('outgoingCall');
        let { chat_id, other_user} = JSON.parse(activeOngoingCall);
        $("#crashedCallMsg").text('The Call with '+other_user+' did not end properly.');
        $("#crashedCallChatId").val(chat_id);
        $("#crashedCallOtherUser").val(other_user);
        $("#crashedCallModal").modal('show');
        socket.emit('changeCallStatus', {'chat_id': chat_id, 'status': 'crashed'});
    }

    $("#reconnectCrashedCall").on('click', function() {
        initiateCall('audio', 'reconnect');
        localStorage.removeItem('activeCall');
        $("#crashedCallModal").modal('hide');
    });

    $("#reconnectCrashedCallwithVideo").on('click', function() {
        initiateCall('video', 'reconnect');
        localStorage.removeItem('activeCall');
        $("#crashedCallModal").modal('hide');
    });

    $("#cancelCrashedCall").on('click', function() {
        localStorage.removeItem('activeCall');
        $("#crashedCallModal").modal('hide');
    });

    let storedInCall = localStorage.getItem('incomingCall');
    if (storedInCall) {
        let { caller_name, chat_id, timestamp, call_type } = JSON.parse(storedInCall);
        if (isRecentCallAttempt(timestamp)) {
            showIncomingCall(caller_name, chat_id, timestamp, call_type);
        } else {
            // More than 30 seconds have passed, clear the item from local storage
            localStorage.removeItem('incomingCall');
        }
    }

    let storedOutCall = localStorage.getItem('outgoingCall');
    if (storedOutCall) {
        let { receiver_name, chat_id, timestamp, type } = JSON.parse(storedOutCall);
        if (isRecentCallAttempt(timestamp)) {
            showOutGoingCall(receiver_name, chat_id, timestamp, type);
        } else {
            // More than 30 seconds have passed, clear the item from local storage
            localStorage.removeItem('outgoingCall');
        }
    }

    // Socket Disconnect
    $(window).on('beforeunload', function() {
        socket.disconnect();
        closePeerConnection();
    });

});