function TMDbApi() {
	Mojo.Log.info("----- Movie DB: TMDbApi: Initialize -----");

	//TODO: /configuration - API that returns base info
/*
	/configuration
	Updated on Dec. 13, 2013

	Get the system wide configuration information. Some elements of the API require some knowledge of this configuration data. The purpose of this is to try and keep the actual API responses as light as possible. It is recommended you cache this data within your application and check for updates every few days.

	This method currently holds the data relevant to building image URLs as well as the change key map.

	To build an image URL, you will need 3 pieces of data. The base_url, size and file_path. Simply combine them all and you will have a fully qualified URL. Here’s an example URL:http://image.tmdb.org/t/p/w500/8uO0gUM8aNqYLs1OsTBQiXu0fEv.jpg
	Required Parameters
	api_key
*/
    this.BASE_URI = "http://api.themoviedb.org/";
    this.API_VERSION = "3";
    this.LANGUAGE = "en";
    this.API_MODE = "json";
    this.API_KEY = "1656ddde30e44456a24f525a975247d0";
    this.MOVIES_GETIMAGES_URL = "Movie.getImages";//un-used
    //this.MOVIES_SEARCH_URL = "Movie.search";
    this.MOVIES_SEARCH_URL = "search/movie";
    this.MOVIES_GETINFO_URL = "movie";//"Movie.getInfo";
    this.MOVIES_GETVERSION_URL = "Movie.getVersion";//un-used
    this.MOVIES_GETLATEST_URL = "Movie.getLatest";//un-used
    this.MOVIES_MULTILIST_PREFIX_URL = "movie/";///now_playing";//un-used
    this.MOVIES_GETTRANSLATIONS_URL =  "Movie.getTranslations";//un-used
    this.MOVIES_GENRE_LIST_URL = "genre";//"Movie.browse"; //genre/{id}/movies";//" ???
    this.MOVIES_BROWSE_URL = "discover/movie";//"Movie.browse";
    this.MOVIES_ADDRATING_URL = "Movie.addRating";//un-used

    this.TV_GETINFO_URL = "tv";
    //this.PERSON_SEARCH_URL = "Person.search";
    this.PERSON_SEARCH_URL = "search/person";
    this.PERSON_GETINFO_URL = "person";//"Person.getInfo";
    this.PERSON_GETVERSION_URL = "Person.getVersion";
    this.PERSON_GETLATEST_URL = "Person.getLatest";
    this.GENRES_GETLIST_URL = "genre/movie/list";//"Genres.getList";
    this.AUTH_TOKEN_URL = "Auth.getToken";
    this.AUTH_SESSION_URL = "Auth.getSession";
}

// Perform a movie search using the searchString
TMDbApi.prototype.movieSearch = function(searchString, successCallback, errorCallback) {
    Mojo.Log.warn("----- Movie DB: TMDbApi: Movie Search for: ", searchString, " -----");

    var url = this.BASE_URI
                + this.API_VERSION + "/"
                + this.MOVIES_SEARCH_URL
                //+ this.LANGUAGE + "/"
                //+ this.API_MODE + "/"
                + "?api_key=" + this.API_KEY
                + "&query=" + searchString;

    Mojo.Log.warn("----- Movie DB: TMDbApi: Movie Search URL: ", url, " -----");

    // do AJAX request
	new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
        contentType:"application/json",
		onSuccess: function(transport) {
			if (transport.status == 0) {
				errorCallback(transport);
			}
			else {
				successCallback(transport);
			}
		},
		onFailure: errorCallback
	});
}

// Perform a Movie Lookup using the specified Movie ID
TMDbApi.prototype.movieGetInfo = function(movieID, mediatype, successCallback, errorCallback) {
    Mojo.Log.info("----- Movie DB: TMDbApi: Movie GetInfo for: ", movieID, " -----");

    var url = this.BASE_URI
                + this.API_VERSION + "/"
                + (mediatype == "movie" ? this.MOVIES_GETINFO_URL : this.TV_GETINFO_URL ) + "/"
                + movieID
                + "?api_key=" + this.API_KEY
                + "&language=" + this.LANGUAGE
                + "&append_to_response=images,credits,releases";
//                + this.API_MODE + "/"
//                + this.API_KEY + "/"

    Mojo.Log.info("----- Movie DB: TMDbApi: Movie GetInfo URL: ", url, " -----");

    // do AJAX request
	new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
        contentType:"application/json",
		onSuccess: function(transport) {
			if (transport.status == 0) {
				errorCallback(transport);
			}
			else {
				successCallback(transport);
			}
		},
		onFailure: errorCallback
	});
}


// Perform a Movie search using the searchString
TMDbApi.prototype.personSearch = function(searchString, successCallback, errorCallback) {
    Mojo.Log.info("----- Movie DB: TMDbApi: Person Search for: ", searchString, " -----");

    var url = this.BASE_URI
                + this.API_VERSION + "/"
                + this.PERSON_SEARCH_URL
                + "?api_key=" + this.API_KEY
                + "&language=" + this.LANGUAGE
                + "&query=" + searchString;

                //+ this.API_VERSION + "/"
                //+ this.PERSON_SEARCH_URL + "/"
                //+ this.LANGUAGE + "/"
                //+ this.API_MODE + "/"
                //+ this.API_KEY + "/"
                //+ searchString;

    Mojo.Log.info("----- Movie DB: TMDbApi: Person Search URL: ", url, " -----");

    // do AJAX request
	new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
        contentType:"application/json",
		onSuccess: function(transport) {
			if (transport.status == 0) {
				errorCallback(transport);
			}
			else {
				successCallback(transport);
			}
		},
		onFailure: errorCallback
	});
};

