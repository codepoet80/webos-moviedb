function SearchListAssistant(searchVal) {
    this.maxHeightPoster = 80;
    this.maxWidthPoster = 54;
    this.defaultPoster = "images/no-poster-small.png";

    this.maxHeightProfile = 60;
    this.maxWidthProfile = 40;
    this.defaultProfile = "images/no-profile-small.png";

    this.searchVal = searchVal;
    this.movieResponseDone = false;
    this.castResponseDone = false;

    this.firstStatusError = true;

    this.currentViewScrollPosition = null;
};

SearchListAssistant.prototype.setup = function() {
    //List Models
    this.listModelMovie = { items: [] };
    this.listModelCast = { items: [] };

    // setup menu
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, menuModel);

    //Controller Elements
    this.listElementMovie = this.controller.get('lst_movies');
    this.listElementCast = this.controller.get('lst_cast');
    this.spinnerElement = this.controller.get('spinnerActivity');
    this.movieListContainer = this.controller.get('movieListContainer');
    this.castListContainer = this.controller.get('castListContainer');
    this.overlayScrim = this.controller.get('spinner-scrim');

    //Handler Elements
    this.listMovieTapHandler = this.lst_moviesTap.bindAsEventListener(this);
    this.listCastTapHandler = this.lst_castTap.bindAsEventListener(this);

    //Setup the Top Menu Model
    this.topMenuModel = {
        visible: false,
        items: [
            {},
            {
                label: 'Movies / Cast & Crew',
                toggleCmd: "cmdMovies",
                items: [
                    { label: $L('Movies'), command: "cmdMovies", width: 160 },
                    { label: $L('Cast & Crew'), command: "cmdCast", width: 160 }
                ]
            }, {}
        ]
    };
    //Command Menu Model
    if (Mojo.Environment.DeviceInfo.platformVersionMajor >= 3) {
        Mojo.Log.info("***** show back menu!")
        this.cmdMenuModel = {
            items: [
                { label: 'Back', icon: 'back', command: 'cmd-back' },
            ]
        };
        this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);
    }

    //Setup List widgets
    this.controller.setupWidget('lst_movies',
        this.attributes = {
            itemTemplate: 'searchList/movieRowTemplate',
            swipeToDelete: false,
            reorderable: false,
            renderLimit: 150,
            lookahead: 100
        },
        this.listModelMovie
    );

    this.controller.setupWidget('lst_cast',
        this.attributes = {
            itemTemplate: 'searchList/castRowTemplate',
            swipeToDelete: false,
            reorderable: false,
            renderLimit: 150,
            lookahead: 100
        },
        this.listModelCast
    );

    //Setup Spinner Widget
    this.controller.setupWidget('spinnerActivity',
        this.attributes = {
            spinnerSize: "large"
        },
        this.model = {
            spinning: true
        }
    );

    //Setup top View Menu
    this.controller.setupWidget(Mojo.Menu.viewMenu, { spacerHeight: 0 }, this.topMenuModel);
};

SearchListAssistant.prototype.ready = function(event) {
    MovieDB.tmdbApi.movieSearch(this.searchVal, this.movieResponse.bind(this), this.searchError.bind(this));
    MovieDB.tmdbApi.personSearch(this.searchVal, this.personResponse.bind(this), this.searchError.bind(this));
};

SearchListAssistant.prototype.activate = function(event) {
    this.listElementMovie.addEventListener(Mojo.Event.listTap, this.listMovieTapHandler);
    this.listElementCast.addEventListener(Mojo.Event.listTap, this.listCastTapHandler);

    if (this.currentViewScrollPosition) {
        this.controller.sceneScroller.mojo.setState(this.currentViewScrollPosition);
    }
};

SearchListAssistant.prototype.deactivate = function(event) {
    this.listElementMovie.removeEventListener(Mojo.Event.listTap);
    this.listElementCast.removeEventListener(Mojo.Event.listTap);

    this.currentViewScrollPosition = this.controller.sceneScroller.mojo.getState();
};

SearchListAssistant.prototype.cleanup = function(event) {
    this.currentViewScrollPosition = null;
};

SearchListAssistant.prototype.lst_moviesTap = function(event) {
    Mojo.Log.info("----- Movie DB: Movie List Tap: Movie ID: ", event.item.id);
    this.controller.stageController.pushScene("movieView", event.item.id);
};

