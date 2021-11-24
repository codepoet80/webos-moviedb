function PreferencesAssistant() {
    /* this is the creator function for your scene assistant object. It will be passed all the 
       additional parameters (after the scene name) that were passed to pushScene. The reference
       to the scene controller (this.controller) has not be established yet, so any initialization
       that needs the scene controller should be done in the setup function below. */
}

PreferencesAssistant.prototype.setup = function() {
    this.attributes = {
        label: ' ',
        min: 0,
        max: 500,
        modelProperty: 'value'
    };
    this.model = {
        value: MovieDB.perPageResults
    }
    this.controller.setupWidget('int_perPageResults', this.attributes, this.model);

    this.attributes = {
        label: ' ',
        min: 0,
        max: 100,
        modelProperty: 'value'
    };
    this.model = {
        value: MovieDB.minVotes
    }
    this.controller.setupWidget('int_minVotes', this.attributes, this.model);

    // setup menu
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
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
};

PreferencesAssistant.prototype.activate = function(event) {
    /* put in event handlers here that should only be in effect when this scene is active. For
       example, key handlers that are observing the document */
};

PreferencesAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        Mojo.Log.info("----- Movie DB: Preferences: Menu Tapped:", event.command, "-----");
        switch (event.command) {
            case 'cmd-back':
                this.controller.stageController.popScene();
                break;
        }
    }
};

PreferencesAssistant.prototype.deactivate = function(event) {
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
       this scene is popped or another scene is pushed on top */
};

PreferencesAssistant.prototype.cleanup = function(event) {
    /* this function should do any cleanup needed before the scene is destroyed as 
       a result of being popped off the scene stack */
};