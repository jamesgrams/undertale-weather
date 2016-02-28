angular.module('weather.services', [])

/* Provides a template in order to create city objects
*/
app.factory('City', 
	function(WeatherFactory, TimeFactory, DisplayFactory) {
		
		/* Constructor function to create a city object
		*/
		var City = function() {
			this.name = "";
			this.latitude = "";
			this.longitude = "";
			this.timezoneOffset = "";
			this.hours = [];
			this.days = [];
			this.order = [];
			this.celcius = false;
		}
		
		/* Toggle between celcius and fahrenheit
		*/
		City.prototype.toggleCelcius = function() {
			if(this.celcius) {
				this.setCelcius(false);
			}
			else {
				this.setCelcius(true);
			}
		}
		
		/* Change display to celcius or fahrenheit
		 * @param	boolean		celcius		Whether to display in celcius
		*/
		City.prototype.setCelcius = function(celcius) {
			if(celcius != this.celcius) {
				if(!this.celcius) {
					this.celcius = celcius;
					for(var i = 0; i < this.hours.length; i++) {
						this.hours[i].temperature.information = this.hours[i].temperature.actualCelcius + "°";
						this.hours[i].feels.information = this.hours[i].feels.actualCelcius + "°";
						if(this.hours[i].precipAccumulation != undefined) {
							this.hours[i].precipAccumulation.information = this.hours[i].precipAccumulation.actualCelcius + "cm";
						}
					}
					for(var i = 0; i < this.days.length; i++) {
						this.days[i].high.information = this.days[i].high.actualCelcius + "°";
						this.days[i].low.information = this.days[i].low.actualCelcius + "°";
						this.days[i].feelsHigh.information = this.days[i].feelsHigh.actualCelcius + "°";
						this.days[i].feelsLow.information = this.days[i].feelsLow.actualCelcius + "°";
						if(this.days[i].precipAccumulation != undefined) {
							this.days[i].precipAccumulation.information = this.days[i].precipAccumulation.actualCelcius + "cm";
						}
					}
				}
				else {
					this.celcius = celcius;
					for(var i = 0; i < this.hours.length; i++) {
						this.hours[i].temperature.information = this.hours[i].temperature.actual + "°";
						this.hours[i].feels.information = this.hours[i].feels.actual + "°";
						if(this.hours[i].precipAccumulation != undefined) {
							this.hours[i].precipAccumulation.information = this.hours[i].precipAccumulation.actual + "in";
						}
					}
					for(var i = 0; i < this.days.length; i++) {
						this.days[i].high.information = this.days[i].high.actual + "°";
						this.days[i].low.information = this.days[i].low.actual + "°";
						this.days[i].feelsHigh.information = this.days[i].feelsHigh.actual + "°";
						this.days[i].feelsLow.information = this.days[i].feelsLow.actual + "°";
						if(this.days[i].precipAccumulation != undefined) {
							this.days[i].precipAccumulation.information = this.days[i].precipAccumulation.actual + "in";
						}
					}
				}
			}
		}
		
		/* Set both the time zone and location from provided information
		 * @param	string		name				The name of the location
		 * @param	float		lat					The latitude of the location
		 * @param	float		lng					The longitude of the location
		 * @param	int			timezoneOffset		The timezone offset of the location
		 * @param	boolean		celcius				Whether to display temperature in celcius
		 * @param	function	callback			The function to run after finishing
		*/
		City.prototype.setLocationInformationFromKnownData = function(name, lat, lng, timezoneOffset, celcius, callback) {
			this.name = name;
			this.latitude = lat;
			this.longitude = lng;
			this.timezoneOffset = timezoneOffset;
			this.celcius = celcius;
			callback();
		}
		
		/* Set both the time zone and location by requesting them from their respective APIs
		 * @param	string		loc					The location entered by the user
		 * @param	function	callback			The function to run after successfully fetching the data
		 * @param	function	failureLocation		The function to run after failing to find a location based on the user's entry
		 * @param	function	failureNetwork		The function to run after failing to connect to the network
		*/
		City.prototype.setLocationInformation = function(loc, callback, failureLocation, failureNetwork) {
			var self = this;
			WeatherFactory.getCoordinatesFromLocation(loc).then(function(resp) {
				foundLocation = self.setLocation(resp);
				if(!foundLocation) {
					failureLocation();
					return;
				}
				var time = new Date().getTime()/1000;
				WeatherFactory.getTimezoneOffset(self.latitude, self.longitude, time).then(function(resp) {
					self.setTimeZone(resp);
					callback();
				},
				function(error) {
					failureNetwork();
				});
			},
			function(error) {
				failureNetwork();
			});
		}
		
		/* Set the time zone
		 * @param	object	resp	The response from the Google Time zone API call
		*/
		City.prototype.setTimeZone = function(resp) {
			this.timezoneOffset = (resp.data['rawOffset'] + resp.data['dstOffset']);
		}
		
		/* Set the location
		 * @param	object	resp	The response from the Google Geocoding API call
		 * @returns	boolean			True if found a location successfully
		*/
		City.prototype.setLocation = function(resp) {
			var self = this;
			if(resp.data.status != "OK" || resp.data.results[0].address_components[1] == undefined) {
				return false;
			}
			else {
				self.name = "";
				outerLoop:
				for(var i = 0; i < resp.data.results[0].address_components.length; i ++) {
					for(j = 0; j < resp.data.results[0].address_components[i].types.length; j++) {
						if(resp.data.results[0].address_components[i].types[j] == "locality") {
							self.name = resp.data.results[0].address_components[i].short_name;
							break outerLoop;
						}
					}
				}
				if(self.name == "") {
					self.name = resp.data.results[0].address_components[1].short_name;
				}
				self.latitude = resp.data.results[0].geometry.location.lat;
				self.longitude = resp.data.results[0].geometry.location.lng;
				return true;
			}
		}
		
		/* Fetch the weather
		 * @param	function	callback	Function to call once the weather has been fetched
		*/
		City.prototype.fetchWeather = function(callback) {
			DisplayFactory.loadingBackground();
			var self = this;
			WeatherFactory.getCurrentWeather(this.latitude, this.longitude).then(function(resp) {
				self.initializeHours(resp.data.hourlyData);
				self.initializeDays(resp.data.dailyData);
				callback();
			}, function(error) {
				DisplayFactory.errorBackground();
			});
		}
		
		/* Initialize the hours array that
		 * Contains information about current weather data and the next 9 hours
		 * @param	object	hoursData	The data received about hourly weather data
		*/
		City.prototype.initializeHours = function(hoursData) {
			var userOffset = new Date().getTimezoneOffset() * 60;
			for(var i = 0; i < 10; i++) {
				this.hours[i] = {};
				var resource;
				resource = hoursData[i];
				if(i == 0) {
					this.hours[i]['time'] = {'label':'Time', 'information':'Now', 'actual':hoursData[i].time + this.timezoneOffset + userOffset};
				}
				else {
					this.hours[i]['time'] = {'label':'Time', 'information':TimeFactory.epochToHour(hoursData[i].time + this.timezoneOffset + userOffset), 'actual':hoursData[i].time + this.timezoneOffset + userOffset};
				}
				var temp = resource.temp;
				var feelsTemp = resource.feels;
				var celciusTemp = WeatherFactory.toCelcius(temp);
				var celciusFeels = WeatherFactory.toCelcius(feelsTemp);
				if(this.celcius) {
					var displayTemp = celciusTemp;
					var displayFeels = celciusFeels;
				}
				else {
					var displayTemp = temp;
					var displayFeels = feelsTemp;
				}
				this.hours[i]['temperature'] = {'label':"Temp", 'information': displayTemp + "°", 'actual':temp, 'actualCelcius': celciusTemp};
				this.hours[i]['feels'] = {'label':"Feels", 'information': displayFeels + "°", 'actual':feelsTemp, 'actualCelcius': celciusFeels};
				var precipType = resource.precipType;
				if(precipType == "None") {
					if(resource.temp <= 32) {
						precipType = "Snow";
					}
					else {
						precipType = "Rain";
					}
				}
				else {
					precipType = precipType.charAt(0).toUpperCase() + precipType.slice(1);
				}
				this.hours[i]['precipProb'] = {'label':precipType, 'information':Math.round(resource.precipProb * 100) + "%"};
				//Note, use hoursData[i] here because current accumulation is never defined
				var precipAccumulation = hoursData[i].precipAccumulation;
				if(precipAccumulation != 0) {
					var celciusPrecipAccumilation = WeatherFactory.toCm(precipAccumulation);
					if(this.celcius) {
						var displayAccumulation = celciusPrecipAccumilation;
						var displayUnit = "cm";
					}
					else {
						var displayAccumulation = precipAccumulation;
						var displayUnit = "in";
					}
					this.hours[i]['precipAccumulation'] = {'label':precipType + "fall", 'information':displayAccumulation+displayUnit, 'actual':precipAccumulation, 'actualCelcius':celciusPrecipAccumilation};
				}
				this.hours[i]['windSpeed'] = {'label':"Wind Speed", 'information':resource.windSpeed + "mph"};
				this.hours[i]['humidity'] = {'label':"Humidity", 'information':Math.round(resource.humidity * 100) + "%"};
				this.hours[i]['poweredBy'] = {'label':"Powered By", 'information':"Forecast.io"};
			}
		}
		
		/* Initialize the days array that
		 * Contains information about current weather data and the next 9 hours
		 * @param	object	daysData	The data received about daily weather data
		*/
		City.prototype.initializeDays = function(daysData) {
			var userOffset = new Date().getTimezoneOffset() * 60;
			for(var i = 0; i < 7; i++) {
				this.days[i] = {};
				if(i == 0) {
					this.days[i]['time'] = {'label':'Day', 'information':'Today'};
				}
				else {
					this.days[i]['time'] = {'label':'Day', 'information':TimeFactory.epochToDayOfWeek(daysData[i].time + this.timezoneOffset + userOffset)};
				}
				//Make a copy, this works since this function is called after initializeHours
				this.days[i].temperature = this.hours[i].temperature;
				
				var tempMax = daysData[i].high;
				var tempMin = daysData[i].low;
				var feelsTempMin = daysData[i].feelsLow;
				var feelsTempMax = daysData[i].feelsHigh;
				
				var celciusTempMax = WeatherFactory.toCelcius(tempMax);
				var celciusTempMin = WeatherFactory.toCelcius(tempMin);
				var celciusFeelsTempMin = WeatherFactory.toCelcius(feelsTempMin);
				var celciusFeelsTempMax = WeatherFactory.toCelcius(feelsTempMax);
				
				if(this.celcius) {
					var displayTempMax = celciusTempMax;
					var displayTempMin = celciusTempMin;
					var displayFeelsTempMin = celciusFeelsTempMin;
					var displayFeelsTempMax = celciusFeelsTempMax;
				}
				else {
					var displayTempMax = tempMax;
					var displayTempMin = tempMin;
					var displayFeelsTempMin = feelsTempMin;
					var displayFeelsTempMax = feelsTempMax;
				}
				
				this.days[i]['high'] = {'label':"High", 'information': displayTempMax + "°", 'actual':tempMax, 'actualCelcius':celciusTempMax};
				this.days[i]['low'] = {'label':"Low", 'information': displayTempMin + "°", 'actual':tempMin, 'actualCelcius':celciusTempMin};
				var precipType = daysData[i].precipType;
				if(precipType == "None") {
					if(daysData[i].temp <= 32) {
						precipType = "Snow";
					}
					else {
						precipType = "Rain";
					}
				}
				else {
					precipType = precipType.charAt(0).toUpperCase() + precipType.slice(1);
				}
				var precipAccumulation = daysData[i].precipAccumulation;
				if(precipAccumulation != 0) {
					var celciusPrecipAccumilation = WeatherFactory.toCm(precipAccumulation);
					if(this.celcius) {
						var displayAccumulation = celciusPrecipAccumilation;
						var displayUnit = "cm";
					}
					else {
						var displayAccumulation = precipAccumulation;
						var displayUnit = "in";
					}
					this.days[i]['precipAccumulation'] = {'label':precipType + "fall", 'information':displayAccumulation+displayUnit, 'actual':precipAccumulation, 'actualCelcius':celciusPrecipAccumilation};
				}
				this.days[i]['feelsHigh'] = {'label':"Feels High", 'information': displayFeelsTempMax + "°", 'actual':feelsTempMax, 'actualCelcius':celciusFeelsTempMax};
				this.days[i]['feelsLow'] = {'label':"Feels Low", 'information': displayFeelsTempMin + "°", 'actual':feelsTempMin, 'actualCelcius':celciusFeelsTempMin};
				this.days[i]['sunrise'] = {'label':"Sunrise", 'information': TimeFactory.epochToTime(daysData[i].sunrise + this.timezoneOffset + userOffset), 'actual': daysData[i].sunrise + this.timezoneOffset + userOffset};
				this.days[i]['sunset'] = {'label':"Sunset", 'information': TimeFactory.epochToTime(daysData[i].sunset + this.timezoneOffset + userOffset), 'actual': daysData[i].sunset + this.timezoneOffset + userOffset};
				this.days[i]['windSpeed'] = {'label':"Wind Speed", 'information': daysData[i].windSpeed + "mph"};
				this.days[i]['humidity'] = {'label':"Humidity", 'information': Math.round(daysData[i].humidity * 100) + "%"};
				this.days[i]['moonPhase'] = {'label':"Moon Phase", 'information': Math.round(daysData[i].moonPhase * 100) + "%"};
				this.days[i]['poweredBy'] = {'label':"Powered By", 'information': "Forecast.io"};
			}
		}
		
		/* Initialize the order array specifying the order of the hourly or daily dogs
		 * @param	int			index	The index of the hours array to set the order for
		 * @param	boolean		hours	True if setting to hours
		*/
		City.prototype.setInfoOrder = function(index, hours) {
			if(hours) {
				var precipAccumulation = this.hours[index].precipAccumulation;
				if(precipAccumulation != undefined) {
					this.order = ['time','temperature','feels', 'precipProb', 'precipAccumulation', 'windSpeed', 'humidity', 'poweredBy']; 
				}
				else {
					this.order = ['time','temperature','feels', 'precipProb', 'windSpeed', 'humidity', 'poweredBy']; 
				}
			}
			else {
				var precipAccumulation = this.days[index].precipAccumulation;
				if(precipAccumulation != undefined) {
					this.order = ['time','temperature','high','low', 'precipAccumulation', 'feelsHigh', 'feelsLow', 'sunrise', 'sunset', 'windSpeed', 'humidity', 'moonPhase', 'poweredBy']; 
				}
				else {
					this.order = ['time','temperature','high','low', 'feelsHigh', 'feelsLow', 'sunrise', 'sunset', 'windSpeed', 'humidity', 'moonPhase', 'poweredBy'];
				}
			}
		}
		
		return City;
	}
);

