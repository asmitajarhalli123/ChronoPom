
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

// alert("Timer Finished!");
$scope.completeSession();
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




//timer angularJs completed 


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
    

    // $scope.badges = [
    //     {
    //         name: "First Tomato",
    //         desc: "Complete your first Pomodoro session",
    //         level: "BRONZE",
    //         icon: "🍅",
    //         unlocked: true
    //     },
    //     {
    //         name: "3-Day Warrior",
    //         desc: "Maintain focus for 3 days",
    //         level: "SILVER",
    //         icon: "🔥",
    //         unlocked: true
    //     },
    //     {
    //         name: "Diamond Focus",
    //         desc: "Complete 50 sessions",
    //         level: "PLATINUM",
    //         icon: "💎",
    //         unlocked: false
    //     }
    // ];

    // $scope.showPopup = false;
    // $scope.selected = {};

    // $scope.openPopup = function(badge) {
    //     if (badge.unlocked) {
    //         $scope.selected = badge;
    //         $scope.showPopup = true;
    //     }
    // };

    // $scope.closePopup = function() {
    //     $scope.showPopup = false;
    // };


// ===== ACHIEVEMENT SYSTEM =====

$scope.stats = {
    sessions: 0,
    breaks: 0,
    early: 0,
    night: 0
};

$scope.badges = [
    {
        name: "🚀 Lift Off",
        desc: "Complete first session",
        unlocked: false,
        condition: () => $scope.stats.sessions >= 1
    },
    {
        name: "🔥 3 Day Streak",
        desc: "Complete 3 sessions",
        unlocked: false,
        condition: () => $scope.stats.sessions >= 3
    },
    {
        name: "⚡ Focus Master",
        desc: "Complete 5 sessions",
        unlocked: false,
        condition: () => $scope.stats.sessions >= 5
    },
    {
        name: "🌅 Early Bird",
        desc: "Work before 8AM",
        unlocked: false,
        condition: () => $scope.stats.early >= 1
    },
    {
        name: "🌙 Night Owl",
        desc: "Work after 11PM",
        unlocked: false,
        condition: () => $scope.stats.night >= 1
    },
    {
        name: "☕ Break Lover",
        desc: "Take 3 breaks",
        unlocked: false,
        condition: () => $scope.stats.breaks >= 3
    }
];

$scope.showPopup = false;
$scope.selected = {};

function checkBadges() {
    $scope.badges.forEach(b => {
        if (!b.unlocked && b.condition()) {
            b.unlocked = true;

            $scope.selected = b;
            $scope.showPopup = true;

            setTimeout(() => {
                $scope.showPopup = false;
                $scope.$apply();
            }, 2000);
        }
    });
}

// CALL THIS WHEN TIMER FINISHES
$scope.completeSession = function () {
    $scope.stats.sessions++;

    let hour = new Date().getHours();
    if (hour < 8) $scope.stats.early++;
    if (hour >= 23) $scope.stats.night++;

    checkBadges();
};

// CALL THIS WHEN BREAK TAKEN
$scope.takeBreak = function () {
    $scope.stats.breaks++;
    checkBadges();
};

$scope.openPopup = function (badge) {
    if (badge.unlocked) {
        $scope.selected = badge;
        $scope.showPopup = true;
    }
};

$scope.closePopup = function () {
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



//Achievement Angularjs




// =====================================================
//  CHRONOPOM — app.js
//  Fully integrated: Timer + Tasks + Progress/Badges
// =====================================================

var app = angular.module('myapp', ['ngRoute']);

// ─────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────
app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    .when('/timer',     { templateUrl: 'timer.html' })
    .when('/tasks',     { templateUrl: 'tasks.html' })
    .when('/analytics', { templateUrl: 'analytics.html' })
    .when('/progress',  { templateUrl: 'progress.html' })
    .otherwise({ redirectTo: '/timer' });
}]);

