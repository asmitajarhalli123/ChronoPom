// Initialize the app with ngRoute dependency
var app = angular.module('myapp', ['ngRoute']);

// Configure routes
app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when("/timer", {
      templateUrl: 'timer.html',
      
    })
    .when("/tasks", {
      templateUrl: 'tasks.html',
      
    })
    .when("/analytics", {
      templateUrl: 'analytics.html',
      
    })
    .when("/progress", {
      templateUrl: 'progress.html',
      
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

$scope.color = false;
  $scope.changeColor = function(){
    $scope.color = !$scope.color;
  }

  $scope.unshow = function(){
    $scope.color =false;
  }

}]);


app.controller('myctrl' , function($scope , $interval){
    $scope.count = 0;
    
      var counterInterval = null;

      $scope.start = function() {
        console.log("Start button clicked");
        if (!counterInterval) {  // prevent multiple intervals
          counterInterval = $interval(function() {
            $scope.count++;
          }, 1000); // 1000ms = 1 second
        }
      };
});



