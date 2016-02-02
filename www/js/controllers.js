angular.module('weather.controllers', []);

app.controller('MainCtrl', 
	function($scope, $ionicScrollDelegate, $ionicSlideBoxDelegate, $ionicPopup, $timeout, WeatherService, TimeService) {
		//this variable contains the length of time to userAgent
		$scope.timeLength = "Hourly";
		//this variable contains an array information that needs to be appended to the url to get the next 10 hours
		//the value is the various temperature elements
		$scope.hours;
		//this variable contains an array of the information to append to the URL to get the next seven days
		$scope.days;
		//this variable contains a reference to the array that is currently
		//being used (either hours of days)
		$scope.currentArray;
		//The current index of the array being used
		$scope.currentIndex;
		//this variable contains the an array of locations along with their longitude and latitude coordinates
		$scope.locations = new Array();
		$scope.locationsIndex = 0;
		$scope.locationToAdd = {};
		//This variable contains the popup for adding a location
		$scope.popup;
		//this is the variable that keeps track of the dogs direction
		$scope.scale;
		//This is the width of the time area
		$scope.timeWidth;
		//The song variable
		$scope.dogSong = new Audio('snd/dogsong.mp3');
		$scope.dogSong.loop = true;
		
		//this variable determines whether or not to stop the corgis
		var stopped = false;
		//this variable holds a reference to the animate function
		var animateFunction;
		//this variable holds a reference to the move function
		var moveFunction;
		//this variable keeps track of the corgis direction
		var direction = 0;
		//this cariable holds the actual response data
		var responseData;
		//This flag keeps track of whether data is currently being fetched
		var fetching = false;
		//This flag checks for weatherization
		var weatherizing = false;
		//This flag checks for celcius
		var celcius = false;
		
		//this constant keeps track of the stadard wait time for animation starting
		const STANDARD_WAIT_TIME = 700;
		//this constant holds the time between Corgi movements
		const TIME_BETWEEN_MOVEMENT = 20;
		//this constant holds the distance the corgis travel with each movement
		const TRAVEL_DISTANCE = 2;
		//this constant holds the minimum value for the hot weather image to be shown
		const HOT_TEMPERATURE = 50;
		
		
		//The following are functions to do with initialization
		
		//Function to initialize the hours array
		//The hours array is an array of arrays, with each entry
		//corresponding to an hour of the day
		//Each entry within the hours array represents a specific piece of weather information
		initializeHours = function() {
			var hoursData = responseData.hourly.data;
			var userOffset = new Date().getTimezoneOffset() * 60;
			var timeOffset = userOffset + $scope.locations[$scope.locationsIndex][3];
			for(i = 0; i < 10; i++) {
				var tempArray = new Array();
				var resource;
				if(i == 0) {
					resource = responseData.currently;
					tempArray[0] = ['Time', 'Now'];
				}
				else {
					resource = hoursData[i];
					tempArray[0] = ['Time', TimeService.epochToHour(hoursData[i].time + timeOffset)];
				}
				var temp = resource.temperature;
				var feelsTemp = resource.apparentTemperature;
				if(celcius) {
					temp = WeatherService.toCelcius(temp);
					feelsTemp = WeatherService.toCelcius(feelsTemp);
				}
				tempArray[1] = ["Temp", temp + "°"];
				tempArray[2] = ["Feels", feelsTemp + "°"];
				var precipType = resource.precipType;
				if(precipType == undefined) {
					if(resource.temperature <= 32) {
						precipType = "Snow";
					}
					else {
						precipType = "Rain";
					}
				}
				else {
					precipType = precipType.charAt(0).toUpperCase() + precipType.slice(1);
				}
				tempArray[3] = [precipType, Math.round(resource.precipProbability * 100) + "%"];
				//Note, use hoursData[i] here because current accumulation is never defined
				var precipAccumulation = hoursData[i].precipAccumulation;
				var plus = 0;
				if(precipAccumulation != undefined) {
					if(celcius) {
						tempArray[4] = [precipType + "fall", ((precipAccumulation*2.54).toFixed(2))+"cm"];
					}
					else {
						tempArray[4] = [precipType + "fall", precipAccumulation+"in"];
					}
					plus = 1;
				}
				tempArray[4+plus] = ["Wind Speed", resource.windSpeed + "mph"];
				tempArray[5+plus] = ["Humidity", Math.round(resource.humidity * 100) + "%"];
				tempArray[6+plus] = ["Powered By", "Forecast.io"];
				$scope.hours[i] = tempArray;
			}
		}
		
		//Function to initialize the days array
		//The days array is an array of arrays, with each entry
		//corresponding to a day
		//Each entry within the days array represents a specific piece of weather information
		initializeDays = function() {
			var daysData = responseData.daily.data;
			var userOffset = new Date().getTimezoneOffset() * 60;
			var timeOffset = userOffset + $scope.locations[$scope.locationsIndex][3];
			for(i = 0; i < 7; i++) {
				var tempArray = new Array();
				if(i == 0) {
					tempArray[0] = ['Day', 'Today'];
				}
				else {
					tempArray[0] = ['Day', TimeService.epochToDayOfWeek(daysData[i].time + timeOffset)];
				}
				var tempMax = daysData[i].temperatureMax;
				var tempMin = daysData[i].temperatureMin;
				var feelsTempMin = daysData[i].apparentTemperatureMax;
				var feelsTempMax = daysData[i].apparentTemperatureMin;
				if(celcius) {
					tempMax = WeatherService.toCelcius(tempMax);
					tempMin = WeatherService.toCelcius(tempMin);
					feelsTempMin = WeatherService.toCelcius(feelsTempMin);
					feelsTempMax = WeatherService.toCelcius(feelsTempMax);
				}
				tempArray[1] = ["High", tempMax + "°"];
				tempArray[2] = ["Low", tempMin + "°"];
				var precipType = daysData[i].precipType;
				if(precipType == undefined) {
					if(daysData[i].temperature <= 32) {
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
				var plus = 0;
				if(precipAccumulation != undefined) {
					if(celcius) {
						tempArray[3] = [precipType + "fall", +((precipAccumulation*2.54).toFixed(2))+"cm"];
					}
					else {
						tempArray[3] = [precipType + "fall", precipAccumulation+"in"];
					}
					plus = 1;
				}
				tempArray[3+plus] = ["Feels High", feelsTempMin + "°"];
				tempArray[4+plus] = ["Feels Low", feelsTempMax + "°"];
				tempArray[5+plus] = ["Sunrise", TimeService.epochToTime(daysData[i].sunriseTime + timeOffset)];
				tempArray[6+plus] = ["Sunset", TimeService.epochToTime(daysData[i].sunsetTime + timeOffset)];
				tempArray[7+plus] = ["Wind Speed", daysData[i].windSpeed + "mph"];
				tempArray[8+plus] = ["Humidity", Math.round(daysData[i].humidity * 100) + "%"];
				tempArray[9+plus] = ["Moon Phase", Math.round(daysData[i].moonPhase * 100) + "%"];
				tempArray[10+plus] = ["Powered By", "Forecast.io"];
				$scope.days[i] = tempArray;
			}
		}
		
		//The weatherize function loads new data about a location
		$scope.weatherize = function() {
			$ionicSlideBoxDelegate.enableSlide(false);
			$scope.currentIndex = 0;
			$scope.scale = 1;
			$scope.hours = new Array();
			$scope.days = new Array();
			//this variable contains a reference to the array that is currently
			//being used (either hours of days)
			var myCurrentArray = $scope.currentArray;
			$scope.currentArray = [];
			
			//Hide certain elements until loaded
			document.getElementsByClassName("could-not-connect-text")[0].style.display = "none";
			buttons = document.getElementsByClassName('to-hide');
			for(i = 0; i < buttons.length; i ++) {
				buttons[i].style.visibility = 'hidden';
			}
			document.getElementsByClassName("scroll-section")[0].style.visibility = 'hidden';
			
			//Remove the onclick stopDog event from the main section
			document.getElementsByClassName("main-section")[0].onclick = function() {return false;};
			
			//Set the background to be the loading background
			loadingBackground();
			
			//Get the current weather
			WeatherService.getCurrentWeather($scope.locations[$scope.locationsIndex][1], $scope.locations[$scope.locationsIndex][2]).then(function(resp) {
					responseData = resp.data;
					initializeHours();
					initializeDays();
					if(myCurrentArray == undefined || $scope.timeLength == "Hourly") {
						$scope.currentArray = $scope.hours;
					}
					else {
						$scope.currentArray = $scope.days;
					}
					$scope.$apply;
					resetDogAreaWidth();
					setBackground();
					restartAnimation(true);
					$ionicSlideBoxDelegate.$getByHandle('locationsBox').update();
					$ionicSlideBoxDelegate.$getByHandle('locationsBox').slide($scope.locationsIndex);
					
					window.setTimeout(showButtons, 100);
					
					$ionicSlideBoxDelegate.enableSlide(true);
			}, function(error) {
				$scope.errorBackground();
				$scope.stopDog();
				console.error(error);
				
				$ionicSlideBoxDelegate.enableSlide(true);
			});
		}
		
		//Function to show the buttons that were hidden upon weatherize
		showButtons = function() {
			buttons = document.getElementsByClassName('to-hide');
			for(i = 0; i < buttons.length; i ++) {
				buttons[i].style.visibility = 'visible';
			}
			$ionicSlideBoxDelegate.$getByHandle('timeBox').update();
		}
		
		//this function resets the dog area width
		//it also resets the width of the hours area
		resetDogAreaWidth = function() {
			//update the slide box
			$ionicSlideBoxDelegate.$getByHandle('timeBox').update();
			//document.getElementsByClassName('time-scroll-area')[0].style.width = ($scope.currentArray.length) * 100 + "%";
			document.getElementsByClassName('dog-area')[0].style.width = ($scope.currentArray[$scope.currentIndex].length-1) * 50 + "%";
		}
		
		//End initialization functions
		
		
		//The following are functions to do with user controls
		
		//This function toggles between F and C
		$scope.toggleDegrees = function() {
			if(celcius) {
				celcius = false;
				document.getElementsByClassName('celcius-button')[0].innerHTML = "C";
			}
			else {
				celcius = true;
				document.getElementsByClassName('celcius-button')[0].innerHTML = "F";
			}
			save();
			$scope.weatherize();
		}
		
		//This function changes the time length
		$scope.toggleTimeLength = function() {
			$scope.currentIndex = 0;
			if($scope.timeLength === "Daily") {
				$scope.timeLength = "Hourly";
				$scope.currentArray = $scope.hours;
			}
			else {
				$scope.timeLength = "Daily";
				$scope.currentArray = $scope.days;	
			}
			console.log($scope.timeLength);
			resetDogAreaWidth();
			setBackground();
			restartAnimation(true);
		}
		
		//The function occurs when the time has changed
		//It updates currentIndex that effects the model
		//It also resets the Dog Area Width and Background accordingly
		//It pauses slightly as well
		$scope.changeTime = function(index) {
			if(index != $scope.currentIndex) {
				$scope.currentIndex = index;
				setBackground();
				resetDogAreaWidth();
				restartAnimation(false);
			}
		}
		
		//This function changes the location
		//Then, weatherize is called
		$scope.changeLocations = function(index) {
			if(index != $scope.locationsIndex) {		
				$scope.locationsIndex = index;
				$scope.weatherize();
			}
		}
		
		//Function to show the popup that allows for a new location to be added
		//http://ionicframework.com/docs/api/service/$ionicPopup/
		$scope.newLocation = function() {
			$scope.locationToAdd.name = "";
			$scope.popup = $ionicPopup.show( 
				{
					template: '<input class = "popup-text" type="text" ng-model="locationToAdd.name">',
					title: '<span class = "popup-text">Enter a Location</span>',
					subTitle: '<span class = "popup-text loc-error"></span>',
					scope: $scope,
					buttons: [
						{ type: 'ion-close cancel-button ' },
						{ type: 'ion-checkmark check-button ',
							onTap: function(e) {
									e.preventDefault();
									addLocation($scope.locationToAdd.name);
							}
						}
					]
				}
			);
		};
		
		//Function to add a location
		//This functions will take the input given in the popup,
		//Use Google's Goecoding API to find the longitude and latitude
		//Then use Google's Timezone API to get the timezone offset from UTC time
		//It will then add an array with the locations name, lat, lon, and offset to $scope.locations
		//Then, the currentIndex is set to the index of the newly added elementFromPoint
		//Finally, weatherize is called to fetch the information about the new location
		//http://stackoverflow.com/questions/183161/best-way-to-break-from-nested-loops-in-javascript
		addLocation = function() {
			if(!fetching) {
				fetching = true;
				if($scope.popup != undefined) {
					document.getElementsByClassName('check-button')[0].style.display = 'none';
					document.getElementsByClassName('cancel-button')[0].style.display = 'none';
				}
				WeatherService.getCoordinatesFromZip($scope.locationToAdd['name']).then(function(resp) {
					if(resp.data.status != "OK" || resp.data.results[0].address_components[1] == undefined) {
						document.getElementsByClassName('loc-error')[0].innerHTML = "No Matches Found";
						if($scope.popup != undefined) {
							document.getElementsByClassName('check-button')[0].style.display = 'block';
							document.getElementsByClassName('cancel-button')[0].style.display = 'block';
						}
					}
					else {
						var name = "";
						outerLoop:
						for(i = 0; i < resp.data.results[0].address_components.length; i ++) {
							for(j = 0; j < resp.data.results[0].address_components[i].types.length; j++) {
								if(resp.data.results[0].address_components[i].types[j] == "locality") {
									name = resp.data.results[0].address_components[i].short_name;
									console.log(name);
									break outerLoop;
								}
							}
						}
						if(name == "") {
							name = resp.data.results[0].address_components[1].short_name;
						}
						
						var lat = resp.data.results[0].geometry.location.lat;
						var lng = resp.data.results[0].geometry.location.lng
						var time = new Date().getTime()/1000;
						WeatherService.getTimezoneOffset(lat, lng, time).then(function(tResp) {
							var offset = (tResp.data['rawOffset'] + tResp.data['dstOffset']);
							$scope.locations.push([name, lat, lng, offset]);
							
							$scope.locationsIndex = $scope.locations.length - 1;
							if($scope.popup != undefined) {
								$scope.popup.close();
							}
							
							save();
							$scope.weatherize();
						}, function(error) {
							document.getElementsByClassName('loc-error')[0].innerHTML = "Could not Connect";
							if($scope.popup != undefined) {
								document.getElementsByClassName('check-button')[0].style.display = 'block';
								document.getElementsByClassName('cancel-button')[0].style.display = 'block';
							}
						});
					}
					fetching = false;
				}, function(error) {
					document.getElementsByClassName('loc-error')[0].innerHTML = "Could not Connect";
					fetching = false;
					if($scope.popup != undefined) {
						document.getElementsByClassName('check-button')[0].style.display = 'block';
						document.getElementsByClassName('cancel-button')[0].style.display = 'block';
					}
				});
			}
		}
		
		//Function to show the delete confirmation
		//This function occurs when a user holds down a location
		//The user is asked if they really want to delete the location
		$scope.showDelete = function() {
			if($scope.locations.length > 1) {
				console.log("go");
				$scope.confirmPopup = $ionicPopup.confirm( 
					{
						title: '<span class = "popup-text">Delete Location</span>',
						subTitle: '<span class = "popup-text">Are you sure you want to delete this location?</span>',
						okType: 'check-button',
						okText: '<span class = "popup-text">Yes</span>',
						cancelType: 'cancel-button',
						cancelText: '<span class = "popup-text">No</span>',
					}
				);
				
				$scope.confirmPopup.then(function(res) {
					if(res) {
						deleteLocation();
					}
				});
			}
		}
		
		//Function to delete a location
		//The function removes the current location from the location
		//The location before it is then weatherized and its information shown
		deleteLocation = function() {
			$scope.locations.splice($scope.locationsIndex, 1);
			save();
			if($scope.locationsIndex >= $scope.locations.length) {
				$scope.locationsIndex -= 1;
			}
			else {
				console.log($scope.locationsIndex);
			}
			$scope.weatherize();
		}
		
		//End user control functions
		
		
		//The following functions are to do with animation
		
		//This function toggles between stopped and started
		$scope.toggleStopStart = function() {
			//Only works when dogs are shown
			if(stopped) {
				if(document.getElementsByClassName("scroll-section")[0].style.visibility != 'hidden') {
					stopped = false;
					animateCorgis();
					//http://codepen.io/anon/pen/KpvdLp
					document.getElementsByClassName('play-pause')[0].className = "button icon ion-pause play-pause";
				}
			}
			else {
				$scope.dogSong.pause();
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
		
		//This function stops the corgis movement regardless
		//(It will not start them if they are stopped)
		$scope.stopDog = function() {
			if(!stopped) {
				$scope.toggleStopStart();
			}
		}
		
		//This function is called to start animation
		//It clears any waiting to move (animateFunction) or movement (moveFunction)
		//If restart is true, it starts the Corgis back at the beginning
		//Then it waits for STANDARD_WAIT_TIME to start the Corgi's movement
		restartAnimation = function(restart) {
			if(animateFunction != null) {
				clearTimeout(animateFunction);
			}
			if(moveFunction != null) {
				clearInterval(moveFunction);
			}
			
			if(restart) {
				$scope.scale = 1;
				direction = 0;
				$ionicScrollDelegate.$getByHandle('dogScroll').scrollTo(0,0);
			}
			
			if(!stopped) {	
				animateFunction = setTimeout(function() {animateCorgis()}, STANDARD_WAIT_TIME);
			}
		}
		
		//This function animates the corgis
		//It sets moveFunction to be called every 20 milliseconds
		//http://stackoverflow.com/questions/9419263/playing-audio-with-javascript
		animateCorgis = function() {
			$scope.dogSong.play();
			clearTimeout(animateFunction);
			stopped = false;
			moveFunction = setInterval(move, TIME_BETWEEN_MOVEMENT);
		}
		
		//This function scrolls the screen by TRAVEL_DISTANCE or -TRAVEL_DISTANCE (based on direction)
		//The function will call flip dogs and changes the direction if it reaches the end of the corgis
		move = function() {
			if(direction == 0) {
				$ionicScrollDelegate.$getByHandle('dogScroll').scrollBy(TRAVEL_DISTANCE,0);
				if($ionicScrollDelegate.$getByHandle('dogScroll').getScrollPosition().left >= document.getElementsByClassName('dog-area')[0].clientWidth - window.innerWidth) {
					direction = 1;
					clearInterval(moveFunction);
					flipDogs();
				}
			}
			else {
				$ionicScrollDelegate.$getByHandle('dogScroll').scrollBy(-TRAVEL_DISTANCE,0);
				if($ionicScrollDelegate.$getByHandle('dogScroll').getScrollPosition().left <= 0) {
					direction = 0;
					clearInterval(moveFunction);
					flipDogs();
				}
			}
		}
		
		//This function flips all the dogs
		//CSS transitions take care of how the flipping looks
		flipDogs = function() {
			$scope.scale = -$scope.scale;
			$scope.$apply();
			restartAnimation(false);
		}
		
		//End animation functions
		
		
		//The following functions have to do with setting the background
		
		//This function chooses what background is appropriate
		//Then, it calls setUpBackground to display the correct background
		setBackground = function() {
			var temp;
			var time;
			if($scope.currentIndex == 0) {
				time = responseData.currently.time;
				temp = responseData.currently.temperature;
			}
			else if($scope.currentArray == $scope.hours) {
				time = responseData.hourly.data[$scope.currentIndex].time;
				temp = responseData.hourly.data[$scope.currentIndex].temperature;
			}
			else {
				time = -1;
				temp = (responseData.daily.data[$scope.currentIndex].temperatureMin + responseData.daily.data[$scope.currentIndex].temperatureMax) / 2;
			}
			//Check to see if during the days
			if( (responseData.daily.data[0].sunsetTime > time && responseData.daily.data[0].sunriseTime < time) || time == -1) {
				if(temp >= HOT_TEMPERATURE) {
					setUpBackground(3);
				}
				else {
					setUpBackground(2);
				}
			}
			else {
				setUpBackground(1);
			}
		}
		
		//This function sets background to be the loading background
		loadingBackground = function() {
			var buttonArea = document.getElementsByClassName('button-area')[0];
			var mainSection = document.getElementsByClassName('main-section')[0];
			//This changes the button area
			buttonArea.style.backgroundImage = "none";
			//This changes the main section
			mainSection.style.backgroundImage = "url('img/tauriel.png')";
			mainSection.style.backgroundPosition = "center center";
			mainSection.style.backgroundSize = "auto auto";
			mainSection.style.backgroundRepeat = 'no-repeat';
			//This changes the top bar
			document.body.style.backgroundImage = "none";
		}
		
		//this function alters the styles for the background based on the weather
		//Which specifies which image to show
		setUpBackground = function(which) {
			var buttonArea = document.getElementsByClassName('button-area')[0];
			var mainSection = document.getElementsByClassName('main-section')[0];
			//This changes the button area
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
			//This changes the main section
			mainSection.style.backgroundImage = "url('img/bg"+which+"ex.jpg')";
			mainSection.style.backgroundPosition = "center top";
			mainSection.style.backgroundSize = "100% auto";
			mainSection.style.backgroundRepeat = 'repeat';
			//This changes the top bar
			document.body.style.backgroundImage = "url('img/bg"+which+".jpg')";
			//Show the dogs!
			document.getElementsByClassName("scroll-section")[0].style.visibility = 'visible';
		}
		
		//This function sets the background to display the error message
		//It also sets the background to refresh upon touch
		$scope.errorBackground = function() {
			var buttonArea = document.getElementsByClassName('button-area')[0];
			var mainSection = document.getElementsByClassName('main-section')[0];
			//This changes the button area
			buttonArea.style.backgroundImage = "none";
			//This changes the main section
			mainSection.style.backgroundImage = "url('img/napstablook.gif')";
			mainSection.style.backgroundPosition = "center center";
			mainSection.style.backgroundSize = "auto auto";
			mainSection.style.backgroundRepeat = 'no-repeat';
			//This changes the top bar
			document.body.style.backgroundImage = "none";
			//show the text and add function
			document.getElementsByClassName("could-not-connect-text")[0].style.display = "block";
			document.getElementsByClassName("main-section")[0].onclick = function() {$scope.weatherize()};
		}
		
		//End background functions
		
		
		//The following functions have to do with saving and loading
		
		//Function to save the locations the user has entered along with their preference 
		//of Fahrenheight or Celcius
		save = function() {
			window.localStorage['locationsGreaterWeather'] = JSON.stringify($scope.locations);
			window.localStorage['celciusGreaterWeather'] = celcius;
			console.log(celcius);
		} 
		
		//Function to load the user's preferences (location and C/F)
		//Calls weatherize upon loading (this is run on startup)
		load = function() {
			$scope.locations = JSON.parse(window.localStorage['locationsGreaterWeather'] || "[]");
			if(window.localStorage['celciusGreaterWeather'] != undefined) {
				celcius = window.localStorage['celciusGreaterWeather'];
				if(celcius) {
					document.getElementsByClassName('celcius-button')[0].innerHTML = "F";
				}
			}
			else {
				celcius = false;
			}
			if($scope.locations.length == 0) {
				$scope.locationToAdd['name'] = 'Charlotte';
				addLocation();
			}
			else {
				$scope.weatherize();
			}
		}
		
		//End saving and loading functions
		
		load();
	}
);