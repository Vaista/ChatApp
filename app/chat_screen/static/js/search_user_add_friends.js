$(document).ready (() => {

    var sentRequests;
    var receivedRequests;
    var friendList;

    function showFriendList(data) {
        // Update the FriendList Data to show on the frontend
        let friendListContainer = $("#friendListContainer");
        friendListContainer.empty();
        let html = '';
        if (data.length === 0) {
            html += `<div class="card mb-3">
                        <div class="row g-0">
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-12">
                                        <h6 class="card-title text-center text-muted mb-1">You do not have any friends added.</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
        } else {
            data.forEach(function (item) {
                html += `<div class="card mb-3">
                            <div class="row g-0">
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-6">
                                            <h6 class="card-title mb-1">${item.name}</h6>
                                            <small class="card-text">${item.email}</small>
                                        </div>
                                        <div class="col-6 align-self-center">
                                            <button class="btn btn-sm btn-info mx-1 float-end text-white font12 startChat" data-email="${item.email}">Start Chat</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
            });
        }
        friendListContainer.html(html);
    }

    function getSentRequests() {
        $.ajax({
            'url': '/users/friends/sent_requests/',
            'type': 'GET',
            'data': {
                'response_type': 'email',
            },
            'success': function(response) {
                if (response.status == 'success') {
                    sentRequests = response['data'];
                }
            },
            'error': function(xhr) {
                console.log(xhr);
            }
        });
    }

    function getReceivedRequests() {
        $.ajax({
            'url': '/users/friends/received_requests/',
            'type': 'GET',
            'data': {
                'response_type': 'email',
            },
            'success': function(response) {
                if (response.status == 'success') {
                    receivedRequests = response['data'];
                }
            },
            'error': function(xhr) {
                console.log(xhr);
            }
        });
    }

    function getFriendList() {
        $.ajax({
            'url': '/users/friends/friend_list/',
            'type': 'GET',
            'data': {
                'response_type': 'email',
            },
            'success': function(response) {
                if (response.status == 'success') {
                    friendList = response['friends_email'];
                    let data = response['user_friends'];
                    showFriendList(data);
                }
            },
            'error': function(xhr) {
                console.log(xhr);
            }
        });
    }

    getSentRequests();
    getReceivedRequests();
    getFriendList();

    $("#newChatModalBtn").on('click', function(e) {
        getSentRequests();
        getReceivedRequests();
        getFriendList();
    })

    var search_page = 1; // Track the current page of Search Result
    var search_isLoading = false; // Track if an AJAX request is in progress
    var search_hasMore = true; // Track if there is more data to load

    // Function to get HTML when user is searched in Add Friend
    function getHTML(data) {
        let html = '';
        data.forEach(function (item) {
            html += `<div class="card mb-3">
                <div class="row g-0">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-6">
                                <h6 class="card-title mb-1">${item['first_name']} ${item['last_name']}</h6>
                                <small class="card-text">${item['email']}</small>
                            </div>
                            <div class="col-6 align-self-center">`
            if (sentRequests.includes(item.email)) {
                html += `<button class="btn btn-sm btn-info float-end text-white font12 mx-1 sentFriendRequest" data-email="${item['email']}">✓ Sent</button>`
                html += `<button class="btn btn-sm btn-danger float-end text-white font12 mx-1 removeFriendRequest" data-email="${item['email']}">x Delete</button>`
            } else if (receivedRequests.includes(item.email)) {
                html += `<button class="btn btn-sm btn-success float-end text-white font12 mx-1 search_acceptFriendRequest" data-email="${item['email']}">✓ Accept</button>`
                html += `<button class="btn btn-sm btn-danger float-end text-white font12 mx-1 removeFriendRequest" data-email="${item['email']}">x Reject</button>`
            } else if(friendList.includes(item.email)) {
                 html += `<button class="btn btn-sm btn-success pe-none float-end text-white font12 mx-1">Friends</button>
                          <button class="btn btn-sm btn-danger float-end text-white font12 mx-1 removeFriend" data-email="${item['email']}">x Remove</button>`
            } else {
                html += `<button class="btn btn-sm btn-info float-end text-white font12 mx-1 sendFriendRequest" data-email="${item['email']}">+ Add</button>`
            }
            html += `</div></div></div></div></div>`;
        });
        return html;
    }

    // Function to fetch users from backend when user is searched in Add Friend
    function fetchSearchContent(page, query) {
        return new Promise(function(resolve, reject) {
            $.ajax({
                'url': '/users/add_friends/search/',
                'type': 'POST',
                'data': {
                    'search_query': query,
                    'page': page
                },
                'success': function(response) {
                    if (response['status'] == 'success') {
                        resolve(response['data']);
                    }
                },
                'error': function(xhr) {
                    reject(xhr);
                }
            });
        });
    }

    // Function to load more content in Add user Search Section
    function loadMoreSearchContent() {
        if (!search_isLoading && search_hasMore) {
            search_isLoading = true;
            $('#loading-spinner').addClass('d-flex').removeClass('d-none');
            let query = $("#searchUserForm input").val();
            fetchSearchContent(search_page, query)
                .then(function(response) {
                    let data = response.data;
                    let has_more = response.has_more;

                    if (has_more) {
                        let cardContainer = $('#searchResult');
                        let html = getHTML(data);
                        cardContainer.append(html);
                        search_page++; // Increment the page number for the next request
                        search_isLoading = false;
                        $('#loading-spinner').addClass('d-none').removeClass('d-flex');
                        $('#load-more-search-result').show();
                        $('#end-of-results').addClass('d-none');
                    } else {
                        // No more data to load
                        search_hasMore = false;
                        $('#load-more-search-result').hide();
                        $('#end-of-results').removeClass('d-none');
                        search_isLoading = false;
                        $('#loading-spinner').addClass('d-none').removeClass('d-flex');
                    }
                })
                .catch(function(error) {
                    // Handle errors here
                    console.log(error);
                });
        }
    }

    // Function to empty the search result of Add Friend Section
    function emptySearchResult() {
        $("#empty_search").show();
        var cardContainer = $('#searchResult');
        cardContainer.empty(); // Clear existing content
        $('#loading-spinner').addClass('d-none').removeClass('d-flex');
        $("#load-more-search-result").addClass('d-none');
        $('#end-of-results').addClass('d-none');
    }

    // Attach the loadMoreContent function to the button click event on Load more users in Search event of Add Friend Section
    $('#load-more-button').on('click', loadMoreSearchContent);

    // Prevent Form Submission for Search User
    $("#searchUserForm").on("submit", function(e){
        e.preventDefault();
    });

    // Search User when input is provided in Add Friend Section
    let search_friend_timeoutId;
    $('#searchUserForm input').on('keydown', function() {
        // Clear the previous timeout, if any
        clearTimeout(search_friend_timeoutId);

        // Set a new timeout to trigger the AJAX call after 1.5 seconds of inactivity
        search_friend_timeoutId = setTimeout(function() {
            search_page = 1
            var cardContainer = $('#searchResult');
            cardContainer.empty(); // Clear existing content
            $('#loading-spinner').addClass('d-flex').removeClass('d-none');
            $('#load-more-search-result').addClass('d-none');
            let search_query = $("#searchUserForm input").val();
            if (search_query.length > 0) {
                fetchSearchContent(search_page, search_query)
                    .then(function(response) {
                        let data = response['data'];
                        search_hasMore = response['has_more'];
                        if (data.length > 0) {
                            html = getHTML(data);
                            cardContainer.append(html);
                            $("#load-more-search-result").removeClass('d-none');
                            search_page++;
                            $('#loading-spinner').addClass('d-none').removeClass('d-flex');
                            $("#empty_search").hide();
                            if (search_hasMore) {
                                $("#load-more-search-result").removeClass('d-none');
                                $("#end-of-results").addClass('d-none');
                            } else {
                                $("#load-more-search-result").addClass('d-none');
                                $("#end-of-results").removeClass('d-none');
                            }
                        } else {
                            emptySearchResult();
                        }
                    })
                    .catch(function(error) {
                        // Handle errors here
                         console.log(error);
                    });
            }
            else {
                emptySearchResult();
            }
        }, 800);
    });

    // Refresh Friend Requests when Nav Bar between Modal is Clicked
    $("#searchUserModal .nav-item a, #receivedRequestModal .nav-item a").on('click', function(e) {
        getSentRequests();
        getReceivedRequests();
        getFriendList();
    })
});
