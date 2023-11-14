$(document).ready (() => {

    // Send Friend Request Button is Clicked
    $(document).on('click', '.sendFriendRequest', function(e) {
        e.preventDefault();
        var component = $(this);
        let email_id = $(this).data('email');
        $.ajax({
            'url': '/users/add_friends/send_request/',
            'type': 'POST',
            'data': {
                'email_id': email_id
            },
            'success': function(response) {
                if (response['status'] == 'success') {
                    let html = `<button class="btn btn-sm btn-info float-end text-white font12 mx-1 sentFriendRequest" data-email="${email_id}">✓ Sent</button>
                                <button class="btn btn-sm btn-danger float-end text-white font12 mx-1 removeFriendRequest" data-email="${email_id}">x Delete</button>`
                    let parentComponent = component.parent();
                    parentComponent.html(html);
                }
            },
            'error': function(xhr) {
                console.log(xhr);
            }
        });
    });

    // Delete Friend Requests - Search User Modal
    $(document).on('click', '.removeFriendRequest', function(e) {
        e.preventDefault();
        var component = $(this);
        let email_id = $(this).data('email');
        $.ajax({
            'url': '/users/add_friends/delete_request/',
            'type': 'POST',
            'data': {
                'email_id': email_id
            },
            'success': function(response) {
                if (response['status'] == 'success') {
                    let html = `<button class="btn btn-sm btn-info float-end text-white font12 mx-1 sendFriendRequest" data-email="${email_id}">+ Add</button>`
                    let parentComponent = component.parent();
                    parentComponent.html(html);
                }
            },
            'error': function(xhr) {
                console.log(xhr);
            }
        });
    })

    // Delete Friend Request - Friend Requests Modal
    $(document).on('click', '.req_rejectFriendRequest', function(e){
        e.preventDefault();
        var component = $(this);
        let email_id = $(this).data('email');
        $.ajax({
            'url': '/users/add_friends/delete_request/',
            'type': 'POST',
            'data': {
                'email_id': email_id
            },
            'success': function(response) {
                if (response['status'] == 'success') {
                    let parentCardComponent = component.closest('.card');
                    parentCardComponent.html('<p class="my-2 text-center text-muted">Friend Request has been deleted</p>');
                }
            },
            'error': function(xhr) {
                console.log(xhr);
            }
        });
    })

    // Accept Friend Request - Search Modal
    $(document).on('click', '.search_acceptFriendRequest, .req_acceptFriendRequest', function(e) {
        e.preventDefault();
        var component = $(this);
        let email_id = $(this).data('email');
        $.ajax({
            'url': '/users/add_friends/accept_request/',
            'type': 'POST',
            'data': {
                'email_id': email_id
            },
            'success': function(response) {
                if (response['status'] == 'success') {
                    let html = `<button class="btn btn-sm btn-success float-end text-white font12 mx-1">Friends</button>
                                <button class="btn btn-sm btn-danger float-end text-white font12 mx-1 removeFriend" data-email="${email_id}">x Remove</button>`
                    let parentComponent = component.parent();
                    parentComponent.html(html);
                }
            },
            'error': function(xhr) {
                console.log(xhr);
            }
        });
    })

    // Delete Friend - Search Modal
    $(document).on('click', '.removeFriend', function(e){
        e.preventDefault();
        var component = $(this);
        let email_id = $(this).data('email');
        $.ajax({
            'url': '/users/friends/remove_friend/',
            'type': 'POST',
            'data': {
                'email_id': email_id
            },
            'success': function(response) {
                if (response['status'] == 'success') {
                    let html = `<button class="btn btn-sm btn-info float-end text-white font12 mx-1 sendFriendRequest" data-email="${email_id}">+ Add</button>`

                    let parentComponent = component.parent();
                    parentComponent.html(html);
                }
            },
            'error': function(xhr) {
                console.log(xhr);
            }
        });
    })
});