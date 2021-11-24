function FullImageAssistant(images, title) {
    this.images = images;
    this.title = title;
    this.positionDelta = { left: -1, center: 0, right: 1 };
    this.uiTimeoutSeconds = 5;
    this.ticketArray;
    this.pathTmp = "/media/internal/.MovieDB-TMP";
    this.pathWall = "/media/internal/MovieDB";
}

FullImageAssistant.prototype.setup = function() {
    this.fullImageElement = this.controller.get('fullImageView');
    this.spinnerElement = this.controller.get('spinnerActivity');
    this.headerNameElement = this.controller.get('headerName');
    this.headerCountElement = this.controller.get('headerCount');
    this.overlayScrim = this.controller.get('spinner-scrim');

    this.fullImageElement.style.height = Mojo.Environment.DeviceInfo.screenHeight + "px";
    this.fullImageElement.style.width = Mojo.Environment.DeviceInfo.screenWidth + "px";
    this.uiVisible = true;
    this.ticketArray = new Array();

    this.curPhotoIndex = 0;
    this.tempFileCounter = 0;

    //Bind response handlers
    this.leftHandler = this.leftHandler.bind(this);
    this.rightHandler = this.rightHandler.bind(this);

    // Setup and instantiate the image viewer
    this.viewerAttributes = {
        noExtractFS: false,
        highResolutionLoadTimeout: 0.1
    };
    this.viewerModel = {
        background: "black",
        onLeftFunction: this.leftHandler,
        onRightFunction: this.rightHandler
    };
    this.controller.setupWidget('fullImageView', this.viewerAttributes, this.viewerModel);

    this.headerNameElement.update(this.title);
    this.headerCountElement.update($L("#{index}/#{total}").interpolate({
        index: this.curPhotoIndex + 1,
        total: this.images.length
    }).escapeHTML());

    this.shareModel = {
        items: [{
                label: $L('Set wallpaper'),
                command: 'set-wallpaper',
                disabled: false
            },
            {
                label: $L('Share via email'),
                command: 'share-email',
                disabled: false
            },
            {
                label: $L('Share via MMS'),
                command: 'share-messaging',
                disabled: false
            }
        ]
    };
    //App Menu
    if (Mojo.Environment.DeviceInfo.platformVersionMajor >= 3) {
        var imgMenuModel = {
            visible: true,
            items: [{
                    label: $L('Set wallpaper'),
                    command: 'set-wallpaper',
                    disabled: false
                },
                {
                    label: $L('Share via email'),
                    command: 'share-email',
                    disabled: false
                },
                {
                    label: $L('Share via MMS'),
                    command: 'share-messaging',
                    disabled: false
                },
                { label: "Go Back", command: 'cmd-back' },
            ]
        };
        this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, imgMenuModel);
    }

    //Setup the command Menu
    this.cmdMenuModel = {
        visible: true,
        items: [
            { label: $L('Share'), icon: 'menu-share', submenu: 'share-submenu' },
            {}
        ]
    };
    if (Mojo.Environment.DeviceInfo.platformVersionMajor >= 3) {
        this.cmdMenuModel.items.unshift({ label: 'Back', icon: 'back', command: 'cmd-back' })
    }

    this.controller.setupWidget(Mojo.Menu.commandMenu, {
            spacerHeight: 0,
            menuClass: 'no-fade'
        },
        this.cmdMenuModel);

    //Setup the Spinner
    this.controller.setupWidget('spinnerActivity',
        this.attributes = {
            spinnerSize: "large"
        },
        this.model = {
            spinning: true
        }
    );

    this.controller.setupWidget('share-submenu', null, this.shareModel);
    this.startHideTimer();
};

//Upon activating, set to fullscreen
FullImageAssistant.prototype.aboutToActivate = function(event) {
    this.controller.enableFullScreenMode(true);
    this.orientateControls(Mojo.Controller.getAppController().getScreenOrientation());
};

FullImageAssistant.prototype.activate = function(event) {
    Mojo.Log.info("----- Movie DB: Full Image View: Activating:", Object.toJSON(this.images), "-----");

    this.controller.window.onresize = this.handleWindowResize.bind(this);
    this.fullImageElement.addEventListener(Mojo.Event.tap, this.handleTap.bind(this));

    this.isActive = true;

    this.fullImageElement.mojo.leftUrlProvided(this.getUrlForThe('left'), this.getThumbForThe('left'));
    this.fullImageElement.mojo.centerUrlProvided(this.getUrlForThe('center'), this.getThumbForThe('center'));
    this.fullImageElement.mojo.rightUrlProvided(this.getUrlForThe('right'), this.getThumbForThe('right'));

    this.spinnerElement.mojo.stop();
    this.overlayScrim.hide();
    this.handleWindowResize();
};

