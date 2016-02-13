angular.module('weather.controllers', []);

/* The main controller of the app
*/
app.controller('MainCtrl', 
	function($scope, $ionicScrollDelegate, $ionicSlideBoxDelegate, $ionicPopup, $timeout, WeatherFactory, TimeFactory, City, DisplayFactory) {
		$scope.timeLength = "Hourly";
		$scope.locations = new Array();
		$scope.locationsIndex = 0;
		$scope.weatherInformationForTime = new Array();
		$scope.timeIndex = 0;
		$scope.locationToAdd = {};
		
		/* Toggle the dogs between stopped and moving
		*/
		$scope.toggleStopStart = function() {
			DisplayFactory.toggleStopStart();
		}
		
		/* Stop the dogs
		*/
		$scope.stopDog = function() {
			if(!DisplayFactory.getStopped()) {
				DisplayFactory.toggleStopStart();
			}
		}
		
		/* Get whether the display is currently hourly
		 * @returns	boolean		If the display is hourly
		*/
		$scope.toggleDegrees = function() {
			for(var i = 0; i < $scope.locations.length; i++) {
				$scope.locations[i].toggleCelcius();
			}
			if(document.getElementsByClassName('celcius-button')[0].innerHTML == "C") {
				document.getElementsByClassName('celcius-button')[0].innerHTML = "F";
			}
			else {
				document.getElementsByClassName('celcius-button')[0].innerHTML = "C";
			}
			save();
		}
		
		/* Toggle between daily and hourly
		*/
		$scope.toggleTimeLength = function() {
			DisplayFactory.toggleDisplayHours();
			if($scope.timeLength === "Daily") {
				$scope.timeLength = "Hourly";
			}
			else {
				$scope.timeLength = "Daily";	
			}
			$scope.timeIndex = 0;
			displayCurrentWeather();
		}
		
		/* Change the shown time
		 * @param	int		index		The index to change within the time array (either the city's hours array or days array) to change the time to
		*/
		$scope.changeTime = function(index) {
			if(index != $scope.timeIndex) {
				$scope.timeIndex = index;
				var city = $scope.locations[$scope.locationsIndex];
				if(DisplayFactory.getDisplayHours()) {
					city.setInfoOrder(index, true);
				}
				else {
					city.setInfoOrder(index, false);
				}
				DisplayFactory.chooseBackground(city, $scope.timeIndex);
				var length = DisplayFactory.getDogAreaWidth(city, $scope.timeIndex);
				DisplayFactory.resetDogAreaWidth(length);
				DisplayFactory.restartAnimation(false);
				window.setTimeout(DisplayFactory.setDogsDirection, 10);
			}
		}
		
		/* Change the shown location
		 * @param	int		index		The index to change within $scope.locations
		*/
		$scope.changeLocations = function(index) {
			if(index != $scope.locationsIndex) {		
				$scope.locationsIndex = index;
				displayCurrentWeather();
				$scope.$apply();
			}
		}
		
		/* Display a popup to add a new location
		*/
		$scope.newLocation = function() {
			$scope.locationToAdd.name = "";
			if(document.getElementsByClassName("scroll-section")[0].style.display != 'none') {
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
										addLocation($scope.locationToAdd.name, true);
								}
							}
						]
					}
				);
			}
		};
	
		/* Add a new location
		 * @param	string		name		The name of the location
		 * @param	boolean		display		Whether to display the weather for the location after the location has been added
		*/
		var addLocation = function(name, display) {
			if($scope.popup) {
				document.getElementsByClassName('cancel-button')[0].style.display = 'none';
				document.getElementsByClassName('check-button')[0].style.display = 'none';
			}
			var city = new City();
			city.setLocationInformation(name, function() { uponAddedLocation(city, display, true) }, uponFailedToAddLocation, uponFailedToAddLocationNetwork);
		}
		
		/* Add a new location with data that would be fetched from Google already known
		 * @param	string		name		The name of the location
		 * @param	float		lat			The latitude of the location
		 * @param	float		lng			The longitude of the location
		 * @param	int			timezone	The time zone offset of the location
		 * @param	boolean		celcius		Whether the location's weather will be displayed in celcius
		 * @param	boolean		display		Whether to display the weather for the location after the location has been added
		*/
		var addLocationKnownData = function(name, lat, lng, timezone, celcius, display) {
			var city = new City();
			city.setLocationInformationFromKnownData(name, lat, lng, timezone, celcius, function() { uponAddedLocation(city, display) });
		}
		
		/* Display error message about not being able to get weather for the location due to bad input
		*/
		var uponFailedToAddLocation = function() {
			document.getElementsByClassName('cancel-button')[0].style.display = 'block';
			document.getElementsByClassName('check-button')[0].style.display = 'block';
			document.getElementsByClassName('loc-error')[0].innerHTML = "Could not get weather for location";
		}
		
		/* Display error message about not being able to get weather for the location due to lack of network connectivity
		*/
		var uponFailedToAddLocationNetwork = function() {
			document.getElementsByClassName('cancel-button')[0].style.display = 'block';
			document.getElementsByClassName('check-button')[0].style.display = 'block';
			document.getElementsByClassName('loc-error')[0].innerHTML = "Could not connect to the network";
		}
		
		/* Add the new location to the list of locations
		 * @param	object		city		The newly created location
		 * @param	boolean		display		Whether to display the weather
		 * @param	boolean		goTo		Whether to scroll to the newly added location (otherwise will scroll to beginning)
		*/
		var uponAddedLocation = function(city, display, goTo) {
			if($scope.popup) {
				$scope.popup.close();
			}
			if(display) {
				city.fetchWeather(displayCurrentWeather);
			}
			else {
				city.fetchWeather(function() {return false;});
			}
			$scope.locations.push(city);
			if(!goTo) {
				$scope.locationsIndex = 0;
			}
			else {
				$scope.locationsIndex = $scope.locations.length - 1;
			}
			save();
		}
		
		/* Display the weather based on the selected location and time
		*/
		var displayCurrentWeather = function() {
			var city = $scope.locations[$scope.locationsIndex];
			if(DisplayFactory.getDisplayHours()) {
				$scope.weatherInformationForTime = $scope.locations[$scope.locationsIndex].hours;
				city.setInfoOrder($scope.timeIndex, true);
			}
			else {
				$scope.weatherInformationForTime = $scope.locations[$scope.locationsIndex].days;
				city.setInfoOrder($scope.timeIndex, false);
			}
			DisplayFactory.resetCity(city , $scope.timeIndex, $scope.locationsIndex);
		}
		
		/* Refresh the weather displayed
		*/
		$scope.refreshWeather = function() {
			$scope.locations[$scope.locationsIndex].fetchWeather(displayCurrentWeather);
		}
		
		/* Display a popup to delete a location
		*/
		$scope.showDelete = function() {
			if($scope.locations.length > 1) {
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
		
		/* Delete a location
		*/
		var deleteLocation = function() {
			$scope.locations.splice($scope.locationsIndex, 1);
			save();
			if($scope.locationsIndex >= $scope.locations.length) {
				$scope.locationsIndex -= 1;
			}
			else {
			}
			displayCurrentWeather(); 
		}
		
		/* Save the locations that the user has set
		*/
		var save = function() {
			var saveLocations = [];
			for(var i = 0; i < $scope.locations.length; i++) {
				saveLocations.push( {'name':$scope.locations[i].name, 'longitude':$scope.locations[i].longitude, 'latitude':$scope.locations[i].latitude, 'timezoneOffset':$scope.locations[i].timezoneOffset, 'celcius':$scope.locations[i].celcius} );
			}
			window.localStorage['GreaterWeatherCities'] = JSON.stringify(saveLocations);
		} 
		
		/* Load the locations that are saved or load Charlotte's data if no save data exists
		*/
		var load = function() {
			var loadedLocations = JSON.parse(window.localStorage['GreaterWeatherCities'] || "[]");
			var celcius = false;
			
			if(loadedLocations == 0) {
				addLocationKnownData('Charlotte', 35.2270869, -80.8431267, -18000, false, true);
			}
			else {
				for(var i = 0; i < loadedLocations.length; i++) {
					if(i == 0) {
						var display = true;
					}
					else {
						var display = false;
					}
					addLocationKnownData(loadedLocations[i].name, loadedLocations[i].latitude, loadedLocations[i].longitude, loadedLocations[i].timezoneOffset, loadedLocations[i].celcius, display);
				}
				celcius = loadedLocations[0].celcius;
			}
			if(celcius) {
				document.getElementsByClassName('celcius-button')[0].innerHTML = "F";
			}
		}
		
		load();
		
	}
);