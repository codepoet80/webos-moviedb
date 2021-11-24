function CastViewAssistant(castID) {
    this.castID = castID;
    this.castJSON = null;
    this.profileJSON = null;
    this.filmographyJSON = null;
    this.defaultProfile = "images/no-profile.png";
    this.defaultPoster = "images/no-poster-small.png";
    this.maxHeightProfile = 166;
    this.maxWidthProfile = 112;
    this.maxHeightPoster = 60;
    this.maxWidthPoster = 40;
    this.currentToggle = "cmd-details";
    this.currentViewScrollPosition = null;
}

CastViewAssistant.prototype.setup = function() {
    //List Models
    this.biographyModel = { items: [] };
    this.filmsModel = { items: [] };
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
                    { label: $L('Biography'), command: 'cmd-details' },
                    { label: $L('Films'), command: 'cmd-people' },
                    { label: $L('Photos'), /*icon: 'menu-media',*/ command: 'cmd-photos' }
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

    //Controller Elements
    this.divBody = this.controller.get('castView');
    this.divTitle = this.controller.get('castView-title');
    this.divProfile = this.controller.get('castView-profile');
    this.divDetailsWrapper = this.controller.get('details-wrapper');
    this.divFilmsWrapper = this.controller.get('films-wrapper');

    this.spanBirthday = this.controller.get('castView-birthday');
    this.spanBirthplace = this.controller.get('castView-birthplace');
    this.spanMovieNum = this.controller.get('castView-movieNum');
    this.spinnerElement = this.controller.get('spinnerActivity');
    this.biographyElement = this.controller.get('lst_biography');
    this.filmsElement = this.controller.get('lst_films');

    this.btnIMDB = this.controller.get('btn_imdb');
    this.btnShare = this.controller.get('btn_share');
    this.overlayScrim = this.controller.get('spinner-scrim');

    //Handler Elments
    this.listFilmsTapHandler = this.lst_filmTap.bindAsEventListener(this);
    this.imgTapHandler = this.img_tap.bindAsEventListener(this);
    this.btnImdbHandler = this.btn_imdbTap.bindAsEventListener(this);
    this.btnShareHandler = this.btn_shareTap.bindAsEventListener(this);

    //Setup the Spinner Widget
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
    this.controller.setupWidget('lst_biography',
        this.attributes = {
            itemTemplate: 'castView/biographyTemplate',
            emptyTemplate: 'castView/emptyBiographyTemplate',
            swipeToDelete: false,
            reorderable: false,
            renderLimit: 20
        },
        this.biographyModel
    );

    this.controller.setupWidget('lst_films',
        this.attributes = {
            itemTemplate: 'castView/filmsTemplate',
            emptyTemplate: 'castView/emptyFilmsTemplate',
            swipeToDelete: false,
            reorderable: false,
            renderLimit: 150
        },
        this.filmsModel
    );

    this.controller.setDefaultTransition(Mojo.Transition.zoomFade);
};

CastViewAssistant.prototype.ready = function(event) {
    MovieDB.tmdbApi.personGetInfo(this.castID, this.getInfoResponse.bind(this), this.getInfoError.bind(this));
};
CastViewAssistant.prototype.activate = function(event) {
    this.filmsElement.addEventListener(Mojo.Event.listTap, this.listFilmsTapHandler);
    this.divProfile.addEventListener(Mojo.Event.tap, this.imgTapHandler);
    this.btnIMDB.addEventListener(Mojo.Event.tap, this.btnImdbHandler);
    this.btnShare.addEventListener(Mojo.Event.tap, this.btnShareHandler);

    if (this.currentViewScrollPosition) {
        this.controller.sceneScroller.mojo.setState(this.currentViewScrollPosition);
    }
};
CastViewAssistant.prototype.deactivate = function(event) {
    this.filmsElement.removeEventListener(Mojo.Event.listTap);
    this.divProfile.removeEventListener(Mojo.Event.tap);
    this.btnIMDB.removeEventListener(Mojo.Event.tap);
    this.btnShare.addEventListener(Mojo.Event.tap);

    this.currentViewScrollPosition = this.controller.sceneScroller.mojo.getState();
};
CastViewAssistant.prototype.cleanup = function(event) {
    this.currentViewScrollPosition = null;
};