// Perform a Person Lookup using the specified Person ID
TMDbApi.prototype.personGetInfo = function(personID, successCallback, errorCallback) {
    Mojo.Log.info("----- Movie DB: TMDbApi: Person GetInfo for: ", personID, " -----");

    var url = this.BASE_URI
                + this.API_VERSION + "/"
                + this.PERSON_GETINFO_URL + "/"
                + personID
//                + this.API_MODE + "/"
	 			+ "?api_key=" + this.API_KEY
	 			+ "&language=" + this.LANGUAGE
                + "&append_to_response=images,combined_credits";


    Mojo.Log.info("----- Movie DB: TMDbApi: Person GetInfo URL: ", url, " -----");

    // do AJAX request
	new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
        contentType:"application/json",
		onSuccess: function(transport) {
			if (transport.status == 0) {
				errorCallback(transport);
			}
			else {
				successCallback(transport);
			}
		},
		onFailure: errorCallback
	});
};

TMDbApi.prototype.genresGetList = function(successCallback, errorCallback) {
	 Mojo.Log.info("----- Movie DB: TMDbApi: Genres Get List -----");

//http://api.themoviedb.org/3/genre/movie/list?api_key=1656ddde30e44456a24f525a975247d0
	 var url = this.BASE_URI
	 			+ this.API_VERSION + "/"
	 			+ this.GENRES_GETLIST_URL
	 			//+ this.LANGUAGE + "/"
	 			//+ this.API_MODE + "/"
	 			+ "?api_key=" + this.API_KEY
	 			+ "&language=" + this.LANGUAGE;

	 Mojo.Log.info("----- Movie DB: TMDbApi: Genres Get List URL: ", url, " -----");

	 // do AJAX request
	 new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
		contentType:"application/json",
		onSuccess: function(transport) {
			if (transport.status == 0) {
				errorCallback(transport);
			}
			else {
				successCallback(transport);
			}
		},
		onFailure: errorCallback
	});
};

TMDbApi.prototype.movieBrowse = function(params, page, successCallback, errorCallback) {
	try {
	 Mojo.Log.info("----- Movie DB: TMDbApi: Movie Browse:", Object.toJSON(params), "-----");
	 if (!params.genres || params.genres.length == 0) {
		 errorCallback();
	 }

	////http://api.themoviedb.org/3/discover/movie?api_key=1656ddde30e44456a24f525a975247d0&language=en&sort_by=release_date.desc&with_genres=28&release_date.lte=2014-09-04
	 var url = this.BASE_URI
	 			+ this.API_VERSION + "/"
	 			+ this.MOVIES_BROWSE_URL
//	 			+ this.LANGUAGE + "/"
//	 			+ this.API_MODE + "/"
//	 			+ this.API_KEY + "?"
	 			+ "?api_key=" + this.API_KEY
	 			+ "&language=" + this.LANGUAGE;
	 			//+ "&page=" + page;



	 var order_by = "primary_release_date";
	 var order = "asc";
	 var min_votes = "1";
	 var per_page = MovieDB.perPageResults;


	 //if (params != null && params.length > 0) {
		 if (params.order_by && params.order_by != null) {
			 order_by = params.order_by;
		 }
		 url = url + "&sort_by=" + order_by;

		 if (params.order && params.order != null) {
			 order = params.order
		 }
		 url = url + "." + order;

		 if (params.min_votes && params.min_votes != null) {
			 min_votes = MovieDB.minVotes;
		 }
		 url = url + "&vote_count.gte=" + min_votes;

		 count = 0;
		 for (var i = 0; params.genres && i < params.genres.length; i++) {
			 if (params.genres[i].id != null) {
				 count++;
				 if (i == 0) {
					url = url + "&with_genres=" + params.genres[i].id;
				 }
				 else {
					 url = url + "," +params.genres[i].id;
				 }
			 }
		 }

		 //if (count > 1) {
		//	 url = url + "&genres_selector=AND";
		 //}

	 //TODO: add filter for release date?
	 //&release_date.lte=2014-09-04

		 url = url + "&page=" + page; // +"&per_page=" + per_page; //no longer supported
	// }

	 Mojo.Log.info("----- Movie DB: TMDbApi: Genres Get List URL: ", url, " -----");

	 // do AJAX request
	 new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
		contentType:"application/json",
		onSuccess: function(transport) {
			if (transport.status == 0) {
				errorCallback(transport);
			}
			else {
				successCallback(transport);
			}
		},
		onFailure: errorCallback
	});
} catch (ex) {
	Mojo.Log.error("Exception in TMDbAPI.movieBrowse(): ", ex);
}
};

// Perform a movie search using the searchString
TMDbApi.prototype.movieGetNowPlaying = function(listType, page, successCallback, errorCallback) {

    var url = this.BASE_URI
                + this.API_VERSION + "/"
                + this.MOVIES_MULTILIST_PREFIX_URL + (listType ? listType : "now_playing")
                + "?api_key=" + this.API_KEY
                + "&page=" + page
	 			+ "&language=" + this.LANGUAGE;

    Mojo.Log.warn("----- Movie DB: TMDbApi: Movie NowPlaying URL: ", url, " -----");

    // do AJAX request
	new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force',
        contentType:"application/json",
		onSuccess: function(transport) {
			if (transport.status == 0) {
				errorCallback(transport);
			}
			else {
				successCallback(transport);
			}
		},
		onFailure: errorCallback
	});
};

