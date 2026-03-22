// ============================================================
//  FILE: shared/services/app.service.js
//  PURPOSE: AppService — the single source of truth for the
//           entire app. Declared as a service (singleton) so
//           its state survives Angular route changes.
//           Shared by: TimerCtrl, TaskCtrl, AnalyticsCtrl,
//                      ProgressCtrl
// ============================================================

app.service('AppService', function () {

  var svc = this;

  // ── TIMER STATE ──────────────────────────────────────────
  // All timer properties read/written by TimerCtrl.
  // Kept here so the countdown keeps running when the user
  // navigates away from the Timer page.
  svc.timerState = {
    mode           : 'pomodoro', // 'pomodoro' | 'short' | 'long'
    totalTime      : 1500,       // current mode's duration in seconds
    timeLeft       : 1500,       // seconds remaining
    running        : false,      // true while $interval is ticking
    minutes        : '25',       // formatted display value
    seconds        : '00',       // formatted display value
    dashOffset     : 0,          // SVG circle stroke-dashoffset
    sessions       : 0,          // total completed pomodoro sessions
    activeTaskIndex: -1,         // index into svc.tasks (-1 = none)
    _breaks        : 0           // total break sessions completed
  };

  // ── MODE DURATIONS (seconds) ─────────────────────────────
  // Used by TimerCtrl.setMode() and timer.view.html tab buttons.
  svc.MODE_TIMES = { pomodoro: 1500, short: 300, long: 600 };

  // ── INTERNAL $interval HANDLE ────────────────────────────
  // Stored here (not in the controller) so the interval
  // reference survives controller $destroy on navigation.
  svc._timerInterval = null;

  // ── TASKS ────────────────────────────────────────────────
  // Same array reference is bound in both TaskCtrl and
  // TimerCtrl, so changes in one page are instantly visible
  // in the other without any extra broadcast.
  svc.tasks = [];

  // ── STATS ────────────────────────────────────────────────
  // dailyScore: incremented by 50 for each completed pomodoro
  // streak: calendar-day streak, persisted in localStorage
  svc.stats = { dailyScore: 0, streak: 0 };

  // ── POMODORO LOG ─────────────────────────────────────────
  // Each entry: { day:'Mon', hour:14, category:'Work', focusMins:25 }
  // Written by TimerCtrl on every completed pomodoro session.
  // Read by AnalyticsCtrl to update charts and heatmap.
  svc.pomLog       = [];
  svc._anListeners = []; // subscriber callbacks for pub/sub

  // ── HEATMAP GRID ─────────────────────────────────────────
  // 10 rows (9 am–6 pm) × 7 cols (Mon–Sun).
  // Pre-seeded with sample data so the heatmap is not blank
  // on first load. TimerCtrl increments cells on session end.
  svc.heatGrid = [
    [5,7,8,4,3,1,0],[6,9,9,5,7,2,0],[8,9,10,6,8,2,0],[4,5,8,3,6,1,0],
    [3,4,6,7,9,1,0],[2,3,4,5,5,0,0],[1,2,3,3,4,1,0],[0,1,2,2,3,0,0],
    [0,0,1,1,2,0,0],[0,0,0,1,1,0,0]
  ];

  // ── TIME-OF-DAY FLAGS ────────────────────────────────────
  // Set by TimerCtrl when a session finishes at unusual hours.
  // Read by ProgressCtrl to unlock Early Bird / Night Owl badges.
  svc._earlyBird = false; // session finished before 8 AM
  svc._nightOwl  = false; // session finished after 11 PM

  // ── GSAP GUARD ───────────────────────────────────────────
  // Prevents GSAP timeline from re-running if the user
  // navigates away and back to the Timer page.
  svc._gsapDone = false;

  // ── updateDisplay() ──────────────────────────────────────
  // Recalculates minutes/seconds strings and the SVG
  // circle dashOffset from the current timeLeft value.
  // Called every tick and after mode/reset changes.
  svc.updateDisplay = function () {
    var t        = svc.timerState;
    t.minutes    = ('0' + Math.floor(t.timeLeft / 60)).slice(-2);
    t.seconds    = ('0' + (t.timeLeft % 60)).slice(-2);
    t.dashOffset = 754 - (754 * (t.timeLeft / t.totalTime));
  };

  // ── completedCount() ────────────────────────────────────
  // Returns the number of tasks with completed === true.
  // Used by TimerCtrl stats panel and ProgressCtrl.
  svc.completedCount = function () {
    return svc.tasks.filter(function (t) { return t.completed; }).length;
  };

  // ── completionPct() ─────────────────────────────────────
  // Returns 0-100 percent of completed tasks.
  // Displayed in the timer stats box ("X% completion").
  svc.completionPct = function () {
    return svc.tasks.length
      ? Math.round(svc.completedCount() / svc.tasks.length * 100)
      : 0;
  };

  // ── activeTask() ────────────────────────────────────────
  // Returns the task object at activeTaskIndex, or null.
  // Used by TimerCtrl tick() to credit pomodoros to the task.
  svc.activeTask = function () {
    var i = svc.timerState.activeTaskIndex;
    return (i >= 0 && i < svc.tasks.length) ? svc.tasks[i] : null;
  };

  // ── logPomodoro(entry) ───────────────────────────────────
  // Called by TimerCtrl when a pomodoro session ends.
  // Pushes the entry to pomLog and notifies all subscribers
  // (AnalyticsCtrl and ProgressCtrl listen via onPomLog).
  svc.logPomodoro = function (entry) {
    svc.pomLog.push(entry);
    svc._anListeners.forEach(function (fn) { fn(); });
  };

  // ── onPomLog(fn) ────────────────────────────────────────
  // Subscribe to pomodoro completion events.
  // AnalyticsCtrl and ProgressCtrl call this to register
  // their refresh callbacks.
  svc.onPomLog = function (fn) {
    svc._anListeners.push(fn);
  };

  // ── refreshStreak() ─────────────────────────────────────
  // Calculates and saves the user's daily streak to
  // localStorage keys: cp_streak and cp_lastDay.
  // Called on service init and after every completed session.
  svc.refreshStreak = function () {
    try {
      var today     = new Date().toDateString();
      var last      = localStorage.getItem('cp_lastDay') || '';
      var streak    = parseInt(localStorage.getItem('cp_streak') || '0', 10);
      var yesterday = new Date(Date.now() - 86400000).toDateString();

      if (last === today) {
        /* already counted today — do nothing */
      } else if (last === yesterday) {
        streak++;
        localStorage.setItem('cp_streak', streak);
        localStorage.setItem('cp_lastDay', today);
      } else {
        streak = 1;  // streak broken — reset to 1
        localStorage.setItem('cp_streak', streak);
        localStorage.setItem('cp_lastDay', today);
      }
      svc.stats.streak = streak;
    } catch (e) { /* silently ignore if localStorage is blocked */ }
  };

  // ── INITIALISE ───────────────────────────────────────────
  svc.updateDisplay();   // set initial minutes/seconds display
  svc.refreshStreak();   // load streak from localStorage
});