SearchListAssistant.prototype.lst_castTap = function(event) {
    Mojo.Log.info("----- Movie DB: People List Tap: Person ID: ", event.item.id);
    this.controller.stageController.pushScene("castView", event.item.id);
};

SearchListAssistant.prototype.movieResponse = function(response) {
    Mojo.Log.info("----- Movie DB: SearchList: Movie Respone: ", Object.toJSON(response), " -----");
    if (response != undefined && response.responseText != "") {
        var resp1 = response.responseJSON;
        var jResponse = null; //response.responseJSON;
        var resultCount = resp1.total_results;
        if (resp1.results) {
            jResponse = resp1.results;
        }
        if (jResponse) {
            this.listModelMovie.items.clear();
            Mojo.Log.info("----- Movie DB: response length: " + jResponse.length + ", " + resultCount);
            Mojo.Log.info("----- Movie DB: SearchList: Movie Respone: ", Object.toJSON(jResponse), " -----");

            for (var i = 0; i < jResponse.length; i++) {
                var duplicate = false;
                for (var j = 0; j < this.listModelMovie.items.length; j++) {
                    if (jResponse[i].id == this.listModelMovie.items[j].id) {
                        duplicate = true
                        break;
                    }
                }
                Mojo.Log.info("Duplicate:" + duplicate);

                if (!duplicate) {
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

                    if (jResponse[i].poster_path) {
                        image = 'http://image.tmdb.org/t/p/w92/' + jResponse[i].poster_path;
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

                    if (jResponse[i].id && jResponse[i].title && !jResponse[i].adult) {
                        //Mojo.Log.info("----- Movie DB: SearchList: Movie: Add to List: ",jResponse[i].title,", ",releaseDate,", ", rating,", ",image);

                        var newItem = {
                            name: jResponse[i].title,
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
        } //if jResponse
    } //responseText != ""

    this.movieResponseDone = true;
    if (this.castResponseDone) {
        this.processData();
    }
};

SearchListAssistant.prototype.personResponse = function(response) {
    Mojo.Log.info("----- Movie DB: SearchList: Person Response: ", Object.toJSON(response), " -----");
    if (response != undefined && response.responseText != "") {
        //var jResponse = response.responseJSON;
        var resp1 = response.responseJSON;
        var jResponse = null; //response.responseJSON;
        var resultCount = resp1.total_results;
        if (resp1.results) {
            jResponse = resp1.results;
        }
        this.listModelCast.items.clear();
        Mojo.Log.info("----- Movie DB: SearchList: Person Response: ", Object.toJSON(jResponse), " -----");

        for (var i = 0; i < jResponse.length; i++) {
            var duplicate = false;
            for (var j = 0; j < this.listModelCast.items.length; j++) {
                if (jResponse[i].id == this.listModelCast.items[j].id) {
                    duplicate = true
                    break;
                }
            }

            if (!duplicate) {
                var image = this.defaultProfile;
                var width = this.maxWidthProfile;
                var height = this.maxHeightProfile;
                var name = jResponse[i].name;
                var id = jResponse[i].id;
                var found = false;

                for (var j = 0; jResponse[i].profile && j < jResponse[i].profile.length && !found; j++) {
                    if (jResponse[i].profile[j].image && jResponse[i].profile[j].image.size == "thumb") {
                        if (jResponse[i].profile[j].image.url) {
                            image = jResponse[i].profile[j].image.url;
                            found = true;

                            if (jResponse[i].profile[j].image.width && jResponse[i].profile[j].image.height) {
                                var w = jResponse[i].profile[j].image.width;
                                var h = jResponse[i].profile[j].image.height;
                                height = (width * h) / w;

                                if (height >= this.maxHeightProfile) {
                                    height = this.maxHeightProfile;
                                }
                            }
                        }
                    }
                }

                if (jResponse[i].id && jResponse[i].name) {
                    //Mojo.Log.info("----- Movie DB: SearchList: Movie: Add to List: ",jResponse[i].id,", ",jResponse[i].name,", ",image);

                    var newItem = {
                        id: jResponse[i].id,
                        name: jResponse[i].name,
                        image: image,
                        width: this.maxWidthProfile,
                        height: this.maxHeightProfile
                    };

                    this.listModelCast.items.push(newItem);
                }
            }
        }
    }

    this.castResponseDone = true;
    if (this.movieResponseDone) {
        this.processData();
    }
};

//Error from Ajax Request
SearchListAssistant.prototype.searchError = function(response) {
    if (this.firstStatusError) {
        this.firstStatusError = false;
        Mojo.Log.error("Error from server ==================== %o", $H(response));
        Mojo.Log.error("Request url " + response.request.URL);

        this.spinnerElement.mojo.stop();
        this.overlayScrim.hide();

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

SearchListAssistant.prototype.processData = function(event) {
    var peopleListEmpty = true;
    var movieListEmpty = true;

    var movieCount = this.listModelMovie.items.length;
    var castCount = this.listModelCast.items.length;

    Mojo.Log.info("----- Movie DB: SearchList: Process Data: Movie Count", movieCount, " -----");
    Mojo.Log.info("----- Movie DB: SearchList: Process Data: Cast Count", castCount, " -----");

    if ((movieCount + castCount) > 1) {
        if (this.listModelCast != null && this.listModelCast.items.length > 0) {
            this.listElementCast.mojo.noticeUpdatedItems(0, this.listModelCast.items);
            this.listElementCast.mojo.setLength(this.listModelCast.items.length);
            peopleListEmpty = false;
        }

        if (this.listModelMovie != null && this.listModelMovie.items.length > 0) {
            this.listElementMovie.mojo.noticeUpdatedItems(0, this.listModelMovie.items);
            this.listElementMovie.mojo.setLength(this.listModelMovie.items.length);
            movieListEmpty = false;
        }

        if (movieListEmpty && !peopleListEmpty) {
            this.topMenuModel.items[0].toggleCmd = "cmdCast";
            this.controller.modelChanged(this.topMenuModel);

            this.movieListContainer.hide();
            this.controller.hideWidgetContainer(this.movieListContainer);
            this.castListContainer.show();
            this.controller.showWidgetContainer(this.castListContainer);
        } else {
            this.castListContainer.hide();
            this.controller.hideWidgetContainer(this.castListContainer);
            this.movieListContainer.show();
            this.controller.showWidgetContainer(this.movieListContainer);
        }

        this.spinnerElement.mojo.stop();
        this.overlayScrim.hide();
        this.controller.setMenuVisible(Mojo.Menu.viewMenu, true);
    } else if (movieCount == 1) {
        Mojo.Log.info("----- Movie DB: SearchList: Swap Scene", this.listModelMovie.items[0].id, "-----");
        this.controller.stageController.swapScene({ name: 'movieView', transition: Mojo.Transition.none }, this.listModelMovie.items[0].id);
    } else if (castCount == 1) {
        Mojo.Log.info("----- Movie DB: SearchList: Swap Scene", this.listModelCast.items[0].id, "-----");
        this.controller.stageController.swapScene({ name: 'castView', transition: Mojo.Transition.none }, this.listModelCast.items[0].id);
    } else {
        Mojo.Log.info("----- Movie DB: SearchList: Process Data: Nothing Found -----");
        this.spinnerElement.mojo.stop();
        this.overlayScrim.hide();

        this.controller.showAlertDialog({
            onChoose: function(value) { this.controller.stageController.popScene(); }.bind(this),
            title: $L("Error"),
            message: $L("No Movies, Cast or Crew found for current Search Criteria"),
            choices: [
                { label: $L('Try Again'), type: 'negative' },
            ]
        });
    }
};

SearchListAssistant.prototype.handleCommand = function(event) {
    Mojo.Log.info("----- Movie DB: SearchList: Handle View Menu Command:", event.command);
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case 'cmd-back':
                this.controller.stageController.popScene();
                break;
            case 'cmdMovies':
                this.castListContainer.hide();
                this.controller.hideWidgetContainer(this.castListContainer);
                this.movieListContainer.show();
                this.controller.showWidgetContainer(this.movieListContainer);
                Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();
                break;

            case 'cmdCast':
                this.movieListContainer.hide();
                this.controller.hideWidgetContainer(this.movieListContainer);
                this.castListContainer.show();
                this.controller.showWidgetContainer(this.castListContainer);
                Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();
                break;
        }
    }
};