// ─────────────────────────────────────────────
//  SHARED STATE SERVICE
//  Single source of truth for all stats
// ─────────────────────────────────────────────
app.factory('AppState', function () {
  var state = {
    // Timer stats
    sessions:       0,
    breaks:         0,
    pomodorosToday: 0,
    totalMinutes:   0,

    // Task stats
    tasks:          [],
    completedTasks: 0,
    highPriorityDone: 0,
    workTasksDone:  0,

    // Time-based
    earlyBird:  0,   // sessions before 8am
    nightOwl:   0,   // sessions after 11pm
    lunchFocus: 0,   // sessions 12pm-2pm

    // Consistency
    weekSessions:   [0, 0, 0, 0, 0, 0, 0],  // Mon–Sun
    dailyStreak:    0,

    // Activity log
    activityLog: [],

    // Callbacks list (for cross-controller reactivity)
    _listeners: [],
    subscribe: function (fn) { this._listeners.push(fn); },
    notify: function () {
      this._listeners.forEach(function (fn) { try { fn(); } catch(e){} });
    }
  };
  return state;
});

// ─────────────────────────────────────────────
//  MAIN CONTROLLER  (navigation + theme)
// ─────────────────────────────────────────────
app.controller('MainController', ['$scope', '$location', '$timeout', '$interval', 'AppState',
  function ($scope, $location, $timeout, $interval, AppState) {

  // ── Navigation ──
  $scope.currentRoute = $location.path();
  $scope.$on('$routeChangeSuccess', function () {
    $scope.currentRoute = $location.path();
  });

  // ── Theme picker ──
  $scope.color = false;
  $scope.changeColor  = function () { $scope.color = !$scope.color; };
  $scope.unshow       = function () { $scope.color = false; };

  // ── Shared state reference ──
  $scope.AppState = AppState;

  // ── Toast (badge unlock notification) ──
  $scope.showToast  = false;
  $scope.toastBadge = {};

  function showBadgeToast(badge) {
    $scope.toastBadge = badge;
    $scope.showToast  = true;
    $timeout(function () { $scope.showToast = false; }, 3500);
  }

  // ── BADGE DEFINITIONS ──────────────────────────
  $scope.badges = [

    // ── TIMER BADGES ──
    {
      id: 'lift_off',
      name: '🚀 Lift Off',
      desc: 'Complete your very first Pomodoro session.',
      icon: '🚀',
      rarity: 'Common',
      xp: 50,
      category: 'timer',
      showProgress: true,
      requirement: 'Complete 1 Pomodoro session',
      unlocked: false, isNew: false,
      condition: function () { return AppState.sessions >= 1; },
      progress:  function () { return Math.min(AppState.sessions / 1, 1); }
    },
    {
      id: 'triple_threat',
      name: '🔥 Triple Threat',
      desc: 'Finish 3 sessions in total. You\'re getting into the rhythm!',
      icon: '🔥',
      rarity: 'Common',
      xp: 100,
      category: 'timer',
      showProgress: true,
      requirement: 'Complete 3 Pomodoro sessions',
      unlocked: false, isNew: false,
      condition: function () { return AppState.sessions >= 3; },
      progress:  function () { return Math.min(AppState.sessions / 3, 1); }
    },
    {
      id: 'focus_master',
      name: '⚡ Focus Master',
      desc: '10 sessions down! You\'ve mastered the art of deep focus.',
      icon: '⚡',
      rarity: 'Rare',
      xp: 250,
      category: 'timer',
      showProgress: true,
      requirement: 'Complete 10 Pomodoro sessions',
      unlocked: false, isNew: false,
      condition: function () { return AppState.sessions >= 10; },
      progress:  function () { return Math.min(AppState.sessions / 10, 1); }
    },
    {
      id: 'iron_mind',
      name: '🧠 Iron Mind',
      desc: '25 sessions? Nothing breaks your focus. You\'re legendary.',
      icon: '🧠',
      rarity: 'Epic',
      xp: 600,
      category: 'timer',
      showProgress: true,
      requirement: 'Complete 25 Pomodoro sessions',
      unlocked: false, isNew: false,
      condition: function () { return AppState.sessions >= 25; },
      progress:  function () { return Math.min(AppState.sessions / 25, 1); }
    },

    // ── BREAK BADGES ──
    {
      id: 'break_lover',
      name: '☕ Break Lover',
      desc: 'You\'ve taken 3 breaks. Rest is part of the process!',
      icon: '☕',
      rarity: 'Common',
      xp: 60,
      category: 'timer',
      showProgress: true,
      requirement: 'Take 3 breaks',
      unlocked: false, isNew: false,
      condition: function () { return AppState.breaks >= 3; },
      progress:  function () { return Math.min(AppState.breaks / 3, 1); }
    },
    {
      id: 'recharge_king',
      name: '🔋 Recharge King',
      desc: '10 breaks taken. You know balance is the secret weapon.',
      icon: '🔋',
      rarity: 'Rare',
      xp: 150,
      category: 'timer',
      showProgress: true,
      requirement: 'Take 10 breaks',
      unlocked: false, isNew: false,
      condition: function () { return AppState.breaks >= 10; },
      progress:  function () { return Math.min(AppState.breaks / 10, 1); }
    },

    // ── TIME-OF-DAY BADGES ──
    {
      id: 'early_bird',
      name: '🌅 Early Bird',
      desc: 'You started a session before 8 AM. Dawn belongs to the disciplined.',
      icon: '🌅',
      rarity: 'Rare',
      xp: 180,
      category: 'streak',
      showProgress: false,
      requirement: 'Start a session before 8:00 AM',
      unlocked: false, isNew: false,
      condition: function () { return AppState.earlyBird >= 1; },
      progress:  function () { return AppState.earlyBird >= 1 ? 1 : 0; }
    },
    {
      id: 'night_owl',
      name: '🌙 Night Owl',
      desc: 'Working after 11 PM? The night is your canvas.',
      icon: '🌙',
      rarity: 'Rare',
      xp: 180,
      category: 'streak',
      showProgress: false,
      requirement: 'Start a session after 11:00 PM',
      unlocked: false, isNew: false,
      condition: function () { return AppState.nightOwl >= 1; },
      progress:  function () { return AppState.nightOwl >= 1 ? 1 : 0; }
    },
    {
      id: 'lunch_grind',
      name: '🍱 Lunch Grind',
      desc: 'No lunch break — you turned it into a focus session. Respect.',
      icon: '🍱',
      rarity: 'Common',
      xp: 80,
      category: 'streak',
      showProgress: false,
      requirement: 'Complete a session between 12 PM and 2 PM',
      unlocked: false, isNew: false,
      condition: function () { return AppState.lunchFocus >= 1; },
      progress:  function () { return AppState.lunchFocus >= 1 ? 1 : 0; }
    },

    // ── TASK BADGES ──
    {
      id: 'first_win',
      name: '🎯 First Win',
      desc: 'You completed your very first task. The journey begins!',
      icon: '🎯',
      rarity: 'Common',
      xp: 75,
      category: 'tasks',
      showProgress: true,
      requirement: 'Complete 1 task',
      unlocked: false, isNew: false,
      condition: function () { return AppState.completedTasks >= 1; },
      progress:  function () { return Math.min(AppState.completedTasks / 1, 1); }
    },
    {
      id: 'task_crusher',
      name: '💪 Task Crusher',
      desc: '5 tasks done! You\'re crushing it one checkbox at a time.',
      icon: '💪',
      rarity: 'Rare',
      xp: 200,
      category: 'tasks',
      showProgress: true,
      requirement: 'Complete 5 tasks',
      unlocked: false, isNew: false,
      condition: function () { return AppState.completedTasks >= 5; },
      progress:  function () { return Math.min(AppState.completedTasks / 5, 1); }
    },
    {
      id: 'task_machine',
      name: '🤖 Task Machine',
      desc: '20 tasks completed! You\'re operating on a whole new level.',
      icon: '🤖',
      rarity: 'Epic',
      xp: 500,
      category: 'tasks',
      showProgress: true,
      requirement: 'Complete 20 tasks',
      unlocked: false, isNew: false,
      condition: function () { return AppState.completedTasks >= 20; },
      progress:  function () { return Math.min(AppState.completedTasks / 20, 1); }
    },
    {
      id: 'priority_slayer',
      name: '🔴 Priority Slayer',
      desc: 'You tackled 3 High priority tasks head-on. No procrastination!',
      icon: '🔴',
      rarity: 'Epic',
      xp: 350,
      category: 'tasks',
      showProgress: true,
      requirement: 'Complete 3 High priority tasks',
      unlocked: false, isNew: false,
      condition: function () { return AppState.highPriorityDone >= 3; },
      progress:  function () { return Math.min(AppState.highPriorityDone / 3, 1); }
    },
    {
      id: 'work_warrior',
      name: '💼 Work Warrior',
      desc: '5 Work category tasks finished. Your career thanks you.',
      icon: '💼',
      rarity: 'Rare',
      xp: 220,
      category: 'tasks',
      showProgress: true,
      requirement: 'Complete 5 Work category tasks',
      unlocked: false, isNew: false,
      condition: function () { return AppState.workTasksDone >= 5; },
      progress:  function () { return Math.min(AppState.workTasksDone / 5, 1); }
    },

    // ── STREAK / CONSISTENCY BADGES ──
    {
      id: 'comeback_kid',
      name: '🔄 Comeback Kid',
      desc: 'You had a session today after previously completing tasks. Consistency wins!',
      icon: '🔄',
      rarity: 'Common',
      xp: 90,
      category: 'streak',
      showProgress: true,
      requirement: 'Have both tasks & sessions in one day',
      unlocked: false, isNew: false,
      condition: function () { return AppState.sessions >= 1 && AppState.completedTasks >= 1; },
      progress:  function () { return (AppState.sessions >= 1 ? 0.5 : 0) + (AppState.completedTasks >= 1 ? 0.5 : 0); }
    },
    {
      id: 'double_duty',
      name: '⚙️ Double Duty',
      desc: 'You completed both a timer session AND a task. Synergy unlocked!',
      icon: '⚙️',
      rarity: 'Common',
      xp: 100,
      category: 'streak',
      showProgress: true,
      requirement: 'Complete 1 session + 1 task',
      unlocked: false, isNew: false,
      condition: function () { return AppState.sessions >= 1 && AppState.completedTasks >= 1; },
      progress:  function () { return ((AppState.sessions >= 1 ? 1 : 0) + (AppState.completedTasks >= 1 ? 1 : 0)) / 2; }
    },
    {
      id: 'pomodoro_pro',
      name: '🍅 Pomodoro Pro',
      desc: 'You have logged 5 sessions AND 5 tasks. True productivity champion!',
      icon: '🍅',
      rarity: 'Epic',
      xp: 400,
      category: 'streak',
      showProgress: true,
      requirement: 'Complete 5 sessions + 5 tasks',
      unlocked: false, isNew: false,
      condition: function () { return AppState.sessions >= 5 && AppState.completedTasks >= 5; },
      progress:  function () { return (Math.min(AppState.sessions / 5, 1) + Math.min(AppState.completedTasks / 5, 1)) / 2; }
    },
    {
      id: 'legendary_grinder',
      name: '👑 Legendary Grinder',
      desc: '50 sessions + 30 tasks. You are an absolute force of productivity.',
      icon: '👑',
      rarity: 'Legendary',
      xp: 2000,
      category: 'streak',
      showProgress: true,
      requirement: 'Complete 50 sessions AND 30 tasks',
      unlocked: false, isNew: false,
      condition: function () { return AppState.sessions >= 50 && AppState.completedTasks >= 30; },
      progress:  function () { return (Math.min(AppState.sessions / 50, 1) + Math.min(AppState.completedTasks / 30, 1)) / 2; }
    },
    {
      id: 'diamond_focus',
      name: '💎 Diamond Focus',
      desc: 'The rarest badge. 100 sessions completed. You are a legend.',
      icon: '💎',
      rarity: 'Legendary',
      xp: 5000,
      category: 'timer',
      showProgress: true,
      requirement: 'Complete 100 Pomodoro sessions',
      unlocked: false, isNew: false,
      condition: function () { return AppState.sessions >= 100; },
      progress:  function () { return Math.min(AppState.sessions / 100, 1); }
    }
  ];

  // ── Badge filter ──
  $scope.badgeFilter = 'all';

  $scope.filterBadges = function (badge) {
    if ($scope.badgeFilter === 'all')      return true;
    if ($scope.badgeFilter === 'unlocked') return badge.unlocked;
    if ($scope.badgeFilter === 'locked')   return !badge.unlocked;
    return badge.category === $scope.badgeFilter;
  };

  // ── Badge progress helpers ──
  $scope.badgeProgress = function (badge) {
    return Math.round(badge.progress() * 100);
  };

  $scope.badgeProgressText = function (badge) {
    var pct = $scope.badgeProgress(badge);
    return pct + '% complete';
  };

  // ── Stats helpers ──
  $scope.completedTasksCount = function () { return AppState.completedTasks; };
  $scope.unlockedCount       = function () { return $scope.badges.filter(function(b){ return b.unlocked; }).length; };

  $scope.totalXP = function () {
    return $scope.badges
      .filter(function(b){ return b.unlocked; })
      .reduce(function(sum, b){ return sum + b.xp; }, 0);
  };

  $scope.currentLevel = function () { return Math.floor($scope.totalXP() / 500) + 1; };

  $scope.levelTitle = function () {
    var titles = ['Beginner', 'Apprentice', 'Focused', 'Committed', 'Dedicated',
                  'Elite', 'Champion', 'Master', 'Grandmaster', 'Legend'];
    var idx = Math.min($scope.currentLevel() - 1, titles.length - 1);
    return titles[idx];
  };

  $scope.nextLevelXP = function () { return $scope.currentLevel() * 500; };

  $scope.xpPercent = function () {
    var prev = ($scope.currentLevel() - 1) * 500;
    var next = $scope.nextLevelXP();
    return Math.min(Math.max(($scope.totalXP() - prev) / (next - prev) * 100, 0), 100);
  };

  // ── Week tracker ──
  var days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var todayIdx = (new Date().getDay() + 6) % 7; // 0=Mon

  $scope.weekDays = days.map(function(d, i){
    return {
      label: d,
      sessions: AppState.weekSessions[i] || 0,
      active: (AppState.weekSessions[i] || 0) > 0,
      today: i === todayIdx
    };
  });

  function refreshWeekDays() {
    $scope.weekDays.forEach(function(d, i){
      d.sessions = AppState.weekSessions[i] || 0;
      d.active   = d.sessions > 0;
    });
  }

  // ── Recent Activity ──
  $scope.recentActivity = AppState.activityLog;

  // ── Confetti ──
  $scope.confettiPieces = [];
  var confettiColors = ['#ffd700','#ff8c00','#ff4fa0','#7c5cff','#48B3AF','#A7E399'];

  function makeConfetti() {
    $scope.confettiPieces = [];
    for (var i = 0; i < 20; i++) {
      $scope.confettiPieces.push({
        x: Math.random() * 100,
        d: Math.random() * 2,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)]
      });
    }
  }

  // ── Badge popup ──
  $scope.showBadgePopup = false;
  $scope.selectedBadge  = {};

  $scope.openBadgePopup = function (badge) {
    $scope.selectedBadge = badge;
    if (badge.unlocked) makeConfetti();
    $scope.showBadgePopup = true;
    badge.isNew = false;
  };

  $scope.closeBadgePopup = function () {
    $scope.showBadgePopup = false;
  };

  // ── Check & unlock badges ──
  function checkBadges(source) {
    $scope.badges.forEach(function (badge) {
      if (!badge.unlocked && badge.condition()) {
        badge.unlocked = true;
        badge.isNew    = true;

        // Log activity
        AppState.activityLog.unshift({
          type: 'badge',
          icon: '🏆',
          text: 'Badge Unlocked: ' + badge.name,
          time: 'Just now',
          xp: badge.xp
        });

        // Show toast
        showBadgeToast(badge);
      }
    });
    refreshWeekDays();
  }

  // ── Subscribe to AppState changes ──
  AppState.subscribe(function () {
    $scope.$applyAsync(function () {
      checkBadges();
      $scope.recentActivity = AppState.activityLog;
    });
  });

  // Initial check
  checkBadges();

}]);