//Reset orientation
FullImageAssistant.prototype.deactivate = function(event) {
    Mojo.Log.info("----- Movie DB: Full Image View: Deactivate -----");
    this.controller.window.onresize = null;
    this.fullImageElement.removeEventListener(Mojo.Event.tap);

    this.isActive = false;
    this.stopHideTimer();
    if (Mojo.Environment.DeviceInfo.platformVersionMajor < 3) {
        this.orientateControls("up");
    }
};

//Delete unused images
FullImageAssistant.prototype.cleanup = function(event) {
    Mojo.Log.info("----- Movie DB: Full Image View: Cleanup:", Object.toJSON(this.ticketArray), "-----");
    this.controller.window.onresize = null;

    for (var i = 0; i < this.ticketArray.length; i++) {
        this.controller.serviceRequest('palm://com.palm.downloadmanager/', {
            method: 'deleteDownloadedFile',
            parameters: { "ticket": this.ticketArray[i] },
            onSuccess: function(resp) { Mojo.Log.info(Object.toJSON(resp)) },
            onFailure: function(e) { Mojo.Log.info(Object.toJSON(e)) }
        });
    }
};

//Start timer to hide the command menu and header
FullImageAssistant.prototype.startHideTimer = function() {
    Mojo.Log.info("----- Movie DB: Full Image View: Start Hide Timer -----");
    this.stopHideTimer();
    this.hideTimeout = this.controller.window.setTimeout(this.hideUI.bind(this), this.uiTimeoutSeconds * 1000);
};

//Stop the timer
FullImageAssistant.prototype.stopHideTimer = function() {
    Mojo.Log.info("----- Movie DB: Full Image View: Stop Hide Timer -----");
    if (!this.hideTimeout) {
        return;
    }

    this.controller.window.clearTimeout(this.hideTimeout);
    delete this.hideTimeout;
};

//Show UI elements
FullImageAssistant.prototype.showUI = function() {
    Mojo.Log.info("----- Movie DB: Full Image View: Show UI -----");
    this.uiVisible = true;
    this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
    this.controller.get('header').show();
    this.startHideTimer();
};

//Hide UI Elements
FullImageAssistant.prototype.hideUI = function() {
    Mojo.Log.info("----- Movie DB: Full Image View: Hide UI -----");
    this.stopHideTimer();
    this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
    this.controller.get('header').hide();
    this.uiVisible = false;
};

FullImageAssistant.prototype.orientateControls = function(dir) {
    Mojo.Log.info("----- Movie DB: Full Image View: Orientate Controls Called:", dir, "-----");
    if (this.orientation == dir) {
        Mojo.Log.info("Same dir, ignoring orientation.");
        return;
    }
    this.orientation = dir;
    if (Mojo.Environment.DeviceInfo.platformVersionMajor < 3) {
        this.controller.stageController.setWindowOrientation(dir);
    }
};

FullImageAssistant.prototype.orientationChanged = function(dir) {
    Mojo.Log.info("----- Movie DB: Full Image View: Orientate Controls Fired:", dir, "-----");

    if (!this.isActive) {
        Mojo.Log.info("Not active, ignoring orientation.");
        return;
    }

    this.orientateControls(dir);
};

FullImageAssistant.prototype.handleWindowResize = function(event) {
    Mojo.Log.info("----- Movie DB: Full Image View: Handle Windo Resize:", this.controller.window.innerWidth, "x", this.controller.window.innerHeight, "-----");
    if (this.fullImageElement && this.fullImageElement.mojo) {
        this.fullImageElement.mojo.manualSize(this.controller.window.innerWidth, this.controller.window.innerHeight);
    }
};

FullImageAssistant.prototype.leftHandler = function() {
    Mojo.Log.info("----- Movie DB: Full Image View: Left Handler -----");
    this.movePhotoIndex('left');
    this.fullImageElement.mojo.leftUrlProvided(this.getUrlForThe('left'), this.getThumbForThe('left'));
};

FullImageAssistant.prototype.rightHandler = function() {
    Mojo.Log.info("----- Movie DB: Full Image View: Right Handler -----");
    this.movePhotoIndex('right');
    this.fullImageElement.mojo.rightUrlProvided(this.getUrlForThe('right'), this.getThumbForThe('right'));
};

