// ============================================================
//  FILE: app/progress/progress.controller.js
//  PURPOSE: ProgressCtrl — manages the badges system, XP
//           levels, productivity awards, and the badge detail
//           modal on the progress page.
//  USED IN: app/progress/progress.view.html  →  ng-controller="ProgressCtrl"
//  DEPENDS ON: AppService (timerState.sessions, tasks, stats)
// ============================================================

app.controller('ProgressCtrl', ['$scope', '$timeout', '$interval', 'AppService',
function ($scope, $timeout, $interval, AppService) {

  // ── LIVE DATA HELPERS ────────────────────────────────────
  // These small functions read from AppService so badge
  // conditions always reflect the latest live values.

  // Total completed pomodoro sessions (timer page counter)
  function sessions () {
    return AppService.timerState.sessions || 0;
  }

  // Number of tasks marked completed
  function doneTasks () {
    return AppService.tasks.filter(function (t) { return t.completed; }).length;
  }

  // Number of HIGH priority tasks completed (Priority Slayer badge)
  function highPriDone () {
    return AppService.tasks.filter(function (t) {
      return t.completed && t.priority === 'High';
    }).length;
  }

  // ── BADGES ───────────────────────────────────────────────
  // Each badge object has:
  //   condition() → bool  — true when the badge should unlock
  //   progress()  → 0-1   — shown as a progress bar while locked
  // Badges are checked in checkAll() which runs on a 3s poll
  // and on every pomodoro / task-completion event.
  $scope.badges = [
    {
      id: 'lift_off', icon: '🚀', name: 'Lift Off',
      desc: 'You completed your very first Pomodoro session!',
      rarity: 'Common', xp: 50, category: 'timer', showProgress: true,
      requirement: 'Complete 1 Pomodoro session',
      unlocked: false, isNew: false,
      condition: function () { return sessions() >= 1; },
      progress:  function () { return Math.min(sessions() / 1, 1); }
    },
    {
      id: 'triple_threat', icon: '🔥', name: 'Triple Threat',
      desc: '3 sessions done. You are building a real habit!',
      rarity: 'Common', xp: 100, category: 'timer', showProgress: true,
      requirement: 'Complete 3 Pomodoro sessions',
      unlocked: false, isNew: false,
      condition: function () { return sessions() >= 3; },
      progress:  function () { return Math.min(sessions() / 3, 1); }
    },
    {
      id: 'focus_master', icon: '⚡', name: 'Focus Master',
      desc: '10 sessions completed. Your concentration is remarkable.',
      rarity: 'Rare', xp: 250, category: 'timer', showProgress: true,
      requirement: 'Complete 10 Pomodoro sessions',
      unlocked: false, isNew: false,
      condition: function () { return sessions() >= 10; },
      progress:  function () { return Math.min(sessions() / 10, 1); }
    },
    {
      id: 'iron_mind', icon: '🧠', name: 'Iron Mind',
      desc: '25 sessions and still going. Nothing breaks your focus.',
      rarity: 'Epic', xp: 600, category: 'timer', showProgress: true,
      requirement: 'Complete 25 Pomodoro sessions',
      unlocked: false, isNew: false,
      condition: function () { return sessions() >= 25; },
      progress:  function () { return Math.min(sessions() / 25, 1); }
    },
    {
      id: 'first_win', icon: '🎯', name: 'First Win',
      desc: 'First task completed. Every legend starts somewhere!',
      rarity: 'Common', xp: 75, category: 'tasks', showProgress: true,
      requirement: 'Complete 1 task',
      unlocked: false, isNew: false,
      condition: function () { return doneTasks() >= 1; },
      progress:  function () { return Math.min(doneTasks() / 1, 1); }
    },
    {
      id: 'task_crusher', icon: '💪', name: 'Task Crusher',
      desc: '5 tasks done. You are crushing your to-do list!',
      rarity: 'Rare', xp: 200, category: 'tasks', showProgress: true,
      requirement: 'Complete 5 tasks',
      unlocked: false, isNew: false,
      condition: function () { return doneTasks() >= 5; },
      progress:  function () { return Math.min(doneTasks() / 5, 1); }
    },
    {
      id: 'priority_slayer', icon: '🔴', name: 'Priority Slayer',
      desc: '3 high-priority tasks done. No procrastination here!',
      rarity: 'Epic', xp: 350, category: 'tasks', showProgress: true,
      requirement: 'Complete 3 High priority tasks',
      unlocked: false, isNew: false,
      condition: function () { return highPriDone() >= 3; },
      progress:  function () { return Math.min(highPriDone() / 3, 1); }
    },
    {
      id: 'double_duty', icon: '⚙️', name: 'Double Duty',
      desc: 'Both a session and a task done. Timer + Tasks = power combo!',
      rarity: 'Common', xp: 100, category: 'combo', showProgress: true,
      requirement: 'Complete 1 session + 1 task',
      unlocked: false, isNew: false,
      condition: function () { return sessions() >= 1 && doneTasks() >= 1; },
      progress:  function () { return ((sessions() >= 1 ? 1 : 0) + (doneTasks() >= 1 ? 1 : 0)) / 2; }
    },
    {
      id: 'pomodoro_pro', icon: '🍅', name: 'Pomodoro Pro',
      desc: '5 sessions AND 5 tasks. You are the definition of productive.',
      rarity: 'Epic', xp: 400, category: 'combo', showProgress: true,
      requirement: 'Complete 5 sessions + 5 tasks',
      unlocked: false, isNew: false,
      condition: function () { return sessions() >= 5 && doneTasks() >= 5; },
      progress:  function () { return (Math.min(sessions() / 5, 1) + Math.min(doneTasks() / 5, 1)) / 2; }
    },
    {
      id: 'early_bird', icon: '🌅', name: 'Early Bird',
      desc: 'Started a session before 8 AM. Dawn belongs to the disciplined.',
      rarity: 'Rare', xp: 180, category: 'special', showProgress: false,
      requirement: 'Start a session before 8:00 AM',
      unlocked: false, isNew: false,
      // AppService._earlyBird is set true by TimerCtrl when hour < 8
      condition: function () { return !!AppService._earlyBird; },
      progress:  function () { return AppService._earlyBird ? 1 : 0; }
    },
    {
      id: 'night_owl', icon: '🌙', name: 'Night Owl',
      desc: 'Working after 11 PM. The night is your canvas.',
      rarity: 'Rare', xp: 180, category: 'special', showProgress: false,
      requirement: 'Start a session after 11:00 PM',
      unlocked: false, isNew: false,
      // AppService._nightOwl is set true by TimerCtrl when hour >= 23
      condition: function () { return !!AppService._nightOwl; },
      progress:  function () { return AppService._nightOwl ? 1 : 0; }
    },
    {
      id: 'legendary_grinder', icon: '👑', name: 'Legendary Grinder',
      desc: '20 sessions + 10 tasks. You are an absolute force.',
      rarity: 'Legendary', xp: 2000, category: 'combo', showProgress: true,
      requirement: 'Complete 20 sessions AND 10 tasks',
      unlocked: false, isNew: false,
      condition: function () { return sessions() >= 20 && doneTasks() >= 10; },
      progress:  function () { return (Math.min(sessions() / 20, 1) + Math.min(doneTasks() / 10, 1)) / 2; }
    }
  ];

  // ── AWARDS ───────────────────────────────────────────────
  // Simpler earned/locked tiles shown below the badges grid.
  $scope.awards = [
    { icon: '🎖️', name: 'First Session', desc: 'Completed 1st Pomodoro',      earned: false, check: function () { return sessions() >= 1; } },
    { icon: '📋', name: 'Task Master',   desc: 'Completed 5 tasks',            earned: false, check: function () { return doneTasks() >= 5; } },
    { icon: '⏱️', name: 'Time Keeper',  desc: 'Ran 10 Pomodoro sessions',     earned: false, check: function () { return sessions() >= 10; } },
    { icon: '🌟', name: 'Daily Hero',    desc: 'Session + task done together', earned: false, check: function () { return sessions() >= 1 && doneTasks() >= 1; } },
    { icon: '🚀', name: 'High Flyer',    desc: '3 high-priority tasks done',   earned: false, check: function () { return highPriDone() >= 3; } },
    { icon: '🔥', name: 'Streak Keeper', desc: '2+ day streak maintained',     earned: false, check: function () { return !!(AppService.stats && AppService.stats.streak >= 2); } }
  ];

  // ── BADGE FILTERS ────────────────────────────────────────
  // Drives the filter tab row above the badge grid.
  $scope.filters = [
    { key: 'all',      label: 'All'     },
    { key: 'timer',    label: 'Timer'   },
    { key: 'tasks',    label: 'Tasks'   },
    { key: 'combo',    label: 'Combo'   },
    { key: 'special',  label: 'Special' },
    { key: 'unlocked', label: 'Earned'  },
    { key: 'locked',   label: 'Locked'  }
  ];
  $scope.badgeFilter = 'all';

  // Used by ng-repeat filter in progress.view.html
  $scope.filterFn = function (b) {
    var f = $scope.badgeFilter;
    if (f === 'all')      return true;
    if (f === 'unlocked') return b.unlocked;
    if (f === 'locked')   return !b.unlocked;
    return b.category === f;
  };

  // Returns 0-100 progress percentage for the bar inside each badge card.
  $scope.badgePct = function (b) { return Math.round(b.progress() * 100); };

  // ── XP + LEVEL SYSTEM ────────────────────────────────────
  // 500 XP per level. Level titles advance through 10 tiers.

  // Sum of xp values of all unlocked badges
  $scope.totalXP = function () {
    return $scope.badges
      .filter(function (b) { return b.unlocked; })
      .reduce(function (s, b) { return s + b.xp; }, 0);
  };

  // Count of unlocked badges (shown in "X / 12 earned" header)
  $scope.unlockedCount = function () {
    return $scope.badges.filter(function (b) { return b.unlocked; }).length;
  };

  // Current level number (starts at 1)
  $scope.currentLevel = function () { return Math.floor($scope.totalXP() / 500) + 1; };

  // XP required to reach the next level
  $scope.nextLevelXP  = function () { return $scope.currentLevel() * 500; };

  // 0-100 fill for the XP progress bar in the level box
  $scope.xpPercent = function () {
    var prev = ($scope.currentLevel() - 1) * 500;
    var next = $scope.nextLevelXP();
    return Math.min(Math.max(($scope.totalXP() - prev) / (next - prev) * 100, 0), 100);
  };

  // Human-readable title for the current level
  $scope.levelTitle = function () {
    var titles = ['Beginner','Apprentice','Focused','Committed','Dedicated',
                  'Elite','Champion','Master','Grandmaster','Legend'];
    return titles[Math.min($scope.currentLevel() - 1, titles.length - 1)];
  };

  // ── MINI STATS ROW ───────────────────────────────────────
  // Four stat tiles below the level box (Sessions / Tasks / Focus Time / Streak).
  $scope.miniStats = [
    { icon: '🍅', label: 'Sessions',   value: '0'  },
    { icon: '✅', label: 'Tasks Done', value: '0'  },
    { icon: '⏱',  label: 'Focus Time', value: '0m' },
    { icon: '🔥', label: 'Streak',     value: '0'  }
  ];

  // Refreshes the mini stat values from live AppService data.
  function refreshStats () {
    var mins = sessions() * 25; // each session = 25 focus minutes
    $scope.miniStats[0].value = String(sessions());
    $scope.miniStats[1].value = String(doneTasks());
    $scope.miniStats[2].value = Math.floor(mins / 60) > 0
      ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm'
      : mins + 'm';
    $scope.miniStats[3].value = String((AppService.stats && AppService.stats.streak) || 0);
  }

  // ── TOAST NOTIFICATION ───────────────────────────────────
  // Slides in from the right when a badge is unlocked.
  // Driven by pr-toast + pr-toast-show CSS classes.
  $scope.toast = { visible: false, icon: '', name: '', xp: 0 };

  function showToast (b) {
    $scope.toast = { visible: true, icon: b.icon, name: b.name, xp: b.xp };
    $timeout(function () { $scope.toast.visible = false; }, 3200);
  }

  // ── BADGE DETAIL MODAL ───────────────────────────────────
  // Opens when a badge card is clicked. Shows rarity, XP,
  // requirement text and progress bar (if locked).
  $scope.modal      = { open: false, badge: {} };
  $scope.openModal  = function (b) { b.isNew = false; $scope.modal = { open: true, badge: b }; };
  $scope.closeModal = function ()  { $scope.modal.open = false; };

  // ── CHECK ALL BADGES & AWARDS ────────────────────────────
  // Iterates every badge; if its condition() turns true,
  // marks it unlocked and fires the toast. Also updates awards.
  function checkAll () {
    refreshStats();
    $scope.badges.forEach(function (b) {
      if (!b.unlocked && b.condition()) {
        b.unlocked = true;
        b.isNew    = true;
        showToast(b);
      }
    });
    $scope.awards.forEach(function (a) { a.earned = a.check(); });
  }

  // ── SUBSCRIBE TO POMODORO EVENTS ─────────────────────────
  // Re-checks badges immediately when a session completes.
  AppService.onPomLog(function () { $scope.$applyAsync(checkAll); });

  // ── WATCH TASK COMPLETIONS ───────────────────────────────
  // Re-checks badges when any task's completed flag changes.
  $scope.$watch(
    function () {
      return AppService.tasks.map(function (t) { return t.completed; }).join(',');
    },
    function (newVal, oldVal) { if (newVal !== oldVal) checkAll(); }
  );

  // ── BOOT + POLL ──────────────────────────────────────────
  // Initial check after 300ms, then re-check every 3 seconds
  // so the page stays current even if events are missed.
  $timeout(function () {
    checkAll();
    var poll = $interval(checkAll, 3000);
    $scope.$on('$destroy', function () { $interval.cancel(poll); });
  }, 300);
}]);


// ── APP RUN BLOCK ────────────────────────────────────────────
// Ensures time-of-day flags are initialised on AppService
// before any controller checks them. Safe to run multiple times.
app.run(['AppService', function (AppService) {
  if (!AppService._earlyBird)            AppService._earlyBird         = false;
  if (!AppService._nightOwl)             AppService._nightOwl          = false;
  if (!AppService.timerState._breaks)    AppService.timerState._breaks = 0;
}]);