CastViewAssistant.prototype.lst_filmTap = function(event) {
    Mojo.Log.info("----- Movie DB: Cast View: Film Tap ID:", event.item.id);
    this.controller.stageController.pushScene('movieView', event.item.id, event.item.mediatype);
};

//Event trigger by tapping on the poster
CastViewAssistant.prototype.img_tap = function(event) {
    Mojo.Log.info("----- Movie DB: Cast View: Profile Tapped: View Profile -----");
    this.handleProfileView();
};

CastViewAssistant.prototype.btn_imdbTap = function(event) {
    if (this.castJSON.imdb_id && this.castJSON.imdb_id.length > 0) {
        var url = MovieDB.utility.getIMDBPersonUrl(this.castJSON.imdb_id);
    } else {
        var url = MovieDB.utility.getIMDBSearchTitleUrl(this.castJSON.name);
    }

    Mojo.Log.info("----- Movie DB: Cast View: IMDB Link Tapped:", url, "-----");

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

CastViewAssistant.prototype.btn_shareTap = function(event) {
    if (this.shareSubmenuModel.items.length == 0) {
        this.shareSubmenuModel = {
            items: [
                { label: $L('Email'), command: 'share-tmdbEmail' },
                { label: $L('Text Message'), command: 'share-tmdbText' }
            ]
        };
    }

    Mojo.Log.info("----- Movie DB: Cast View: Show Share Popup", Object.toJSON(this.shareSubmenuModel.items), "-----");

    if (this.shareSubmenuModel.items.length > 0) {
        this.showPopup(event, this.shareSubmenuModel.items);
    }
};

//Show the Popup Menu
CastViewAssistant.prototype.showPopup = function(event, items) {
    Mojo.Log.info("----- Movie DB: Cast View: Show Media Popup", Object.toJSON(items), "-----");

    if (items.length > 0) {
        this.controller.popupSubmenu({
            onChoose: this.popupHandler,
            placeNear: event.target,
            items: items
        });
    }
};

CastViewAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        Mojo.Log.info("----- Movie DB: Cast View: Menu Tapped:", event.command, "-----");
        switch (event.command) {
            case 'cmd-back':
                this.controller.stageController.popScene();
                break;
            case 'cmd-details':
                this.divFilmsWrapper.hide();
                this.controller.hideWidgetContainer(this.divFilmsWrapper);
                this.divDetailsWrapper.show();
                this.controller.showWidgetContainer(this.divDetailsWrapper);
                this.currentToggle = 'cmd-details';
                Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();
                break;

            case 'cmd-people':
                this.divDetailsWrapper.hide();
                this.controller.hideWidgetContainer(this.divDetailsWrapper);
                this.divFilmsWrapper.show();
                this.controller.showWidgetContainer(this.divDetailsWrapper);
                this.currentToggle = 'cmd-people';
                Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();
                break;

            case 'cmd-photos':
                this.cmdMenuModel.items[1].toggleCmd = this.currentToggle;
                this.controller.modelChanged(this.cmdMenuModel);
                this.handleProfileView();
                break;
        }
    }
};

