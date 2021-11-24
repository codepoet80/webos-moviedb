function GenreListAssistant() {};

GenreListAssistant.prototype.setup = function() {
    //List Models
    this.genresModel = { items: [] };

    //Controller Elements
    this.listGenresElement = this.controller.get('lst_genres');
    this.spinnerElement = this.controller.get('spinnerActivity');
    this.overlayScrim = this.controller.get('spinner-scrim');

    //Handler Elements
    this.listGenresTapHandler = this.lst_genresTap.bindAsEventListener(this);

    //Setup Spinner Widget
    this.controller.setupWidget('spinnerActivity',
        this.attributes = {
            spinnerSize: "large"
        },
        this.model = {
            spinning: true
        }
    );
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

    this.controller.setupWidget('lst_genres',
        this.attributes = {
            itemTemplate: 'genreList/genreTemplate',
            //emptyTemplate: 'genreList/emptyActorTemplate',
            swipeToDelete: false,
            reorderable: false
        },
        this.genresModel
    );
};

GenreListAssistant.prototype.ready = function(event) {
    var now = new Date();

    if (MovieDB.genre.list != null && now.valueOf() < (MovieDB.genre.lastUpdate + MovieDB.genre.interval)) {
        Mojo.Log.info("----- Movie DB: GenreList: Fill List: Using existing List -----");
        this.genresModel = MovieDB.genre.list;

        this.listGenresElement.mojo.noticeUpdatedItems(0, this.genresModel.items);
        this.listGenresElement.mojo.setLength(this.genresModel.items.length);

        this.spinnerElement.mojo.stop();
        this.overlayScrim.hide();
    } else {
        Mojo.Log.info("----- Movie DB: GenreList: Fill List: Getting update from TMDb -----");
        MovieDB.tmdbApi.genresGetList(this.genreResponse.bind(this), this.genreError.bind(this));
    }
};

GenreListAssistant.prototype.activate = function(event) {
    this.listGenresElement.addEventListener(Mojo.Event.listTap, this.listGenresTapHandler);
};

GenreListAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        Mojo.Log.info("----- Movie DB: Genre List: Menu Tapped:", event.command, "-----");
        switch (event.command) {
            case 'cmd-back':
                this.controller.stageController.popScene();
                break;
        }
    }
};

GenreListAssistant.prototype.deactivate = function(event) {};
GenreListAssistant.prototype.cleanup = function(event) {};

GenreListAssistant.prototype.lst_genresTap = function(event) {
    Mojo.Log.info("----- Movie DB: Genres List Tap: Genre ID: ", event.item.id);

    var params = {
        header: event.item.name + " Movies",
        order_by: "primary_release_date",
        order: "desc",
        genres: [
            { id: event.item.id, name: event.item.name }
        ]
    };

    this.controller.stageController.pushScene('browseList', params);
};

GenreListAssistant.prototype.genreResponse = function(response) {
    Mojo.Log.info("----- Movie DB: GenreList: Genre Respone: ", Object.toJSON(response), " -----");
    if (response != undefined && response.responseText != "") {
        var jResponse = response.responseJSON.genres;
        Mojo.Log.info("----- Movie DB: GenreList: Genre Respone: ", Object.toJSON(jResponse), " -----");

        for (var i = 0; i < jResponse.length; i++) {
            if (jResponse[i].id && jResponse[i].name) {
                Mojo.Log.info("----- Movie DB: GenreList: Genres: Add to List: ", jResponse[i].name, "-----");
                var newItem = {
                    name: jResponse[i].name,
                    id: jResponse[i].id
                };
                this.genresModel.items.push(newItem);
            }
        }

        var now = new Date();

        MovieDB.genre.list = this.genresModel;
        MovieDB.genre.lastUpdate = now.valueOf();
    }

    this.listGenresElement.mojo.noticeUpdatedItems(0, this.genresModel.items);
    this.listGenresElement.mojo.setLength(this.genresModel.items.length);

    this.spinnerElement.mojo.stop();
    this.overlayScrim.hide();
};

GenreListAssistant.prototype.genreError = function(response) {
    Mojo.Log.error("Error from server ==================== %o", $H(response));

    this.spinnerElement.mojo.stop();
    this.overlayScrim.hide();

    MovieDB.genre.list = null;
    MovieDB.genre.lastUpdate = null;

    this.controller.showAlertDialog({
        onChoose: function(value) { this.controller.stageController.popScene(); }.bind(this),
        title: $L("Error"),
        message: $L("No Internet Connection Found."),
        choices: [
            { label: $L('Try Again'), type: 'negative' },
        ]
    });
};