function MovieViewAssistant(movieID, mediatype) {
    this.movieID = movieID;
    this.mediatype = mediatype ? mediatype : "movie";
    this.movieJSON = null;
    this.posterJSON = null;
    this.backdropJSON = null;
    this.genresJSON = null;
    this.castJSON = null;
    this.countryJSON = null;
    this.studioJSON = null;
    this.defaultPoster = "images/no-poster.png";
    this.defaultProfile = "images/no-profile-small.png";
    this.maxHeightPoster = 166;
    this.maxWidthPoster = 112;
    this.maxHeightProfile = 60;
    this.maxWidthProfile = 40;
    this.currentToggle = "cmd-details";
    this.currentViewScrollPosition = null;
}

MovieViewAssistant.prototype.setup = function() {
    //List Models
    this.overviewModel = { items: [] };
    this.actorsModel = { items: [] };
    this.crewModel = { items: [] };
    this.studioModel = { items: [] };
    this.genreModel = { items: [] };
    this.detailsModel = { items: [] };
    this.mediaSubmenuModel = { items: [] };
    this.shareSubmenuModel = { items: [] };

    //Setup the Command Menu
    this.cmdMenuModel = {
        visible: false,
        items: [
            {},
            {
                label: $L('Views'),
                toggleCmd: 'cmd-details',
                items: [
                    { label: $L('Details'), command: 'cmd-details' },
                    { label: $L('People'), command: 'cmd-people' },
                    { label: $L('Media'), /*icon: 'menu-media',*/ command: 'cmd-media' }
                ]
            },
            {},
        ]
    };
    if (Mojo.Environment.DeviceInfo.platformVersionMajor >= 3) {
        this.cmdMenuModel.items[1].items.unshift({ label: 'Back', icon: 'back', command: 'cmd-back' })
    }

    // setup menu
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, menuModel);
    this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel);

    //Div Group Elements
    this.divTitle = this.controller.get('movieView-title');
    this.divPoster = this.controller.get('movieView-poster');
    this.divStars = this.controller.get('movieView-stars');
    this.divGenreWrapper = this.controller.get('genres-wrapper');
    this.divBody = this.controller.get('movieView');
    this.divActorGroup = this.controller.get('actors-group');
    this.divCrewGroup = this.controller.get('crew-group');
    this.divDetailsWrapper = this.controller.get('details-wrapper');
    this.divPeopleWrapper = this.controller.get('people-wrapper');

    this.spanRating = this.controller.get('movieView-rating');
    this.spanReleased = this.controller.get('movieView-released');
    this.spanRuntime = this.controller.get('movieView-runtime');
    this.spanCertification = this.controller.get('movieView-certification');
    this.spanGenres = this.controller.get('movieView-genres');
    this.spinnerElement = this.controller.get('spinnerActivity');
    this.overviewElement = this.controller.get('lst_overview');
    this.actorsElement = this.controller.get('lst_actors');
    this.crewElement = this.controller.get('lst_crew');
    this.detailsElement = this.controller.get('lst_details');

    this.btnIMDB = this.controller.get('btn_imdb');
    this.btnShare = this.controller.get('btn_share');
    this.overlayScrim = this.controller.get('spinner-scrim');

    //Handler Elments
    this.listCastTapHandler = this.lst_castTap.bindAsEventListener(this);
    this.imgTapHandler = this.img_tap.bindAsEventListener(this);
    this.btnImdbHandler = this.btn_imdbTap.bindAsEventListener(this);
    this.btnShareHandler = this.btn_shareTap.bindAsEventListener(this);

    /* setup widgets here */
    this.controller.setupWidget('spinnerActivity',
        this.attributes = {
            spinnerSize: "large"
        },
        this.model = {
            spinning: true
        }
    );

    this.controller.setupWidget('btn_share',
        this.attributes = {},
        this.model = {
            buttonClass: 'reviews-button',
            buttonLabel: $L("Share")
        }
    );

    this.controller.setupWidget('btn_imdb',
        this.attributes = {},
        this.model = {
            buttonClass: 'reviews-button',
            buttonLabel: $L("IMDB")
        }
    );

    // Set up the list widget with templates for the items, their dividers & the list container.
    this.controller.setupWidget('lst_overview',
        this.attributes = {
            itemTemplate: 'movieView/overviewTemplate',
            emptyTemplate: 'movieView/emptyOverviewTemplate',
            swipeToDelete: false,
            reorderable: false,
            renderLimit: 20
        },
        this.overviewModel
    );

    this.controller.setupWidget('lst_details',
        this.attributes = {
            itemTemplate: 'movieView/detailsTemplate',
            emptyTemplate: 'movieView/emptyDetailsTemplate',
            swipeToDelete: false,
            reorderable: false,
            renderLimit: 20
        },
        this.detailsModel
    );

    this.controller.setupWidget('lst_actors',
        this.attributes = {
            itemTemplate: 'movieView/actorTemplate',
            emptyTemplate: 'movieView/emptyActorTemplate',
            swipeToDelete: false,
            reorderable: false,
            renderLimit: 100
        },
        this.actorsModel
    );

    this.controller.setupWidget('lst_crew',
        this.attributes = {
            itemTemplate: 'movieView/crewTemplate',
            emptyTemplate: 'movieView/emptyCrewTemplate',
            swipeToDelete: false,
            reorderable: false,
            renderLimit: 100
        },
        this.crewModel
    );

    this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
};