FullImageAssistant.prototype.movePhotoIndex = function(direction) {
    Mojo.Log.info("----- Movie DB: Full Image View: Current Index:", this.curPhotoIndex, "+ Delta Index:", this.positionDelta[direction], " -----");
    this.curPhotoIndex = this.curPhotoIndex + this.positionDelta[direction];

    // Wrap around edges
    if (this.curPhotoIndex > this.images.length - 1 || this.curPhotoIndex < 0) {
        this.curPhotoIndex = this.wrapAroundStyle(this.curPhotoIndex, this.images.length);
    }

    this.headerCountElement.update($L("#{index}/#{total}").interpolate({
        index: this.curPhotoIndex + 1,
        total: this.images.length
    }).escapeHTML());

    //this.captionDiv.innerHTML = this.captions[this.curPhotoIndex] || "";
};

FullImageAssistant.prototype.getUrlForThe = function(position) {
    Mojo.Log.info("----- Movie DB: Full Image View: Get URL for:", position, " -----");
    var urlIndex;
    urlIndex = this.curPhotoIndex + this.positionDelta[position];

    //reach around edges
    if (urlIndex > this.images.length - 1 || urlIndex < 0) {
        urlIndex = this.wrapAroundStyle(urlIndex, this.images.length);
    }

    return this.images[urlIndex].url;
};

FullImageAssistant.prototype.getThumbForThe = function(position) {
    Mojo.Log.info("----- Movie DB: Full Image View: Get Thumb for:", position, " -----");
    var urlIndex;
    urlIndex = this.curPhotoIndex + this.positionDelta[position];

    //reach around edges
    if (urlIndex > this.images.length - 1 || urlIndex < 0) {
        urlIndex = this.wrapAroundStyle(urlIndex, this.images.length);
    }

    return this.images[urlIndex].thumb;
};

FullImageAssistant.prototype.wrapAroundStyle = function(index, max) {
    return Math.abs(Math.abs(index) - max);
};

FullImageAssistant.prototype.handleTap = function(event) {
    Mojo.Log.info("----- Movie DB: Full Image View: Handle Tap -----");
    if (event.count != 1) {
        return;
    }

    event.stop();

    if (this.uiVisible) {
        this.hideUI();
    } else {
        this.showUI();
    }
};

FullImageAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        Mojo.Log.info("----- Movie DB: Full Image View: Handle Command:", event.command, "-----");
        switch (event.command) {
            case 'cmd-back':
                this.controller.stageController.popScene();
                break;
            case 'set-wallpaper':
                this.handleSetAsWallpaper();
                break;
            case 'share-messaging':
                this.handleSendViaMessaging();
                break;
            case 'share-email':
                this.handleAttachToEmail();
                break;
        }
    }
};

FullImageAssistant.prototype.showBanner = function(msg) {
    Mojo.Controller.getAppController().showBanner(msg, { source: 'notification' });
}

FullImageAssistant.prototype.downloadFile = function(tmpImage, source, successCallback, errorCallback) {
    Mojo.Log.info("----- Movie DB: FullImage: Downlaod File: Entered -----");
    var currentUrl = this.getUrlForThe('center');
    var dateNow = new Date();
    var fileName = dateNow.getTime() + currentUrl.substring(currentUrl.lastIndexOf("."));

    if (tmpImage) {
        var path = this.pathTmp;
    } else {
        var path = this.pathWall;
    }

    this.controller.serviceRequest('palm://com.palm.downloadmanager/', {
        method: 'download',
        parameters: {
            target: source,
            targetDir: path,
            targetFilename: fileName,
            subscribe: true
        },
        onFailure: errorCallback,
        onSuccess: function(resp) {
            if (resp.returnValue) {
                Mojo.Log.info("----- Movie DB: FullImage: Downlaod File: Started -----");
            } else {
                Mojo.Log.info("----- Movie DB: FullImage: Downlaod File: In Progress:", resp.amountReceived, "of", resp.amountTotal, "received -----")
            }
        }.bind(this),
        onComplete: function(resp) {
            if (resp.completed) {
                Mojo.Log.info("----- Movie DB: FullImage: Downlaod File: Complete:", Object.toJSON(resp), "-----");
                if (tmpImage) {
                    this.ticketArray.push(resp.ticket);
                }
                successCallback(path + "/" + fileName);
            }
        }.bind(this)
    });
};

