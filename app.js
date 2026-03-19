
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

    //   //start the timer
    //   $scope.start = function() {
       
    //     if (!counterInterval) {  // prevent multiple intervals
    //       counterInterval = $interval(function() {
    //         $scope.count++;
    //       }, 1000); // 1000ms = 1 second
    //     }
    //   };

      ///restart the timer
    //   $scope.restart =function(){
    //         $scope.count = 0;
    //         if (counterInterval) {
    //           $interval.cancel(counterInterval);
    //           counterInterval = null;
    //         }
    //         $scope.start();
    //   }


    //   //go to next for break
    //   $scope.next =function(){
    //         $scope.count = 0;
    //         if (counterInterval) {
    //           $interval.cancel(counterInterval);
    //           counterInterval = null;
    //         }  
    //   }
        // $scope.progress = 0;
        // $scope.tasklist = [];
        // $scope.newTask = {};
        // $scope.istask = false;

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

//timer Angular js
// var app = angular.module("pomodoroApp", []);

// app.controller("timerCtrl", function($scope,$interval){

var timer = null;

$scope.totalTime = 900;
$scope.timeLeft = 900;

$scope.minutes = "15";
$scope.seconds = "00";

$scope.dashOffset = 0;

function updateDisplay(){

let m = Math.floor($scope.timeLeft/60);
let s = $scope.timeLeft % 60;

$scope.minutes = ("0"+m).slice(-2);
$scope.seconds = ("0"+s).slice(-2);

let progress = $scope.timeLeft / $scope.totalTime;
$scope.dashOffset = 754 - (754 * progress);
}

$scope.start = function(){

if(timer) return;

timer = $interval(function(){

$scope.timeLeft--;

updateDisplay();

if($scope.timeLeft <= 0){

$interval.cancel(timer);
timer = null;

alert("Timer Finished!");

}

},1000);

};

$scope.pause = function(){

$interval.cancel(timer);
timer = null;

};

$scope.reset = function(){

$scope.pause();
$scope.timeLeft = $scope.totalTime;
updateDisplay();

};

$scope.setMode = function(mode){

$scope.pause();

if(mode == "pomodoro"){

$scope.totalTime = 900;

}

if(mode == "short"){

$scope.totalTime = 300;

}

if(mode == "long"){

$scope.totalTime = 600;

}

$scope.timeLeft = $scope.totalTime;
updateDisplay();

};

updateDisplay();

// don't know files





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

  ScrollTrigger.refresh();
const tl2 = gsap.timeline();
  tl2.from(".ks .keep" , {
    y :50,
    duration:0.7,
    opacity:0,
      scrollTrigger: {
        trigger: ".keep",      
        scroller:"body",
           
        start:"top 40%",
        end:"top -100%",
        scrub:0.5
    }
  });

  gsap.from(".box" , {
    y :50,
    duration:1,
    opacity:0,
     stagger: 0.3,
      scrollTrigger: {
        trigger: ".keep",      
        scroller:"body",  
        start:"top 40%",
        end:"top -100%",
      
    }
  })

 

  gsap.from(".mintext .min" , {
    y : -30,
    duration:5,
    opacity:0,
    stagger: 0.2,
     scrollTrigger : {
          trigger:".mintext",
          scroller:"body",
          markers:false,
          start: "top 40%",
          end : "top 60%"
        }
  })

    gsap.from(".mintext .count" , {
    y : -30,
    delay:1,
    duration:5,
    opacity:0,
    stagger: 0.5,
     scrollTrigger : {
          trigger:".mintext",
          scroller:"body",
          markers:false,
          start: "top 60%",
          end: "top 40%",
          scrub:0.3
        }
  })

  
    gsap.from(".mintext P" , {
    y : -40,
    duration:5,
    opacity:0,
    stagger: 0.2,
     scrollTrigger : {
          trigger:".mintext",
          scroller:"body",
          markers:false,
          start: "top 55%",
         
           scrub:0.2
        }
  })






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




// add on code logic for timer and task interconncetion 


// ============================================================
//  ADD-ON CODE — paste at the bottom of your existing app.js
//  Do NOT change anything already in your app.js
// ============================================================


// ── 1. SHARED SERVICE (single source of truth) ───────────────
//    Stores timer state + tasks so they survive route changes.