MovieViewAssistant.prototype.ready = function(event) {
    MovieDB.tmdbApi.movieGetInfo(this.movieID, this.mediatype, this.getInfoResponse.bind(this), this.getInfoError.bind(this));
};

MovieViewAssistant.prototype.activate = function(event) {
    this.actorsElement.addEventListener(Mojo.Event.listTap, this.listCastTapHandler);
    this.crewElement.addEventListener(Mojo.Event.listTap, this.listCastTapHandler);
    this.divPoster.addEventListener(Mojo.Event.tap, this.imgTapHandler);
    this.btnIMDB.addEventListener(Mojo.Event.tap, this.btnImdbHandler);
    this.btnShare.addEventListener(Mojo.Event.tap, this.btnShareHandler);

    if (this.currentViewScrollPosition) {
        this.controller.sceneScroller.mojo.setState(this.currentViewScrollPosition);
    }
};

MovieViewAssistant.prototype.deactivate = function(event) {
    this.actorsElement.removeEventListener(Mojo.Event.listTap);
    this.crewElement.removeEventListener(Mojo.Event.listTap);
    this.divPoster.removeEventListener(Mojo.Event.tap);
    this.btnIMDB.removeEventListener(Mojo.Event.tap);
    this.btnShare.addEventListener(Mojo.Event.tap);

    this.currentViewScrollPosition = this.controller.sceneScroller.mojo.getState();
};

MovieViewAssistant.prototype.cleanup = function(event) {
    this.currentViewScrollPosition = null;
};

//Event triggered when the list is tapped
MovieViewAssistant.prototype.lst_castTap = function(event) {
    Mojo.Log.info("----- Movie DB: Movie View: Cast Tap ID:", event.item.id, " -----");
    this.controller.stageController.pushScene('castView', event.item.id);
};

//Event trigger by tapping on the poster
MovieViewAssistant.prototype.img_tap = function(event) {
    Mojo.Log.info("----- Movie DB: Movie View: Poster Tapped -----");
    this.showPopup(event, this.mediaSubmenuModel.items);
};

MovieViewAssistant.prototype.btn_imdbTap = function(event) {
    if (this.movieJSON.imdb_id && this.movieJSON.imdb_id.length > 0) {
        var url = MovieDB.utility.getIMDBTitleUrl(this.movieJSON.imdb_id);
    } else {
        var useTitle = this.movieJSON.title || this.movieJSON.original_title
        var url = MovieDB.utility.getIMDBSearchTitleUrl(useTitle);
    }

    Mojo.Log.info("----- Movie DB: Movie View: IMDB Link Tapped:", url, "-----");

    this.controller.serviceRequest("palm://com.palm.applicationManager", {
        method: "open",
        parameters: {
            id: 'com.palm.app.browser',
            params: {
                target: url
            }
        }
    });
};

