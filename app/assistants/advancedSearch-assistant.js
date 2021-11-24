function AdvancedSearchAssistant() {};

AdvancedSearchAssistant.prototype.setup = function() {
	Mojo.Log.info("----- Movie DB: Advanced Search: Setup Called -----");
	
	this.listModel = [
		{category:$L("Other"), detail:$L("Advanced Search")},
		{category:$L("Other"), detail:$L("Browse Genres")}		
	];
	
	// setup menu
	this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, menuModel);
	
	// get elements
	this.txtSearchElement = this.controller.get('txt_search');
	this.spanVersion = this.controller.get('main-version');
	this.btnSearchElement = this.controller.get('btn_search');
	
	this.keyupHandler = this.handleKeyUp.bindAsEventListener(this);
	this.btnSearchTapHandler = this.btn_searchPress.bindAsEventListener(this);
	
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
	
	this.spanVersion.innerHTML = $L('v') + Mojo.appInfo.version;
};

AdvancedSearchAssistant.prototype.activate = function(event) {
	Mojo.Log.info("----- Movie DB: Advanced Search: Activate Called -----");
	
	this.controller.document.addEventListener("keyup", this.keyupHandler, true);
	this.btnSearchElement.addEventListener(Mojo.Event.tap, this.btnSearchTapHandler);
	this.txtSearchElement.mojo.focus();	
	
	this.btnSearchElement.style.visibility = 'visible';
};

AdvancedSearchAssistant.prototype.deactivate = function(event) {
	Mojo.Log.info("----- Movie DB: Advanced Search: Deactivate Called -----");
	
	this.controller.document.removeEventListener('keyup', this.keyupHandler, true);
	this.btnSearchElement.removeEventListener(Mojo.Event.tap);
};

AdvancedSearchAssistant.prototype.cleanup = function(event) {};

//Handles the enter key
AdvancedSearchAssistant.prototype.handleKeyUp = function(event) {
	Mojo.Log.info("----- Movie DB: Advanced Search: Keyup in Search Box:", event.keyCode, "-----");
	if (event && Mojo.Char.isEnterKey(event.keyCode)) {
		if(event.srcElement.parentElement.id=="txt_search") {
			this.btn_searchPress(event);
		}
	}
};

AdvancedSearchAssistant.prototype.btn_searchPress = function(event) {
	Mojo.Log.info("----- Movie DB: Advanced Search: Button Search Pressed -----");
	
	var searchVal = this.txtSearchElement.mojo.getValue();
	
	if (searchVal.length > 0) {
		this.controller.stageController.pushScene("searchList", searchVal, "basic");
	}
	else {
		this.controller.showAlertDialog({
			onChoose: function(value){},
			title: $L("Error"),
			message: $L("Invalid Search Criteria"),
			choices:[
				{label:$L('OK'), type:'negative'},
			]
		});
		
		this.txtSearchElement.mojo.focus();
	}    
};
