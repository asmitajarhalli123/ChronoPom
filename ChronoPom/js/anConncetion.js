// ============================================================
//  anConncetion.js — ChronoPom Firebase Connection Layer
//  Contains:
//    1. app.run  — loads all user data from Firestore on startup
//    2. TimerCtrl — timer logic + saves sessions to Firestore
//    3. TaskCtrl  — loads/saves/deletes tasks in Firestore
//    4. AnalyticsCtrl — charts powered by live AppService data
// ============================================================


// ─────────────────────────────────────────────────────────────
//  1. APP.RUN — Runs once on app start
//  Resets AppService state for this user, then loads their
//  data from Firestore: stats, heatmap, and session log.
// ─────────────────────────────────────────────────────────────

app.run(['AppService', '$rootScope', function(AppService, $rootScope) {

  // Reset to zero so no previous user's data bleeds through
  AppService.stats.dailyScore        = 0;
  AppService.stats.streak            = 0;
  AppService.timerState.sessions     = 0;
  AppService._earlyBird              = false;
  AppService._nightOwl               = false;
  AppService.pomLog.length           = 0;

  var uid = getCurrentUID();
  if (!uid) {
    AppService.refreshStreak();
    return;
  }

  // ── Load stats (dailyScore, streak, totalPoms, earlyBird, nightOwl) ──
  userDoc().collection('stats').doc('summary').get()
    .then(function(doc) {
      $rootScope.$apply(function() {
        if (doc.exists) {
          var d = doc.data();
          AppService.stats.dailyScore        = d.dailyScore  || 0;
          AppService.stats.streak            = d.streak       || 0;
          AppService.timerState.sessions     = d.totalPoms    || 0;
          AppService._earlyBird              = d.earlyBird    || false;
          AppService._nightOwl               = d.nightOwl     || false;
          localStorage.setItem('cp_streak_' + uid, AppService.stats.streak);
        }
        AppService.refreshStreak(); // check if today extends streak
      });
    })
    .catch(function(e) { console.warn('Stats load failed:', e); });

  // ── Load heatmap grid ──
  userDoc().collection('heatmap').doc('grid').get()
    .then(function(doc) {
      if (doc.exists) {
        var rows = doc.data().rows;
        if (rows && rows.length === 10) {
          $rootScope.$apply(function() {
            for (var i = 0; i < 10; i++) AppService.heatGrid[i] = rows[i];
          });
        }
      }
    })
    .catch(function(e) { console.warn('Heatmap load failed:', e); });

  // ── Load last 100 sessions into pomLog (powers Analytics charts) ──
  userDoc().collection('sessions')
    .orderBy('timestamp', 'desc')
    .limit(100)
    .get()
    .then(function(snapshot) {
      $rootScope.$apply(function() {
        AppService.pomLog.length = 0;
        snapshot.forEach(function(doc) {
          var d = doc.data();
          AppService.pomLog.push({
            day      : d.day       || 'Mon',
            hour     : d.hour      || 9,
            category : d.category  || 'Work',
            focusMins: d.focusMins || 25
          });
        });
        // Notify AnalyticsCtrl to re-render with this user's data
        AppService._anListeners.forEach(function(fn) {
          try { fn(); } catch(e) {}
        });
      });
    })
    .catch(function(e) { console.warn('Session log load failed:', e); });

}]);


// ─────────────────────────────────────────────────────────────
//  2. TIMER CONTROLLER
//  - Runs the countdown timer
//  - On pomodoro complete: updates AppService + saves to Firestore
// ─────────────────────────────────────────────────────────────

