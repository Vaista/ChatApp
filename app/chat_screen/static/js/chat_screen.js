$(document).ready (() => {

    function adjustInputHeight() {
        let input = $('#message-input');
        input.css('height', 'auto');
        input.css('height', input[0].scrollHeight + 'px');
    }

    // Adjust the input height initially and on input change
    adjustInputHeight();
    $('#message-input').on('input', adjustInputHeight);

    // Toggle the emoji-picker
    $('#emojiButton').on('click', function() {
        $('#emojiPicker').toggle();
        adjustInputHeight();
    });

    $(document).on('click', function(event) {
        if (!$(event.target).closest('#emojiPicker').length && !$(event.target).closest('#emojiButton').length) {
            $('#emojiPicker').css("display", "none");
            adjustInputHeight();
        }
    });

    // Click on an Emoji
    $('emoji-picker').on('emoji-click', (e) => {
        let selectedEmoji = e.detail.unicode;
        let input = $('#message-input');
        input.val(input.val() + selectedEmoji);
        adjustInputHeight();
    });

    // Start New Chat Conversation
    $(document).on('click', '.startChat', function(e){
        e.preventDefault();
        let email_id = $(this).data('email');
        $.ajax({
            'url': '/chat/one-on-chat/new_chat/',
            'type': 'POST',
            'data': {
                'email_id': email_id
            },
            'success': function(response) {
                console.log(response);
                window.location.reload();
            },
            'error': function(xhr) {
                console.log(xhr);
            }
        });
    });

});