/* Manage aspects of the Display including animation and backgrounds
*/
app.factory('DisplayFactory',
	function($ionicScrollDelegate, $ionicSlideBoxDelegate, $ionicPopup) {
		var DisplayFactory = {}
		
		var displayHours = true;
		var dogScale = 1;
		var animateFunction;
		var moveFunction;
		var stopped = false;
		var directionRight = false;
		var dogSong = new Audio('snd/dogsong.mp3');
		dogSong.loop = true;
		var startedDogSong = false;
		var mute = false;
		
		var HOT_TEMPERATURE = 50;
		var STANDARD_WAIT_TIME = 700;
		var TIME_BETWEEN_MOVEMENT = 20;
		var TRAVEL_DISTANCE = 2;

		/* Get whether the music is currently muted
		 * @returns	boolean		If the music is muted
		*/
		DisplayFactory.getMute = function() {
			return mute;
		}
		
		/* Set whether the music is currently muted (for loading)
		 * @param	boolean		newMute		What mute should be set to
		*/
		DisplayFactory.setMute = function(newMute) {
			mute = newMute;
		}
		
		/* Get whether the display is currently hourly
		 * @returns	boolean		If the display is hourly
		*/
		DisplayFactory.getDisplayHours = function() {
			return displayHours;
		}
		
		/* Get whether the dogs are currently stopped
		 * @returns	boolean		If the dogs are stopped
		*/
		DisplayFactory.getStopped = function() {
			return stopped;
		}
		
		/* Toggle the display between hours and days
		*/
		DisplayFactory.toggleDisplayHours = function() {
			if(displayHours) {
				displayHours = false;
			}
			else {
				displayHours = true;
			}
			this.restartAnimation(true);
		}
		
		/* Toggle between muted and unmuted
		*/
		DisplayFactory.toggleMute = function() {
			if(mute) {
				mute = false;
				if(!stopped) {
					dogSong.play();
					startedDogSong = true;
				}
				document.getElementsByClassName('mute-button')[0].className = "button icon ion-volume-mute mute-button";
			}
			else {
				mute = true;
				dogSong.pause();
				document.getElementsByClassName('mute-button')[0].className = "button icon ion-volume-medium mute-button";
			}
		}

		/* Toggle the dogs between stopped and moving
		*/
		DisplayFactory.toggleStopStart = function() {
			if(stopped) {
				if(document.getElementsByClassName("scroll-section")[0].style.display != 'none') {
					if(!mute) {
						dogSong.play();
					}
					stopped = false;
					animateCorgis();
					//http://codepen.io/anon/pen/KpvdLp
					document.getElementsByClassName('play-pause')[0].className = "button icon ion-pause play-pause";
				}
			}
			else {
				dogSong.pause();
				stopped = true;
				if(animateFunction != null) {
					clearTimeout(animateFunction);
				}
				if(moveFunction != null) {
					clearInterval(moveFunction);
				}
				document.getElementsByClassName('play-pause')[0].className = "button icon ion-play play-pause";
			}
		}
		
		/* Restart the dogs animation
		 * @param	boolean		restart		Whether to completely restart the dogs from the beginning of the screen
		*/
		DisplayFactory.restartAnimation = function(restart) {
			if(animateFunction != null) {
				clearTimeout(animateFunction);
			}
			if(moveFunction != null) {
				clearInterval(moveFunction);
			}
			if(restart) {
				dogScale = 1;
				directionRight = false;
				$ionicScrollDelegate.$getByHandle('dogScroll').scrollTo(0,0);
				$ionicSlideBoxDelegate.$getByHandle('timeBox').slide(0);
				this.setDogsDirection();
			}
			
			if(!stopped) {	
				animateFunction = setTimeout(function() {animateCorgis()}, STANDARD_WAIT_TIME);
			}
		}
		
		/* Set the dogs to move every TIME_BETWEEN_MOVEMENT ms
		*/
		var animateCorgis = function() {
			clearTimeout(animateFunction);
			stopped = false;
			moveFunction = setInterval(move, TIME_BETWEEN_MOVEMENT);
		}
		
		/* Move the dogs
		*/
		var move = function() {
			if(!directionRight) {
				$ionicScrollDelegate.$getByHandle('dogScroll').scrollBy(TRAVEL_DISTANCE,0);
				if($ionicScrollDelegate.$getByHandle('dogScroll').getScrollPosition().left >= document.getElementsByClassName('dog-area')[0].clientWidth - window.innerWidth) {
					directionRight = true;
					clearInterval(moveFunction);
					DisplayFactory.flipDogs();
				}
			}
			else {
				$ionicScrollDelegate.$getByHandle('dogScroll').scrollBy(-TRAVEL_DISTANCE,0);
				if($ionicScrollDelegate.$getByHandle('dogScroll').getScrollPosition().left <= 0) {
					directionRight = false;
					clearInterval(moveFunction);
					DisplayFactory.flipDogs();
				}
			}
		}
		
		/* Flip the dogs
		*/
		DisplayFactory.flipDogs = function() {
			dogScale = -dogScale;
			this.setDogsDirection();
			this.restartAnimation(false); 
		}
		
		/* Set the dogs direction
		*/
		DisplayFactory.setDogsDirection = function() {
			var dogs = document.getElementsByClassName("dog");
			for(var i = 0; i < dogs.length; i++) {
				dogs[i].style.transform = 'scale('+dogScale+', 1)';
			}
		}
		
		/* Get the length of the array holding the dogs based on parameters
		 * @param	object	city		The city object for which we are displaying the background
		 * @param	int		timeIndex	The index of the currently selected time period within either the city's hours or days
		 * @returns	int					The length of array holding the dogs
		*/
		DisplayFactory.getDogAreaWidth = function(city, timeIndex) {
			if(displayHours) {
				var weatherData = Object.keys(city.hours[timeIndex]);
			}
			else {
				var weatherData = Object.keys(city.days[timeIndex]);
			}
			var length = Object.keys(weatherData).length - 1;
			if(weatherData.indexOf('$$hashKey') > -1) {
				length = length - 1;
			}
			
			return length;
		}
		
		/* Reset the width of the area that contains the dogs
		 * @param	int		length		The length of the array currently holding the dogs - 1
		*/
		DisplayFactory.resetDogAreaWidth = function(length) {
			$ionicSlideBoxDelegate.$getByHandle('timeBox').update();
			$ionicSlideBoxDelegate.$getByHandle('periodBox').update();
			document.getElementsByClassName('dog-area')[0].style.width = (length) * 50 + "%";
			$ionicScrollDelegate.resize();
		}
		
		/* Choose the appropriate background based on the weather
		 * @param	object	city		The city object for which we are displaying the background
		 * @param	int		timeIndex	The index of the currently selected time period within either the city's hours or days
		*/
		DisplayFactory.resetCity = function(city, timeIndex, locationIndex) {
			$ionicSlideBoxDelegate.$getByHandle('locationsBox').slide(locationIndex);
			var length = this.getDogAreaWidth(city, timeIndex);
			this.resetDogAreaWidth(length);
			this.chooseBackground(city, timeIndex);
			this.showButtons();
			this.restartAnimation(true);
			if(!startedDogSong) {
				if(!mute) {
					dogSong.play();
					startedDogSong = true;
				}
			}
			document.getElementsByClassName("scroll-section")[0].style.display = 'flex';
			$ionicSlideBoxDelegate.update();
			//This is a workaround to a strange display glitch
			//that possibly has to do with loading issues
			//(The time slide box will be blank until the window is resized)
			$ionicSlideBoxDelegate.$getByHandle('timeBox').slide(6);
			$ionicSlideBoxDelegate.$getByHandle('timeBox').slide(0);
		}
		
		/* Choose the appropriate background based on the weather
		 * @param	object	city		The city object for which we are displaying the background
		 * @param	int		timeIndex	The index of the currently selected time period within either the city's hours or days
		*/
		DisplayFactory.chooseBackground = function(city, timeIndex) {
			var temp;
			var time;
			if(displayHours || timeIndex == 0) {
				time = city.hours[timeIndex]['time'].actual;
				temp = city.hours[timeIndex]['temperature'].actual;
			}
			else {
				time = -1;
				temp = (city.days[timeIndex]['high'].actual + city.days[timeIndex]['low'].actual) / 2;
			}
			//Check to see if during the day
			if( (city.days[0]['sunset'].actual > time && city.days[0]['sunrise'].actual < time) || time == -1) {
				if(temp >= HOT_TEMPERATURE) {
					this.setBackground(3);
				}
				else {
					this.setBackground(2);
				}
			}
			else {
				this.setBackground(1);
			}
		}
		
		/* Set the screen up the screen to display weather
		 * @param	int		which	The number of the background to display (1 = night, 2 = snow, 3 = hot)
		*/
		DisplayFactory.setBackground = function(which) {
			var buttonArea = document.getElementsByClassName('button-area')[0];
			var mainSection = document.getElementsByClassName('main-section')[0];
			buttonArea.style.backgroundImage = "url('img/bg"+which+".jpg')";
			if(which == 3) {
				buttonArea.style.backgroundPosition = "left top";
				buttonArea.style.backgroundSize = "200% 200%";
			}
			else if(which == 2) {
				buttonArea.style.backgroundPosition = "45% 20%";
				buttonArea.style.backgroundSize = "400% 400%";
			}
			else {
				buttonArea.style.backgroundPosition = "left bottom";
				buttonArea.style.backgroundSize = "200% 200%";
			}
			mainSection.style.backgroundImage = "url('img/bg"+which+"ex.jpg')";
			mainSection.style.backgroundPosition = "center top";
			mainSection.style.backgroundSize = "100% auto";
			mainSection.style.backgroundRepeat = 'repeat';
			document.body.style.backgroundImage = "url('img/bg"+which+".jpg')";
		}
		
		/* Set the screen up to show a connection error has occurred
		*/
		DisplayFactory.errorBackground = function() {
			var buttonArea = document.getElementsByClassName('button-area')[0];
			this.hideButtons();
			var mainSection = document.getElementsByClassName('main-section')[0];
			buttonArea.style.backgroundImage = "none";
			mainSection.style.backgroundImage = "url('img/napstablook.gif')";
			mainSection.style.backgroundPosition = "center center";
			mainSection.style.backgroundSize = "auto auto";
			mainSection.style.backgroundRepeat = 'no-repeat';
			document.body.style.backgroundImage = "none";
			document.getElementsByClassName("could-not-connect-text")[0].style.display = "block";
		}
		
		/* Set the screen up to show it is loading
		*/
		DisplayFactory.loadingBackground = function() {
			document.getElementsByClassName("could-not-connect-text")[0].style.display = "none";
			document.getElementsByClassName('scroll-section')[0].style.display = "none";
			this.hideButtons();
			var buttonArea = document.getElementsByClassName('button-area')[0];
			var mainSection = document.getElementsByClassName('main-section')[0];
			buttonArea.style.backgroundImage = "none";
			document.body.style.backgroundImage = "none";
			mainSection.style.backgroundImage = "url('img/tauriel.png')";
			mainSection.style.backgroundPosition = "center center";
			mainSection.style.backgroundSize = "auto auto";
			mainSection.style.backgroundRepeat = 'no-repeat';
		}
		
		
		/* Show the buttons that allow the user to manipulate what is being shown
		*/
		DisplayFactory.showButtons = function() {
			buttons = document.getElementsByClassName('to-hide');
			for(var i = 0; i < buttons.length; i ++) {
				buttons[i].style.display = 'block';
			}
			$ionicSlideBoxDelegate.$getByHandle('timeBox').update();
			$ionicSlideBoxDelegate.$getByHandle('locationsBox').update();
		}
		
		/* Hide the buttons that allow the user to manipulate what is being shown
		*/
		DisplayFactory.hideButtons = function() {
			buttons = document.getElementsByClassName('to-hide');
			for(var i = 0; i < buttons.length; i ++) {
				buttons[i].style.display = 'none';
			}
			$ionicSlideBoxDelegate.$getByHandle('timeBox').update();
		}
		
		return DisplayFactory;
	}
);

