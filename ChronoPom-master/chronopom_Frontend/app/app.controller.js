// ============================================================
//  FILE: app/app.controller.js
//  PURPOSE: MainController — handles the top-level navigation
//           bar: active route highlighting, theme picker, and
//           the logged-in user display + logout.
//  USED IN: index.html  →  ng-controller="MainController"
// ============================================================

// ── MAIN CONTROLLER ──────────────────────────────────────────
// Runs on the outer shell (index.html), always active.
app.controller('MainController', ['$scope', '$location',
function ($scope, $location) {

  // ── ACTIVE ROUTE (highlights nav links) ─────────────────
  // currentRoute is used by ng-class="{'active': currentRoute=='/timer'}"
  $scope.currentRoute = $location.path();
  $scope.$on('$routeChangeSuccess', function () {
    $scope.currentRoute = $location.path();
  });

  // ── THEME PICKER (nav palette icon) ─────────────────────
  // color: controls whether the theme dropdown is visible
  // currentTheme: tracks which theme card has the active class
  $scope.color        = false;
  $scope.currentTheme = 'Soft Pastel Calm';

  $scope.changeColor = function () { $scope.color = !$scope.color; };
  $scope.unshow      = function (theme) {
    if (theme) $scope.currentTheme = theme;
    $scope.color = false;
  };

  // ── CURRENT USER (read from localStorage after login) ───
  // cp_currentUser is written by auth.html on successful login.
  try {
    var raw = localStorage.getItem('cp_currentUser');
    $scope.currentUser = raw ? JSON.parse(raw) : { name: 'User', email: '' };
  } catch (e) {
    $scope.currentUser = { name: 'User', email: '' };
  }

  // Returns the first letter of the username for the avatar circle
  $scope.userInitial = function () {
    return ($scope.currentUser.name || 'U').charAt(0).toUpperCase();
  };

}]);

// ── GLOBAL LOGOUT FUNCTION ───────────────────────────────────
// Defined on window so the plain onclick="handleLogout()" in
// the nav button works regardless of Angular scope nesting.
window.handleLogout = function () {
  try {
    localStorage.removeItem('cp_loggedIn');
    localStorage.removeItem('cp_currentUser');
  } catch (e) {}
  window.location.href = 'app/auth/auth.html?logout=1';
};
