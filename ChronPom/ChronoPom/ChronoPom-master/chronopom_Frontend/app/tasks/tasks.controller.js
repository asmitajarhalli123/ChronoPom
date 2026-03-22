// ============================================================
//  FILE: app/tasks/tasks.controller.js
//  PURPOSE: TaskCtrl — manages the task list: add, delete,
//           mark complete, and link a task to the timer's
//           active focus session.
//  USED IN: app/tasks/tasks.view.html  →  ng-controller="TaskCtrl"
//  DEPENDS ON: AppService (shared task array + timer state)
// ============================================================

app.controller('TaskCtrl', ['$scope', '$timeout', 'AppService',
function ($scope, $timeout, AppService) {

  // ── SHARED TASK ARRAY ────────────────────────────────────
  // Direct reference to AppService.tasks — the same array
  // that TimerCtrl uses, so any change here appears instantly
  // on the timer page's active-task panel.
  $scope.tasks = AppService.tasks;

  // ── NEW TASK FORM MODEL ──────────────────────────────────
  // Bound to the add-task inputs via ng-model in tasks.view.html
  $scope.task = { name: '', priority: 'Medium', category: 'Work', pomodoros: 1 };

  // ── TOAST NOTIFICATION STATE ─────────────────────────────
  // showNotification / notificationMsg drive the .notification
  // div at the bottom of tasks.view.html
  $scope.showNotification = false;
  $scope.notificationMsg  = '';

  // ── ADD TASK ─────────────────────────────────────────────
  // Pushes a new task object into AppService.tasks.
  // Called by the "Add Task →" button and Enter key.
  $scope.addTask = function () {
    if (!$scope.task.name || !$scope.task.name.trim()) return;

    AppService.tasks.push({
      name           : $scope.task.name.trim(),
      priority       : $scope.task.priority  || 'Medium',
      category       : $scope.task.category  || 'Work',
      pomodoros      : parseInt($scope.task.pomodoros) || 1,
      done           : 0,          // pomodoros completed so far
      completed      : false,      // true when all pomodoros are done
      _progress      : 0,          // 0-100, drives the in-session progress bar
      _secThisSession: 0           // seconds elapsed in the current pomodoro
    });

    // Reset form fields after adding
    $scope.task = { name: '', priority: 'Medium', category: 'Work', pomodoros: 1 };
    $scope.notify('✅ Task added!');
  };

  // ── DELETE TASK ──────────────────────────────────────────
  // Removes the task at index and adjusts activeTaskIndex so
  // the timer's active task reference stays correct.
  $scope.deleteTask = function (index) {
    var ai = AppService.timerState.activeTaskIndex;
    if      (ai === index) AppService.timerState.activeTaskIndex = -1;
    else if (ai > index)   AppService.timerState.activeTaskIndex--;
    AppService.tasks.splice(index, 1);
  };

  // ── SET ACTIVE (link task to timer) ─────────────────────
  // Sets the timer's active task to this index so pomodoros
  // are credited to this task. Shows a notification.
  $scope.setActive = function (index) {
    AppService.timerState.activeTaskIndex = index;
    $scope.notify('⏱ "' + AppService.tasks[index].name + '" is now active in timer!');
  };

  // ── isActive(i) ─────────────────────────────────────────
  // Returns true when index i is the timer's active task.
  // Drives task-card-active CSS class and button label in view.
  $scope.isActive = function (i) {
    return AppService.timerState.activeTaskIndex === i;
  };

  // ── barWidth(task) ───────────────────────────────────────
  // Returns 0-100 percent completed pomodoros for the progress
  // bar inside each task card.
  $scope.barWidth = function (t) {
    return t.pomodoros
      ? Math.min(100, Math.round((t.done || 0) / t.pomodoros * 100))
      : 0;
  };

  // ── pomodoroArray(task) ──────────────────────────────────
  // Converts a task's pomodoros count into an array of
  // { filled: bool } objects used to render 🍅 dots in the view.
  $scope.pomodoroArray = function (task) {
    var arr = [];
    for (var i = 0; i < task.pomodoros; i++) {
      arr.push({ filled: i < task.done });
    }
    return arr;
  };

  // ── TOAST NOTIFICATION ───────────────────────────────────
  // Shows the .notification div for 2.5 seconds then hides it.
  $scope.notify = function (msg) {
    $scope.notificationMsg  = msg;
    $scope.showNotification = true;
    $timeout(function () { $scope.showNotification = false; }, 2500);
  };
}]);
