// ============================================================
//  FILE: app/timer/timer.controller.js
//  PURPOSE: TimerCtrl — drives the pomodoro countdown timer,
//           links the active task, triggers analytics logging,
//           and runs GSAP scroll animations on the timer page.
//  USED IN: app/timer/timer.view.html  →  ng-controller="TimerCtrl"
//  DEPENDS ON: AppService (shared state + helpers)
// ============================================================

app.controller('TimerCtrl', ['$scope', '$interval', '$timeout', 'AppService',
function ($scope, $interval, $timeout, AppService) {

  // ── BIND SERVICE STATE TO SCOPE ──────────────────────────
  // These are direct references — any mutation in AppService
  // is automatically reflected in the view, and vice versa.
  $scope.t     = AppService.timerState; // timer display values + flags
  $scope.tasks = AppService.tasks;      // shared task list
  $scope.stats = AppService.stats;      // dailyScore + streak

  // Day-name lookup arrays for analytics logging and heatmap
  var DAY_KEYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; // JS getDay() order
  var HEAT_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; // heatmap column order

  // ── TICK ────────────────────────────────────────────────
  // Runs every 1 second while the timer is active.
  // Decrements timeLeft, updates the display, and handles
  // session completion when timeLeft reaches 0.
  function tick () {
    var t = AppService.timerState;

    if (t.timeLeft > 0) {
      // ── NORMAL TICK ──
      t.timeLeft--;
      AppService.updateDisplay(); // refreshes minutes, seconds, dashOffset

      // Update the live progress bar on the currently active task
      var active = AppService.activeTask();
      if (active && t.mode === 'pomodoro') {
        if (!active._secThisSession) active._secThisSession = 0;
        active._secThisSession++;
        // _progress (0-100) drives the .atp-bar-fill width in the view
        active._progress = Math.round(active._secThisSession / t.totalTime * 100);
      }

    } else {
      // ── SESSION FINISHED ──
      t.running = false;
      $interval.cancel(AppService._timerInterval);
      AppService._timerInterval = null;

      if (t.mode === 'pomodoro') {
        // Increment session counter and daily score
        t.sessions++;
        AppService.stats.dailyScore += 50;

        // Set time-of-day flags for Progress badge conditions
        var hour = new Date().getHours();
        if (hour < 8)   AppService._earlyBird = true;  // Early Bird badge
        if (hour >= 23) AppService._nightOwl  = true;  // Night Owl badge

        // Recalculate and save the daily streak
        AppService.refreshStreak();

        // Credit one pomodoro to the active task
        var active = AppService.activeTask();
        if (active) {
          active.done = Math.min((active.done || 0) + 1, active.pomodoros);
          active._secThisSession = 0;
          active._progress = Math.round(active.done / active.pomodoros * 100);
          // Auto-complete task when all its pomodoros are done
          if (active.done >= active.pomodoros) active.completed = true;
        }

        // Log the completed session to analytics
        var now    = new Date();
        var dayStr = DAY_KEYS[now.getDay()];
        AppService.logPomodoro({
          day      : dayStr,
          hour     : hour,
          category : (active && active.category) ? active.category : 'Work',
          focusMins: Math.round(t.totalTime / 60)
        });

        // Increment the matching heatmap cell in AppService.heatGrid
        var di = HEAT_DAYS.indexOf(dayStr); // column: day of week
        var hi = hour - 9;                  // row: hour (9am = 0)
        if (AppService.heatGrid && di >= 0 && hi >= 0 && hi < 10) {
          AppService.heatGrid[hi][di]++;
        }

        alert('🍅 Pomodoro done! Take a break.');

      } else {
        // Break session finished — increment break counter
        AppService.timerState._breaks = (AppService.timerState._breaks || 0) + 1;
        alert('⏰ Break over! Back to focus.');
      }
    }
  }

  // ── START ────────────────────────────────────────────────
  // Begins the countdown. Auto-selects the first incomplete
  // task if no task has been manually set as active.
  $scope.start = function () {
    var t = AppService.timerState;
    if (t.running) return;
    t.running = true;

    if (t.activeTaskIndex === -1) {
      var idx = AppService.tasks.findIndex(function (tk) { return !tk.completed; });
      if (idx >= 0) t.activeTaskIndex = idx;
    }
    AppService._timerInterval = $interval(tick, 1000);
  };

  // ── PAUSE ────────────────────────────────────────────────
  // Cancels the $interval but preserves timeLeft.
  $scope.pause = function () {
    AppService.timerState.running = false;
    if (AppService._timerInterval) {
      $interval.cancel(AppService._timerInterval);
      AppService._timerInterval = null;
    }
  };

  // ── RESET ────────────────────────────────────────────────
  // Pauses and restores timeLeft to the full mode duration.
  $scope.reset = function () {
    $scope.pause();
    var t      = AppService.timerState;
    t.timeLeft = t.totalTime;
    AppService.updateDisplay();
  };

  // ── SET MODE ─────────────────────────────────────────────
  // Switches between Pomodoro / Short Break / Long Break.
  // Pauses any running timer and resets to the new duration.
  $scope.setMode = function (mode) {
    $scope.pause();
    var t       = AppService.timerState;
    t.mode      = mode;
    t.totalTime = AppService.MODE_TIMES[mode];
    t.timeLeft  = t.totalTime;
    AppService.updateDisplay();
  };

  // ── TASK SELECTION ───────────────────────────────────────
  // Called from the active-task panel in timer.view.html.
  $scope.setActiveTask = function (index) {
    AppService.timerState.activeTaskIndex = index;
  };

  $scope.isActive   = function (i) { return AppService.timerState.activeTaskIndex === i; };
  $scope.activeTask = function ()  { return AppService.activeTask(); };

  // ── STATS HELPERS ────────────────────────────────────────
  // Used by the three stat boxes at the top of timer.view.html.
  $scope.completedCount = function () { return AppService.completedCount(); };
  $scope.totalTasks     = function () { return AppService.tasks.length; };
  $scope.completionPct  = function () { return AppService.completionPct(); };

  // ── GSAP SCROLL ANIMATIONS ───────────────────────────────
  // Entrance and scroll-triggered animations for the timer page.
  // The _gsapDone flag prevents them from replaying if the user
  // navigates away and returns to this route.
  $timeout(function () {
    if (window.gsap && !AppService._gsapDone) {
      AppService._gsapDone = true;
      try {
        // Hero header entrance animation
        if (document.querySelector('.lefthead h1')) {
          var tl = gsap.timeline();
          tl.from('.lefthead h1', { x: -50, duration: 1.2, opacity: 0 });
          tl.from('.righthead p', { x:  50, duration: 1.2, opacity: 0 }, '-=0.8');
          tl.from('.lefthead p',  { y:  20, duration: 1.0, opacity: 0 }, '-=0.6');
        }
        // Scroll-triggered animations (require ScrollTrigger plugin)
        if (window.ScrollTrigger) {
          ScrollTrigger.refresh();
          if (document.querySelector('.keep'))
            gsap.from('.ks .keep', { y: 50, opacity: 0, duration: 0.8,
              scrollTrigger: { trigger: '.keep', scroller: 'body', start: 'top 70%' } });
          if (document.querySelector('.box'))
            gsap.from('.box', { y: 50, opacity: 0, duration: 1, stagger: 0.3,
              scrollTrigger: { trigger: '.keep', scroller: 'body', start: 'top 60%' } });
          if (document.querySelector('.mintext')) {
            gsap.from('.mintext .min',   { y: -30, opacity: 0, duration: 1.5,
              scrollTrigger: { trigger: '.mintext', scroller: 'body', start: 'top 60%' } });
            gsap.from('.mintext .count', { y: -30, opacity: 0, duration: 1.5, delay: 0.4,
              scrollTrigger: { trigger: '.mintext', scroller: 'body', start: 'top 60%' } });
            gsap.from('.mintext p',      { y: -40, opacity: 0, duration: 1.5, delay: 0.8,
              scrollTrigger: { trigger: '.mintext', scroller: 'body', start: 'top 55%' } });
          }
        }
      } catch (e) { /* GSAP is optional — fail silently */ }
    }
  }, 200);

  // ── PREVENT TIMER CANCELLATION ON NAVIGATION ────────────
  // $destroy is called when the route changes and Angular
  // removes this controller. We leave the $interval running
  // intentionally so the timer keeps counting in the background.
  $scope.$on('$destroy', function () { /* intentionally empty */ });
}]);