MovieViewAssistant.prototype.btn_shareTap = function(event) {
    if (this.shareSubmenuModel.items.length == 0) {
        if (this.movieJSON.imdb_id && this.movieJSON.imdb_id.length > 0) {
            this.shareSubmenuModel = {
                items: [{
                    label: $L('TMDb Link'),
                    items: [
                        { label: $L('via Email'), command: 'share-tmdbEmail' },
                        { label: $L('via Text Message'), command: 'share-tmdbText' }
                    ]
                }, {
                    label: $L('IMDB Link'),
                    items: [
                        { label: $L('via Email'), disabled: false, command: 'share-imdbEmail' },
                        { label: $L('via Text Message'), disabled: false, command: 'share-imdbText' }
                    ]
                }, {
                    label: $L('Both Links'),
                    items: [
                        { label: $L('via Email'), command: 'share-bothEmail' },
                        { label: $L('via Text Message'), command: 'share-bothText' }
                    ]
                }]
            };
        } else {
            this.shareSubmenuModel = {
                items: [
                    { label: $L('Email'), command: 'share-tmdbEmail' },
                    { label: $L('Text Message'), command: 'share-tmdbText' }
                ]
            };
        }
    }

    Mojo.Log.info("----- Movie DB: Movie View: Show Share Popup", Object.toJSON(this.shareSubmenuModel.items), "-----");

    if (this.shareSubmenuModel.items.length > 0) {
        this.showPopup(event, this.shareSubmenuModel.items);
    }
};

//Show the Popup Menu
MovieViewAssistant.prototype.showPopup = function(event, items) {
    Mojo.Log.info("----- Movie DB: Movie View: Show Media Popup", Object.toJSON(items), "-----");
    var source = event.target || event.srcElement;
    if (items.length > 0) {
        this.controller.popupSubmenu({
            onChoose: this.popupHandler,
            placeNear: source,
            items: items
        });
    }
};

//Handle Menu Button Press
MovieViewAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        Mojo.Log.info("----- Movie DB: Movie View: Menu Tapped:", event.command, "-----");
        switch (event.command) {
            case 'cmd-back':
                this.controller.stageController.popScene();
                break;
            case 'cmd-details':
                this.divPeopleWrapper.hide();
                this.controller.hideWidgetContainer(this.divPeopleWrapper);
                this.divDetailsWrapper.show();
                this.controller.showWidgetContainer(this.divDetailsWrapper);
                this.currentToggle = 'cmd-details';
                Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();
                break;

            case 'cmd-people':
                this.divDetailsWrapper.hide();
                this.controller.hideWidgetContainer(this.divDetailsWrapper);
                this.divPeopleWrapper.show();
                this.controller.showWidgetContainer(this.divPeopleWrapper);
                this.currentToggle = 'cmd-people';
                Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();
                break;

            case 'cmd-media':
                this.showPopup(event, this.mediaSubmenuModel.items);
                this.cmdMenuModel.items[1].toggleCmd = this.currentToggle;
                this.controller.modelChanged(this.cmdMenuModel);
                break;

        }
    }
};

//Handle the Popup Menu
MovieViewAssistant.prototype.popupHandler = function(command) {
    Mojo.Log.info("----- Movie DB: Movie View: Popup Tapped:", command, "-----");
    switch (command) {
        case 'view-posters':
            this.handlePosterView();
            break;
        case 'view-backdrops':
            this.handleBackdropView();
            break;
        case 'view-trailer':
            this.handleTrailerView();
            break;
        case 'search-trailer':
            this.handleTrailerSearch();
            break;
        case 'share-tmdbEmail':
            this.handleShareEmail('tmdb');
            break;
        case 'share-imdbEmail':
            this.handleShareEmail('imdb');
            break;
        case 'share-bothEmail':
            this.handleShareEmail('both');
            break;
        case 'share-tmdbText':
            this.handleShareText('tmdb');
            break;
        case 'share-imdbText':
            this.handleShareText('imdb');
            break;
        case 'share-bothText':
            this.handleShareText('both');
            break;
    }
};