FullImageAssistant.prototype.handleSendViaMessaging = function() {
    Mojo.Log.info("----- Movie DB: FullImage: Send Via MMS: Started -----");
    this.showBanner("Preparing to send via MMS...");

    function downloadWallpaperOkay(path) {
        Mojo.Log.info("----- Movie DB: FullImage: Send Via MMS: Download: Success:", path, " -----");

        this.controller.serviceRequest(
            'palm://com.palm.applicationManager', {
                method: 'open',
                parameters: {
                    id: 'com.palm.app.messaging',
                    params: { "attachment": path }
                }
            });

        this.spinnerElement.mojo.stop();
        this.overlayScrim.hide();
    }

    function downloadWallpaperFail(response) {
        Mojo.Log.error("----- Movie DB: FullImage: Send Via MMS: Failed:", Object.toJSON(response), " -----");

        this.spinnerElement.mojo.stop();
        this.overlayScrim.hide();
    }

    this.spinnerElement.mojo.start();
    this.overlayScrim.show();

    this.downloadFile(true, this.getUrlForThe('center'), downloadWallpaperOkay.bind(this), downloadWallpaperFail.bind(this));
};

FullImageAssistant.prototype.handleAttachToEmail = function() {
        Mojo.Log.info("----- Movie DB: FullImage: Send Via Email: Started -----");
        this.showBanner("Preparing to send via Email...");

        function downloadWallpaperOkay(path) {
            Mojo.Log.info("----- Movie DB: FullImage: Send Via Email: Download: Success:", path, " -----");

            this.controller.serviceRequest(
                'palm://com.palm.applicationManager', {
                    method: 'open',
                    parameters: {
                        id: 'com.palm.app.email',
                        params: {
                            recipients: [],
                            attachments: [{
                                fullPath: path
                            }]
                        }
                    }
                });

            this.spinnerElement.mojo.stop();
            this.overlayScrim.hide();
        }

        function downloadWallpaperFail(response) {
            Mojo.Log.error("----- Movie DB: FullImage: Send Via Email: Failed:", Object.toJSON(response), " -----");

            this.spinnerElement.mojo.stop();
            this.overlayScrim.hide();
        }

        this.spinnerElement.mojo.start();
        this.overlayScrim.show();

        this.downloadFile(true, this.getUrlForThe('center'), downloadWallpaperOkay.bind(this), downloadWallpaperFail.bind(this));
    },

    FullImageAssistant.prototype.handleSetAsWallpaper = function() {
        if (this.settingWallpaper) {
            Mojo.Log.error("Cannot set two wallpapers at once.");
            return;
        }

        this.showBanner("Preparing to set Wallpaper...");

        this.settingWallpaper = true;

        function downloadWallpaperOkay(response) {
            Mojo.Log.info("----- Movie DB: FullImage: Set Wallpaper: Download: Okay:", Object.toJSON(response), "-----");
            this.controller.serviceRequest(
                'palm://com.palm.systemservice/', {
                    method: 'wallpaper/importWallpaper',
                    parameters: {
                        target: response
                    },
                    onSuccess: importedWallpaperOkay.bind(this),
                    onFailure: assignedWallpaperFail.bind(this)
                });
        }

        function downloadWallpaperFail(response) {
            Mojo.Log.error("----- Movie DB: FullImage: Set Wallpaper: Download: Failed:", Object.toJSON(response), " -----");

            this.spinnerElement.mojo.stop();
            this.overlayScrim.hide();
        }

        function importedWallpaperOkay(response) {
            Mojo.Log.info("----- Movie DB: FullImage: Set Wallpaper: Import: Okay:", Object.toJSON(response), "-----");
            this.controller.serviceRequest(
                "palm://com.palm.systemservice/", {
                    method: "setPreferences",
                    parameters: { "wallpaper": response.wallpaper },
                    onSuccess: assignedWallpaperOkay.bind(this),
                    onFailure: assignedWallpaperFail.bind(this)
                });
        }

        function assignedWallpaperOkay(response) {
            Mojo.Log.info("----- Movie DB: FullImage: Set Wallpaper: Assigned: Okay:", Object.toJSON(response), "-----");
            Mojo.Log.info("Assign to wallpaper okay");
            delete this.settingWallpaper;

            this.showBanner("Wallpaper set successfully...");

            this.spinnerElement.mojo.stop();
            this.overlayScrim.hide();
        }

        function assignedWallpaperFail(response) {
            Mojo.Log.error("----- Movie DB: FullImage: Set Wallpaper: Assigned: Failed:", Object.toJSON(response), "-----");
            delete this.settingWallpaper;

            this.spinnerElement.mojo.stop();
            this.overlayScrim.hide();
        }

        this.spinnerElement.mojo.start();
        this.overlayScrim.show();

        this.downloadFile(true, this.getUrlForThe('center'), downloadWallpaperOkay.bind(this), downloadWallpaperFail.bind(this));

    };