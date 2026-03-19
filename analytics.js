// ============================================================
//  ANALYTICS CONTROLLER
//  Add this block inside your existing app.js file,
//  alongside your other controllers.
//
//  It reads $scope.tasks (shared via $rootScope) and
//  $scope.pomodoroLog (timer events) so every chart
//  updates the moment a task or pomodoro changes.
// ============================================================


// ── Shared service so timer & tasks can broadcast to analytics ──
app.factory('PomLog', function () {
    var log = [];           // { day:'Mon', category:'Work', focusMins:25 }
    var listeners = [];

    return {
        add: function (entry) {
            log.push(entry);
            listeners.forEach(function (fn) { fn(); });
        },
        getAll: function ()  { return log; },
        onChange: function (fn) { listeners.push(fn); }
    };
});


// ── Patch myctrl to emit to PomLog when a pomodoro finishes ──
//    Find your existing myctrl and add PomLog as dependency,
//    then call PomLog.add() when the timer hits 0.
//    (Snippet shown below — merge into your existing myctrl)
//
//  app.controller('myctrl', function($scope, $interval, $timeout, PomLog) {
//    ...inside the $interval callback where you alert("Timer Finished!"):
//      var activeTask = $scope.tasks && $scope.tasks.length
//                       ? $scope.tasks[$scope.tasks.length - 1]
//                       : null;
//      PomLog.add({
//          day      : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()],
//          category : activeTask ? activeTask.category : 'Work',
//          focusMins: Math.round($scope.totalTime / 60)
//      });
//    ...
//  });


