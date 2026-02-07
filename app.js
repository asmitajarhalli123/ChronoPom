// Initialize the app with ngRoute dependency
var app = angular.module('myapp', ['ngRoute']);

// Configure routes
app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when("/timer", {
      templateUrl: 'timer.html',
      controller: 'TimerController'
    })
    .when("/tasks", {
      templateUrl: 'tasks.html',
      controller: 'TasksController'
    })
    .when("/analytics", {
      templateUrl: 'analytics.html',
      controller: 'AnalyticsController'
    })
    .when("/progress", {
      templateUrl: 'progress.html',
      controller: 'ProgressController'
    })
    .otherwise({
      redirectTo: '/timer'
    });
}]);

// Main controller for navigation
app.controller('MainController', ['$scope', '$location', function($scope, $location) {
  $scope.currentRoute = $location.path();
  
  $scope.$on('$routeChangeSuccess', function() {
    $scope.currentRoute = $location.path();
  });
}]);