app.service('AppService', function () {

    var svc = this;

    // Timer state — persists across navigation
    svc.timerState = {
        mode      : 'pomodoro',
        totalTime : 1500,
        timeLeft  : 1500,
        running   : false,
        minutes   : '25',
        seconds   : '00',
        dashOffset: 0,
        sessions  : 0,
        activeTaskIndex: -1
    };

    // Shared task list (same array used by tasks page & timer page)
    svc.tasks = [];

    // Stats
    svc.stats = { dailyScore: 0, streak: 0 };

    // Mode durations
    svc.MODE_TIMES = { pomodoro: 1500, short: 300, long: 600 };

    // Internal interval handle (stored here so it survives controller destroy)
    svc._timerInterval  = null;
    svc._gsapDone       = false;

    svc.updateDisplay = function () {
        var t = svc.timerState;
        t.minutes   = ('0' + Math.floor(t.timeLeft / 60)).slice(-2);
        t.seconds   = ('0' + (t.timeLeft % 60)).slice(-2);
        t.dashOffset = 754 - (754 * (t.timeLeft / t.totalTime));
    };

    svc.completedCount = function () {
        return svc.tasks.filter(function (t) { return t.completed; }).length;
    };

    svc.completionPct = function () {
        return svc.tasks.length
            ? Math.round(svc.completedCount() / svc.tasks.length * 100)
            : 0;
    };

    svc.activeTask = function () {
        var i = svc.timerState.activeTaskIndex;
        return (i >= 0 && i < svc.tasks.length) ? svc.tasks[i] : null;
    };

    svc.updateDisplay(); // init display
});


// ── 2. TIMER CONTROLLER (replaces myctrl for timer.html) ─────
//    Reads/writes AppService so state never resets on navigation.

app.controller('TimerCtrl', ['$scope', '$interval', '$timeout', 'AppService',
function ($scope, $interval, $timeout, AppService) {

    // Expose service state directly on scope
    $scope.t     = AppService.timerState;
    $scope.tasks = AppService.tasks;
    $scope.stats = AppService.stats;

    // Internal tick — advances timer every second
    function tick () {
        var t = AppService.timerState;
        if (t.timeLeft > 0) {
            t.timeLeft--;
            AppService.updateDisplay();

            // Update active task's in-session progress bar
            var active = AppService.activeTask();
            if (active && t.mode === 'pomodoro') {
                if (!active._secThisSession) active._secThisSession = 0;
                active._secThisSession++;
                active._progress = Math.round(active._secThisSession / t.totalTime * 100);
            }
        } else {
            // Session finished
            t.running = false;
            $interval.cancel(AppService._timerInterval);
            AppService._timerInterval = null;

            if (t.mode === 'pomodoro') {
                t.sessions++;
                AppService.stats.dailyScore += 50;

                var active = AppService.activeTask();
                if (active) {
                    active.done = Math.min((active.done || 0) + 1, active.pomodoros);
                    active._secThisSession = 0;
                    active._progress = Math.round(active.done / active.pomodoros * 100);
                    if (active.done >= active.pomodoros) active.completed = true;
                }
            }

            alert(t.mode === 'pomodoro'
                ? '🍅 Pomodoro done! Take a break.'
                : '⏰ Break over! Back to focus.');
        }
    }

    // Controls
    $scope.start = function () {
        var t = AppService.timerState;
        if (t.running) return;
        t.running = true;

        // Auto-select first incomplete task if none chosen
        if (t.activeTaskIndex === -1) {
            var idx = AppService.tasks.findIndex(function (tk) { return !tk.completed; });
            if (idx >= 0) t.activeTaskIndex = idx;
        }
        AppService._timerInterval = $interval(tick, 1000);
    };

    $scope.pause = function () {
        AppService.timerState.running = false;
        if (AppService._timerInterval) {
            $interval.cancel(AppService._timerInterval);
            AppService._timerInterval = null;
        }
    };

    $scope.reset = function () {
        $scope.pause();
        var t = AppService.timerState;
        t.timeLeft = t.totalTime;
        AppService.updateDisplay();
    };

    $scope.setMode = function (mode) {
        $scope.pause();
        var t       = AppService.timerState;
        t.mode      = mode;
        t.totalTime = AppService.MODE_TIMES[mode];
        t.timeLeft  = t.totalTime;
        AppService.updateDisplay();
    };

    // Active task selector
    $scope.setActiveTask = function (index) {
        AppService.timerState.activeTaskIndex = index;
    };

    $scope.isActive    = function (i) { return AppService.timerState.activeTaskIndex === i; };
    $scope.activeTask  = function ()  { return AppService.activeTask(); };

    // Stats helpers for template
    $scope.completedCount = function () { return AppService.completedCount(); };
    $scope.totalTasks     = function () { return AppService.tasks.length; };
    $scope.completionPct  = function () { return AppService.completionPct(); };

    // GSAP — run only once, guarded by flag
    $timeout(function () {
        if (window.gsap && !AppService._gsapDone) {
            AppService._gsapDone = true;
            try {
                var tl = gsap.timeline();
                if (document.querySelector('.lefthead h1')) {
                    tl.from('.lefthead h1', { x: -50, duration: 1.2, opacity: 0 });
                    tl.from('.righthead p', { x:  50, duration: 1.2, opacity: 0 }, '-=0.8');
                    tl.from('.lefthead p',  { y:  20, duration: 1.0, opacity: 0 }, '-=0.6');
                }
                if (window.ScrollTrigger) {
                    ScrollTrigger.refresh();
                    if (document.querySelector('.keep'))
                        gsap.from('.ks .keep', { y:50, opacity:0, duration:0.8, scrollTrigger:{ trigger:'.keep', scroller:'body', start:'top 70%' } });
                    if (document.querySelector('.box'))
                        gsap.from('.box', { y:50, opacity:0, duration:1, stagger:0.3, scrollTrigger:{ trigger:'.keep', scroller:'body', start:'top 60%' } });
                    if (document.querySelector('.mintext')) {
                        gsap.from('.mintext .min',   { y:-30, opacity:0, duration:1.5, scrollTrigger:{ trigger:'.mintext', scroller:'body', start:'top 60%' } });
                        gsap.from('.mintext .count', { y:-30, opacity:0, duration:1.5, delay:0.4, scrollTrigger:{ trigger:'.mintext', scroller:'body', start:'top 60%' } });
                        gsap.from('.mintext p',      { y:-40, opacity:0, duration:1.5, delay:0.8, scrollTrigger:{ trigger:'.mintext', scroller:'body', start:'top 55%' } });
                    }
                }
            } catch(e) {}
        }
    }, 200);

    // Don't cancel the interval when controller is destroyed —
    // timer must keep running while user navigates to other pages
    $scope.$on('$destroy', function () { /* intentionally empty */ });
}]);


