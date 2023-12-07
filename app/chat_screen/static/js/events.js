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

    function getCallHTML(msg) {

        let call_text = '';

        if (msg.call_status === 'calling') {
            call_text = 'Out Going Call Made';
        } else if (msg.call_status === 'declined') {
            call_text = 'Call Declined';
        } else if (msg.call_status === 'missed') {
            call_text = 'Call Missed';
        } else if (msg.call_status === 'ongoing') {
            call_text = 'Ongoing Call';
        } else if (msg.call_status === 'ended') {
            call_text = 'Call has ended';
        }

        let html = `<div class="chatHistoryNotificationDiv individualMsgDiv">
                        <p class="chatHistoryNotification">
                            <span>${call_text}</span>
                            <span class="d-none timeDetailsDiv" data-timestamp="${msg.str_timestamp}"></span>
                        </p>
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

            let html = '';
            messages.forEach(function (msg) {

                if (msg.message_type === 'call') {

                html += getCallHTML(msg);

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
                                <p class="mb-0 rounded-2">${content}</p><br/>
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
                    html += getCallHTML(msg);
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
                                <p class="mb-0 rounded-2">${content}</p><br/>
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


    // Audio and Video Call Functionalities

    var localVideo = document.getElementById('localVideo');
    var remoteVideo = document.getElementById('remoteVideo');
    var peerConnection;
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


    $('#startAudioCall').click(function() {
        initiateCall('audio');
    });

    $('#startVideoCall').click(function() {
        initiateCall('video');
    });

    function initiateCall(type) {
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
                peerConnection = new RTCPeerConnection(RTCConfiguration);

                stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

                peerConnection.addEventListener('track', async (event) => {
                    const [remoteStream] = event.streams;
                    remoteVideo.srcObject = remoteStream;
                });

                // Create Offer
                peerConnection.createOffer()
                //Set Local Description
                .then(offer => peerConnection.setLocalDescription(offer))
                .then(() => {
                    // Send Offer Via Emit
                    let chat_id = $("#activeChatId").val();
                    let receiver_name = $(".active_chat .group_name").text();
                    socket.emit('initiateCall', { type, chat_id: chat_id, caller: currentUserEmail, offer: peerConnection.localDescription });

                    // Update Frontend
                    let timestamp = new Date().getTime();
                    localStorage.setItem('outgoingCall', JSON.stringify({ receiver_name, chat_id, timestamp }));
                    showOutGoingCall(receiver_name, chat_id, timestamp);
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
        data['timestamp'] = timestamp
        localStorage.setItem('incomingCall', JSON.stringify(data));

        // Display the incoming call
        showIncomingCall(data['caller_name'], data['chat_id'], timestamp, data['type']);
    });

    function showIncomingCall(caller_name, chat_id, timestamp, call_type) {
        $("#incomingCallChatId").val(chat_id);
        if (call_type === 'audio') {
            $("#acceptIncomingCallwithVideo").addClass('d-none');
            $("#acceptIncomingCall").removeClass('d-none');
        } else {
            $("#acceptIncomingCallwithVideo").removeClass('d-none');
            $("#acceptIncomingCall").addClass('d-none');
        }
        $("#inCallMsg").html('Incoming call from ' + caller_name);
        $("#incomingCallModal").modal('show');
        $("#callingSound")[0].play();

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

    function showOutGoingCall(receiver_name, chat_id, timestamp) {
        $("#outgoingCallChatId").val(chat_id);
        $("#outCallMsg").html('Calling ' + receiver_name);
        $("#outgoingCallModal").modal('show');
        $("#callingSound")[0].play();

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
            }, 2000);
        }, remainingTime);
        localStorage.removeItem('incomingCall');
    }

    function isRecentCallAttempt(timestamp) {
        let now = new Date().getTime();
        return now - timestamp < 30000; // 30 seconds in milliseconds
    }

    $("#cancelOutgoingCall").on('click', function(e) {
        $("#outCallMsg").html('Outgoing Call Canceled!');
        setInterval(function() {
            // Close the modal after 30 seconds
            $("#outgoingCallModal").modal('hide');
        }, 2000);
        localStorage.removeItem('outgoingCall');
        let call_chat_id = $("#outgoingCallChatId").val();
        socket.emit('changeCallStatus', {'chat_id': call_chat_id, 'status': 'missed'});
        socket.emit('cancel-outgoing-call', {'chat_id': call_chat_id, 'caller_email': currentUserEmail});
    });

    socket.on('incomingCallCancelled', function () {
        $("#inCallMsg").html('Missed Call!');
        setInterval(function() {
            // Close the modal after 30 seconds
            $("#incomingCallModal").modal('hide');
        }, 2000);
        localStorage.removeItem('incomingCall');
        $("#incomingCallChatId").val('');
    })

    $("#acceptIncomingCall").on('click', function(e) {
        answerCall('audio');
    });

    $("#acceptIncomingCallwithVideo").on('click', function(e) {
        answerCall('video');
    });

    $("#rejectIncomingCall").on('click', function(e) {
        $("#inCallMsg").html('Incoming Call Declined!');
        setInterval(function() {
            // Close the modal after 2 seconds
            $("#incomingCallModal").modal('hide');
        }, 2000);
        localStorage.removeItem('incomingCall');
        let call_chat_id = $("#incomingCallChatId").val();
        socket.emit('changeCallStatus', {'chat_id': call_chat_id, 'status': 'declined'});
    });

    socket.on('callGotRejected', function() {
        $("#outCallMsg").html('The call was declined!');
        setInterval(function() {
            // Close the modal after 30 seconds
            $("#outgoingCallModal").modal('hide');
        }, 2000);
        localStorage.removeItem('outgoingCall');
    })

    function answerCall(call_type) {
        clearTimeout(incomingCallTimeout);
        localStorage.removeItem('incomingCall');
        $("#incomingCallModal").modal('hide');

        let chat_id = $("#incomingCallChatId").val();

        $.ajax({
            'url': '/chat/audio_video_call/rtc_offers/get_offer/',
            'method': 'GET',
            'data': {
                'chat_id': chat_id
            },
            'success': function(response) {
                if (response['status'] === 'success') {
                    createRTCAnswer(response['offer'], call_type);
                }
            },
            'error': function(xhr) {
                console.log(xhr)
            }
        });
    }

    function createRTCAnswer(offer, call_type) {
        let chat_id = $("#incomingCallChatId").val();
        // Define Constraints for getting Media

        if (call_type === 'audio') {
            callConstraints['video'] = false;
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(callConstraints)
            .then(async function(stream) {
                localVideo.srcObject = stream;

                peerConnection = new RTCPeerConnection(RTCConfiguration);

                stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

                peerConnection.addEventListener('track', async (event) => {
                    const [remoteStream] = event.streams;
                    remoteVideo.srcObject = remoteStream;
                });

                var remoteDescription = await new RTCSessionDescription(offer);
                await peerConnection.setRemoteDescription(remoteDescription);

                peerConnection.onicecandidate = handleICECandidate;

                peerConnection.createAnswer()
                    .then(answer => peerConnection.setLocalDescription(answer))
                    .then(() => {
                        socket.emit('answer-call', { answer: peerConnection.localDescription, chat_id: chat_id });
                    })
                    .catch(error => {
                        console.error('Error creating answer:', error);
                    });

                if (call_type === 'audio') {
                    $("#toggleCamera").addClass('d-none');
                    $("#remoteVideo, #localVideo").addClass('d-none');
                    $("#remoteVideoPlaceholder, #localVideoPlaceholder").removeClass('d-none');
                } else {
                    $("#toggleCamera").removeClass('d-none');
                    $("#remoteVideo, #localVideo").removeClass('d-none');
                    $("#remoteVideoPlaceholder, #localVideoPlaceholder").addClass('d-none');
                }
                $("#callEndedDiv").addClass('d-none');

                $("#activeCallChatId").val(chat_id);

                $("#activeCallModal").modal('show');

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
        let chat_id = $("#incomingCallChatId").val();
        if (event.candidate) {
            socket.emit('newIceCandidate', {'candidate': event.candidate, 'chat_id': chat_id, 'email': currentUserEmail});
        }
    }

    socket.on('callGotAnswered', async function(data) {

        clearTimeout(outgoingCallTimeout);
        localStorage.removeItem('outgoingCall');
        $("#outgoingCallModal").modal('hide');

        let chat_id = $("#outgoingCallChatId").val();

        var RTCAnswer = await new RTCSessionDescription(data.answer);
        await peerConnection.setRemoteDescription(RTCAnswer);

        // Listen for local ICE candidates on the local RTCPeerConnection
        peerConnection.onicecandidate = handleICECandidate;

        if (callConstraints['video'] === false) {
            $("#toggleCamera").addClass('d-none');
            $("#remoteVideo, #localVideo").addClass('d-none');
            $("#remoteVideoPlaceholder, #localVideoPlaceholder").removeClass('d-none');
        } else {
            $("#toggleCamera").removeClass('d-none');
            $("#remoteVideo, #localVideo").removeClass('d-none');
            $("#remoteVideoPlaceholder, #localVideoPlaceholder").addClass('d-none');
        }
        $("#callEndedDiv").addClass('d-none');

        $("#activeCallChatId").val(chat_id);
        $("#activeCallModal").modal('show');

        socket.emit('changeCallStatus', {'chat_id': chat_id, 'status': 'ongoing'})
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
    $("#toggleCamera").click(function() {
        var videoTrack = localVideo.srcObject.getVideoTracks()[0];
        let cameraStatus = !videoTrack.enabled;
        videoTrack.enabled = cameraStatus
        let chat_id = $("#activeCallChatId").val();
        socket.emit('camera-toggled', {'camera_status': cameraStatus, 'chat_id': chat_id, 'sender_email': currentUserEmail});
        $('#camera_on_svg').toggleClass('d-none');
        $('#camera_off_svg').toggleClass('d-none');
        $("#localVideo").toggleClass('d-none');
        $("#localVideoPlaceholder").toggleClass('d-none');
    })

//    $('#toggleCamera').click(function() {
//        var videoTracks = localVideo.srcObject.getVideoTracks();
//        if (videoTracks.length > 0) {
//            var videoTrack = videoTracks[0];
//            let cameraStatus = !videoTrack.enabled;
//            if (cameraStatus === true) {
//                //Enable camera
//                startCamera(true)
//            } else if (cameraStatus === false) {
//                //Disable Camera
//                localVideo.srcObject.getTracks().forEach(track => track.stop());
//                startCamera(false)
//            }
//        } else {
//            startCamera(true);
//        }
////        videoTrack.enabled = cameraStatus
////        let chat_id = $("#activeCallChatId").val();
////        socket.emit('camera-toggled', {'camera_status': cameraStatus, 'chat_id': chat_id, 'sender_email': currentUserEmail});
////        $('#camera_on_svg').toggleClass('d-none');
////        $('#camera_off_svg').toggleClass('d-none');
////        $("#localVideo").toggleClass('d-none');
////        $("#localVideoPlaceholder").toggleClass('d-none');
//    });

//    function startCamera(enableCamera) {
//        // Get user media with video
//        navigator.mediaDevices.getUserMedia({ video: enableCamera, audio: true })
//            .then(stream => {
//                // Update the local video source with the new stream
//                localVideo.srcObject = stream;
//                const sender = peerConnection.getSenders().find(sender => sender.track.kind === 'video');
//                sender.replaceTrack(newStream.getVideoTracks()[0]);
//
//                // Create and set the offer
//                return peerConnection.createOffer();
//            })
//            .catch(error => {
//                console.error('Error accessing camera:', error);
//            });
//        console.log('executing');
//    }

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
        let chat_id = $("#activeCallChatId").val();
        console.log(chat_id);
        $("#remoteVideo, #localVideo").addClass('d-none');
        $("#remoteVideoPlaceholder, #localVideoPlaceholder, #callEndedDiv").removeClass('d-none');
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
        peerConnection.close();
        localVideo.srcObject.getTracks().forEach(track => track.stop());

        // Emit a signal to inform the other party about ending the call
        let chat_id = $("#activeCallChatId").val();
        socket.emit('endCall', { chat_id: chat_id, 'user_email': currentUserEmail });
        closeActiveCallModal();
    });

    socket.on('call_ended', function() {
        peerConnection.close();
        localVideo.srcObject.getTracks().forEach(track => track.stop());
        closeActiveCallModal();
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
        let { receiver_name, chat_id, timestamp } = JSON.parse(storedOutCall);
        if (isRecentCallAttempt(timestamp)) {
            showOutGoingCall(receiver_name, chat_id, timestamp);
        } else {
            // More than 30 seconds have passed, clear the item from local storage
            localStorage.removeItem('outgoingCall');
        }
    }
});