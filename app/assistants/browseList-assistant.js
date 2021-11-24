function BrowseListAssistant(params) {
    this.maxHeightPoster = 80;
    this.maxWidthPoster = 54;
    this.defaultPoster = "images/no-poster-small.png";

    this.page = 1;
    this.params = params;
}

BrowseListAssistant.prototype.setup = function() {
    try {
        //List Models
        this.listModelMovie = { items: [] };

        // setup menu
        this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, menuModel);

        //Controller Elements
        this.listElementMovie = this.controller.get('lst_movies');
        this.spinnerElement = this.controller.get('spinnerActivity');
        this.divMovieHeader = this.controller.get('movieHeader');
        this.overlayScrim = this.controller.get('spinner-scrim');
        this.movieListContainer = this.controller.get('movieListContainer');

        //Handler Elements
        this.listMovieTapHandler = this.lst_moviesTap.bindAsEventListener(this);
        this.listMovieAddHandler = this.lst_moviesAdd.bindAsEventListener(this);

        //Command Menu Model
        this.cmdMenuModel = {
            visible: false,
            items: [
                {},
                {
                    toggleCmd: 'by_date',
                    items: [
                        { icon: "app-icon-filter-date", command: 'by_date' },
                        { icon: "app-icon-filter-alpha", command: 'by_title' },
                        { icon: "app-icon-filter-rating", command: 'by_rating' }
                    ]
                },
                {},
            ]
        };
        if (Mojo.Environment.DeviceInfo.platformVersionMajor >= 3) {
            this.cmdMenuModel.items[1].items.unshift({ label: 'Back', icon: 'back', command: 'cmd-back' })
        }

        //Setup List widgets
        this.controller.setupWidget('lst_movies',
            this.attributes = {
                itemTemplate: "browseList/movieRowTemplate",
                swipeToDelete: false,
                reorderable: false,
                addItemLabel: "Load More Results ...",
                renderLimit: 40,
                lookahead: 40
                    /*,
                        		itemsCallback: this.itemsCallback.bind(this)*/
            },
            this.listModelMovie);

        //Setup Spinner Widget
        this.controller.setupWidget('spinnerActivity',
            this.attributes = {
                spinnerSize: "large"
            },
            this.model = {
                spinning: true
            }
        );

        //Setup command menu
        this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
        //where did this go???
        //this.updateListWithNewItems = this.updateListWithNewItems.bind(this);
    } catch (ex) {
        Mojo.Log.error("Exception in browseList.setup(): ", ex);
    }

};

BrowseListAssistant.prototype.ready = function(event) {
    //tmdbApi.movieBrowse(this.params, this.browseResponse.bind(this), this.browseError.bind(this));
    this.page = 1;
    MovieDB.tmdbApi.movieBrowse(this.params, this.page, this.browseResponse.bind(this), this.browseError.bind(this));
    this.divMovieHeader.innerHTML = this.params.header;
}

BrowseListAssistant.prototype.activate = function(event) {
    this.listElementMovie.addEventListener(Mojo.Event.listTap, this.listMovieTapHandler);
    this.listElementMovie.addEventListener(Mojo.Event.listAdd, this.listMovieAddHandler);
};

BrowseListAssistant.prototype.deactivate = function(event) {
    this.listElementMovie.removeEventListener(Mojo.Event.listTap);
};

BrowseListAssistant.prototype.cleanup = function(event) {};

BrowseListAssistant.prototype.lst_moviesTap = function(event) {
    Mojo.Log.info("----- Movie DB: Movie List Tap: Movie ID: ", event.item.id, "-----");
    this.controller.stageController.pushScene("movieView", event.item.id);
};

BrowseListAssistant.prototype.lst_moviesAdd = function(event) {
    Mojo.Log.info("----- Movie DB: Movie List Add -----");
    this.overlayScrim.show();
    this.spinnerElement.mojo.start();

    this.page++;
    MovieDB.tmdbApi.movieBrowse(this.params, this.page, this.browseResponse.bind(this), this.browseError.bind(this));
};

BrowseListAssistant.prototype.browseResponse = function(response) {
    Mojo.Log.info("----- Movie DB: BrowseList: Movie Response: ", Object.toJSON(response), "-----");
    if (response != undefined && response.responseText != "") {
        var pageCount = response.responseJSON.total_pages;
        var resultCount = response.responseJSON.total_results;
        var jResponse = response.responseJSON.results;
        if (this.page == 1) {
            this.listModelMovie.items.clear();
        }

        Mojo.Log.info("----- Movie DB: BrowseList: Movie Respone: ", Object.toJSON(jResponse), "-----");

        for (var i = 0; i < jResponse.length; i++) {
            var image = this.defaultPoster;
            var width = this.maxWidthPoster;
            var height = this.maxHeightPoster;
            found = false;

            /*
			for (var j = 0; jResponse[i].posters && j < jResponse[i].posters.length && !found; j++) {
                if (jResponse[i].posters[j].image &&  jResponse[i].posters[j].image.size == "thumb") {
                    if (jResponse[i].posters[j].image.url) {
                        image = jResponse[i].posters[j].image.url;
                        found = true;

                        if (jResponse[i].posters[j].image.width && jResponse[i].posters[j].image.height) {
                            var w = jResponse[i].posters[j].image.width;
                            var h = jResponse[i].posters[j].image.height;
                            height = (width * h) / w;

							if (height >= this.maxHeightPoster) {
                                height = this.maxHeightPoster;
                            }
                        }
                    }
                }
            }
            */

            var thisname = jResponse[i].name || jResponse[i].title;

            if (jResponse[i].poster_path && image == this.defaultPoster) {
                image = 'http://image.tmdb.org/t/p/w185/' + jResponse[i].poster_path;
            }


            var releaseDate = "Unavailable";
            if (jResponse[i].release_date) {
                releaseDate = MovieDB.utility.getYear(jResponse[i].release_date);
            }

            var rating = 0;
            if (jResponse[i].vote_average) {
                rating = jResponse[i].vote_average * 10;
            }

            var votes = 0;
            if (jResponse[i].vote_count) {
                votes = jResponse[i].vote_count;
            }

            if (jResponse[i].id && thisname && !jResponse[i].adult) {
                Mojo.Log.info("----- Movie DB: SearchList: Movie: Add to List: ", thisname, ", ", releaseDate, ", ", rating, ", ", image);

                var newItem = {
                    name: thisname,
                    id: jResponse[i].id,
                    release: releaseDate,
                    rating: rating,
                    votes: votes,
                    image: image,
                    width: width,
                    height: height
                };
                this.listModelMovie.items.push(newItem);
            }
        }
    }

    //this.updateListWithNewItems(this.listWidget, this.offset, this.listModelMovie.items.slice(this.offset, this.offset+this.count));
    this.processData();
};

