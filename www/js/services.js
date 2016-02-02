angular.module('weather.services', [])

app.service('WeatherService',
	function($http, FORECAST_KEY) {
		return {
			//This function gets the current weather for a location
			//based on longitude and latitude
			//It will also get the weather based on an optional parameter - time
			//It uses forcast.io
			//Returns a promise for the response of the API call
			getCurrentWeather: function(lat, lng, time) {
				var url = 'https://api.forecast.io/forecast/' + FORECAST_KEY + '/';
				var fullUrl = url + lat + ',' + lng;
				if(time != null) {
					fullUrl += ',' + time;
				}
				fullUrl +='?callback=JSON_CALLBACK';
				return $http.jsonp(fullUrl);
			},
			
			//This function uses Google's Geocoding API to get latitude and longitude
			//from an entered location
			//Returns a promise for the response of the API call
			//http://stackoverflow.com/questions/21729605/syntaxerror-missing-before-statement
			getCoordinatesFromZip: function(zip) {
				var googleUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + zip + "&key=" + GOOGLE_KEY;
				return $http.get(googleUrl);
			},
			
			//This function gets the timezone offset for a given location
			//from UTC time
			//Returns a promise for the response of the API call
			//https://developers.google.com/maps/documentation/timezone/intro
			getTimezoneOffset: function(lat, lng, timestamp) {
				var googleUrl = 'https://maps.googleapis.com/maps/api/timezone/json?location=' + lat + ',' + lng + '&timestamp=' + timestamp + "&key=" + GOOGLE_KEY;
				console.log(googleUrl);
				return $http.get(googleUrl);
			},
			
			//This function converts Fahrenheit to Celsius
			toCelcius: function(celcius) {
				return +( ( (celcius - 32)/1.8 ).toFixed(2) );
			}
		}
	}
);

app.service('TimeService',
	function() {
		return {
			//Function to pad an integer with a leading 0
			//Used to put a zero before the number of minutes in epochToTime
			pad: function(integer, length) {
				var leadingInt = integer+"";
				while (leadingInt.length < length) leadingInt = "0" + leadingInt;
				return leadingInt;
			},
		
			//Function to convert an epoch date to a time including hour, minute, and am or pm
			epochToTime: function(epoch) {
				var date = new Date(0);
				date.setUTCSeconds(epoch);
				var hour = date.getHours();
				var ampm = 'am';
				if(hour == 12) {
					ampm = 'pm';
				}
				if(hour == 0) {
					hour = 12;
				}
				if(hour > 12) {
					hour -= 12;
					ampm = 'pm';
				}
				var minute = this.pad(date.getMinutes(), 2);
				return hour + ":" + minute + ampm;
			},
			
			//Function to convert an epoch date to an hour plus am or pm
			epochToHour: function(epoch) {
				var date = new Date(0);
				date.setUTCSeconds(epoch);
				var hour = date.getHours();
				var ampm = 'am';
				if(hour == 12) {
					ampm = 'pm';
				}
				if(hour == 0) {
					hour = 12;
				}
				if(hour > 12) {
					hour -= 12;
					ampm = 'pm';
				}
				return hour + ampm;
			},
			
			//Function to convert an epoch date to the day of the week
			epochToDayOfWeek:function(epoch) {
				var date = new Date(0);
				date.setUTCSeconds(epoch);
				var day = date.getDay();
				//http://www.w3schools.com/jsref/jsref_getday.asp
				var weekday = new Array(7);
				weekday[0]=  "Sunday";
				weekday[1] = "Monday";
				weekday[2] = "Tuesday";
				weekday[3] = "Wednesday";
				weekday[4] = "Thursday";
				weekday[5] = "Friday";
				weekday[6] = "Saturday";
				return weekday[day];
			}
			
		}		
	}
);
