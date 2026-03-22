// ============================================================
//  progress.js — ChronoPom Progress & Badges
//  Contains:
//    1. app.run — extends AppService with time-of-day flags
//    2. ProgressCtrl — badges, XP, level, awards
//       All data loaded from Firestore per user
// ============================================================


// ─────────────────────────────────────────────────────────────
//  1. APP.RUN — Extend AppService with time-of-day flags
//  (safe to call multiple times — only sets if not yet defined)
// ─────────────────────────────────────────────────────────────

app.run(['AppService', function(AppService) {
  if (AppService._earlyBird === undefined) AppService._earlyBird = false;
  if (AppService._nightOwl  === undefined) AppService._nightOwl  = false;
}]);


// ─────────────────────────────────────────────────────────────
//  2. PROGRESS CONTROLLER
//  Reads sessions, tasks, and streak from AppService
//  (which was loaded from Firestore by anConncetion.js app.run)
//  Saves newly unlocked badges and XP to Firestore.
// ─────────────────────────────────────────────────────────────

app.controller('ProgressCtrl', ['$scope', '$timeout', '$interval', 'AppService',
function($scope, $timeout, $interval, AppService) {

  // ── Helpers — read live values from AppService ──
  function sessions()    { return AppService.timerState.sessions || 0; }
  function doneTasks()   { return AppService.tasks.filter(function(t) { return t.completed; }).length; }
  function highPriDone() { return AppService.tasks.filter(function(t) { return t.completed && t.priority === 'High'; }).length; }

  // ─────────────────────────────────────────────────────────
  //  BADGE DEFINITIONS
  //  Each badge has:
  //    condition() — returns true when earned
  //    progress()  — 0..1 fraction for the progress bar
  // ─────────────────────────────────────────────────────────

  $scope.badges = [
    {
      id: 'lift_off', icon: '🚀', name: 'Lift Off',
      desc: 'You completed your very first Pomodoro session!',
      rarity: 'Common', xp: 50, category: 'timer', showProgress: true,
      requirement: 'Complete 1 Pomodoro session',
      unlocked: false, isNew: false,
      condition: function() { return sessions() >= 1; },
      progress:  function() { return Math.min(sessions() / 1, 1); }
    },
    {
      id: 'triple_threat', icon: '🔥', name: 'Triple Threat',
      desc: '3 sessions done. You are building a real habit!',
      rarity: 'Common', xp: 100, category: 'timer', showProgress: true,
      requirement: 'Complete 3 Pomodoro sessions',
      unlocked: false, isNew: false,
      condition: function() { return sessions() >= 3; },
      progress:  function() { return Math.min(sessions() / 3, 1); }
    },
    {
      id: 'focus_master', icon: '⚡', name: 'Focus Master',
      desc: '10 sessions completed. Your concentration is remarkable.',
      rarity: 'Rare', xp: 250, category: 'timer', showProgress: true,
      requirement: 'Complete 10 Pomodoro sessions',
      unlocked: false, isNew: false,
      condition: function() { return sessions() >= 10; },
      progress:  function() { return Math.min(sessions() / 10, 1); }
    },
    {
      id: 'iron_mind', icon: '🧠', name: 'Iron Mind',
      desc: '25 sessions and still going. Nothing breaks your focus.',
      rarity: 'Epic', xp: 600, category: 'timer', showProgress: true,
      requirement: 'Complete 25 Pomodoro sessions',
      unlocked: false, isNew: false,
      condition: function() { return sessions() >= 25; },
      progress:  function() { return Math.min(sessions() / 25, 1); }
    },
    {
      id: 'first_win', icon: '🎯', name: 'First Win',
      desc: 'First task completed. Every legend starts somewhere!',
      rarity: 'Common', xp: 75, category: 'tasks', showProgress: true,
      requirement: 'Complete 1 task',
      unlocked: false, isNew: false,
      condition: function() { return doneTasks() >= 1; },
      progress:  function() { return Math.min(doneTasks() / 1, 1); }
    },
    {
      id: 'task_crusher', icon: '💪', name: 'Task Crusher',
      desc: '5 tasks done. You are crushing your to-do list!',
      rarity: 'Rare', xp: 200, category: 'tasks', showProgress: true,
      requirement: 'Complete 5 tasks',
      unlocked: false, isNew: false,
      condition: function() { return doneTasks() >= 5; },
      progress:  function() { return Math.min(doneTasks() / 5, 1); }
    },
    {
      id: 'priority_slayer', icon: '🔴', name: 'Priority Slayer',
      desc: '3 high-priority tasks done. No procrastination here!',
      rarity: 'Epic', xp: 350, category: 'tasks', showProgress: true,
      requirement: 'Complete 3 High priority tasks',
      unlocked: false, isNew: false,
      condition: function() { return highPriDone() >= 3; },
      progress:  function() { return Math.min(highPriDone() / 3, 1); }
    },
    {
      id: 'double_duty', icon: '⚙️', name: 'Double Duty',
      desc: 'Both a session and a task done — Timer + Tasks = power combo!',
      rarity: 'Common', xp: 100, category: 'combo', showProgress: true,
      requirement: 'Complete 1 session + 1 task',
      unlocked: false, isNew: false,
      condition: function() { return sessions() >= 1 && doneTasks() >= 1; },
      progress:  function() { return ((sessions() >= 1 ? 1 : 0) + (doneTasks() >= 1 ? 1 : 0)) / 2; }
    },
    {
      id: 'pomodoro_pro', icon: '🍅', name: 'Pomodoro Pro',
      desc: '5 sessions AND 5 tasks — the definition of productive.',
      rarity: 'Epic', xp: 400, category: 'combo', showProgress: true,
      requirement: 'Complete 5 sessions + 5 tasks',
      unlocked: false, isNew: false,
      condition: function() { return sessions() >= 5 && doneTasks() >= 5; },
      progress:  function() { return (Math.min(sessions() / 5, 1) + Math.min(doneTasks() / 5, 1)) / 2; }
    },
    {
      id: 'early_bird', icon: '🌅', name: 'Early Bird',
      desc: 'Started a session before 8 AM. Dawn belongs to the disciplined.',
      rarity: 'Rare', xp: 180, category: 'special', showProgress: false,
      requirement: 'Start a session before 8:00 AM',
      unlocked: false, isNew: false,
      condition: function() { return !!AppService._earlyBird; },
      progress:  function() { return AppService._earlyBird ? 1 : 0; }
    },
    {
      id: 'night_owl', icon: '🌙', name: 'Night Owl',
      desc: 'Working after 11 PM. The night is your canvas.',
      rarity: 'Rare', xp: 180, category: 'special', showProgress: false,
      requirement: 'Start a session after 11:00 PM',
      unlocked: false, isNew: false,
      condition: function() { return !!AppService._nightOwl; },
      progress:  function() { return AppService._nightOwl ? 1 : 0; }
    },
    {
      id: 'legendary_grinder', icon: '👑', name: 'Legendary Grinder',
      desc: '20 sessions + 10 tasks — you are an absolute force.',
      rarity: 'Legendary', xp: 2000, category: 'combo', showProgress: true,
      requirement: 'Complete 20 sessions AND 10 tasks',
      unlocked: false, isNew: false,
      condition: function() { return sessions() >= 20 && doneTasks() >= 10; },
      progress:  function() { return (Math.min(sessions() / 20, 1) + Math.min(doneTasks() / 10, 1)) / 2; }
    }
  ];

  // ── Load previously unlocked badges from Firestore ──
  // So badges stay unlocked across page refreshes and devices
  var uid = getCurrentUID();
  if (uid) {
    userDoc().collection('badges').get()
      .then(function(snapshot) {
        $scope.$apply(function() {
          var unlockedIds = {};
          snapshot.forEach(function(doc) { unlockedIds[doc.id] = true; });
          $scope.badges.forEach(function(b) {
            if (unlockedIds[b.id]) b.unlocked = true;
          });
        });
      })
      .catch(function(e) { console.warn('Badge load failed:', e); });
  }

  // ── Awards (simpler achievements, no XP) ──
  $scope.awards = [
    { icon: '🎖️', name: 'First Session',  desc: 'Completed 1st Pomodoro',      earned: false, check: function() { return sessions() >= 1; } },
    { icon: '📋', name: 'Task Master',    desc: 'Completed 5 tasks',            earned: false, check: function() { return doneTasks() >= 5; } },
    { icon: '⏱️', name: 'Time Keeper',   desc: 'Ran 10 Pomodoro sessions',     earned: false, check: function() { return sessions() >= 10; } },
    { icon: '🌟', name: 'Daily Hero',     desc: 'Session + task done together', earned: false, check: function() { return sessions() >= 1 && doneTasks() >= 1; } },
    { icon: '🚀', name: 'High Flyer',     desc: '3 high-priority tasks done',   earned: false, check: function() { return highPriDone() >= 3; } },
    { icon: '🔥', name: 'Streak Keeper',  desc: '2+ day streak maintained',     earned: false, check: function() { return !!(AppService.stats && AppService.stats.streak >= 2); } }
  ];

  // ── Filter tabs ──
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

  $scope.filterFn = function(b) {
    var f = $scope.badgeFilter;
    if (f === 'all')      return true;
    if (f === 'unlocked') return b.unlocked;
    if (f === 'locked')   return !b.unlocked;
    return b.category === f;
  };

  $scope.badgePct = function(b) { return Math.round(b.progress() * 100); };

  // ── XP + Level (computed from unlocked badges) ──
  $scope.totalXP = function() {
    return $scope.badges.filter(function(b) { return b.unlocked; })
                        .reduce(function(s, b) { return s + b.xp; }, 0);
  };

  $scope.unlockedCount = function() {
    return $scope.badges.filter(function(b) { return b.unlocked; }).length;
  };

  $scope.currentLevel = function() { return Math.floor($scope.totalXP() / 500) + 1; };
  $scope.nextLevelXP  = function() { return $scope.currentLevel() * 500; };

  $scope.xpPercent = function() {
    var prev = ($scope.currentLevel() - 1) * 500;
    var next = $scope.nextLevelXP();
    return Math.min(Math.max(($scope.totalXP() - prev) / (next - prev) * 100, 0), 100);
  };

  $scope.levelTitle = function() {
    var titles = ['Beginner', 'Apprentice', 'Focused', 'Committed', 'Dedicated',
                  'Elite', 'Champion', 'Master', 'Grandmaster', 'Legend'];
    return titles[Math.min($scope.currentLevel() - 1, titles.length - 1)];
  };

  // ── Mini stats cards ──
  $scope.miniStats = [
    { value: '0', icon: '🍅', label: 'Pomodoros'    },
    { value: '0', icon: '✅', label: 'Tasks done'    },
    { value: '0', icon: '🔴', label: 'High pri done' },
    { value: '0', icon: '🔥', label: 'Day streak'    }
  ];

  function refreshStats() {
    $scope.miniStats[0].value = String(sessions());
    $scope.miniStats[1].value = String(doneTasks());
    $scope.miniStats[2].value = String(highPriDone());
    $scope.miniStats[3].value = String(AppService.stats.streak || 0);
  }

  // ── Toast notification (badge unlocked) ──
  $scope.toast = { visible: false, icon: '', name: '', xp: 0 };

  function showToast(b) {
    $scope.toast = { visible: true, icon: b.icon, name: b.name, xp: b.xp };
    $timeout(function() { $scope.toast.visible = false; }, 3200);
  }

  // ── Badge detail modal ──
  $scope.modal = { open: false, badge: {} };
  $scope.openModal  = function(b) { b.isNew = false; $scope.modal = { open: true, badge: b }; };
  $scope.closeModal = function()  { $scope.modal.open = false; };

  // ── Check all badges and awards ──
  // Runs on boot, on every pomodoro, on task completion, and every 3s
  function checkAll() {
    refreshStats();
    var currentUID = getCurrentUID();
    $scope.badges.forEach(function(b) {
      if (!b.unlocked && b.condition()) {
        b.unlocked = true;
        b.isNew    = true;
        showToast(b);

        // Save newly unlocked badge to Firestore
        if (currentUID) {
          userDoc().collection('badges').doc(b.id).set({
            name      : b.name,
            icon      : b.icon,
            xp        : b.xp,
            rarity    : b.rarity,
            unlockedAt: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(function(e) { console.warn('Badge save failed:', e); });

          // Save updated XP total
          userDoc().collection('stats').doc('summary').set({
            totalXP: $scope.totalXP()
          }, { merge: true }).catch(function(e) { console.warn('XP save failed:', e); });
        }
      }
    });
    $scope.awards.forEach(function(a) { a.earned = a.check(); });
  }

  // Subscribe to pomodoro completions
  if (AppService.onPomLog) AppService.onPomLog(function() { $scope.$applyAsync(checkAll); });

  // Watch task completions
  $scope.$watch(function() {
    return AppService.tasks.map(function(t) { return t.completed; }).join(',');
  }, function(n, o) { if (n !== o) checkAll(); });

  // Watch session count (fires when a pomodoro completes in TimerCtrl)
  $scope.$watch(function() {
    return AppService.timerState.sessions;
  }, function(n, o) { if (n !== o) checkAll(); });

  // Boot: 600ms delay gives Firestore badge load time to complete first
  $timeout(function() {
    checkAll();
    var poll = $interval(checkAll, 3000);
    $scope.$on('$destroy', function() { $interval.cancel(poll); });
  }, 600);

}]);