MovieViewAssistant.prototype.handlePosterView = function(event) {
    Mojo.Log.info("----- Movie DB: Movie View: Handle Poster View -----");
    var images = { items: [] };

    for (var i = 0; this.posterJSON && i < this.posterJSON.length; i++) {
        //if (this.posterJSON[i].image && this.posterJSON[i].image.size == "mid") {
        if (this.posterJSON[i].file_path) {
            var imagePoster = this.posterJSON[i].file_path;
            var imageThumb = imagePoster;

            //if ((i+1) <= this.posterJSON.length && this.posterJSON[i+1].image.size == "cover" && this.posterJSON[i+1].image.url) {
            //    imageThumb = this.posterJSON[i+1].image.url;
            //}

            var newItem = {
                url: 'http://image.tmdb.org/t/p/w500' + imagePoster,
                thumb: 'http://image.tmdb.org/t/p/w185' + imageThumb
            };

            images.items.push(newItem);
        }
        //}
    }
    Mojo.Log.info("loaded posters: " + Object.toJSON(images));
    if (images.items.length == 0 && this.movieJSON.poster_path) {
        Mojo.Log.info("No posters returned, adding default poster");
        var image = this.movieJSON.poster_path;
        var newItem = {
            url: 'http://image.tmdb.org/t/p/w500' + image,
            thumb: 'http://image.tmdb.org/t/p/w185' + image,
        };
        images.items.push(newItem);
    }

    if (images.items.length > 0) {
        var useTitle = this.movieJSON.title || this.movieJSON.original_title
        this.controller.stageController.pushScene('fullImage', images.items, useTitle);
    }
};

MovieViewAssistant.prototype.handleBackdropView = function(event) {
    Mojo.Log.info("----- Movie DB: Movie View: Handle Backdrop View -----");
    var images = { items: [] };

    for (var i = 0; this.backdropJSON && i < this.backdropJSON.length; i++) {
        //if (this.backdropJSON[i].image && this.backdropJSON[i].image.size == "poster") {
        if (this.backdropJSON[i].file_path) {
            var imageBackdrop = this.backdropJSON[i].file_path;
            var imageThumb = imageBackdrop;

            //if ((i+1) <= this.backdropJSON.length && this.backdropJSON[i+1].image.size == "thumb" && this.backdropJSON[i+1].image.url) {
            //    imageThumb = this.backdropJSON[i+1].image.url;
            //}

            var newItem = {
                url: 'http://image.tmdb.org/t/p/w500' + imageBackdrop,
                thumb: 'http://image.tmdb.org/t/p/w185' + imageThumb
            };

            images.items.push(newItem);
        }
        //}
    }
    Mojo.Log.info("loaded backdrops: " + Object.toJSON(images));

    var useTitle = this.movieJSON.title || this.movieJSON.original_title
    this.controller.stageController.pushScene('fullImage', images.items, useTitle);
};

MovieViewAssistant.prototype.handleTrailerView = function(event) {
    Mojo.Log.info("----- Movie DB: Movie View: Handle Trailer View:", this.movieJSON.trailer, "-----");
    if (this.movieJSON.trailer) {
        this.controller.serviceRequest("palm://com.palm.applicationManager", {
            method: "launch",
            parameters: {
                id: "com.jonandnic.metube",
                params: {
                    target: this.movieJSON.trailer,
                    direct: false
                }
            },
            onFailure: function(response) {
                this.ShowDialogBox("MeTube Not Found", "Install MeTube from App Museum II to search for and play trailers on your webOS device!");
            }.bind(this)
        });
    }
};

