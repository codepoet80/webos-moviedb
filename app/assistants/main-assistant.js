// -----------------------------------------------------------------------------
//    Main Assistant
// -----------------------------------------------------------------------------
function MainAssistant(query) {
    if (query) {
        this.query = query;
        this.search = true;
    }
    this.updateCheckDone = false;
};

MainAssistant.prototype.setup = function() {
    Mojo.Log.info("----- Movie DB: Main: Setup Called -----");

    // setup menu
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, menuModel);

    // get elements
    this.txtSearchElement = this.controller.get('txt_search');
    this.spanVersion = this.controller.get('main-version');
    this.btnSearchElement = this.controller.get('btn_search');
    //this.btnAdvSearchElement = this.controller.get('btn_advSearch');
    this.btnNowPlayingElement = this.controller.get('btn_nowplaying');
    this.btnComingSoonElement = this.controller.get('btn_comingsoon');
    this.btnTopRatedElement = this.controller.get('btn_toprated');
    this.btnGenreElement = this.controller.get('btn_genres');

    this.keyupHandler = this.handleKeyUp.bindAsEventListener(this);
    this.btnSearchTapHandler = this.btn_searchPress.bindAsEventListener(this);
    //this.btnAdvSearchTapHandler = this.btn_advSearchPress.bindAsEventListener(this);
    this.btnNowPlayingTapHandler = this.btn_nowplaying.bindAsEventListener(this);
    this.btnComingSoonTapHandler = this.btn_comingsoon.bindAsEventListener(this);
    this.btnTopRatedTapHandler = this.btn_toprated.bindAsEventListener(this);
    this.btnGenreTapHandler = this.btn_genrePress.bindAsEventListener(this);

    this.controller.setupWidget('txt_search',
        this.attributes = {
            hintText: 'Search Movie, Cast, Crew...',
            multiline: false,
            autoFocus: true,
            focusMode: Mojo.Widget.focusSelectMode
        },
        this.model = {
            value: '',
            disabled: false
        }
    );

    //Command Menu Model
    /*
    this.cmdMenuModel = {
        visible: true,
        items: [
            {},
            { label: $L('Now Playing'), command: "now_playing" },
            { label: $L('Upcoming'), command: "upcoming" },
            { icon: "app-icon-filter-rating", command: 'top_rated' },
            {},
        ]
    };
    this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
    */

    this.spanVersion.innerHTML = $L('v') + Mojo.appInfo.version;
};

MainAssistant.prototype.activate = function(event) {
    Mojo.Log.info("----- Movie DB: Main: Activate Called -----");

    if (event && event.type == "justType" && event.searchVal) {
        Mojo.Log.info("----- Movie DB: Main: Activate: Just Type Event -----");
        this.query = event.searchVal.replace(/%20/g, " ");
        this.search = true;
    }

    this.controller.document.addEventListener("keyup", this.keyupHandler, true);
    this.btnSearchElement.addEventListener(Mojo.Event.tap, this.btnSearchTapHandler);
    //this.btnAdvSearchElement.addEventListener(Mojo.Event.tap, this.btnAdvSearchTapHandler);
    this.btnNowPlayingElement.addEventListener(Mojo.Event.tap, this.btnNowPlayingTapHandler);
    this.btnComingSoonElement.addEventListener(Mojo.Event.tap, this.btnComingSoonTapHandler);
    this.btnTopRatedElement.addEventListener(Mojo.Event.tap, this.btnTopRatedTapHandler);
    this.btnGenreElement.addEventListener(Mojo.Event.tap, this.btnGenreTapHandler);
    this.txtSearchElement.mojo.focus();

    this.btnSearchElement.style.visibility = 'visible';

    if (this.search && this.search == true) {
        this.search = false;

        //this.txtSearchElement.mojo.setValue(this.query.replace(/%20/g, " "));
        this.txtSearchElement.mojo.setValue(this.query);
        this.btn_searchPress(null);
        //this.controller.stageController.pushScene("searchList", searchVal, "basic");
    }

    this.updateCheckDone = true;
    updaterModel.CheckForUpdate("Movie DB", function(responseObj) {
        if (responseObj && responseObj.updateFound) {
            updaterModel.PromptUserForUpdate(function(response) {
                if (response)
                    updaterModel.InstallUpdate();
            }.bind(this));
        }
    }.bind(this));
};

