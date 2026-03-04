
// Initialize the app with ngRoute dependency
var app = angular.module('myapp',['ngRoute']);

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


app.controller('myctrl' , function($scope , $interval , $timeout){
    $scope.count = 0;
    $scope.taskCount = 0;

      var counterInterval = null;

      //start the timer
      $scope.start = function() {
       
        if (!counterInterval) {  // prevent multiple intervals
          counterInterval = $interval(function() {
            $scope.count++;
          }, 1000); // 1000ms = 1 second
        }
      };

      ///restart the timer
      $scope.restart =function(){
            $scope.count = 0;
            if (counterInterval) {
              $interval.cancel(counterInterval);
              counterInterval = null;
            }
            $scope.start();
      }


      //go to next for break
      $scope.next =function(){
            $scope.count = 0;
            if (counterInterval) {
              $interval.cancel(counterInterval);
              counterInterval = null;
            }  
      }
        $scope.progress = 0;
        $scope.tasklist = [];
        $scope.newTask = {};
        $scope.istask = false;

        // function to set task
        $scope.submittask = function(){
          $scope.taskCount = $scope.taskCount+1;
          if ($scope.newTask.taskname && $scope.newTask.taskname.trim() !== "") {
                      $scope.tasklist.push({
                          tname: $scope.newTask.taskname,
                         
                      });

                  }
                  
                  // Clear form after adding
                      $scope.newTask = {};
              };


//function for task progress bar working 
$scope.startProgress = function(task){

    if (!task.progress) {
        task.progress = 0; 
    }

    if(task.interval){
        $interval.cancel(task.interval);
    }

    task.interval = $interval(function () {

        if (task.progress < 100) {
            task.progress++;
        } else {
            $interval.cancel(task.interval);
        }

    }, 1000);

};


// gsap
      
const tl = gsap.timeline();

  tl.from(".lefthead h1" ,{
    x:-50,
    duration:1.5,
    opacity:0
  })

   tl.from(".righthead p" ,{
    x:50,
    duration:1.5,
    opacity:0
  })

  tl.from(".lefthead p" ,{
    x:0,
    y:0,
    duration:1.5,
    opacity:0
  })

  gsap.from(".ks" , {
    y :20,
    duration:5,
    opacity:0,
      scrollTrigger: {
      trigger: ".ks",      // 👈 use the element itself
    start: "bottom 20%",    // 👈 REQUIRED
    end: "top 30%",
    markers: true,
    scrub: 3
    }
    
  });





//var app = angular.module("myApp", []);


    $timeout(function () {
// asdasd
        // BAR CHART
        const barCtx = document.getElementById("barChart");

        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                datasets: [{
                    label: "Tasks",
                    data: [8,6,12,9,11,5,7],
                    backgroundColor: "#8b5cf6"
                },{
                    label: "Pomodoros",
                    data: [18,15,28,21,25,12,16],
                    backgroundColor: "#06b6d4"
                }]
            }
        });


        // LINE CHART
        const lineCtx = document.getElementById("lineChart");

        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ["Week1","Week2","Week3","Week4","Week5","Week6"],
                datasets: [{
                    label: "Score",
                    data: [650,720,880,1050,980,1300],
                    borderColor: "#22c55e",
                    tension: 0.4
                }]
            }
        });


        // SCATTER CHART
        const scatterCtx = document.getElementById("scatterChart");

        new Chart(scatterCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: "Scatter Data",
                    data: [
                        {x:5,y:7},
                        {x:10,y:15},
                        {x:15,y:10},
                        {x:20,y:25}
                    ],
                    backgroundColor: "#f43f5e"
                }]
            }
        });

    }, 500); 

});

   //Achievements

app.controller("MainController", function($scope, $timeout) {

    
    //   ACHIEVEMENTS SECTION
    

    $scope.badges = [
        {
            name: "First Tomato",
            desc: "Complete your first Pomodoro session",
            level: "BRONZE",
            icon: "🍅",
            unlocked: true
        },
        {
            name: "3-Day Warrior",
            desc: "Maintain focus for 3 days",
            level: "SILVER",
            icon: "🔥",
            unlocked: true
        },
        {
            name: "Diamond Focus",
            desc: "Complete 50 sessions",
            level: "PLATINUM",
            icon: "💎",
            unlocked: false
        }
    ];

    $scope.showPopup = false;
    $scope.selected = {};

    $scope.openPopup = function(badge) {
        if (badge.unlocked) {
            $scope.selected = badge;
            $scope.showPopup = true;
        }
    };

    $scope.closePopup = function() {
        $scope.showPopup = false;
    };


  
       //TASK SECTION
    

    $scope.tasks = [];

    $scope.task = {
        priority: "Medium",
        category: "Work",
        pomodoros: 1
    };

    $scope.showNotification = false;

    $scope.addTask = function() {

        if (!$scope.task.name) return;

        var newTask = {
            name: $scope.task.name,
            priority: $scope.task.priority,
            category: $scope.task.category,
            pomodoros: $scope.task.pomodoros,
            done: 0,
            completed: false
        };

        $scope.tasks.push(newTask);

        $scope.task.name = "";

        $scope.showNotification = true;

        $timeout(function(){
            $scope.showNotification = false;
        }, 2000);
    };

});