MovieViewAssistant.prototype.handleTrailerSearch = function(event) {
    Mojo.Log.info("----- Movie DB: Movie View: Handle Trailer Search -----");
    var useTitle = this.movieJSON.title || this.movieJSON.original_title;
    //this.overviewElement.innerText = JSON.stringify(this.movieJSON);

    Mojo.Log.info("Launching trailer search for title: " + useTitle);
    this.controller.serviceRequest('palm://com.palm.applicationManager', {
        method: 'launch',
        parameters: {
            id: "com.jonandnic.metube",
            params: {
                query: useTitle + " trailer"
            }
        },
        onFailure: function(response) {
            this.ShowDialogBox("MeTube Not Found", "Install MeTube from App Museum II to search for and play trailers on your webOS device!");
        }.bind(this)
    });
};

MovieViewAssistant.prototype.ShowDialogBox = function(title, message) {
    var stageController = Mojo.Controller.getAppController().getActiveStageController();
    if (stageController) {
        this.controller = stageController.activeScene();

        this.controller.showAlertDialog({
            onChoose: function(value) {},
            title: title,
            message: message,
            choices: [{ label: 'OK', value: 'OK' }],
            allowHTMLMessage: true
        });
    }
}

MovieViewAssistant.prototype.handleShareEmail = function(linkType) {
    var message = "Here's a movie I think you would like: ";
    var useTitle = this.movieJSON.title || this.movieJSON.original_title
    var useURL = this.movieJSON.url || "https://www.themoviedb.org/movie/" + this.movieJSON.id;
    if (linkType == 'imdb') {
        message += "<a href=" + MovieDB.utility.getIMDBTitleUrl(this.movieJSON.imdb_id) + ">" + useTitle + "</a>";
    } else if (linkType == 'tmdb') {
        message += "<a href=" + useURL + ">" + useTitle + "</a>";
    } else {
        message += useTitle + " (<a href=" + MovieDB.utility.getIMDBTitleUrl(this.movieJSON.imdb_id) + ">IMDB</a>" +
            ", <a href=" + useURL + ">TMDb</a>)"
    }

    message += "<span style=\"font-size: .8em; color: #444;\"><br/><br/>Sent using <a href=\"http://developer.palm.com/appredirect/?packageid=com.silentapps.moviedb\">Movie DB</a></span>";

    this.controller.serviceRequest("palm://com.palm.applicationManager", {
        method: 'open',
        parameters: {
            id: "com.palm.app.email",
            params: {
                summary: "Check out this Cool Movie",
                text: message
            }
        }
    });
};

MovieViewAssistant.prototype.handleShareText = function(linkType) {
    var useTitle = this.movieJSON.title || this.movieJSON.original_title
    var useURL = this.movieJSON.url || "https://www.themoviedb.org/movie/" + this.movieJSON.id;

    var message = "Check out the movie " + useTitle + ": ";

    if (linkType == 'imdb') {
        message += MovieDB.utility.getIMDBTitleUrl(this.movieJSON.imdb_id);
    } else if (linkType == 'tmdb') {
        message += useURL;
    } else {
        message += MovieDB.utility.getIMDBTitleUrl(this.movieJSON.imdb_id) + " or " + useURL;
    }

    this.controller.serviceRequest('palm://com.palm.applicationManager', {
        method: 'open',
        parameters: {
            id: 'com.palm.app.messaging',
            params: {
                messageText: message
            }
        }
    });
};

//Get all info from the JSON returned value
MovieViewAssistant.prototype.getInfoResponse = function(response) {
    //If we have received a valid response, then prcoess the data
    try {
        if (response != undefined && response.responseText != "") {
            this.movieJSON = response.responseJSON; //[0]
            this.posterJSON = this.movieJSON.images.posters;
            this.castJSON = this.movieJSON.credits;
            this.backdropJSON = this.movieJSON.images.backdrops;
            this.countryJSON = this.movieJSON.countries;
            this.studioJSON = this.movieJSON.production_companies;
            this.genresJSON = this.movieJSON.genres;

            Mojo.Log.info("----- Movie DB: SearchList: Movie GetInfo:", Object.toJSON(this.movieJSON), " -----");

            this.loadMedia();
            this.loadDetails();
            this.loadCast();
            this.loadStudios();
            this.loadGenres();
        }
    } catch (ex) {
        Mojo.Log.error("MovieViewAssistant.getInfoResponse() exception: " + Object.toJSON(ex));
    }
    this.processData();
};

