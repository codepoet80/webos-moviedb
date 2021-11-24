// -----------------------------------------------------
//   GLOBALS
// -----------------------------------------------------

MovieDB = {};

//Constants
MovieDB.mainStageName = "moviedb-main";
MovieDB.versionString = Mojo.appInfo.version;

//Prefs
MovieDB.perPageResults = 50;
MovieDB.minVotes = 5;

//Genres
MovieDB.genre = {};
MovieDB.genre.lastUpdate = null;
MovieDB.genre.list = null;
MovieDB.genre.interval = 86400000; //24 Hours in Milliseconds.

//Global Class Objects
MovieDB.tmdbApi = null;
MovieDB.utility = null;
MovieDB.cookie = null;

//Session Globals
MovieDB.isFirst = false;
MovieDB.isNew = false;

var mainStageName = MovieDB.mainStageName;

var menuModel = {
    visible: true,
    items: [
        Mojo.Menu.editItem,
        //{label: "Preferences", command: 'do-prefs'},
        { label: "Help", command: 'do-help' }
    ]
};

var menuModelNoHelp = {
    visible: true,
    items: [
        Mojo.Menu.editItem,
        //{label: "Preferences", command: 'do-prefs'},
        { label: "Help", command: 'do-help', disabled: true }
    ]
};

function AppAssistant() {};

AppAssistant.prototype.setup = function() {
    MovieDB.tmdbApi = new TMDbApi();
    MovieDB.utility = new Utility();
    MovieDB.cookie = new Cookie();
    MovieDB.cookie.get();
    updaterModel = new UpdaterModel();
};

AppAssistant.prototype.handleLaunch = function(params) {
    var now = new Date();
    Mojo.Log.info("----- Handle Launch -----");
    Mojo.Log.info("----- App Assistant: Handle Launch: Params: ", Object.toJSON(params), "-----");
    Mojo.Log.info(now.valueOf());

    var mainStageController = this.controller.getStageController(MovieDB.mainStageName);

    try {
        if (params === null || params === {} || params.stageName === null || params.stageName === undefined || params.stageName === "main") {
            if (mainStageController) {
                Mojo.Log.info("----- Handle Launch: Stage Controller Exists -----");
                mainStageController.popScenesTo('main');
                mainStageController.activate();
            } else {
                Mojo.Log.info("----- Handle Launch: Stage Controller Doesn't Exists -----");
                this.controller.createStageWithCallback({ name: mainStageName, lightweight: true }, this.launchMain.bind(this));
            }
        } else {
            if (params.stageName == "justtype") {
                if (mainStageController) {
                    Mojo.Log.info("----- Handle Launch: Stage Controller Exists: With Params -----");
                    mainStageController.popScenesTo('main', { 'type': 'justType', 'searchVal': params.searchKeyword });
                    mainStageController.activate();
                    //mainStageController.pushScene('searchList', params.searchKeyword);
                    //mainStageController.delegateToSceneAssistant('setQuery', params.searchKeyword);					
                } else {
                    var f = function(mainStageController) {
                        Mojo.Log.info("----- Launching Search: Query: ", params.searchKeyword, "-----");
                        mainStageController.pushScene('main', params.searchKeyword);
                    }.bind(this);

                    this.controller.createStageWithCallback({ name: mainStageName, lightweight: true }, f);
                    //this.controller.createStageWithCallback({name: mainStageName, lightweight: true}, this.launchSearch.bind(mainStageController, params.searchKeyword));
                }
            } else {
                if (mainStageController) {
                    Mojo.Log.info("----- Handle Launch: Stage Controller Exists -----");
                    mainStageController.popScenesTo('main');
                    mainStageController.activate();
                } else {
                    Mojo.Log.info("----- Handle Launch: Stage Controller Doesn't Exists -----");
                    this.controller.createStageWithCallback({ name: mainStageName, lightweight: true }, this.launchMain.bind(this));
                }
            }
        }
    } catch (e) {
        Mojo.Log.error(e, "AppAssistant#handleLaunch");
    }
};

AppAssistant.prototype.launchMain = function(stageController) {
    Mojo.Log.info("----- Launching Main -----");

    if (MovieDB.isNew) {
        stageController.pushScene('version', true);
    } else {
        stageController.pushScene('main');
    }
};

AppAssistant.prototype.launchSearch = function(stageController, searchVal) {
    Mojo.Log.info("----- Launching Search: Query: ", searchVal, "-----");
    stageController.pushScene('main', searchVal);
};

AppAssistant.prototype.cleanup = function() {};

AppAssistant.prototype.handleCommand = function(event) {
    var stageController = this.controller.getActiveStageController();
    var currentScene = stageController.activeScene();

    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case Mojo.Menu.helpCmd:
                stageController.pushScene('help');
                break;

            case 'do-prefs':
                stageController.pushScene('preferences');
                break;

            case 'do-help':
                stageController.pushScene('help');
                break;
        }
    }
};

function StageAssistant() {};