function MultiListAssistant(params) {
    this.maxHeightPoster = 80;
    this.maxWidthPoster = 54;
    this.defaultPoster = "images/no-poster-small.png";

    this.page = 1;
    this.listType = params ? params : "now_playing";
}

MultiListAssistant.prototype.setup = function() {
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
        if (Mojo.Environment.DeviceInfo.platformVersionMajor >= 3) {
            this.cmdMenuModel = {
                visible: false,
                items: [
                    {},
                    {
                        toggleCmd: this.listType,
                        items: [
                            { label: $L('Back'), icon: "back", command: "cmd-back" },
                            { label: $L('Now Playing'), command: "now_playing" },
                            { label: $L('Coming Soon'), command: "upcoming" },
                            { label: $L('Top Rated'), command: 'top_rated' }
                        ]
                    },
                    {},
                ]
            };
        } else {
            this.cmdMenuModel = {
                visible: false,
                items: [
                    {},
                    {
                        toggleCmd: this.listType,
                        items: [
                            { label: $L('Now Playing'), iconPath: "images/film.png", command: "now_playing" },
                            { label: $L('Coming Soon'), iconPath: "images/cut.png", command: "upcoming" },
                            { label: $L('Top Rated'), icon: "app-icon-filter-rating", command: 'top_rated' }
                        ]
                    },
                    {},
                ]
            };
        }

        //Setup List widgets
        this.controller.setupWidget('lst_movies',
            this.attributes = {
                itemTemplate: "browseList/movieRowTemplate", //Re-using template - really they should all be the same
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
        Mojo.Log.error("Exception in MultiList.setup(): ", ex);
    }

};

MultiListAssistant.prototype.ready = function(event) {
    //tmdbApi.movieBrowse(this.params, this.browseResponse.bind(this), this.browseError.bind(this));
    this.page = 1;
    MovieDB.tmdbApi.movieGetNowPlaying(this.listType, this.page, this.browseResponse.bind(this), this.browseError.bind(this));
    Mojo.Log.info("***** List Type: " + this.listType);
    switch (this.listType) {
        case 'now_playing':
            this.divMovieHeader.innerHTML = 'Now Playing';
            break;

        case 'top_rated':
            this.divMovieHeader.innerHTML = 'Top Rated';
            break;

        case 'upcoming':
            this.divMovieHeader.innerHTML = 'Coming Soon';
            break;

        default:
            break;
    }


}

MultiListAssistant.prototype.activate = function(event) {
    this.listElementMovie.addEventListener(Mojo.Event.listTap, this.listMovieTapHandler);
    this.listElementMovie.addEventListener(Mojo.Event.listAdd, this.listMovieAddHandler);
};

MultiListAssistant.prototype.deactivate = function(event) {
    this.listElementMovie.removeEventListener(Mojo.Event.listTap);
};

MultiListAssistant.prototype.cleanup = function(event) {};

MultiListAssistant.prototype.lst_moviesTap = function(event) {
    Mojo.Log.info("----- Movie DB: Movie List Tap: Movie ID: ", event.item.id, "-----");
    this.controller.stageController.pushScene("movieView", event.item.id);
};

MultiListAssistant.prototype.lst_moviesAdd = function(event) {
    Mojo.Log.info("----- Movie DB: Movie List Add -----");
    this.overlayScrim.show();
    this.spinnerElement.mojo.start();

    this.page++;
    MovieDB.tmdbApi.movieGetNowPlaying(this.listType, this.page, this.browseResponse.bind(this), this.browseError.bind(this));
};

MultiListAssistant.prototype.browseResponse = function(response) {
    Mojo.Log.info("----- Movie DB: MultiList: Movie Respone: ", Object.toJSON(response), "-----");
    if (response != undefined && response.responseText != "") {
        var pageCount = response.responseJSON.total_pages;
        var resultCount = response.responseJSON.total_results;
        var jResponse = response.responseJSON.results;
        if (this.page == 1) {
            this.listModelMovie.items.clear();
        }

        Mojo.Log.info("----- Movie DB: MultiList: Movie Respone: ", Object.toJSON(jResponse), "-----");

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
            if (jResponse[i].votes) {
                votes = jResponse[i].votes;
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
MultiListAssistant.prototype.browseError = function(response) {
    Mojo.Log.error("MultiList.browseError()");
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
    this.spinnerElement.mojo.stop();
    this.overlayScrim.hide();
};

MultiListAssistant.prototype.processData = function(event) {
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

MultiListAssistant.prototype.handleCommand = function(event) {
    Mojo.Log.info("----- Movie DB: MultiList: Handle View Command:", event.command);
    this.listType = event.command;
    switch (this.listType) {
        case 'cmd-back':
            this.controller.stageController.popScene();
            break;
        case 'now_playing':
            this.divMovieHeader.innerHTML = 'Now playing';
            break;

        case 'top_rated':
            this.divMovieHeader.innerHTML = 'Top rated movies';
            break;

        case 'upcoming':
            this.divMovieHeader.innerHTML = 'Upcoming movies';
            break;

        default:
            break;
    }

    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case 'now_playing':
                this.overlayScrim.show();
                this.spinnerElement.mojo.start();
                this.listModelMovie.items.clear();
                this.controller.modelChanged(this.listModelMovie);
                this.page = 1;

                MovieDB.tmdbApi.movieGetNowPlaying(this.listType, this.page, this.browseResponse.bind(this), this.browseError.bind(this));

                break;

            case 'upcoming':
                this.overlayScrim.show();
                this.spinnerElement.mojo.start();
                this.listModelMovie.items.clear();
                this.controller.modelChanged(this.listModelMovie);
                this.page = 1;

                MovieDB.tmdbApi.movieGetNowPlaying(this.listType, this.page, this.browseResponse.bind(this), this.browseError.bind(this));

                break;

            case 'top_rated':
                this.overlayScrim.show();
                this.spinnerElement.mojo.start();
                this.listModelMovie.items.clear();
                this.controller.modelChanged(this.listModelMovie);
                this.page = 1;

                MovieDB.tmdbApi.movieGetNowPlaying(this.listType, this.page, this.browseResponse.bind(this), this.browseError.bind(this));

                break;

            default:
                break;
        }
    }
};