// ─────────────────────────────────────────────
//  TIMER CONTROLLER  (myctrl)
// ─────────────────────────────────────────────
app.controller('myctrl', ['$scope', '$interval', '$timeout', 'AppState',
  function ($scope, $interval, $timeout, AppState) {

  $scope.AppState = AppState;

  // ── Timer core ──
  var timer = null;
  $scope.totalTime = 900;
  $scope.timeLeft  = 900;
  $scope.minutes   = '15';
  $scope.seconds   = '00';
  $scope.dashOffset = 0;

  function updateDisplay() {
    var m = Math.floor($scope.timeLeft / 60);
    var s = $scope.timeLeft % 60;
    $scope.minutes    = ('0' + m).slice(-2);
    $scope.seconds    = ('0' + s).slice(-2);
    var progress      = $scope.timeLeft / $scope.totalTime;
    $scope.dashOffset = 754 - (754 * progress);
  }

  $scope.start = function () {
    if (timer) return;
    timer = $interval(function () {
      $scope.timeLeft--;
      updateDisplay();
      if ($scope.timeLeft <= 0) {
        $interval.cancel(timer);
        timer = null;
        $scope.completeSession();
      }
    }, 1000);
  };

  $scope.pause = function () {
    $interval.cancel(timer);
    timer = null;
  };

  $scope.reset = function () {
    $scope.pause();
    $scope.timeLeft = $scope.totalTime;
    updateDisplay();
  };

  $scope.setMode = function (mode) {
    $scope.pause();
    if (mode === 'pomodoro') { $scope.totalTime = 900; }
    if (mode === 'short')    { $scope.totalTime = 300; AppState.breaks++; AppState.notify(); logActivity('break', '☕', 'Short break taken', 10); }
    if (mode === 'long')     { $scope.totalTime = 600; AppState.breaks++; AppState.notify(); logActivity('break', '☕', 'Long break taken', 15); }
    $scope.timeLeft = $scope.totalTime;
    updateDisplay();
  };

  $scope.completeSession = function () {
    AppState.sessions++;
    AppState.pomodorosToday++;
    AppState.totalMinutes += Math.floor($scope.totalTime / 60);

    // Time-of-day stats
    var h = new Date().getHours();
    if (h < 8)  AppState.earlyBird++;
    if (h >= 23) AppState.nightOwl++;
    if (h >= 12 && h < 14) AppState.lunchFocus++;

    // Week sessions
    var dayIdx = (new Date().getDay() + 6) % 7;
    AppState.weekSessions[dayIdx] = (AppState.weekSessions[dayIdx] || 0) + 1;

    logActivity('session', '🍅', 'Pomodoro session completed', 30);
    AppState.notify();
  };

  updateDisplay();

  // ── Task section (shared via AppState) ──
  $scope.tasks = AppState.tasks;

  $scope.task = { priority: 'Medium', category: 'Work', pomodoros: 1 };

  $scope.showNotification = false;

  $scope.addTask = function () {
    if (!$scope.task.name) return;
    AppState.tasks.push({
      name: $scope.task.name,
      priority: $scope.task.priority,
      category: $scope.task.category,
      pomodoros: $scope.task.pomodoros,
      done: 0,
      completed: false
    });
    logActivity('task', '📝', 'New task added: ' + $scope.task.name, 5);
    $scope.task = { priority: 'Medium', category: 'Work', pomodoros: 1 };
    $scope.showNotification = true;
    $timeout(function () { $scope.showNotification = false; }, 2000);
    AppState.notify();
  };

  // Watch task completion status
  $scope.$watch(function () {
    return AppState.tasks.map(function(t){ return t.completed; }).join(',');
  }, function (newVal, oldVal) {
    if (newVal === oldVal) return;
    var done = AppState.tasks.filter(function(t){ return t.completed; }).length;
    var prev = AppState.completedTasks;

    AppState.completedTasks = done;

    AppState.highPriorityDone = AppState.tasks.filter(function(t){
      return t.completed && t.priority === 'High';
    }).length;

    AppState.workTasksDone = AppState.tasks.filter(function(t){
      return t.completed && t.category === 'Work';
    }).length;

    if (done > prev) {
      var task = AppState.tasks.filter(function(t){ return t.completed; })[done - 1];
      if (task) logActivity('task', '✅', 'Task completed: ' + task.name, 20);
      AppState.notify();
    }
  }, true);

  // ── GSAP animations (only if gsap is available) ──
  $timeout(function () {
    if (typeof gsap === 'undefined') return;

    try {
      gsap.from('.lefthead h1', { x: -50, duration: 1.5, opacity: 0 });
      gsap.from('.righthead p', { x: 50,  duration: 1.5, opacity: 0 });
      gsap.from('.lefthead p',  { y: 20,  duration: 1.5, opacity: 0, delay: 0.3 });

      gsap.from('.ks .keep', {
        y: 50, duration: 0.7, opacity: 0,
        scrollTrigger: { trigger: '.keep', scroller: 'body', start: 'top 40%', scrub: 0.5 }
      });

      gsap.from('.box', {
        y: 50, duration: 1, opacity: 0, stagger: 0.3,
        scrollTrigger: { trigger: '.keep', scroller: 'body', start: 'top 40%' }
      });

      gsap.from('.mintext .min', {
        y: -30, duration: 5, opacity: 0, stagger: 0.2,
        scrollTrigger: { trigger: '.mintext', scroller: 'body', start: 'top 40%', end: 'top 60%' }
      });

      gsap.from('.mintext .count', {
        y: -30, delay: 1, duration: 5, opacity: 0, stagger: 0.5,
        scrollTrigger: { trigger: '.mintext', scroller: 'body', start: 'top 60%', end: 'top 40%', scrub: 0.3 }
      });

      gsap.from('.mintext p', {
        y: -40, duration: 5, opacity: 0, stagger: 0.2,
        scrollTrigger: { trigger: '.mintext', scroller: 'body', start: 'top 55%', scrub: 0.2 }
      });
    } catch (e) {}

    // ── Charts ──
    var barCtx = document.getElementById('barChart');
    if (barCtx) {
      new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
          datasets: [
            { label: 'Tasks',     data: [8,6,12,9,11,5,7],   backgroundColor: '#8b5cf6' },
            { label: 'Pomodoros', data: [18,15,28,21,25,12,16], backgroundColor: '#06b6d4' }
          ]
        }
      });
    }

    var lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
      new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: ['Week1','Week2','Week3','Week4','Week5','Week6'],
          datasets: [{
            label: 'Score',
            data: [650,720,880,1050,980,1300],
            borderColor: '#22c55e', tension: 0.4
          }]
        }
      });
    }

    var scatterCtx = document.getElementById('scatterChart');
    if (scatterCtx) {
      new Chart(scatterCtx, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Scatter Data',
            data: [{x:5,y:7},{x:10,y:15},{x:15,y:10},{x:20,y:25}],
            backgroundColor: '#f43f5e'
          }]
        }
      });
    }

  }, 600);

  // ── Helper: log activity ──
  function logActivity(type, icon, text, xp) {
    var now = new Date();
    var h = now.getHours(), m = now.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    var timeStr = h + ':' + ('0'+m).slice(-2) + ' ' + ampm;

    AppState.activityLog.unshift({
      type: type, icon: icon, text: text, time: timeStr, xp: xp
    });

    // Keep max 20 items
    if (AppState.activityLog.length > 20) AppState.activityLog.pop();
  }

}]);
