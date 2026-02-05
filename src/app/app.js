// Initialize the app with ngRoute dependency
var app = angular.module('myapp', ['ngRoute']);

// Configure routes
app.config(['$routeProvider', function($locationProvider) {
  
    $routeProvider.when("/timer", {
      template: '<h1>hello</h1>'
      
    })
    
}]);