// ── Main analytics controller ──
app.controller('AnalyticsCtrl', ['$scope', '$rootScope', '$timeout', '$interval', 'PomLog',
function ($scope, $rootScope, $timeout, $interval, PomLog) {

    // ── PERIOD TABS ──────────────────────────────────────────
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

    // ── COLOUR PALETTE ───────────────────────────────────────
    var PALETTE = ['#8b5cf6','#06b6d4','#f59e0b','#10b981','#f43f5e','#3b82f6','#e879f9'];

    function color(i) { return PALETTE[i % PALETTE.length]; }

    // ── METRIC CARDS ─────────────────────────────────────────
    $scope.metrics = [
        { label: 'Total pomodoros', icon: '🍅', value: '0',  up: true,  trend: '0%'  },
        { label: 'Focus time',      icon: '⏱',  value: '0m', up: true,  trend: '0%'  },
        { label: 'Tasks done',      icon: '✅',  value: '0',  up: true,  trend: '0'   },
        { label: 'Completion',      icon: '📈',  value: '0%', up: false, trend: '0%'  }
    ];

    function refreshMetrics () {
        var tasks    = $scope.tasks || [];
        var total    = tasks.reduce(function (s, t) { return s + (t.pomodoros || 0); }, 0);
        var done     = tasks.filter(function (t)    { return t.completed; }).length;
        var focusMins = total * 25;

        $scope.metrics[0].value = String(total);
        $scope.metrics[1].value = Math.floor(focusMins / 60) + 'h ' + (focusMins % 60) + 'm';
        $scope.metrics[2].value = String(done);
        $scope.metrics[3].value = tasks.length
            ? Math.round(done / tasks.length * 100) + '%'
            : '0%';
    }

    // ── TASK FILTER + HELPERS ────────────────────────────────
    $scope.taskFilter = 'All';

    $scope.filteredTasks = function () {
        var all    = $scope.tasks || [];
        var filter = $scope.taskFilter;
        if (filter === 'All') return all;
        return all.filter(function (t) {
            return t.priority === filter || t.category === filter;
        });
    };

    $scope.taskBarPct = function (t) {
        if (!t.pomodoros) return 0;
        return Math.min(100, Math.round((t.done || 0) / t.pomodoros * 100));
    };

    // ── CATEGORY LEGEND (for donut) ──────────────────────────
    $scope.categoryLegend = [];

    var CAT_COLORS = { Work: '#8b5cf6', Health: '#10b981', Creative: '#f59e0b', Other: '#06b6d4' };

    function buildCategoryLegend () {
        var map = {};
        ($scope.tasks || []).forEach(function (t) {
            var c = t.category || 'Other';
            map[c] = (map[c] || 0) + 1;
        });
        $scope.categoryLegend = Object.keys(map).map(function (k) {
            return { name: k, count: map[k], color: CAT_COLORS[k] || '#9ca3af' };
        });
    }

    // ── DAILY TICKS ──────────────────────────────────────────
    var DAY_KEYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    $scope.dailyTicks = DAY_KEYS.map(function (d) {
        var ticks = Array.from({ length: 8 }, function () { return { done: false }; });
        return { day: d, ticks: ticks, doneCount: 0, total: 8 };
    });

    $scope.toggleTick = function (dayObj, tick) {
        tick.done = !tick.done;
        dayObj.doneCount = dayObj.ticks.filter(function (t) { return t.done; }).length;
        updateBarChart();
    };

    // ── HEATMAP ──────────────────────────────────────────────
    $scope.heatDays  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    $scope.heatHours = ['9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm'];

    // seed with some sample intensity so the heatmap isn't blank on first load
    $scope.heatGrid = [
        [5,7,8,4,3,1,0],[6,9,9,5,7,2,0],[8,9,10,6,8,2,0],[4,5,8,3,6,1,0],
        [3,4,6,7,9,1,0],[2,3,4,5,5,0,0],[1,2,3,3,4,1,0],[0,1,2,2,3,0,0],
        [0,0,1,1,2,0,0],[0,0,0,1,1,0,0]
    ];

    $scope.heatColor = function (val) {
        var a = val === 0 ? 0.05 : 0.10 + (val / 10) * 0.82;
        return 'rgba(0, 12, 49, ' + a.toFixed(2) + ')';
    };

    // When a pomodoro is logged, bump the current hour/day cell
    PomLog.onChange(function () {
        var log  = PomLog.getAll();
        var last = log[log.length - 1];
        if (!last) return;
        var di = $scope.heatDays.indexOf(last.day);
        var hi = new Date().getHours() - 9;     // 9am = index 0
        if (di >= 0 && hi >= 0 && hi < 10) {
            $scope.heatGrid[hi][di]++;
        }
        $scope.$applyAsync(function () { refreshAll(); });
    });

    // ── CHART REFERENCES ─────────────────────────────────────
    var barChart, donutChart, lineChart, scatterChart;

    // ── BAR CHART: daily pomodoros vs tasks done ──────────────
    var barDatasets = {
        week:  { pom:[6,5,8,4,7,5,3],  tasks:[2,1,3,1,3,2,2]  },
        month: { pom:[28,34,30,38],     tasks:[9,11,10,14]       },
        all:   { pom:[110,132,125,148,155,138,160,170,158,180,175,190],
                 tasks:[38,45,42,50,54,47,56,60,52,62,60,68]     }
    };
    var barLabels = {
        week:  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        month: ['W1','W2','W3','W4'],
        all:   ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    };

    function buildBarData () {
        // Overlay today's live tick counts onto the seed data
        var seed = barDatasets.week.tasks.slice();
        $scope.dailyTicks.forEach(function (d, i) { seed[i] = d.doneCount; });

        var pomSeed = barDatasets.week.pom.slice();
        // Count real pomodoros from PomLog per day
        var pomMap  = {};
        PomLog.getAll().forEach(function (e) {
            pomMap[e.day] = (pomMap[e.day] || 0) + 1;
        });
        DAY_KEYS.forEach(function (d, i) {
            if (pomMap[d]) pomSeed[i] = pomMap[d];
        });

        if ($scope.period !== 'week') {
            return { labels: barLabels[$scope.period], pom: barDatasets[$scope.period].pom, tasks: barDatasets[$scope.period].tasks };
        }
        return { labels: barLabels.week, pom: pomSeed, tasks: seed };
    }

    function updateBarChart () {
        if (!barChart) return;
        var d = buildBarData();
        barChart.data.labels              = d.labels;
        barChart.data.datasets[0].data    = d.pom;
        barChart.data.datasets[1].data    = d.tasks;
        barChart.update();
    }

    // ── DONUT CHART: tasks by category ───────────────────────
    function buildDonutData () {
        var tasks = $scope.tasks || [];
        var map   = {};
        tasks.forEach(function (t) {
            var c = t.category || 'Other';
            map[c] = (map[c] || 0) + 1;
        });
        if (!Object.keys(map).length) {
            map = { Work: 3, Health: 1, Creative: 2 }; // placeholder
        }
        return {
            labels: Object.keys(map),
            data  : Object.values(map),
            colors: Object.keys(map).map(function (k) { return CAT_COLORS[k] || '#9ca3af'; })
        };
    }

    function updateDonutChart () {
        if (!donutChart) return;
        var d = buildDonutData();
        donutChart.data.labels                  = d.labels;
        donutChart.data.datasets[0].data        = d.data;
        donutChart.data.datasets[0].backgroundColor = d.colors;
        donutChart.update();
        buildCategoryLegend();
    }

    // ── LINE CHART: weekly score trend ───────────────────────
    var lineDatasets = {
        week:  [650, 720, 880, 1050, 980, 1300],
        month: [2400, 2900, 2700, 3200],
        all:   [8000, 9100, 10500, 12000, 11400, 13800, 14200, 13600, 15200, 16000, 15500, 17200]
    };
    var lineLabels = {
        week:  ['W1','W2','W3','W4','W5','W6'],
        month: ['Mar','Apr','May','Jun'],
        all:   ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    };

    function updateLineChart () {
        if (!lineChart) return;
        // Add live score from completed tasks
        var base   = lineDatasets[$scope.period].slice();
        var extra  = ($scope.tasks || []).filter(function (t) { return t.completed; }).length * 50;
        base[base.length - 1] += extra;

        lineChart.data.labels           = lineLabels[$scope.period];
        lineChart.data.datasets[0].data = base;
        lineChart.update();
    }

    // ── SCATTER CHART: focus time vs tasks completed ─────────
    function buildScatterData () {
        var tasks = $scope.tasks || [];
        if (!tasks.length) {
            return [
                {x:5,y:7},{x:10,y:15},{x:15,y:10},{x:20,y:25},
                {x:8,y:12},{x:25,y:30},{x:12,y:18}
            ];
        }
        return tasks.map(function (t) {
            return {
                x: (t.pomodoros || 1) * 25,     // focus minutes
                y: t.done || 0                    // sub-pomodoros done
            };
        });
    }

    function updateScatterChart () {
        if (!scatterChart) return;
        scatterChart.data.datasets[0].data = buildScatterData();
        scatterChart.update();
    }

    // ── INIT ALL CHARTS ──────────────────────────────────────
    var tipOpts = {
        backgroundColor: '#fff',
        titleColor: '#000c31',
        bodyColor: '#6b7280',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10
    };

    function initCharts () {
        // BAR
        var barCtx = document.getElementById('anBarChart');
        if (barCtx && !barChart) {
            var bd = buildBarData();
            barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: bd.labels,
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

        // DONUT
        var donutCtx = document.getElementById('anDonutChart');
        if (donutCtx && !donutChart) {
            var dd = buildDonutData();
            donutChart = new Chart(donutCtx, {
                type: 'doughnut',
                data: {
                    labels: dd.labels,
                    datasets: [{ data: dd.data, backgroundColor: dd.colors, borderWidth: 0, hoverOffset: 5 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: { legend: { display: false }, tooltip: tipOpts }
                }
            });
            buildCategoryLegend();
        }

        // LINE
        var lineCtx = document.getElementById('anLineChart');
        if (lineCtx && !lineChart) {
            lineChart = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: lineLabels.week,
                    datasets: [{
                        label: 'Score',
                        data: lineDatasets.week,
                        borderColor: '#000c31',
                        backgroundColor: 'rgba(0,12,49,0.08)',
                        fill: true, tension: 0.4,
                        pointRadius: 5,
                        pointBackgroundColor: '#000c31',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
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

        // SCATTER
        var scatterCtx = document.getElementById('anScatterChart');
        if (scatterCtx && !scatterChart) {
            scatterChart = new Chart(scatterCtx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Focus min vs done',
                        data: buildScatterData(),
                        backgroundColor: '#f43f5e',
                        pointRadius: 7,
                        pointHoverRadius: 10
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: tipOpts },
                    scales: {
                        x: {
                            title: { display: true, text: 'Focus minutes', color: '#9ca3af', font: { size: 11 } },
                            grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false }
                        },
                        y: {
                            title: { display: true, text: 'Pomodoros done', color: '#9ca3af', font: { size: 11 } },
                            grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, border: { display: false }
                        }
                    }
                }
            });
        }
    }

    // ── FULL REFRESH (called whenever tasks change) ──────────
    function refreshAll () {
        refreshMetrics();
        buildCategoryLegend();
        updateBarChart();
        updateDonutChart();
        updateLineChart();
        updateScatterChart();
    }

    // ── WATCH $scope.tasks for any change ───────────────────
    // tasks live on MainController scope; we reach them via $rootScope
    $scope.$watch(
        function () { return $rootScope.sharedTasks; },
        function (newVal) {
            if (newVal) { $scope.tasks = newVal; refreshAll(); }
        },
        true   // deep watch
    );

    // Also watch local scope in case tasks are on same scope
    $scope.$watch('tasks', function (newVal) {
        if (newVal) { refreshAll(); }
    }, true);

    // ── BOOT: init charts after DOM is ready ─────────────────
    $timeout(function () {
        initCharts();
        refreshAll();

        // poll every 5s so live timer pomodoros update charts
        $interval(function () { refreshAll(); }, 5000);
    }, 400);

}]);


// ── PATCH MainController to share tasks via $rootScope ──────
//    Add these two lines inside your existing MainController:
//
//   $scope.$watch('tasks', function(v){ $rootScope.sharedTasks = v; }, true);
//
//    And inject $rootScope:
//   app.controller("MainController", function($scope, $timeout, $rootScope) { ... });