/* Perform data-fetching operations based on weather
*/
app.factory('WeatherFactory',
	function($http) {
		var weatherFactory = {};
		
		var GREATER_WEATHER_CACHE_URL = 'http://greater-weather-caching.appspot.com/';
		var GOOGLE_GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
		var GOOGLE_TIMEZONE_URL = 'https://maps.googleapis.com/maps/api/timezone/json?location=';
		
		/*
		 * Get the current weather for a location
		 * @param	string	lat		The latitude of the location
		 * @param	string	lng		The longitude of the location
		 * @param	string	time	The time to get the weather for (null if now)
		 * @return	object			Promise for the weather data
		*/
		weatherFactory.getCurrentWeather = function(lat, lng) {
			var fullUrl = GREATER_WEATHER_CACHE_URL + '/' + lat + '/' + lng + '/all';
			return $http.get(fullUrl);
		}
		
		/*
		 * Get the latitude and longitude for a location
		 * @param	string	location	The location to get coordinates for
		 * @return	object				Promise for the latitude and longitude
		*/
		weatherFactory.getCoordinatesFromLocation = function(loc) {
			var url = GOOGLE_GEOCODING_URL + loc + "&key=" + GOOGLE_KEY;
			return $http.get(url);
		}
		
		/*
		 * Get the timezone offset for a location
		 * @param	string	lat		The latitude of the location
		 * @param	string	lng		The longitude of the location
		 * @param	string	time	The time to get the offset in the location
		 * @return	object			Promise for the timezone offset
		*/
		weatherFactory.getTimezoneOffset = function(lat, lng, timestamp) {
			var url = GOOGLE_TIMEZONE_URL + lat + ',' + lng + '&timestamp=' + timestamp + "&key=" + GOOGLE_KEY;
			return $http.get(url);
		}
		
		/* Convert Fahrenheit to Celsius
		 * @param	float	fahrenheit	The temperature in Fahrenheit	
		 * @returns	float				The temperature in Celsius
		*/
		weatherFactory.toCelcius = function(fahrenheit) {
			return +( ( (fahrenheit - 32)/1.8 ).toFixed(2) );
		}
		
		/* Convert Fahrenheit to Celsius
		 * @param	float	inches	The amount in inches
		 * @returns	float			The amount in centimeters
		*/
		weatherFactory.toCm = function(inches) {
			return +( (inches*2.54).toFixed(2) );
		} 
		
		return weatherFactory;
	}
);

