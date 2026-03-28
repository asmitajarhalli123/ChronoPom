// ============================================================
//  FILE: app/app.module.js
//  PURPOSE: Bootstraps the AngularJS app and defines all
//           client-side routes using ngRoute.
//  USED IN: index.html  →  ng-app="chronopom"
// ============================================================

var app = angular.module('chronopom', ['ngRoute']);

// ── ROUTE CONFIGURATION ──────────────────────────────────────
// Maps each URL hash fragment to its partial view template.
// The <div ng-view></div> in index.html renders these templates.
app.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    .when('/timer', {
      templateUrl: 'app/timer/timer.view.html'        // TimerCtrl
    })
    .when('/tasks', {
      templateUrl: 'app/tasks/tasks.view.html'        // TaskCtrl
    })
    .when('/analytics', {
      templateUrl: 'app/analytics/analytics.view.html' // AnalyticsCtrl
    })
    .when('/progress', {
      templateUrl: 'app/progress/progress.view.html'  // ProgressCtrl
    })
    .otherwise({ redirectTo: '/timer' });             // Default route
}]);