MovieViewAssistant.prototype.loadMedia = function() {
    Mojo.Log.warn("MovieViewAssistant.loadMedia()");
    var found = false;
    var image = this.defaultPoster;
    var width = this.maxWidthPoster;
    var height = this.maxHeightPoster;


    for (var i = 0; this.posterJSON && i < this.posterJSON.length && !found; i++) {
        if (this.posterJSON[i].file_path) {
            image = 'http://image.tmdb.org/t/p/w185/' + this.posterJSON[i].file_path;
            found = true;

            if (this.posterJSON[i].width && this.posterJSON[i].height) {
                var w = this.posterJSON[i].width;
                var h = this.posterJSON[i].height;
                height = (width * h) / w;

                if (height >= this.maxHeightPoster) {
                    height = this.maxHeightPoster;
                }
            }
        }
    }

    if (this.movieJSON.poster_path && image == this.defaultPoster) {
        image = 'http://image.tmdb.org/t/p/w185/' + this.movieJSON.poster_path;
    }

    var postersDisabled = true;
    var backdropDisabled = true;
    var trailerDisabled = true;

    if ((this.posterJSON.length > 0) || image) {
        Mojo.Log.info("posterJSON == 0, disabling..");
        postersDisabled = false;
    }

    if (this.backdropJSON.length > 0) {
        Mojo.Log.info("backdropJSON == 0, disabling..");
        backdropDisabled = false;
    }

    if (this.movieJSON.trailer) {
        Mojo.Log.info("trailerJSON == 0, disabling..");
        trailerDisabled = false;
    }

    this.mediaSubmenuModel = {
        items: [{
            label: $L("View Posters"),
            command: "view-posters",
            disabled: postersDisabled
        }, {
            label: $L("View Backdrops"),
            command: "view-backdrops",
            disabled: backdropDisabled
        }, {
            label: $L("View Trailer"),
            command: "view-trailer",
            disabled: trailerDisabled
        }, {
            label: $L("Search Trailers"),
            command: "search-trailer",
            disabled: false
        }]
    };

    this.divPoster.style.backgroundImage = 'url(' + this.defaultPoster + ')';
    this.divPoster.style.backgroundSize = width + 'px ' + height + 'px';
    this.divPoster.style.width = width + 'px';
    this.divPoster.style.height = height + 'px';
    if (image != this.defaultPoster) {
        Mojo.Log.info("preloading movie poster..");
        MovieDB.utility.preloadImage(image, this.divPoster, width, height);
    }
};