//Error from Ajax Request
BrowseListAssistant.prototype.browseError = function(response) {
    Mojo.Log.error("BrowseList.browseError()");
    if (this.firstStatusError) {
        this.firstStatusError = false;
        Mojo.Log.error("Error from server ==================== %o", $H(response));

        this.spinnerElement.mojo.stop();
        $('overlay-scrim').hide();

        this.controller.showAlertDialog({
            onChoose: function(value) { this.controller.stageController.popScene(); }.bind(this),
            title: $L("Error"),
            message: $L("No Internet Connection Found."),
            choices: [
                { label: $L('Try Again'), type: 'negative' },
            ]
        });
    }
};

BrowseListAssistant.prototype.processData = function(event) {
    var movieListEmpty = true;

    var movieCount = this.listModelMovie.items.length;

    if (movieCount > 1) {
        if (this.listModelMovie != null && this.listModelMovie.items.length > 0) {
            Mojo.Log.info("----- Movie DB: SearchList: Process Data: Movie Count", movieCount, " -----");
            var offset = (this.page - 1) * 10;

            this.listElementMovie.mojo.setLength(movieCount);
            this.listElementMovie.mojo.noticeUpdatedItems(offset, this.listModelMovie.items.slice(offset));
        }

        if (this.page == 1) {
            this.divMovieHeader.show();
            this.movieListContainer.show();
            this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
            this.controller.sceneScroller.mojo.revealTop();
        }

        this.spinnerElement.mojo.stop();
        this.overlayScrim.hide();
    } else {
        Mojo.Log.info("----- Movie DB: SearchList: Process Data: Nothing Found -----");
        this.spinnerElement.mojo.stop();
        this.overlayScrim.hide();

        this.controller.showAlertDialog({
            onChoose: function(value) { this.controller.stageController.popScene(); }.bind(this),
            title: $L("Error"),
            message: $L("No Movies for current Search Criteria"),
            choices: [
                { label: $L('Try Again'), type: 'negative' },
            ]
        });
    }
};

BrowseListAssistant.prototype.handleCommand = function(event) {
    Mojo.Log.info("----- Movie DB: BrowseList: Handle View Command:", event.command);
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case 'cmd-back':
                this.controller.stageController.popScene();
                break;
            case 'by_date':
                this.overlayScrim.show();
                this.spinnerElement.mojo.start();
                this.listModelMovie.items.clear();
                this.controller.modelChanged(this.listModelMovie);
                this.page = 1;

                if (this.params.order_by == "primary_release_date") {
                    if (this.params.order == "desc") {
                        this.params.order = "asc";
                    } else {
                        this.params.order = "desc";
                    }
                } else {
                    this.params.order_by = "primary_release_date";
                    this.params.order = "desc";
                }

                MovieDB.tmdbApi.movieBrowse(this.params, this.page, this.browseResponse.bind(this), this.browseError.bind(this));

                break;

            case 'by_title':
                this.overlayScrim.show();
                this.spinnerElement.mojo.start();
                this.listModelMovie.items.clear();
                this.controller.modelChanged(this.listModelMovie);
                this.page = 1;

                if (this.params.order_by == "title") {
                    if (this.params.order == "desc") {
                        this.params.order = "asc";
                    } else {
                        this.params.order = "desc";
                    }
                } else {
                    this.params.order_by = "title";
                    this.params.order = "asc";
                }

                MovieDB.tmdbApi.movieBrowse(this.params, this.page, this.browseResponse.bind(this), this.browseError.bind(this));

                break;

            case 'by_rating':
                this.overlayScrim.show();
                this.spinnerElement.mojo.start();
                this.listModelMovie.items.clear();
                this.controller.modelChanged(this.listModelMovie);
                this.page = 1;

                if (this.params.order_by == "vote_average") {
                    if (this.params.order == "desc") {
                        this.params.order = "asc";
                    } else {
                        this.params.order = "desc";
                    }
                } else {
                    this.params.order_by = "vote_average";
                    this.params.order = "desc";
                }

                this.params.min_votes = MovieDB.minVotes;

                MovieDB.tmdbApi.movieBrowse(this.params, this.page, this.browseResponse.bind(this), this.browseError.bind(this));

                break;

            default:
                break;
        }
    }
};