app.controller('TimerCtrl', ['$scope', '$interval', '$timeout', 'AppService',
function($scope, $interval, $timeout, AppService) {

  // Bind AppService state directly to scope for template binding
  $scope.t     = AppService.timerState;
  $scope.tasks = AppService.tasks;
  $scope.stats = AppService.stats;

  var DAY_KEYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var HEAT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // ── Tick — called every second while timer is running ──
  function tick() {
    var t = AppService.timerState;

    if (t.timeLeft > 0) {
      t.timeLeft--;
      AppService.updateDisplay();

      // Update active task's live progress bar
      var active = AppService.activeTask();
      if (active && t.mode === 'pomodoro') {
        if (!active._secThisSession) active._secThisSession = 0;
        active._secThisSession++;
        active._progress = Math.round(active._secThisSession / t.totalTime * 100);
      }

    } else {
      // ── Session finished ──
      t.running = false;
      $interval.cancel(AppService._timerInterval);
      AppService._timerInterval = null;

      if (t.mode === 'pomodoro') {
        t.sessions++;
        AppService.stats.dailyScore += 50;

        // Track time-of-day for Early Bird / Night Owl badges
        var hour = new Date().getHours();
        if (hour < 8)   AppService._earlyBird = true;
        if (hour >= 23) AppService._nightOwl  = true;

        AppService.refreshStreak();

        // Increment active task's done count
        var active = AppService.activeTask();
        if (active) {
          active.done = Math.min((active.done || 0) + 1, active.pomodoros);
          active._secThisSession = 0;
          active._progress = Math.round(active.done / active.pomodoros * 100);
          if (active.done >= active.pomodoros) active.completed = true;
        }

        // Log this pomodoro for Analytics charts
        var now    = new Date();
        var dayStr = DAY_KEYS[now.getDay()];
        AppService.logPomodoro({
          day      : dayStr,
          hour     : hour,
          category : (active && active.category) ? active.category : 'Work',
          focusMins: Math.round(t.totalTime / 60)
        });

        // Update heatmap in memory
        var di = HEAT_DAYS.indexOf(dayStr);
        var hi = hour - 9;
        if (di >= 0 && hi >= 0 && hi < 10) AppService.heatGrid[hi][di]++;

        // ── Save everything to Firestore ──
        var uid = getCurrentUID();
        if (uid) {
          // Save session log entry
          userDoc().collection('sessions').add({
            day      : dayStr,
            hour     : hour,
            category : (active && active.category) ? active.category : 'Work',
            focusMins: Math.round(t.totalTime / 60),
            taskName : (active && active.name) ? active.name : '',
            score    : 50,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });

          // Save updated stats summary
          userDoc().collection('stats').doc('summary').set({
            dailyScore : AppService.stats.dailyScore,
            totalPoms  : firebase.firestore.FieldValue.increment(1),
            streak     : AppService.stats.streak,
            earlyBird  : AppService._earlyBird,
            nightOwl   : AppService._nightOwl,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          // Save active task's new progress
          if (active && active._firestoreId) {
            tasksCollection().doc(active._firestoreId).update({
              done     : active.done,
              completed: active.completed
            }).catch(function(e) { console.warn('Task update failed:', e); });
          }

          // Save updated heatmap
          userDoc().collection('heatmap').doc('grid').set({
            rows: AppService.heatGrid
          });
        }

        alert('🍅 Pomodoro done! Take a break.');

      } else {
        AppService.timerState._breaks = (AppService.timerState._breaks || 0) + 1;
        alert('⏰ Break over! Back to focus.');
      }
    }
  }

  // ── Controls ──
  $scope.start = function() {
    var t = AppService.timerState;
    if (t.running) return;
    t.running = true;
    // Auto-select first incomplete task if none is chosen
    if (t.activeTaskIndex === -1) {
      var idx = AppService.tasks.findIndex(function(tk) { return !tk.completed; });
      if (idx >= 0) t.activeTaskIndex = idx;
    }
    AppService._timerInterval = $interval(tick, 1000);
  };

  $scope.pause = function() {
    AppService.timerState.running = false;
    if (AppService._timerInterval) {
      $interval.cancel(AppService._timerInterval);
      AppService._timerInterval = null;
    }
  };

  $scope.reset = function() {
    $scope.pause();
    var t = AppService.timerState;
    t.timeLeft = t.totalTime;
    AppService.updateDisplay();
  };

  $scope.setMode = function(mode) {
    $scope.pause();
    var t       = AppService.timerState;
    t.mode      = mode;
    t.totalTime = AppService.MODE_TIMES[mode];
    t.timeLeft  = t.totalTime;
    AppService.updateDisplay();
  };

  // ── Task selector helpers ──
  $scope.setActiveTask  = function(i)  { AppService.timerState.activeTaskIndex = i; };
  $scope.isActive       = function(i)  { return AppService.timerState.activeTaskIndex === i; };
  $scope.activeTask     = function()   { return AppService.activeTask(); };
  $scope.completedCount = function()   { return AppService.completedCount(); };
  $scope.totalTasks     = function()   { return AppService.tasks.length; };
  $scope.completionPct  = function()   { return AppService.completionPct(); };

  // ── GSAP animations (run once, guarded by flag) ──
  $timeout(function() {
    if (window.gsap && !AppService._gsapDone) {
      AppService._gsapDone = true;
      try {
        if (document.querySelector('.lefthead h1')) {
          var tl = gsap.timeline();
          tl.from('.lefthead h1', { x: -50, duration: 1.2, opacity: 0 });
          tl.from('.righthead p', { x:  50, duration: 1.2, opacity: 0 }, '-=0.8');
          tl.from('.lefthead p',  { y:  20, duration: 1.0, opacity: 0 }, '-=0.6');
        }
        if (window.ScrollTrigger) {
          ScrollTrigger.refresh();
          if (document.querySelector('.keep'))
            gsap.from('.ks .keep', { y: 50, opacity: 0, duration: 0.8, scrollTrigger: { trigger: '.keep', scroller: 'body', start: 'top 70%' } });
          if (document.querySelector('.box'))
            gsap.from('.box', { y: 50, opacity: 0, duration: 1, stagger: 0.3, scrollTrigger: { trigger: '.keep', scroller: 'body', start: 'top 60%' } });
          if (document.querySelector('.mintext')) {
            gsap.from('.mintext .min',   { y: -30, opacity: 0, duration: 1.5, scrollTrigger: { trigger: '.mintext', scroller: 'body', start: 'top 60%' } });
            gsap.from('.mintext .count', { y: -30, opacity: 0, duration: 1.5, delay: 0.4, scrollTrigger: { trigger: '.mintext', scroller: 'body', start: 'top 60%' } });
            gsap.from('.mintext p',      { y: -40, opacity: 0, duration: 1.5, delay: 0.8, scrollTrigger: { trigger: '.mintext', scroller: 'body', start: 'top 55%' } });
          }
        }
      } catch(e) {}
    }
  }, 200);

  // Don't cancel interval on controller destroy — timer keeps running while navigating
  $scope.$on('$destroy', function() { /* intentionally empty */ });

}]);


// ─────────────────────────────────────────────────────────────
//  3. TASK CONTROLLER
//  - Clears and reloads tasks from Firestore on every mount
//    (ensures User B never sees User A's tasks)
//  - Saves new tasks, deletes tasks, marks complete in Firestore
// ─────────────────────────────────────────────────────────────

app.controller('TaskCtrl', ['$scope', '$timeout', 'AppService',
function($scope, $timeout, AppService) {

  $scope.tasks             = AppService.tasks;
  $scope.task              = { name: '', priority: 'Medium', category: 'Work', pomodoros: 1 };
  $scope.showNotification  = false;
  $scope.notificationMsg   = '';

  // Helper: tell analytics to re-render after task changes
  function notifyAnalytics() {
    AppService._anListeners.forEach(function(fn) { fn(); });
  }

  // ── Clear previous user's tasks, reset active index ──
  AppService.tasks.length = 0;
  AppService.timerState.activeTaskIndex = -1;

  // ── Load this user's tasks from Firestore ──
  var uid = getCurrentUID();
  if (uid) {
    tasksCollection().orderBy('createdAt').get()
      .then(function(snapshot) {
        $scope.$apply(function() {
          AppService.tasks.length = 0;
          snapshot.forEach(function(doc) {
            var data          = doc.data();
            data._firestoreId    = doc.id;
            data._progress       = 0;
            data._secThisSession = 0;
            data._dirty          = false;
            AppService.tasks.push(data);
          });
          notifyAnalytics();
        });
      })
      .catch(function(e) { console.warn('Task load failed:', e); });
  }

  // ── Add task — saves to Firestore ──
  $scope.addTask = function() {
    if (!$scope.task.name || !$scope.task.name.trim()) return;
    var currentUID = getCurrentUID();
    var newTask = {
      name     : $scope.task.name.trim(),
      priority : $scope.task.priority  || 'Medium',
      category : $scope.task.category  || 'Work',
      pomodoros: parseInt($scope.task.pomodoros) || 1,
      done     : 0,
      completed: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (currentUID) {
      tasksCollection().add(newTask)
        .then(function(docRef) {
          $scope.$apply(function() {
            newTask._firestoreId    = docRef.id;
            newTask._progress       = 0;
            newTask._secThisSession = 0;
            newTask._dirty          = false;
            AppService.tasks.push(newTask);
            $scope.task = { name: '', priority: 'Medium', category: 'Work', pomodoros: 1 };
            $scope.notify('✅ Task added!');
            notifyAnalytics();
          });
        })
        .catch(function(e) {
          $scope.$apply(function() { $scope.notify('❌ Failed to save task.'); });
        });
    } else {
      // Fallback if no uid (should not happen after login)
      newTask._progress = 0;
      newTask._secThisSession = 0;
      AppService.tasks.push(newTask);
      $scope.task = { name: '', priority: 'Medium', category: 'Work', pomodoros: 1 };
      $scope.notify('✅ Task added!');
    }
  };

  // ── Delete task — removes from Firestore ──
  $scope.deleteTask = function(index) {
    var task = AppService.tasks[index];
    var ai   = AppService.timerState.activeTaskIndex;
    if (ai === index)    AppService.timerState.activeTaskIndex = -1;
    else if (ai > index) AppService.timerState.activeTaskIndex--;
    AppService.tasks.splice(index, 1);
    notifyAnalytics();

    var currentUID = getCurrentUID();
    if (currentUID && task._firestoreId) {
      tasksCollection().doc(task._firestoreId).delete()
        .catch(function(e) { console.warn('Delete failed:', e); });
    }
  };

  // ── Checkbox: mark dirty so $watch saves it to Firestore ──
  $scope.markDirty = function(task) { task._dirty = true; };

  // ── $watch: saves any dirty task to Firestore (triggered by markDirty) ──
  $scope.$watch('tasks', function(newTasks) {
    if (!newTasks) return;
    var currentUID = getCurrentUID();
    if (!currentUID) return;
    newTasks.forEach(function(t) {
      if (t._firestoreId && t._dirty) {
        tasksCollection().doc(t._firestoreId).update({
          completed: t.completed,
          done     : t.done
        }).catch(function(e) { console.warn('Update failed:', e); });
        t._dirty = false;
      }
    });
    notifyAnalytics();
  }, true);

  // ── Set active task (links timer to this task) ──
  $scope.setActive = function(index) {
    AppService.timerState.activeTaskIndex = index;
    $scope.notify('⏱ "' + AppService.tasks[index].name + '" is now active!');
  };

  // ── Template helpers ──
  $scope.isActive = function(i) {
    return AppService.timerState.activeTaskIndex === i;
  };

  $scope.barWidth = function(t) {
    return t.pomodoros ? Math.min(100, Math.round((t.done || 0) / t.pomodoros * 100)) : 0;
  };

  $scope.pomodoroArray = function(task) {
    var arr = [];
    for (var i = 0; i < task.pomodoros; i++) arr.push({ filled: i < task.done });
    return arr;
  };

  // ── Toast notification ──
  $scope.notify = function(msg) {
    $scope.notificationMsg  = msg;
    $scope.showNotification = true;
    $timeout(function() { $scope.showNotification = false; }, 2500);
  };

}]);


// ─────────────────────────────────────────────────────────────
//  4. ANALYTICS CONTROLLER
//  - All data comes from AppService (loaded from Firestore)
//  - Charts initialised after 400ms (DOM must be ready)
//  - Polls every 5s for live updates
// ─────────────────────────────────────────────────────────────

app.controller('AnalyticsCtrl', ['$scope', '$timeout', '$interval', 'AppService',
function($scope, $timeout, $interval, AppService) {

  $scope.tasks = AppService.tasks;

  // ── Period selector (Week / Month / All time) ──
  $scope.periods = [
    { key: 'week',  label: 'Week'     },
    { key: 'month', label: 'Month'    },
    { key: 'all',   label: 'All time' }
  ];
  $scope.period = 'week';
  $scope.setPeriod = function(key) {
    $scope.period = key;
    updateBarChart();
    updateLineChart();
  };

  // ── Metric cards ──
  $scope.metrics = [
    { label: 'Total pomodoros', icon: '🍅', value: '0',  up: true,  trend: '0%' },
    { label: 'Focus time',      icon: '⏱',  value: '0m', up: true,  trend: '0%' },
    { label: 'Tasks done',      icon: '✅',  value: '0',  up: true,  trend: '0'  },
    { label: 'Completion',      icon: '📈',  value: '0%', up: false, trend: '0%' }
  ];

  function refreshMetrics() {
    var tasks     = AppService.tasks;
    var pomsDone  = AppService.pomLog.length;
    var focusMins = tasks.reduce(function(s, t) { return s + (t.done || 0) * 25; }, 0);
    var done      = tasks.filter(function(t) { return t.completed; }).length;
    var pct       = tasks.length ? Math.round(done / tasks.length * 100) : 0;

    $scope.metrics[0].value = String(pomsDone || tasks.reduce(function(s, t) { return s + (t.done || 0); }, 0));
    $scope.metrics[1].value = Math.floor(focusMins / 60) + 'h ' + (focusMins % 60) + 'm';
    $scope.metrics[2].value = String(done);
    $scope.metrics[3].value = pct + '%';
    $scope.metrics[3].up    = pct >= 50;
  }

  // ── Task breakdown filter ──
  $scope.taskFilter = 'All';

  $scope.filteredTasks = function() {
    var all = AppService.tasks;
    if ($scope.taskFilter === 'All') return all;
    return all.filter(function(t) {
      return t.priority === $scope.taskFilter || t.category === $scope.taskFilter;
    });
  };

  $scope.taskBarPct = function(t) {
    return t.pomodoros ? Math.min(100, Math.round((t.done || 0) / t.pomodoros * 100)) : 0;
  };

  // ── Category legend (for donut chart) ──
  $scope.categoryLegend = [];
  var CAT_COLORS = { Work: '#8b5cf6', Health: '#10b981', Creative: '#f59e0b', Other: '#06b6d4' };

  function buildCategoryLegend() {
    var map = {};
    AppService.tasks.forEach(function(t) {
      var c = t.category || 'Other';
      map[c] = (map[c] || 0) + 1;
    });
    $scope.categoryLegend = Object.keys(map).map(function(k) {
      return { name: k, count: map[k], color: CAT_COLORS[k] || '#9ca3af' };
    });
  }

  // ── Daily tick grid (Mon–Sun, 8 ticks each) ──
  var DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  $scope.dailyTicks = DAY_KEYS.map(function(d) {
    return { day: d, ticks: Array.from({ length: 8 }, function() { return { done: false }; }), doneCount: 0, total: 8 };
  });

  $scope.toggleTick = function(dayObj, tick) {
    tick.done        = !tick.done;
    dayObj.doneCount = dayObj.ticks.filter(function(t) { return t.done; }).length;
    updateBarChart();
  };

  function syncTicksFromTasks() {
    var todayIdx = (new Date().getDay() + 6) % 7;
    var done     = AppService.tasks.filter(function(t) { return t.completed; }).length;
    var dayObj   = $scope.dailyTicks[todayIdx];
    dayObj.ticks.forEach(function(tick, i) { tick.done = i < done; });
    dayObj.doneCount = Math.min(done, 8);
  }

  // ── Heatmap ──
  $scope.heatDays  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  $scope.heatHours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm'];
  $scope.heatGrid  = AppService.heatGrid; // live reference

  $scope.heatColor = function(val) {
    var a = val === 0 ? 0.05 : 0.10 + (val / 10) * 0.82;
    return 'rgba(0,12,49,' + a.toFixed(2) + ')';
  };

  // ── Chart instances ──
  var barChart, donutChart, lineChart, scatterChart;
  var tipOpts = {
    backgroundColor: '#fff', titleColor: '#000c31', bodyColor: '#6b7280',
    borderColor: 'rgba(0,0,0,0.1)', borderWidth: 1, cornerRadius: 8, padding: 10
  };

  var DAY_LABELS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var WEEK_LABELS  = ['W1',  'W2',  'W3',  'W4',  'W5',  'W6'];
  var MONTH_LABELS = ['Mar', 'Apr', 'May', 'Jun'];
  var YEAR_LABELS  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // ── Bar chart data builder ──
  function buildBarData() {
    if ($scope.period === 'week') {
      var tasksSeed = [0, 0, 0, 0, 0, 0, 0];
      var pomSeed   = [0, 0, 0, 0, 0, 0, 0];
      $scope.dailyTicks.forEach(function(d, i) { tasksSeed[i] = d.doneCount; });
      var pomMap = {};
      AppService.pomLog.forEach(function(e) { pomMap[e.day] = (pomMap[e.day] || 0) + 1; });
      DAY_KEYS.forEach(function(d, i) { if (pomMap[d]) pomSeed[i] = pomMap[d]; });
      return { labels: DAY_LABELS, pom: pomSeed, tasks: tasksSeed };
    }
    if ($scope.period === 'month') {
      return { labels: MONTH_LABELS, pom: [0, 0, 0, 0], tasks: [0, 0, 0, 0] };
    }
    return { labels: YEAR_LABELS, pom: new Array(12).fill(0), tasks: new Array(12).fill(0) };
  }

  function updateBarChart() {
    if (!barChart) return;
    var bd = buildBarData();
    barChart.data.labels           = bd.labels;
    barChart.data.datasets[0].data = bd.pom;
    barChart.data.datasets[1].data = bd.tasks;
    barChart.update();
  }

  // ── Donut chart ──
  function buildDonutData() {
    var map  = {};
    AppService.tasks.forEach(function(t) {
      var c = t.category || 'Other';
      map[c] = (map[c] || 0) + 1;
    });
    var keys = Object.keys(map).length ? Object.keys(map) : ['Work', 'Health', 'Creative'];
    return {
      labels: keys,
      data  : keys.map(function(k) { return map[k] || 1; }),
      colors: keys.map(function(k) { return CAT_COLORS[k] || '#9ca3af'; })
    };
  }

  function updateDonutChart() {
    if (!donutChart) return;
    var dd = buildDonutData();
    donutChart.data.labels                      = dd.labels;
    donutChart.data.datasets[0].data            = dd.data;
    donutChart.data.datasets[0].backgroundColor = dd.colors;
    donutChart.update();
    buildCategoryLegend();
  }

  // ── Line chart ──
  function getLineLabels() {
    return { week: WEEK_LABELS, month: MONTH_LABELS, all: YEAR_LABELS }[$scope.period];
  }

  function updateLineChart() {
    if (!lineChart) return;
    var labels = getLineLabels();
    var data   = new Array(labels.length).fill(0);
    var extra  = AppService.tasks.filter(function(t) { return t.completed; }).length * 50
               + AppService.pomLog.length * 30;
    if (data.length) data[data.length - 1] += extra;
    lineChart.data.labels           = labels;
    lineChart.data.datasets[0].data = data;
    lineChart.update();
  }

  // ── Scatter chart ──
  function buildScatterData() {
    var tasks = AppService.tasks;
    if (!tasks.length) return [{ x: 0, y: 0 }];
    return tasks.map(function(t) { return { x: (t.pomodoros || 1) * 25, y: t.done || 0 }; });
  }

  function updateScatterChart() {
    if (!scatterChart) return;
    scatterChart.data.datasets[0].data = buildScatterData();
    scatterChart.update();
  }

  // ── Init all 4 charts ──
  function initCharts() {
    var barCtx = document.getElementById('anBarChart');
    if (barCtx && !barChart) {
      var bd = buildBarData();
      barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels  : bd.labels,
          datasets: [
            { label: 'Pomodoros', data: bd.pom,   backgroundColor: '#8b5cf6', borderRadius: 6, barPercentage: 0.5 },
            { label: 'Tasks done',data: bd.tasks, backgroundColor: '#06b6d4', borderRadius: 6, barPercentage: 0.5 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tipOpts },
          scales : {
            x: { grid: { display: false },              ticks: { color: '#9ca3af', font: { size: 11 } } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' },  ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } }
          }
        }
      });
    }

    var donutCtx = document.getElementById('anDonutChart');
    if (donutCtx && !donutChart) {
      var dd = buildDonutData();
      donutChart = new Chart(donutCtx, {
        type: 'doughnut',
        data: { labels: dd.labels, datasets: [{ data: dd.data, backgroundColor: dd.colors, borderWidth: 0, hoverOffset: 5 }] },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: { legend: { display: false }, tooltip: tipOpts }
        }
      });
      buildCategoryLegend();
    }

    var lineCtx = document.getElementById('anLineChart');
    if (lineCtx && !lineChart) {
      lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels  : WEEK_LABELS,
          datasets: [{
            label: 'Score', data: new Array(WEEK_LABELS.length).fill(0),
            borderColor: '#000c31', backgroundColor: 'rgba(0,12,49,0.08)',
            fill: true, tension: 0.4, pointRadius: 5,
            pointBackgroundColor: '#000c31', pointBorderColor: '#fff', pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tipOpts },
          scales : {
            x: { grid: { display: false },             ticks: { color: '#9ca3af', font: { size: 11 } } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } }
          }
        }
      });
    }

    var scatterCtx = document.getElementById('anScatterChart');
    if (scatterCtx && !scatterChart) {
      scatterChart = new Chart(scatterCtx, {
        type: 'scatter',
        data: { datasets: [{ label: 'Focus min vs done', data: buildScatterData(), backgroundColor: '#f43f5e', pointRadius: 7, pointHoverRadius: 10 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tipOpts },
          scales : {
            x: { title: { display: true, text: 'Focus minutes',   color: '#9ca3af', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
            y: { title: { display: true, text: 'Pomodoros done',  color: '#9ca3af', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } }
          }
        }
      });
    }
  }

  // ── Refresh all charts and metrics at once ──
  function refreshAll() {
    syncTicksFromTasks();
    refreshMetrics();
    buildCategoryLegend();
    updateBarChart();
    updateDonutChart();
    updateLineChart();
    updateScatterChart();
  }

  // Re-render when a new pomodoro is logged
  AppService.onPomLog(function() {
    $scope.$applyAsync(function() {
      $scope.heatGrid = AppService.heatGrid;
      refreshAll();
    });
  });

  // Init charts after 400ms (wait for DOM), then poll every 5s
  $timeout(function() {
    initCharts();
    refreshAll();
    var poll = $interval(function() { refreshAll(); }, 5000);
    $scope.$on('$destroy', function() { $interval.cancel(poll); });
  }, 400);

}]);
