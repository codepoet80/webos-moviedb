function Utility() {
    this.imdbTitleURI = "http://m.imdb.com/title/"
    this.imdbNameURI = "http://m.imdb.com/name/"
    this.imdbSearchTitleURI = "http://m.imdb.com/find?s=tt&q="
    this.imdbSearchNameURI = "http://m.imdb.com/find?s=nm&q="

    this.imdbType = {"Title": 0, "Name": 1, "SearchTitle": 2, "SearchName": 3};
};

Utility.prototype.formatRuntime = function(minutes) {
    var runtime = minutes + " min.";

    if (minutes >= 60) {
        var min = minutes % 60;
        var hours = ((minutes - min) / 60);

        runtime = hours + " hr. " + min + "min.";
    }

    return runtime;
};

Utility.prototype.formatCurrency = function(num) {
    if (num > 0) {
        num = num.toString().replace(/\$|\,/g, '');

        if (isNaN(num)) {
            num = "0";
        }

        num = Math.floor(num * 100 + 0.50000000001);
        var cents = num % 100;
        num = Math.floor(num / 100).toString();

        if (cents < 10) {
            cents = "0" + cents;
        }

        for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) {
            num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
        }

        //return ('$' + num + '.' + cents);
        return ('$' + num);
    }
    else {
        return "Unavailable";
    }
}

Utility.prototype.formatDate = function(date, fullDate) {
    var d = Date.parse(date);
    var dateVal = new Date(d);
    var year = dateVal.getFullYear();

    if (year > 1900) {
        if (fullDate) {
            var monthname = new Array("January","February","March","April","May","June","July","August","September","October","November","December");

            return (monthname[dateVal.getMonth()] + " " + dateVal.getDate() + ", " + dateVal.getFullYear());
        }
        else {
            return (dateVal.getMonth()+1 + "/" + dateVal.getDate() + "/" + dateVal.getFullYear());
        }
    }
    else {
        return "N/A";
    }
};

Utility.prototype.getYear = function(date) {
    var d = Date.parse(date);
    var fullDate = new Date(d);
    var year = fullDate.getFullYear();

    if (year > 1900) {
        return year;
    }
    else {
        return "N/A";
    }
};

Utility.prototype.sortBy = function(field, reverse, primer) {
    reverse = (reverse) ? -1 : 1;

    return function(a,b){
        a = a[field];
        b = b[field];

        if (typeof(primer) != 'undefined'){
            a = primer(a);
            b = primer(b);
        }

        if (a<b) return reverse * -1;
        if (a>b) return reverse * 1;
        return 0;
   }
};

Utility.prototype.preloadImage = function(url, target, width, height) {
    var img = document.createElement('img');

	img.onload = function() {
        this.onload = undefined;
        target.style.backgroundImage = 'url(' + this.src + ')';
        target.style.backgroundSize = this.width + 'px ' + this.height + 'px';
		target.style.width = this.width + 'px';
		target.style.height = this.height + 'px';
	};

    img.src = url;
    img.width = width;
    img.height = height;
};

Utility.prototype.getIMDBTitleUrl = function(id) {
    return this.generateIMDBUrl(id, this.imdbType.Title);
};

Utility.prototype.getIMDBPersonUrl = function(id) {
    return this.generateIMDBUrl(id, this.imdbType.Name);
};

Utility.prototype.getIMDBSearchTitleUrl = function(id) {
    return this.generateIMDBUrl(id, this.imdbType.SearchTitle);
};

Utility.prototype.generateIMDBUrl = function(val, type) {
    Mojo.Log.info("----- Movie DB: Utility: Generate IMDB Started:", type, " & ", val, "-----");
    var url ="";

    switch (type) {
        case this.imdbType.Title:
            url = this.imdbTitleURI + val;
            break;
        case this.imdbType.Name:
        	url = this.imdbNameURI + val;
            break;
        case this.imdbType.SearchTitle:
            url = this.imdbSearchTitleURI + val.replace(" ", "+");
            break;
        case this.imdbType.SearchName:
            break;
        default:
            url = this.imdbTitleURI + val;
            break;

    }

    Mojo.Log.info("----- Movie DB: Utility: Generate IMDB Return URL:", url, "-----");
    return url;
};