// ── 3. TASK CONTROLLER (replaces myctrl for tasks.html) ──────

app.controller('TaskCtrl', ['$scope', '$timeout', 'AppService',
function ($scope, $timeout, AppService) {

    $scope.tasks = AppService.tasks;    // same array as timer page
    $scope.task  = { name:'', priority:'Medium', category:'Work', pomodoros:1 };
    $scope.showNotification = false;
    $scope.notificationMsg  = '';

    $scope.addTask = function () {
        if (!$scope.task.name || !$scope.task.name.trim()) return;
        AppService.tasks.push({
            name      : $scope.task.name.trim(),
            priority  : $scope.task.priority  || 'Medium',
            category  : $scope.task.category  || 'Work',
            pomodoros : parseInt($scope.task.pomodoros) || 1,
            done      : 0,
            completed : false,
            _progress : 0,
            _secThisSession: 0
        });
        $scope.task = { name:'', priority:'Medium', category:'Work', pomodoros:1 };
        $scope.notify('✅ Task added!');
    };

    $scope.deleteTask = function (index) {
        var ai = AppService.timerState.activeTaskIndex;
        if (ai === index)        AppService.timerState.activeTaskIndex = -1;
        else if (ai > index)     AppService.timerState.activeTaskIndex--;
        AppService.tasks.splice(index, 1);
    };

    $scope.setActive = function (index) {
        AppService.timerState.activeTaskIndex = index;
        $scope.notify('⏱ "' + AppService.tasks[index].name + '" is now active in timer!');
    };

    $scope.isActive  = function (i) { return AppService.timerState.activeTaskIndex === i; };
    $scope.barWidth  = function (t) { return t.pomodoros ? Math.min(100, Math.round((t.done||0)/t.pomodoros*100)) : 0; };

    $scope.pomodoroArray = function (task) {
        var arr = [];
        for (var i = 0; i < task.pomodoros; i++) arr.push({ filled: i < task.done });
        return arr;
    };

    $scope.notify = function (msg) {
        $scope.notificationMsg  = msg;
        $scope.showNotification = true;
        $timeout(function () { $scope.showNotification = false; }, 2500);
    };
}]);



