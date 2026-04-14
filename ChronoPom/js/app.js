// ============================================================
//  app.js — ChronoPom Core
//  Contains:
//    1. Angular app + routes
//    2. Firebase helper functions (global)
//    3. MainController (navigation + user)
//    4. AppService (shared state: timer, tasks, stats)
// ============================================================


// ─────────────────────────────────────────────────────────────
//  1. ANGULAR APP + ROUTES
// ─────────────────────────────────────────────────────────────

var app = angular.module('myapp', ['ngRoute']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/timer',     { templateUrl: 'pages/timer.html'     })
    .when('/tasks',     { templateUrl: 'pages/tasks.html'     })
    .when('/analytics', { templateUrl: 'pages/analytics.html' })
    .when('/progress',  { templateUrl: 'pages/progress.html'  })
    .otherwise({ redirectTo: '/timer' });
}]);


// ─────────────────────────────────────────────────────────────
//  2. FIREBASE HELPER FUNCTIONS  (global — used in all files)
// ─────────────────────────────────────────────────────────────

// Get the logged-in user's Firebase UID from localStorage
function getCurrentUID() {
  try {
    var user = JSON.parse(localStorage.getItem('cp_currentUser') || '{}');
    return user.uid || null;
  } catch(e) { return null; }
}

// Reference to this user's Firestore document: users/{uid}
function userDoc() {
  return db.collection('users').doc(getCurrentUID());
}

// Reference to this user's tasks subcollection: users/{uid}/tasks
function tasksCollection() {
  return userDoc().collection('tasks');
}


// ─────────────────────────────────────────────────────────────
//  3. MAIN CONTROLLER  (navigation bar)
// ─────────────────────────────────────────────────────────────

app.controller('MainController', ['$scope', '$location', function($scope, $location) {

  // Active route highlight in navbar
  $scope.currentRoute = $location.path();
  $scope.$on('$routeChangeSuccess', function() {
    $scope.currentRoute = $location.path();
  });

  // Theme picker toggle
  $scope.color = false;
  $scope.changeColor = function() { $scope.color = !$scope.color; };
  $scope.unshow      = function() { $scope.color = false; };

  // Load current user from localStorage (set during login)
  try {
    var raw = localStorage.getItem('cp_currentUser');
    $scope.currentUser = raw ? JSON.parse(raw) : { name: 'User', email: '' };
  } catch(e) {
    $scope.currentUser = { name: 'User', email: '' };
  }

  // Avatar: first letter of user's name
  $scope.userInitial = function() {
    return ($scope.currentUser.name || 'U').charAt(0).toUpperCase();
  };

}]);


// ─────────────────────────────────────────────────────────────
//  4. APP SERVICE  (single source of truth — survives navigation)
//
//  All controllers read from this service so data is never
//  lost when the user switches between pages.
// ─────────────────────────────────────────────────────────────

app.service('AppService', function() {

  var svc = this;

  // ── Timer state ──
  svc.timerState = {
    mode           : 'pomodoro',
    totalTime      : 1500,      // seconds
    timeLeft       : 1500,
    running        : false,
    minutes        : '25',
    seconds        : '00',
    dashOffset     : 0,
    sessions       : 0,         // total pomodoros completed this session
    activeTaskIndex: -1,
    _breaks        : 0
  };

  // ── Shared task list (Tasks page + Timer page use same array) ──
  svc.tasks = [];

  // ── User stats (shown on Timer page) ──
  svc.stats = {
    dailyScore: 0,
    streak    : 0
  };

  // ── Time-of-day flags (used by Progress badges) ──
  svc._earlyBird = false;
  svc._nightOwl  = false;

  // ── Timer mode durations ──
  svc.MODE_TIMES = { pomodoro: 1500, short: 300, long: 600 };

  // ── Internal timer interval handle (kept here so it survives page changes) ──
  svc._timerInterval = null;
  svc._gsapDone      = false;

  // ── Analytics data ──
  svc.pomLog       = [];    // log of completed pomodoro sessions
  svc._anListeners = [];    // callbacks that fire when pomLog updates

  // ── Heatmap grid: 10 hour-rows × 7 day-columns ──
  svc.heatGrid = [
    [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0], [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0], [0,0,0,0,0,0,0]
  ];


  // ── Timer display update ──
  svc.updateDisplay = function() {
    var t = svc.timerState;
    t.minutes    = ('0' + Math.floor(t.timeLeft / 60)).slice(-2);
    t.seconds    = ('0' + (t.timeLeft % 60)).slice(-2);
    t.dashOffset = 754 - (754 * (t.timeLeft / t.totalTime));
  };

  // ── Task helpers ──
  svc.completedCount = function() {
    return svc.tasks.filter(function(t) { return t.completed; }).length;
  };

  svc.completionPct = function() {
    return svc.tasks.length
      ? Math.round(svc.completedCount() / svc.tasks.length * 100)
      : 0;
  };

  svc.activeTask = function() {
    var i = svc.timerState.activeTaskIndex;
    return (i >= 0 && i < svc.tasks.length) ? svc.tasks[i] : null;
  };

  // ── Analytics pub/sub ──
  svc.logPomodoro = function(entry) {
    svc.pomLog.push(entry);
    svc._anListeners.forEach(function(fn) { fn(); });
  };

  svc.onPomLog = function(fn) {
    svc._anListeners.push(fn);
  };

  // ── Streak (per-user localStorage keys, backed up to Firestore) ──
  svc.refreshStreak = function() {
    var uid = getCurrentUID();
    if (!uid) return;

    var today     = new Date().toDateString();
    var lastKey   = 'cp_lastDay_'  + uid;
    var streakKey = 'cp_streak_'   + uid;
    var last      = localStorage.getItem(lastKey)   || '';
    var streak    = parseInt(localStorage.getItem(streakKey) || '0', 10);
    var yesterday = new Date(Date.now() - 86400000).toDateString();

    if (last === today) {
      // already counted today — no change
    } else if (last === yesterday) {
      streak++;
      localStorage.setItem(streakKey, streak);
      localStorage.setItem(lastKey, today);
    } else {
      streak = 1;
      localStorage.setItem(streakKey, streak);
      localStorage.setItem(lastKey, today);
    }
    svc.stats.streak = streak;
  };

  svc.updateDisplay(); // initialise display on load
});
