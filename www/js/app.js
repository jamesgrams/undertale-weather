/* Undertale themed weather application
 * By James Grams
*/
var app = angular.module('weather', ['ionic', 'weather.controllers', 'weather.services']);

var FORECAST_KEY = '18c198780c15d5d15edad9b544bd9397';
var GOOGLE_KEY = 'AIzaSyDGGty1SmoTKGgy_MJVsVeZYpLaExz3YOQ';

/* Default Ionic run function
*/
app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
});