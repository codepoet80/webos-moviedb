function VersionAssistant(startup) {
    this.isStartup = startup;

    // on first start, this message is displayed, along with the current version message from below
    this.startupMessage = $L("I hope you enjoy using this app. Remember this app pulls all data and information from <a href=\"http://www.themoviedb.org/\">TMDb</a>, so to correct an error or add information please do so at their site. If you like the app, visit the Help menu to learn how to donate to the maintainers.");

    //New Features
    this.changelog = [{
            version: "Version 1.4.0",
            detail: [
                "TouchPad layout and support, navigation tweaks.",
                "Fixed a bug where the people URL wasn't being found for sharing.",
                "Fixed a bug where the multi-list command menu wasn't showing user's selection."
            ]
        }, {
            version: "Version 1.3.2",
            detail: [
                "Modified YouTube trailer search/launch to use MeTube instead of the dead built-in app.",
                "Fixed a bug where the movie title wasn't loaded for trailer searches.",
                "Fixed a bug where the movie URL wasn't being found for sharing.",
                "Removed Metrix app analytics, since its dead anyway."
            ]
        },
        {
            version: "Version 1.3.1",
            detail: [
                "Preware Version. Updates the TMDB API to newest version.",
            ]
        },
        {
            version: "Version 1.3.0",
            detail: [
                "Added JustType ability for webOS 2.0 and above.",
                "Fixed a bug when dealing with large lists of movies or cast.",
                "Fixed a bug where cast details weren't shown."
            ]
        }, {
            version: "Version 1.2.5",
            detail: [
                "Added the ability to browse movies based on Genres.",
                "Added the ability to sort the browsed movies based on rating, title, or release date."
            ]
        },
        {
            version: "Version 1.2.0",
            detail: [
                "Added more details under the Movie View, and cleaned up the interface some. Now you can quickly choose between details, cast, and media.",
                "Added more details under the Cast View, and cleaned up the interface some. Now you can quickly choose between details, films, and media.",
                "Added an IMDB Link and a Share Link under the Movie and Cast View."
            ]
        },
        {
            version: "Version 1.1.5",
            detail: [
                "Added the ability to launch YouTube with the TMDB supplied trailer and also search by movie title",
                "Added the Ability to View Profiles, Posters, and Backdrops. In addition you can send them via Email or MMS, or set as the wallpaper",
                "Sorted the Filmography under the Cast Section by Year, and added the Year to the row"
            ]
        },
        {
            version: "Version 1.1.0",
            detail: [
                "Defaulted to selecting the text in the search filed upon reactivation of view and allowing enter to submit",
                "Cast and Crew (People) view created that shows Profile, Birthday, Birthplace, Biographay, and Filmography",
                "Cast and Crew searching implemented",
                "Added rounded corners to posters and profiles"
            ]
        },
        {
            version: "Version 1.0.0",
            detail: [
                "Movie details include Poster, Overview, Rating, MPAA Rating, Cast & Crew List, Runtime, & Release Date",
                "Movie title searching implemented.",
                "Initial Revision."
            ]
        }
    ];

    // setup command menu
    this.cmdMenuModel = {
        visible: false,
        items: [
            {},
            {
                label: $L("Sounds Good, Let's Continue ..."),
                command: 'do-continue'
            },
            {}
        ]
    };
};

VersionAssistant.prototype.setup = function() {
    this.titleElement = this.controller.get('title');
    this.dataElement = this.controller.get('data');

    if (this.isStartup) {
        if (MovieDB.isFirst) {
            this.titleElement.innerHTML = $L('Welcome to Movie DB');
        } else if (MovieDB.isNew) {
            this.titleElement.innerHTML = $L('Movie DB History');
        } else {
            this.titleElement.innerHTML = $L('Version History');
        }
    } else {
        this.titleElement.innerHTML = $L('Version History');
    }

    var html = '';
    if (this.isStartup) {
        html += '<div class="text">' + this.startupMessage + '</div>';
    }

    for (var i = 0; i < this.changelog.length; i++) {
        html += Mojo.View.render({ object: { title: this.changelog[i].version }, template: 'version/rowDivider' });
        html += '<ul>';

        for (var j = 0; j < this.changelog[i].detail.length; j++) {
            html += '<li>' + this.changelog[i].detail[j] + '</li>';
        }
        html += '</ul>';
    }

    // set data
    this.dataElement.innerHTML = html;

    // setup menu
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });

    //if (this.isStartup) {
    // set command menu
    this.controller.setupWidget(Mojo.Menu.commandMenu, { menuClass: 'no-fade' }, this.cmdMenuModel);
    //}
};

VersionAssistant.prototype.activate = function(event) {
    //if (this.isStartup) {
    this.timer = this.controller.window.setTimeout(this.showContinue.bind(this), 3 * 1000);
    //}
};
VersionAssistant.prototype.deactivate = function(event) {};
VersionAssistant.prototype.cleanup = function(event) {};

VersionAssistant.prototype.showContinue = function() {
    // show the command menu
    this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
};

VersionAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case 'do-continue':
                this.controller.stageController.swapScene({ name: 'main', transition: Mojo.Transition.crossFade });
                break;
        }
    }
};