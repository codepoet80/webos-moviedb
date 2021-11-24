function HelpAssistant() {};

HelpAssistant.prototype.setup = function() {
    this.linksElement = this.controller.get('lst_links');
    this.supportElement = this.controller.get('lst_support');

    this.controller.get('help-title').innerHTML = $L('Help');
    this.controller.get('help-links').innerHTML = $L('Links');
    this.controller.get('help-support').innerHTML = $L('Support');

    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });

    this.controller.get('appName').innerHTML = Mojo.appInfo.title;
    this.controller.get('appDetails').innerHTML = $L('v') + Mojo.appInfo.version + $L(' by Grabber Software and Jon Wise');

    this.controller.get('appCopyright').innerHTML = Mojo.appInfo.copyright || '';
    this.controller.get('appAttribution').innerHTML = "This product uses the TMDb API but is not endorsed or certified by TMDb.<br/><br/>Originally written by Silent Apps."

    this.linksModel = { items: [] };
    this.supportModel = { items: [] };

    this.linksModel.items.push({
        text: $L('TMDb Website'),
        detail: 'http://www.themoviedb.org',
        Class: 'img_web',
        type: 'web'
    });
    this.linksModel.items.push({
        text: $L('MeTube by Jon Wise'),
        detail: 'http://appcatalog.webosarchive.com/showMuseumDetails.php?search=metube&app=1005774',
        Class: 'img_metube',
        type: 'web'
    });
    this.linksModel.items.push({
        text: $L('Graphics by Alan Cantillep'),
        address: 'acantill@gmail.com',
        subject: 'Graphics Support',
        Class: 'img_email',
        type: 'email'
    });
    this.linksModel.items.push({
        text: $L('Donate to Grabber'),
        detail: 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PNLUV5CMZEXC4',
        Class: 'img_donate',
        type: 'web'
    });
    this.linksModel.items.push({
        text: $L('Buy Jon Wise a coffee'),
        detail: 'https://www.buymeacoffee.com/codepoet80',
        Class: 'img_donate',
        type: 'web'
    });

    this.supportModel.items.push({
        text: $L('Grabber Software Website'),
        detail: Mojo.appInfo.support.url,
        Class: 'img_web',
        type: 'web'
    });
    this.supportModel.items.push({
        text: $L('webOS Archive'),
        detail: "http://www.webosarchive.com",
        Class: 'img_web',
        type: 'web'
    });
    this.supportModel.items.push({
        text: $L('Send Email'),
        address: Mojo.appInfo.support.email.address,
        subject: Mojo.appInfo.support.email.subject,
        Class: 'img_email',
        type: 'email'
    });
    this.supportModel.items.push({
        text: $L('Version History'),
        detail: 'version',
        Class: 'img_history',
        type: 'scene',
        args: false
    });

    this.controller.setupWidget('lst_links',
        this.attributes = {
            itemTemplate: "help/rowTemplate",
            swipeToDelete: false,
            reorderable: false
        },
        this.linksModel
    );

    this.controller.setupWidget('lst_support',
        this.attributes = {
            itemTemplate: "help/rowTemplate",
            swipeToDelete: false,
            reorderable: false
        },
        this.supportModel
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
}

HelpAssistant.prototype.activate = function(event) {
    this.linksElement.addEventListener(Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
    this.supportElement.addEventListener(Mojo.Event.listTap, this.listTapHandler.bindAsEventListener(this));
};

HelpAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        Mojo.Log.info("----- Movie DB: Genre List: Menu Tapped:", event.command, "-----");
        switch (event.command) {
            case 'cmd-back':
                this.controller.stageController.popScene();
                break;
        }
    }
};

HelpAssistant.prototype.deactivate = function(event) {
    this.linksElement.removeEventListener(Mojo.Event.listTap);
    this.supportElement.removeEventListener(Mojo.Event.listTap);
};

HelpAssistant.prototype.cleanup = function(event) {};

HelpAssistant.prototype.listTapHandler = function(event) {
    switch (event.item.type) {
        case 'web':
            this.controller.serviceRequest("palm://com.palm.applicationManager", {
                method: "open",
                parameters: {
                    id: 'com.palm.app.browser',
                    params: {
                        target: event.item.detail
                    }
                }
            });
            break;

        case 'email':
            this.controller.serviceRequest('palm://com.palm.applicationManager', {
                method: 'open',
                parameters: {
                    target: 'mailto:' + event.item.address + "?subject=" + Mojo.appInfo.title + " " + event.item.subject
                }
            });
            break;

        case 'scene':
            if (event.item.args) {
                this.controller.stageController.pushScene(event.item.detail, event.item.args);
            } else {
                this.controller.stageController.pushScene(event.item.detail);
            }
            break;
    }
};