MovieViewAssistant.prototype.loadDetails = function() {
    Mojo.Log.warn("MovieViewAssistant.loadDetails()");
    this.divTitle.innerHTML = this.movieJSON.title || this.movieJSON.original_title;

    if (this.movieJSON.overview && this.movieJSON.overview != "No overview found.") {
        this.overviewModel.items.push({
            overview: this.movieJSON.overview
        });
    }

    var tagline = "Unavailable";
    if (this.movieJSON.tagline) {
        tagline = this.movieJSON.tagline;
    }
    var newItem = {
        data: tagline,
        category: "Tagline"
    };
    this.detailsModel.items.push(newItem);

    //Get Runtime
    var runtime = "Unavailable";
    if (this.movieJSON.runtime) {
        runtime = MovieDB.utility.formatRuntime(this.movieJSON.runtime);
    }
    this.spanRuntime.innerHTML = runtime;
    var newItem = {
        data: runtime,
        category: "Runtime"
    };
    this.detailsModel.items.push(newItem);

    //Get Released Date
    var released = "Unavailable";
    var releasedFull = "Unavailable";
    if (this.movieJSON.release_date) {
        released = MovieDB.utility.formatDate(this.movieJSON.release_date, false);
        releasedFull = MovieDB.utility.formatDate(this.movieJSON.release_date, true);
    }
    this.spanReleased.innerHTML = released;
    var newItem = {
        data: releasedFull,
        category: "Released"
    };
    this.detailsModel.items.push(newItem);

    //Get Rating
    var rating = "0";
    var ratingText = "Unavailable";
    if (this.movieJSON.vote_average) {
        rating = this.movieJSON.vote_average * 10;
        ratingText = rating + "%";
        if (this.movieJSON.vote_count) {
            ratingText += " (" + this.movieJSON.vote_count + " votes)";
        }
    }
    this.divStars.style.width = rating + 'px';
    var newItem = {
        data: ratingText,
        category: "TMDb Rating"
    };
    this.detailsModel.items.push(newItem);

    var certification = "N/A";
    var certificationText = "Unavailable"
    if (this.movieJSON.certification) {
        certification = this.movieJSON.certification;
        certificationText = this.movieJSON.certification;
    }
    if (this.movieJSON.releases && this.movieJSON.releases.countries) {
        for (ii = 0; ii < this.movieJSON.releases.countries.length; ii++) {
            if (this.movieJSON.releases.countries[ii].iso_3166_1 == "US") {
                certification = this.movieJSON.releases.countries[ii].certification;
                certificationText = certification;
            }
        }
    }
    this.spanCertification.innerHTML = certification;
    var newItem = {
        data: certificationText,
        category: "MPAA Rated"
    };
    this.detailsModel.items.push(newItem);

    var budget = "Unavailable";
    if (this.movieJSON.budget && this.movieJSON.budget > 0) {
        budget = MovieDB.utility.formatCurrency(this.movieJSON.budget);
    }
    var newItem = {
        data: budget,
        category: "Budget"
    };
    this.detailsModel.items.push(newItem);

    var revenue = "Unavailable";
    if (this.movieJSON.revenue && this.movieJSON.revenue > 0) {
        revenue = MovieDB.utility.formatCurrency(this.movieJSON.revenue);
    }
    var newItem = {
        data: revenue,
        category: "Revenue"
    };
    this.detailsModel.items.push(newItem);
};

MovieViewAssistant.prototype.loadStudios = function() {
    Mojo.Log.warn("MovieViewAssistant.loadStudios()");
    var firstTime = true;
    var studioText = "Unavailable";
    try {
        for (var i = 0; this.studioJSON && i < this.studioJSON.length; i++) {
            var name = this.studioJSON[i].name;
            var url = this.studioJSON[i].url;
            var id = this.studioJSON[i].id;

            var newItem = {
                id: id,
                name: name,
                url: url
            };
            this.studioModel.items.push(newItem);

            if (firstTime) {
                studioText = name;
                firstTime = false;
            } else {
                studioText += ", " + name;
            }
        }
    } catch (ex) {
        Mojo.Log.error("loadStudios, error: " + Object.toJSON(ex));
    }

    if (this.studioJSON.length > 0) {
        var newItem = {
            data: studioText,
            category: "Studios"
        };
        this.detailsModel.items.push(newItem);
    }
};

MovieViewAssistant.prototype.loadGenres = function() {
    Mojo.Log.warn("MovieViewAssistant.loadGenres()");
    var firstTime = true;
    var genreText = "Unavailable";

    for (var i = 0; this.genresJSON && i < this.genresJSON.length; i++) {
        if (this.genresJSON[i].id && this.genresJSON[i].name) {
            var name = this.genresJSON[i].name;
            var url = this.genresJSON[i].url;
            var id = this.genresJSON[i].id;

            var newItem = {
                id: id,
                name: name,
                url: url
            };
            this.genreModel.items.push(newItem);

            if (firstTime) {
                genreText = name;
                firstTime = false;
            } else {
                genreText += ", " + name;
            }
        }
    }

    this.spanGenres.innerHTML = genreText;

    if (this.genresJSON.length == 0) {
        this.divGenreWrapper.hide();
    } else {
        var newItem = {
            data: genreText,
            category: "Genres"
        };
        this.detailsModel.items.push(newItem);
    }
};