/* Perform time-based operations
*/
app.factory('TimeFactory',
	function() {
		var timeFactory = {}
		
		/* Pad integer with leading zeros if shorter than a certain length
		 * @param	int		integer	The number to pad	
		 * @param	int		length	The minimum length	
		 * @returns	string			The padded number
		*/
		timeFactory.pad = function(integer, length) {
			var leadingInt = integer+"";
			while (leadingInt.length < length) leadingInt = "0" + leadingInt;
			return leadingInt;
		}
		
		/* Convert an epoch date to a time including hour, minute, and am or pm
		 * @param	int		epoch	The epoch date
		 * @returns	string			The time in a form like 3:43am
		*/
		timeFactory.epochToTime = function(epoch) {
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
		}
		
		/* Convert an epoch date to a time including hour and am or pm
		 * @param	int		epoch	The epoch date
		 * @returns	string			The time in a form like 9pm 
		*/
		timeFactory.epochToHour = function(epoch) {
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
		}
		
		/* Convert an epoch date to a day of the week
		 * @param	int		epoch	The epoch date
		 * @returns	string			The day of the week
		*/
		//http://www.w3schools.com/jsref/jsref_getday.asp
		timeFactory.epochToDayOfWeek = function(epoch) {
			var date = new Date(0);
			date.setUTCSeconds(epoch);
			var day = date.getDay();
			var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
			return weekday[day];
		}
		
		return timeFactory;
	}
);
