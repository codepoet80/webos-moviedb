function Cookie() {
	this.cookie = false;
	this.load();
};

Cookie.prototype.load = function() {
	try {
		if (!this.cookie){
			this.cookie = new Mojo.Model.Cookie('movieDB');
		}
	} 
	catch (e) {
		Mojo.Log.logException(e, 'Cookie Load');
	}
};

Cookie.prototype.get = function() {
	// uncomment to delete cookie for testing
	//this.cookie.remove();
	var cookieData = this.cookie.get();
	
    if(cookieData) {  
        // If current version, just update globals & prefs  
        if(cookieData.versionString == MovieDB.versionString) {
			//Same version
        }  
        else {  
            MovieDB.isFirst = false;
			MovieDB.isNew = true;
			this.put();			
        }  
    }
	else {
		MovieDB.isFirst = true;
		MovieDB.isNew = true;
		this.put();
	}
};

Cookie.prototype.put = function() {  
    try {
		this.load();
		
		this.cookie.put({
			versionString: MovieDB.versionString
		});
	}
	catch (e) {
		Mojo.Log.logException(e, "Cookie Put");
	}
};  