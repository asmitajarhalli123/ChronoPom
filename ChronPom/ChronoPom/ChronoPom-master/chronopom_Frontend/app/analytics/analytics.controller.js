// ============================================================
//  FILE: app/analytics/analytics.controller.js
//  PURPOSE: AnalyticsCtrl — powers all four Chart.js charts
//           (bar, donut, line, scatter), the daily tick grid,
//           the focus heatmap, metric cards, and the task
//           breakdown table on the analytics page.
//  USED IN: app/analytics/analytics.view.html  →  ng-controller="AnalyticsCtrl"
//  DEPENDS ON: AppService (tasks, pomLog, heatGrid)
//  LIBRARY: Chart.js 4 (loaded via CDN in index.html)
// ============================================================

app.controller('AnalyticsCtrl', ['$scope', '$timeout', '$interval', 'AppService',
function ($scope, $timeout, $interval, AppService) {

  // ── LIVE TASK REFERENCE ──────────────────────────────────
  // Same array used by TaskCtrl and TimerCtrl — no copy needed.
  $scope.tasks = AppService.tasks;

  // ── PERIOD TABS ──────────────────────────────────────────
  // Drives the Week / Month / All time filter buttons.
  // setPeriod() is called by ng-click in analytics.view.html.
  $scope.periods = [
    { key: 'week',  label: 'Week'     },
    { key: 'month', label: 'Month'    },
    { key: 'all',   label: 'All time' }
  ];
  $scope.period = 'week';

  $scope.setPeriod = function (key) {
    $scope.period = key;
    updateBarChart();
    updateLineChart();
  };

  // ── METRIC CARDS ─────────────────────────────────────────
  // Four summary tiles at the top of the analytics page.
  // Values are recalculated by refreshMetrics() on every refresh.
  $scope.metrics = [
    { label: 'Total pomodoros', icon: '🍅', value: '0',  up: true,  trend: '0%' },
    { label: 'Focus time',      icon: '⏱',  value: '0m', up: true,  trend: '0%' },
    { label: 'Tasks done',      icon: '✅',  value: '0',  up: true,  trend: '0'  },
    { label: 'Completion',      icon: '📈',  value: '0%', up: false, trend: '0%' }
  ];

  // Recalculates metric card values from live AppService data.
  function refreshMetrics () {
    var tasks     = AppService.tasks;
    var pomsDone  = AppService.pomLog.length; // real sessions logged
    // Fall back to sum of task.done values if pomLog is empty
    var pomCount  = pomsDone || tasks.reduce(function (s, t) { return s + (t.done || 0); }, 0);
    var focusMins = tasks.reduce(function (s, t) { return s + (t.done || 0) * 25; }, 0);
    var done      = tasks.filter(function (t) { return t.completed; }).length;
    var pct       = tasks.length ? Math.round(done / tasks.length * 100) : 0;

    $scope.metrics[0].value = String(pomCount);
    $scope.metrics[1].value = Math.floor(focusMins / 60) + 'h ' + (focusMins % 60) + 'm';
    $scope.metrics[2].value = String(done);
    $scope.metrics[3].value = pct + '%';
    $scope.metrics[3].up    = pct >= 50;
  }

  // ── TASK BREAKDOWN FILTER ────────────────────────────────
  // Drives the filter tabs (All / High / Medium / Work / Health / Creative)
  // and the ng-repeat in the task breakdown table.
  $scope.taskFilter = 'All';

  $scope.filteredTasks = function () {
    var all = AppService.tasks;
    if ($scope.taskFilter === 'All') return all;
    return all.filter(function (t) {
      return t.priority === $scope.taskFilter || t.category === $scope.taskFilter;
    });
  };

  // Returns 0-100 completion % for the mini progress bar in each task row.
  $scope.taskBarPct = function (t) {
    if (!t.pomodoros) return 0;
    return Math.min(100, Math.round((t.done || 0) / t.pomodoros * 100));
  };

  // ── CATEGORY LEGEND (for donut chart) ────────────────────
  // Displayed below the donut chart: Work (3), Health (1), etc.
  $scope.categoryLegend = [];
  var CAT_COLORS = { Work: '#8b5cf6', Health: '#10b981', Creative: '#f59e0b', Other: '#06b6d4' };

  function buildCategoryLegend () {
    var map = {};
    AppService.tasks.forEach(function (t) {
      var c = t.category || 'Other';
      map[c] = (map[c] || 0) + 1;
    });
    $scope.categoryLegend = Object.keys(map).map(function (k) {
      return { name: k, count: map[k], color: CAT_COLORS[k] || '#9ca3af' };
    });
  }

  // ── DAILY TICK GRID ──────────────────────────────────────
  // Seven rows (Mon–Sun), each with 8 tick cells.
  // Ticks can be toggled manually and are auto-filled from
  // today's completed tasks by syncTicksFromTasks().
  var DAY_KEYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  $scope.dailyTicks = DAY_KEYS.map(function (d) {
    return {
      day      : d,
      ticks    : Array.from({ length: 8 }, function () { return { done: false }; }),
      doneCount: 0,
      total    : 8
    };
  });

  // Toggles a single tick cell; updates doneCount and refreshes bar chart.
  $scope.toggleTick = function (dayObj, tick) {
    tick.done        = !tick.done;
    dayObj.doneCount = dayObj.ticks.filter(function (t) { return t.done; }).length;
    updateBarChart();
  };

  // Syncs today's tick row to the number of completed tasks
  // so the grid reflects real data without manual input.
  function syncTicksFromTasks () {
    var todayIdx = (new Date().getDay() + 6) % 7; // Mon = 0
    var done     = AppService.tasks.filter(function (t) { return t.completed; }).length;
    var dayObj   = $scope.dailyTicks[todayIdx];
    dayObj.ticks.forEach(function (tick, i) { tick.done = i < done; });
    dayObj.doneCount = Math.min(done, 8);
  }

  // ── HEATMAP ──────────────────────────────────────────────
  // 10 hour-rows × 7 day-cols. The grid lives in AppService
  // so TimerCtrl can update it directly; we keep a reference.
  $scope.heatDays  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  $scope.heatHours = ['9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm'];
  $scope.heatGrid  = AppService.heatGrid; // live reference — same array

  // Returns an rgba background colour scaled by session intensity.
  $scope.heatColor = function (val) {
    var a = val === 0 ? 0.05 : 0.10 + (val / 10) * 0.82;
    return 'rgba(0,12,49,' + a.toFixed(2) + ')';
  };

  // ── CHART INSTANCES ──────────────────────────────────────
  // Stored in closure so update functions can call .update()
  // without re-creating the chart on every data change.
  var barChart, donutChart, lineChart, scatterChart;

  // Shared tooltip style applied to all four charts.
  var tipOpts = {
    backgroundColor: '#fff',
    titleColor     : '#000c31',
    bodyColor      : '#6b7280',
    borderColor    : 'rgba(0,0,0,0.1)',
    borderWidth    : 1,
    cornerRadius   : 8,
    padding        : 10
  };

  // ── BAR CHART: daily pomodoros vs tasks done ─────────────
  // Seed data for Month and All-time periods (static).
  // Week data is overlaid with live tick counts and pomLog.
  var barDatasets = {
    week : { pom: [6,5,8,4,7,5,3],  tasks: [2,1,3,1,3,2,2]  },
    month: { pom: [28,34,30,38],     tasks: [9,11,10,14]      },
    all  : { pom: [110,132,125,148,155,138,160,170,158,180,175,190],
             tasks: [38,45,42,50,54,47,56,60,52,62,60,68]    }
  };
  var barLabels = {
    week : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    month: ['W1','W2','W3','W4'],
    all  : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  };

  // Builds the bar chart dataset for the current period.
  // For 'week' it overlays live tick counts and real pomLog entries.
  function buildBarData () {
    if ($scope.period !== 'week') {
      return {
        labels: barLabels[$scope.period],
        pom   : barDatasets[$scope.period].pom,
        tasks : barDatasets[$scope.period].tasks
      };
    }
    // Overlay today's live tick counts on the seed task data
    var tasksSeed = barDatasets.week.tasks.slice();
    $scope.dailyTicks.forEach(function (d, i) { tasksSeed[i] = d.doneCount; });

    // Overlay real pomodoro log entries on seed pom data
    var pomSeed = barDatasets.week.pom.slice();
    var pomMap  = {};
    AppService.pomLog.forEach(function (e) {
      pomMap[e.day] = (pomMap[e.day] || 0) + 1;
    });
    DAY_KEYS.forEach(function (d, i) { if (pomMap[d]) pomSeed[i] = pomMap[d]; });

    return { labels: barLabels.week, pom: pomSeed, tasks: tasksSeed };
  }

  function updateBarChart () {
    if (!barChart) return;
    var bd = buildBarData();
    barChart.data.labels           = bd.labels;
    barChart.data.datasets[0].data = bd.pom;
    barChart.data.datasets[1].data = bd.tasks;
    barChart.update();
  }

  // ── DONUT CHART: tasks by category ───────────────────────
  // Slice count = number of tasks per category.
  function buildDonutData () {
    var map = {};
    AppService.tasks.forEach(function (t) {
      var c = t.category || 'Other';
      map[c] = (map[c] || 0) + 1;
    });
    // Fallback to default slices when no tasks exist yet
    var keys = Object.keys(map).length ? Object.keys(map) : ['Work','Health','Creative'];
    return {
      labels: keys,
      data  : keys.map(function (k) { return map[k] || 1; }),
      colors: keys.map(function (k) { return CAT_COLORS[k] || '#9ca3af'; })
    };
  }

  function updateDonutChart () {
    if (!donutChart) return;
    var dd = buildDonutData();
    donutChart.data.labels                        = dd.labels;
    donutChart.data.datasets[0].data              = dd.data;
    donutChart.data.datasets[0].backgroundColor   = dd.colors;
    donutChart.update();
    buildCategoryLegend();
  }

  // ── LINE CHART: weekly score trend ───────────────────────
  // Seed data for each period. The last data point is boosted
  // by live completed tasks and real pomLog entries.
  var lineDatasets = {
    week : [650,720,880,1050,980,1300],
    month: [2800,3100,3500,4200],
    all  : [12000,14000,13500,15500,16200,17800,16900,18500,17200,19800,19100,21000]
  };
  var lineLabels = {
    week : ['W1','W2','W3','W4','W5','W6'],
    month: ['Mar','Apr','May','Jun'],
    all  : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  };

  function updateLineChart () {
    if (!lineChart) return;
    var base  = lineDatasets[$scope.period].slice();
    // Boost the latest data point with real activity
    var extra = AppService.tasks.filter(function (t) { return t.completed; }).length * 50
              + AppService.pomLog.length * 30;
    base[base.length - 1] += extra;
    lineChart.data.labels           = lineLabels[$scope.period];
    lineChart.data.datasets[0].data = base;
    lineChart.update();
  }

  // ── SCATTER CHART: focus time vs pomodoros done ──────────
  // Each point is one task: x = estimated focus minutes,
  // y = pomodoros completed. Fallback to sample points when empty.
  function buildScatterData () {
    var tasks = AppService.tasks;
    if (!tasks.length) {
      return [{x:5,y:7},{x:10,y:15},{x:15,y:10},
              {x:20,y:25},{x:8,y:12},{x:25,y:30},{x:12,y:18}];
    }
    return tasks.map(function (t) {
      return { x: (t.pomodoros || 1) * 25, y: t.done || 0 };
    });
  }

  function updateScatterChart () {
    if (!scatterChart) return;
    scatterChart.data.datasets[0].data = buildScatterData();
    scatterChart.update();
  }

  // ── INIT ALL CHARTS ──────────────────────────────────────
  // Creates the four Chart.js instances once the DOM elements
  // are available. Guards with if (!barChart) etc. to prevent
  // duplicate creation on re-entry to the route.
  function initCharts () {
    // Bar chart — canvas id="anBarChart"
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
          scales: {
            x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } }
          }
        }
      });
    }

    // Donut chart — canvas id="anDonutChart"
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

    // Line chart — canvas id="anLineChart"
    var lineCtx = document.getElementById('anLineChart');
    if (lineCtx && !lineChart) {
      lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels  : lineLabels.week,
          datasets: [{
            label              : 'Score',
            data               : lineDatasets.week,
            borderColor        : '#000c31',
            backgroundColor    : 'rgba(0,12,49,0.08)',
            fill               : true,
            tension            : 0.4,
            pointRadius        : 5,
            pointBackgroundColor: '#000c31',
            pointBorderColor   : '#fff',
            pointBorderWidth   : 2
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tipOpts },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 11 } } },
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } }
          }
        }
      });
    }

    // Scatter chart — canvas id="anScatterChart"
    var scatterCtx = document.getElementById('anScatterChart');
    if (scatterCtx && !scatterChart) {
      scatterChart = new Chart(scatterCtx, {
        type: 'scatter',
        data: { datasets: [{ label: 'Focus min vs done', data: buildScatterData(), backgroundColor: '#f43f5e', pointRadius: 7, pointHoverRadius: 10 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tipOpts },
          scales: {
            x: { title: { display: true, text: 'Focus minutes',   color: '#9ca3af', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } },
            y: { title: { display: true, text: 'Pomodoros done',  color: '#9ca3af', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false } }
          }
        }
      });
    }
  }

  // ── FULL REFRESH ─────────────────────────────────────────
  // Called on boot, on every pomLog event, and on a 5s poll.
  function refreshAll () {
    syncTicksFromTasks();   // keep today's tick row in sync
    refreshMetrics();       // update the four stat cards
    buildCategoryLegend();  // rebuild legend below donut
    updateBarChart();
    updateDonutChart();
    updateLineChart();
    updateScatterChart();
  }

  // ── SUBSCRIBE TO POMODORO EVENTS ─────────────────────────
  // When TimerCtrl calls AppService.logPomodoro(), this fires
  // and re-syncs the heatGrid reference + refreshes all charts.
  AppService.onPomLog(function () {
    $scope.$applyAsync(function () {
      $scope.heatGrid = AppService.heatGrid; // re-sync in case reference changed
      refreshAll();
    });
  });

  // ── BOOT ─────────────────────────────────────────────────
  // Wait 400ms for the DOM (canvases) to be ready before
  // initialising charts. Then poll every 5s so task-completion
  // changes made on other pages are reflected here.
  $timeout(function () {
    initCharts();
    refreshAll();
    var poll = $interval(function () { refreshAll(); }, 5000);
    // Cancel the poll when the user navigates away from this page
    $scope.$on('$destroy', function () { $interval.cancel(poll); });
  }, 400);

}]);