//Handle the Popup Menu
CastViewAssistant.prototype.popupHandler = function(command) {
    Mojo.Log.info("----- Movie DB: Cast View: Popup Tapped:", command, "-----");
    switch (command) {
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


CastViewAssistant.prototype.handleProfileView = function() {
    Mojo.Log.info("----- Movie DB: Cast View: Handle Profile View -----");
    var images = { items: [] };

    for (var i = 0; this.profileJSON && i < this.profileJSON.length; i++) {
        //if (this.profileJSON[i].image && this.profileJSON[i].image.size == "original") {
        if (this.profileJSON[i].file_path) {
            var imageProfile = this.profileJSON[i].file_path;
            var imageThumb = imageProfile;

            var newItem = {
                url: 'http://image.tmdb.org/t/p/original/' + imageProfile,
                thumb: 'http://image.tmdb.org/t/p/w185/' + imageThumb
            };

            images.items.push(newItem);
        }
        //}
    }

    if (images.items.length > 0) {
        this.controller.stageController.pushScene('fullImage', images.items, this.castJSON.name);
    }
};

CastViewAssistant.prototype.handleShareEmail = function(linkType) {
    var message = "Check out ";
    Mojo.Log.info("*** cast: " + JSON.stringify(this.castJSON));
    if (linkType == 'imdb') {
        message += "<a href=" + MovieDB.utility.getIMDBPersonUrl(this.castJSON.imdb_id) + ">" + this.castJSON.name + "</a>";
    } else if (linkType == 'tmdb') {
        if (this.castJSON.homepage && this.castJSON.homepage != "")
            message += "<a href=\"" + this.castJSON.homepage + "\">" + this.castJSON.name + "</a>";
        else
            message += "<a href=\"" + "https://www.themoviedb.org/person/" + this.castJSON.id + "\">" + this.castJSON.name + "</a>";
    } else {
        message += this.castJSON.name + " (<a href=" + MovieDB.utility.getIMDBPersonUrl(this.castJSON.imdb_id) + ">IMDB</a>" +
            ", <a href=" + this.castJSON.url + ">TMDb</a>)"
    }

    message += "<span style=\"font-size: .8em; color: #444;\"><br/><br/>Sent using <a href=\"http://developer.palm.com/appredirect/?packageid=com.silentapps.moviedb\">Movie DB</a></span>";

    this.controller.serviceRequest("palm://com.palm.applicationManager", {
        method: 'open',
        parameters: {
            id: "com.palm.app.email",
            params: {
                summary: "Check this out",
                text: message
            }
        }
    });
};

CastViewAssistant.prototype.handleShareText = function(linkType) {
    var message = "Check out " + this.castJSON.name + ": ";
    Mojo.Log.info("*** cast: " + JSON.stringify(this.castJSON));
    if (linkType == 'imdb') {
        message += MovieDB.utility.getIMDBPersonUrl(this.castJSON.imdb_id);
    } else if (linkType == 'tmdb') {
        if (this.castJSON.homepage && this.castJSON.homepage != "")
            message += this.castJSON.homepage;
        else
            message += "https://www.themoviedb.org/person/" + this.castJSON.id;
    } else {
        message += MovieDB.utility.getIMDBPersonUrl(this.castJSON.imdb_id) + " or " + this.castJSON.url;
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

CastViewAssistant.prototype.getInfoResponse = function(response) {
    //If we have received a valid response, then prcoess the data
    try {
        if (response != undefined && response.responseText != "") {
            //Get JSON data for each item we need
            this.castJSON = response.responseJSON;
            this.profileJSON = this.castJSON.images ? this.castJSON.images.profiles : null; //these are images..
            this.filmographyJSON = this.castJSON.combined_credits;
            Mojo.Log.info("----- Movie DB: Cast View: Get Info Respone:", Object.toJSON(this.castJSON), " -----");

            this.loadProfile();
            this.loadDetails();
            this.loadFilms();
        }
    } catch (ex) {
        Mojo.Log.error("CastViewAssistant.getInfoResponse error: " + Object.toJSON(ex));
    }

    this.processData();
};

CastViewAssistant.prototype.loadProfile = function(response) {
    var found = false;
    var image = this.defaultProfile;
    var width = this.maxWidthProfile;
    var height = this.maxHeightProfile;

    for (var i = 0; this.profileJSON && i < this.profileJSON.length && !found; i++) {
        if (this.profileJSON[i].image && this.profileJSON[i].image.size == "profile") {
            if (this.profileJSON[i].image.url) {
                image = this.profileJSON[i].image.url;
                found = true;

                if (this.profileJSON[i].image.width && this.profileJSON[i].image.height) {
                    var w = this.profileJSON[i].image.width;
                    var h = this.profileJSON[i].image.height;
                    height = (width * h) / w;

                    if (height >= this.maxHeightProfile) {
                        height = this.maxHeightProfile;
                    }
                }
            }
        }
    }

    if (this.castJSON.profile_path) {
        image = 'http://image.tmdb.org/t/p/w185' + this.castJSON.profile_path;
    }


    this.divProfile.style.backgroundImage = 'url(' + this.defaultProfile + ')';
    this.divProfile.style.backgroundSize = width + 'px ' + height + 'px';
    this.divProfile.style.width = width + 'px';
    this.divProfile.style.height = height + 'px';
    if (image != this.defaultProfile) {
        MovieDB.utility.preloadImage(image, this.divProfile, width, height);
    }
};

CastViewAssistant.prototype.loadDetails = function() {
    this.divTitle.innerHTML = this.castJSON.name;
    try {
        if (this.castJSON.biography) {
            this.biographyModel.items.push({
                biography: this.castJSON.biography
            });
        }

        var birthday = "Unavailable";
        if (this.castJSON.birthday) {
            birthday = MovieDB.utility.formatDate(this.castJSON.birthday, false);
        }
        this.spanBirthday.innerHTML = birthday + " in<br/>";

        var birthplace = "Unavailable";
        if (this.castJSON.place_of_birth) {
            birthplace = this.castJSON.place_of_birth;
        }
        this.spanBirthplace.innerHTML = birthplace;

        var movieNum = "N/A";
        if (this.castJSON.known_movies) {
            movieNum = this.castJSON.known_movies;
        }
        if (this.filmographyJSON.cast.length) {
            movieNum = this.filmographyJSON.cast.length;
        }
        this.spanMovieNum.innerHTML = movieNum;
    } catch (ex) {
        Mojo.Log.error("CastViewAssistant.loadDetails() error: " + Object.toJSON(ex));
    }
};

CastViewAssistant.prototype.loadFilms = function() {
    try {
        //Copy from movieview, credits parser
        Mojo.Log.info("loadFilms, cast length: " + this.filmographyJSON.cast.length);
        for (var i = 0; this.filmographyJSON && this.filmographyJSON.cast && i < this.filmographyJSON.cast.length; i++) {
            if (this.filmographyJSON.cast[i].title || this.filmographyJSON.cast[i].name) {
                var image = this.defaultPoster;
                var id = this.filmographyJSON.cast[i].id;
                var name = this.filmographyJSON.cast[i].title || this.filmographyJSON.cast[i].name;
                var mediatype = this.filmographyJSON.cast[i].media_type;
                name += mediatype == "tv" ? (" (TV)") : "";
                var job = "Actor"; //this.filmographyJSON.cast[i].job;
                if (this.filmographyJSON.cast[i].character && this.filmographyJSON.cast[i].character != "") {
                    job = "as " + this.filmographyJSON.cast[i].character;
                }
                job += mediatype == "tv" ? (" (" + this.filmographyJSON.cast[i].episode_count + " episodes)") : "";
                var duplicate = false;


                if (this.filmographyJSON.cast[i].poster_path) {
                    image = 'http://image.tmdb.org/t/p/w185' + this.filmographyJSON.cast[i].poster_path;
                    image = image.replace("-cover.", "-thumb.");
                }

                var release = "0000-00-00";
                var year = "N/A";

                if (this.filmographyJSON.cast[i].release_date) {
                    release = this.filmographyJSON.cast[i].release_date;
                    year = MovieDB.utility.getYear(this.filmographyJSON.cast[i].release_date);
                }
                if (this.filmographyJSON.cast[i].release_date || this.filmographyJSON.cast[i].first_air_date) {
                    release = this.filmographyJSON.cast[i].release_date || this.filmographyJSON.cast[i].first_air_date;
                    year = MovieDB.utility.getYear(release); //this.filmographyJSON.crew[i].release_date || this.filmographyJSON.crew[i].first_air_date
                }


                var newItem = {
                    id: id,
                    name: name,
                    job: job,
                    release: release,
                    year: year,
                    mediatype: mediatype,
                    image: image,
                    width: this.maxWidthPoster,
                    height: this.maxHeightPoster
                };

                for (var j = 0; j < this.filmsModel.items.length; j++) {
                    if (id == this.filmsModel.items[j].id) {
                        this.filmsModel.items[j].job += ", " + job;
                        duplicate = true
                    }
                }

                if (!duplicate) {
                    //Mojo.Log.info("----- Movie DB: Cast View: Filmography: Add to List: ",id,", ",name,", ", job,", ",image);
                    this.filmsModel.items.push(newItem);
                }
            }
        } //cast credits

        Mojo.Log.info("loadFilms, crew length: " + this.filmographyJSON.crew.length);
        for (var i = 0; this.filmographyJSON && this.filmographyJSON.crew && i < this.filmographyJSON.crew.length; i++) {
            if (this.filmographyJSON.crew[i].title || this.filmographyJSON.crew[i].name) {
                var image = this.defaultPoster;
                var id = this.filmographyJSON.crew[i].id;
                var name = this.filmographyJSON.crew[i].title || this.filmographyJSON.crew[i].name;
                var mediatype = this.filmographyJSON.crew[i].media_type;
                name += mediatype == "tv" ? (" (TV)") : "";
                var job = this.filmographyJSON.crew[i].job;
                var duplicate = false;

                if (this.filmographyJSON.crew[i].poster_path) {
                    image = 'http://image.tmdb.org/t/p/w185' + this.filmographyJSON.crew[i].poster_path;
                    image = image.replace("-cover.", "-thumb.");
                }

                var release = "0000-00-00";
                var year = "N/A";

                if (this.filmographyJSON.crew[i].release_date || this.filmographyJSON.crew[i].first_air_date) {
                    release = this.filmographyJSON.crew[i].release_date || this.filmographyJSON.crew[i].first_air_date;
                    year = MovieDB.utility.getYear(release); //this.filmographyJSON.crew[i].release_date || this.filmographyJSON.crew[i].first_air_date
                }

                var newItem = {
                    id: id,
                    name: name,
                    job: job,
                    release: release,
                    year: year,
                    mediatype: mediatype,
                    image: image,
                    width: this.maxWidthPoster,
                    height: this.maxHeightPoster
                };

                for (var j = 0; j < this.filmsModel.items.length; j++) {
                    if (id == this.filmsModel.items[j].id) {
                        this.filmsModel.items[j].job += ", " + job;
                        duplicate = true
                    }
                }

                if (!duplicate) {
                    //Mojo.Log.info("----- Movie DB: Cast View: Filmography: Add to List: ",id,", ",name,", ", job,", ",image);
                    this.filmsModel.items.push(newItem);
                }
            }
        } //crew credits

        if (this.filmsModel.items.length > this.spanMovieNum.innerHTML * 1) {
            Mojo.Log.info("Changing known movies from " + this.spanMovieNum.innerHTML + " to " + this.filmsModel.items.length);
            this.spanMovieNum.innerHTML = this.filmsModel.items.length;
        }
    } catch (ex) {
        Mojo.Log.error("CastViewAssistant.loadFilms() error: " + Object.toJSON(ex));
    }

    if (this.filmsModel.items.length > 0) {
        this.filmsModel.items.sort(MovieDB.utility.sortBy('release', true, function(a) { return a.toUpperCase() }));
    }
};

CastViewAssistant.prototype.getInfoError = function(response) {
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

CastViewAssistant.prototype.processData = function(response) {
    this.biographyElement.mojo.noticeUpdatedItems(0, this.biographyModel.items);
    this.biographyElement.mojo.setLength(this.biographyModel.items.length);

    this.filmsElement.mojo.noticeUpdatedItems(0, this.filmsModel.items);
    this.filmsElement.mojo.setLength(this.filmsModel.items.length);

    this.spinnerElement.mojo.stop();
    this.overlayScrim.hide();
    this.divBody.show();
    this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
};