MovieViewAssistant.prototype.loadCast = function() {
    Mojo.Log.warn("MovieViewAssistant.loadCast()");

    //cast
    for (var i = 0; this.castJSON && this.castJSON.cast && i < this.castJSON.cast.length; i++) {
        if (this.castJSON.cast[i].name) {
            var image = this.defaultProfile;
            var name = this.castJSON.cast[i].name;
            var job = "actor"; //this.castJSON.cast[i].job;
            var id = this.castJSON.cast[i].id;
            var character = "";
            var duplicate = false;

            if (this.castJSON.cast[i].character) {
                var character = "as " + this.castJSON.cast[i].character;
            }

            if (this.castJSON.cast[i].profile_path) {
                image = 'http://image.tmdb.org/t/p/w92/' + this.castJSON.cast[i].profile_path;
            }

            var newItem = {
                id: id,
                name: name,
                character: character,
                job: job,
                image: image,
                width: this.maxWidthProfile,
                height: this.maxHeightProfile
            };

            Mojo.Log.info("----- Movie DB: Movie View: Actors: Add to List: ", id, ", ", name, ", ", character, ", ", image);
            this.actorsModel.items.push(newItem);
        }
    } //for -- cast

    for (var i = 0; this.castJSON && this.castJSON.crew && i < this.castJSON.crew.length; i++) {
        if (this.castJSON.crew[i].name) {
            var image = this.defaultProfile;
            var name = this.castJSON.crew[i].name;
            var job = this.castJSON.crew[i].job;
            var id = this.castJSON.crew[i].id;
            var character = "";
            var duplicate = false;

            if (this.castJSON.crew[i].character) {
                var character = "as " + this.castJSON.crew[i].character;
            }

            if (this.castJSON.crew[i].profile_path) {
                image = 'http://image.tmdb.org/t/p/w92/' + this.castJSON.crew[i].profile_path;
            }

            var newItem = {
                id: id,
                name: name,
                character: character,
                job: job,
                image: image,
                width: this.maxWidthProfile,
                height: this.maxHeightProfile
            };

            if (job.toLowerCase() == "actor") {
                Mojo.Log.info("----- Movie DB: Movie View: Actors: Add to List: ", id, ", ", name, ", ", character, ", ", image);
                this.actorsModel.items.push(newItem);
            } else {
                for (var j = 0; j < this.crewModel.items.length; j++) {
                    if (id == this.crewModel.items[j].id) {
                        this.crewModel.items[j].job += ", " + job;
                        duplicate = true
                    }
                }

                if (!duplicate) {
                    Mojo.Log.info("----- Movie DB: Movie View: Crew: Add to List: ", id, ", ", name, ", ", job, ", ", image);
                    this.crewModel.items.push(newItem);
                }
            }
        }
    } //for -- crew
};

//Error, unable to get JSON Data
MovieViewAssistant.prototype.getInfoError = function(response) {
    this.appCheckInProgress = false;
    Mojo.Log.error("Error from server ==================== %o", $H(response));

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
};

//Process all of the data parsed from the JSON
MovieViewAssistant.prototype.processData = function(response) {
    this.overviewElement.mojo.noticeUpdatedItems(0, this.overviewModel.items);
    this.overviewElement.mojo.setLength(this.overviewModel.items.length);

    this.actorsElement.mojo.noticeUpdatedItems(0, this.actorsModel.items);
    this.actorsElement.mojo.setLength(this.actorsModel.items.length);

    this.crewElement.mojo.noticeUpdatedItems(0, this.crewModel.items);
    this.crewElement.mojo.setLength(this.crewModel.items.length);

    this.detailsElement.mojo.noticeUpdatedItems(0, this.detailsModel.items);
    this.detailsElement.mojo.setLength(this.detailsModel.items.length);

    this.spinnerElement.mojo.stop();
    this.overlayScrim.hide();
    this.divBody.show();
    this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
};