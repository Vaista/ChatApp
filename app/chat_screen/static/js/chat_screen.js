$(document).ready (() => {

    var search_page = 1; // Track the current page of Search Result
    var search_isLoading = false; // Track if an AJAX request is in progress
    var search_hasMore = true; // Track if there is more data to load

    function getHTML(data) {
        let html = '';
        data.forEach(function (item) {
            html += `<div class="card mb-3">
                <div class="row g-0">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-8">
                                <h6 class="card-title mb-1">${item['first_name']} ${item['last_name']}</h6>
                                <small class="card-text">${item['email']}</small>
                            </div>
                            <div class="col-4 align-self-center">
                                <button class="btn btn-sm btn-info float-end text-white">+ Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        return html;
    }

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

    // Function to load more content
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
                    console.error(error);
                });
        }
    }

    function emptySearchResult() {
        $("#empty_search").show();
        var cardContainer = $('#searchResult');
        cardContainer.empty(); // Clear existing content
        $('#loading-spinner').addClass('d-none').removeClass('d-flex');
        $("#load-more-search-result").addClass('d-none');
        $('#end-of-results').addClass('d-none');
    }

    // Attach the loadMoreContent function to the button click event
    $('#load-more-button').on('click', loadMoreSearchContent);

    // Prevent Form Submission for Search User
    $("#searchUserForm").on("submit", function(e){
        e.preventDefault();
    });

    // Search User when input is provided
    let timeoutId;
    $('#searchUserForm input').on('keydown', function() {
        // Clear the previous timeout, if any
        clearTimeout(timeoutId);

        // Set a new timeout to trigger the AJAX call after 1.5 seconds of inactivity
        timeoutId = setTimeout(function() {
            search_page = 1
            $('#loading-spinner').addClass('d-flex').removeClass('d-none');
            $('#load-more-search-result').addClass('d-none');
            let search_query = $("#searchUserForm input").val();
            if (search_query.length > 0) {
                $.ajax({
                    'url': '/users/add_friends/search/',
                    'type': 'POST',
                    'data': {
                        'search_query': search_query,
                        'page': search_page
                    },
                    'success': function(response) {
                        if (response['status'] === 'success') {
                            let data = response['data']['data'];
                            search_hasMore = response['data']['has_more'];
                            if (data.length > 0) {
                                var cardContainer = $('#searchResult');
                                cardContainer.empty(); // Clear existing content
                                html = getHTML(data);
                                cardContainer.append(html);
                                $("#load-more-search-result").removeClass('d-none');
                                search_page++;
                                $('#loading-spinner').addClass('d-none').removeClass('d-flex');
                                $("#empty_search").hide();
                                console.log(search_hasMore);
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
                        }
                    },
                    'error': function(xhr) {
                        console.log(xhr);
                    }
                });
            }
            else {
                emptySearchResult();
            }
        }, 800);
    });

});