MainAssistant.prototype.deactivate = function(event) {
    Mojo.Log.info("----- Movie DB: Main: Deactivate Called -----");

    this.controller.document.removeEventListener('keyup', this.keyupHandler, true);
    this.btnSearchElement.removeEventListener(Mojo.Event.tap);
    //this.btnAdvSearchElement.removeEventListener(Mojo.Event.tap);
    this.btnGenreElement.removeEventListener(Mojo.Event.tap);
};

MainAssistant.prototype.cleanup = function(event) {};

MainAssistant.prototype.setQuery = function(query) {
    Mojo.Log.info("----- Movie DB: Main: SetQuery Called -----");
    this.query = query;
    this.search = true;
};

//Handles the enter key
MainAssistant.prototype.handleKeyUp = function(event) {
    Mojo.Log.info("----- Movie DB: Main: Keyup in Search Box:", event.keyCode, "-----");
    if (event && Mojo.Char.isEnterKey(event.keyCode)) {
        if (event.srcElement.parentElement.id == "txt_search") {
            this.btn_searchPress(event);
        }
    }
};

MainAssistant.prototype.btn_searchPress = function(event) {
    Mojo.Log.info("----- Movie DB: Main: Button Search Pressed -----");

    var searchVal = this.txtSearchElement.mojo.getValue();

    if (searchVal.length > 0) {
        this.controller.stageController.pushScene("searchList", searchVal, "basic");
    } else {
        setTimeout(function() {
            this.txtSearchElement.mojo.focus();
        }.bind(this), 200);
    }
};

MainAssistant.prototype.btn_advSearchPress = function(event) {
    Mojo.Log.info("----- Movie DB: Main: Advanced Search Pressed -----");
    this.controller.stageController.pushScene('advancedSearch');
};

MainAssistant.prototype.btn_nowplaying = function(event) {
    Mojo.Log.info("----- Movie DB: Main: Now Playing Pressed -----");
    this.controller.stageController.pushScene("multiList", "now_playing");
};

MainAssistant.prototype.btn_comingsoon = function(event) {
    Mojo.Log.info("----- Movie DB: Main: Coming Soon Pressed -----");
    this.controller.stageController.pushScene("multiList", "upcoming");
};

MainAssistant.prototype.btn_toprated = function(event) {
    Mojo.Log.info("----- Movie DB: Main: Top Rated Pressed -----");
    this.controller.stageController.pushScene("multiList", "top_rated");
};

MainAssistant.prototype.btn_genrePress = function(event) {
    Mojo.Log.info("----- Movie DB: Main: Browse Genres Pressed -----");
    this.controller.stageController.pushScene('genreList');
};

MainAssistant.prototype.dividerFunc = function(itemModel) {
    return itemModel.category; // We're using the item's category as the divider label.
};

MainAssistant.prototype.handleCommand = function(event) {
    Mojo.Log.info("----- Movie DB: MultiList: Handle View Command:", event.command);
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case 'now_playing':
                Mojo.Log.info("----- Movie DB: Main, show list: ", event.command, "-----");
                this.controller.stageController.pushScene("multiList", event.command);
                break;

            case 'upcoming':
                Mojo.Log.info("----- Movie DB: Main, show list: ", event.command, "-----");
                this.controller.stageController.pushScene("multiList", event.command);
                break;

            case 'top_rated':
                Mojo.Log.info("----- Movie DB: Main, show list: ", event.command, "-----");
                this.controller.stageController.pushScene("multiList", event.command);
                break;

            default:
                break;
        }
    }
};