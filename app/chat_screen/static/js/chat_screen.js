$(document).ready (() => {

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