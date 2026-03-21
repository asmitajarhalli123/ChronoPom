// ============================================================
//  CHRONOPOM — addon_connect.js
//  DROP-IN CONNECTION FILE
//  Paste this entire file at the BOTTOM of your app.js,
//  after all your existing code.
//
//  What it does:
//    1. Upgrades AppService to track pomodoro logs & stats
//    2. Rewires AnalyticsCtrl to read directly from AppService
//       (no more $rootScope dependency)
//    3. Patches TimerCtrl's tick() to emit into PomLog +
//       update heatmap, streak and daily score
//    4. Patches TaskCtrl to fire analytics refresh on every
//       task add / delete / completion toggle
// ============================================================


// ── 1. EXTEND AppService with analytics data ─────────────────
//    We decorate the existing service rather than redefine it.

app.run(['AppService', function (AppService) {

    // Pomodoro log — each entry: { day, hour, category, focusMins }
    if (!AppService.pomLog)       AppService.pomLog       = [];
    if (!AppService._anListeners) AppService._anListeners = [];

    // Heatmap grid: 10 hour-rows × 7 day-cols
    if (!AppService.heatGrid) {
        AppService.heatGrid = [
            [5,7,8,4,3,1,0],[6,9,9,5,7,2,0],[8,9,10,6,8,2,0],[4,5,8,3,6,1,0],
            [3,4,6,7,9,1,0],[2,3,4,5,5,0,0],[1,2,3,3,4,1,0],[0,1,2,2,3,0,0],
            [0,0,1,1,2,0,0],[0,0,0,1,1,0,0]
        ];
    }

    // Pub/sub so AnalyticsCtrl can react to pomodoro completion
    AppService.logPomodoro = function (entry) {
        AppService.pomLog.push(entry);
        AppService._anListeners.forEach(function (fn) { fn(); });
    };

    AppService.onPomLog = function (fn) {
        AppService._anListeners.push(fn);
    };

    // streak: simple daily tracking using localStorage
    AppService.refreshStreak = function () {
        var today     = new Date().toDateString();
        var last      = localStorage.getItem('cp_lastDay')  || '';
        var streak    = parseInt(localStorage.getItem('cp_streak') || '0', 10);
        var yesterday = new Date(Date.now() - 86400000).toDateString();

        if (last === today) {
            // already counted today
        } else if (last === yesterday) {
            streak++;
            localStorage.setItem('cp_streak', streak);
            localStorage.setItem('cp_lastDay', today);
        } else {
            streak = 1;
            localStorage.setItem('cp_streak', streak);
            localStorage.setItem('cp_lastDay', today);
        }
        AppService.stats.streak = streak;
    };

    AppService.refreshStreak();
}]);


// ── 2. PATCH TimerCtrl — emit PomLog on session complete ─────
//    We override the controller's completeSession logic by
//    decorating $provide. Since AngularJS doesn't natively
//    support controller decoration, we instead monkey-patch
//    the tick via an app.run block that replaces the stored
//    interval function when TimerCtrl registers it.
//
//    Simpler approach: we hook into AppService._timerInterval
//    by wrapping AppService.logPomodoro inside TimerCtrl itself.
//    The cleanest way: re-declare TimerCtrl with the extra deps.
//    AngularJS allows multiple .controller() calls; the last one wins.

app.controller('TimerCtrl', ['$scope', '$interval', '$timeout', 'AppService',
function ($scope, $interval, $timeout, AppService) {

    // ── bind service state ──
    $scope.t     = AppService.timerState;
    $scope.tasks = AppService.tasks;
    $scope.stats = AppService.stats;

    var DAY_KEYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var HEAT_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    // ── internal tick ──
    function tick () {
        var t = AppService.timerState;
        if (t.timeLeft > 0) {
            t.timeLeft--;
            AppService.updateDisplay();

            // live progress bar on active task
            var active = AppService.activeTask();
            if (active && t.mode === 'pomodoro') {
                if (!active._secThisSession) active._secThisSession = 0;
                active._secThisSession++;
                active._progress = Math.round(active._secThisSession / t.totalTime * 100);
            }
        } else {
            // ── session finished ──
            t.running = false;
            $interval.cancel(AppService._timerInterval);
            AppService._timerInterval = null;

            if (t.mode === 'pomodoro') {
                t.sessions++;
                AppService.stats.dailyScore += 50;
                AppService.refreshStreak();

                // increment active task pomodoros
                var active = AppService.activeTask();
                if (active) {
                    active.done = Math.min((active.done || 0) + 1, active.pomodoros);
                    active._secThisSession = 0;
                    active._progress = Math.round(active.done / active.pomodoros * 100);
                    if (active.done >= active.pomodoros) active.completed = true;
                }

                // ── emit to analytics ──
                var now    = new Date();
                var dayStr = DAY_KEYS[now.getDay()];
                var hour   = now.getHours();
                AppService.logPomodoro({
                    day      : dayStr,
                    hour     : hour,
                    category : (active && active.category) ? active.category : 'Work',
                    focusMins: Math.round(t.totalTime / 60)
                });

                // ── update heatmap in AppService ──
                var di = HEAT_DAYS.indexOf(dayStr);
                var hi = hour - 9;   // 9 am = index 0
                if (di >= 0 && hi >= 0 && hi < 10) {
                    AppService.heatGrid[hi][di]++;
                }

                alert('🍅 Pomodoro done! Take a break.');
            } else {
                alert('⏰ Break over! Back to focus.');
            }
        }
    }

    // ── controls ──
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

    $scope.pause = function () {
        AppService.timerState.running = false;
        if (AppService._timerInterval) {
            $interval.cancel(AppService._timerInterval);
            AppService._timerInterval = null;
        }
    };

    $scope.reset = function () {
        $scope.pause();
        var t = AppService.timerState;
        t.timeLeft = t.totalTime;
        AppService.updateDisplay();
    };

    $scope.setMode = function (mode) {
        $scope.pause();
        var t       = AppService.timerState;
        t.mode      = mode;
        t.totalTime = AppService.MODE_TIMES[mode];
        t.timeLeft  = t.totalTime;
        AppService.updateDisplay();
    };

    $scope.setActiveTask = function (index) {
        AppService.timerState.activeTaskIndex = index;
    };

    $scope.isActive    = function (i) { return AppService.timerState.activeTaskIndex === i; };
    $scope.activeTask  = function ()  { return AppService.activeTask(); };

    $scope.completedCount = function () { return AppService.completedCount(); };
    $scope.totalTasks     = function () { return AppService.tasks.length; };
    $scope.completionPct  = function () { return AppService.completionPct(); };

    // GSAP — run once
    $timeout(function () {
        if (window.gsap && !AppService._gsapDone) {
            AppService._gsapDone = true;
            try {
                if (document.querySelector('.lefthead h1')) {
                    var tl = gsap.timeline();
                    tl.from('.lefthead h1', { x:-50, duration:1.2, opacity:0 });
                    tl.from('.righthead p', { x: 50, duration:1.2, opacity:0 }, '-=0.8');
                    tl.from('.lefthead p',  { y: 20, duration:1.0, opacity:0 }, '-=0.6');
                }
                if (window.ScrollTrigger) {
                    ScrollTrigger.refresh();
                    if (document.querySelector('.keep'))
                        gsap.from('.ks .keep', { y:50, opacity:0, duration:0.8, scrollTrigger:{ trigger:'.keep', scroller:'body', start:'top 70%' }});
                    if (document.querySelector('.box'))
                        gsap.from('.box', { y:50, opacity:0, duration:1, stagger:0.3, scrollTrigger:{ trigger:'.keep', scroller:'body', start:'top 60%' }});
                    if (document.querySelector('.mintext')) {
                        gsap.from('.mintext .min',   { y:-30, opacity:0, duration:1.5, scrollTrigger:{ trigger:'.mintext', scroller:'body', start:'top 60%' }});
                        gsap.from('.mintext .count', { y:-30, opacity:0, duration:1.5, delay:0.4, scrollTrigger:{ trigger:'.mintext', scroller:'body', start:'top 60%' }});
                        gsap.from('.mintext p',      { y:-40, opacity:0, duration:1.5, delay:0.8, scrollTrigger:{ trigger:'.mintext', scroller:'body', start:'top 55%' }});
                    }
                }
            } catch(e) {}
        }
    }, 200);

    $scope.$on('$destroy', function () { /* keep interval running */ });
}]);


// ── 3. PATCH TaskCtrl — trigger analytics refresh on changes ──
//    Re-declare TaskCtrl so it also notifies AppService listeners
//    whenever tasks are mutated.

app.controller('TaskCtrl', ['$scope', '$timeout', 'AppService',
function ($scope, $timeout, AppService) {

    $scope.tasks = AppService.tasks;
    $scope.task  = { name:'', priority:'Medium', category:'Work', pomodoros:1 };
    $scope.showNotification = false;
    $scope.notificationMsg  = '';

    function notifyAnalytics () {
        // fire all analytics listeners so charts refresh immediately
        AppService._anListeners.forEach(function (fn) { fn(); });
    }

    $scope.addTask = function () {
        if (!$scope.task.name || !$scope.task.name.trim()) return;
        AppService.tasks.push({
            name      : $scope.task.name.trim(),
            priority  : $scope.task.priority  || 'Medium',
            category  : $scope.task.category  || 'Work',
            pomodoros : parseInt($scope.task.pomodoros) || 1,
            done      : 0,
            completed : false,
            _progress : 0,
            _secThisSession: 0
        });
        $scope.task = { name:'', priority:'Medium', category:'Work', pomodoros:1 };
        $scope.notify('✅ Task added!');
        notifyAnalytics();
    };

    $scope.deleteTask = function (index) {
        var ai = AppService.timerState.activeTaskIndex;
        if (ai === index)    AppService.timerState.activeTaskIndex = -1;
        else if (ai > index) AppService.timerState.activeTaskIndex--;
        AppService.tasks.splice(index, 1);
        notifyAnalytics();
    };

    $scope.setActive = function (index) {
        AppService.timerState.activeTaskIndex = index;
        $scope.notify('⏱ "' + AppService.tasks[index].name + '" is now active in timer!');
    };

    $scope.isActive  = function (i) { return AppService.timerState.activeTaskIndex === i; };
    $scope.barWidth  = function (t) { return t.pomodoros ? Math.min(100, Math.round((t.done||0)/t.pomodoros*100)) : 0; };

    $scope.pomodoroArray = function (task) {
        var arr = [];
        for (var i = 0; i < task.pomodoros; i++) arr.push({ filled: i < task.done });
        return arr;
    };

    $scope.notify = function (msg) {
        $scope.notificationMsg  = msg;
        $scope.showNotification = true;
        $timeout(function () { $scope.showNotification = false; }, 2500);
    };

    // Watch task completion toggles and push analytics update
    $scope.$watch(function () {
        return AppService.tasks.map(function (t) { return t.completed; }).join(',');
    }, function (newVal, oldVal) {
        if (newVal !== oldVal) notifyAnalytics();
    });
}]);


// ── 4. REWRITE AnalyticsCtrl — reads directly from AppService ─
//    Drops the $rootScope.sharedTasks approach entirely.

app.controller('AnalyticsCtrl', ['$scope', '$timeout', '$interval', 'AppService',
function ($scope, $timeout, $interval, AppService) {

    // ── live reference to shared task array ──
    $scope.tasks = AppService.tasks;

    // ── PERIOD TABS ──
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

    // ── METRIC CARDS ──
    $scope.metrics = [
        { label: 'Total pomodoros', icon: '🍅', value: '0',  up: true,  trend: '0%' },
        { label: 'Focus time',      icon: '⏱',  value: '0m', up: true,  trend: '0%' },
        { label: 'Tasks done',      icon: '✅',  value: '0',  up: true,  trend: '0'  },
        { label: 'Completion',      icon: '📈',  value: '0%', up: false, trend: '0%' }
    ];

    function refreshMetrics () {
        var tasks     = AppService.tasks;
        var pomsDone  = AppService.pomLog.length;
        var focusMins = tasks.reduce(function (s, t) { return s + (t.done || 0) * 25; }, 0);
        var done      = tasks.filter(function (t) { return t.completed; }).length;
        var pct       = tasks.length ? Math.round(done / tasks.length * 100) : 0;

        $scope.metrics[0].value = String(pomsDone || tasks.reduce(function (s,t){ return s+(t.done||0); }, 0));
        $scope.metrics[1].value = Math.floor(focusMins/60) + 'h ' + (focusMins%60) + 'm';
        $scope.metrics[2].value = String(done);
        $scope.metrics[3].value = pct + '%';
        $scope.metrics[3].up    = pct >= 50;
    }

    // ── TASK FILTER ──
    $scope.taskFilter = 'All';

    $scope.filteredTasks = function () {
        var all = AppService.tasks;
        if ($scope.taskFilter === 'All') return all;
        return all.filter(function (t) {
            return t.priority === $scope.taskFilter || t.category === $scope.taskFilter;
        });
    };

    $scope.taskBarPct = function (t) {
        if (!t.pomodoros) return 0;
        return Math.min(100, Math.round((t.done||0)/t.pomodoros*100));
    };

    // ── CATEGORY LEGEND ──
    $scope.categoryLegend = [];
    var CAT_COLORS = { Work:'#8b5cf6', Health:'#10b981', Creative:'#f59e0b', Other:'#06b6d4' };

    function buildCategoryLegend () {
        var map = {};
        AppService.tasks.forEach(function (t) {
            var c = t.category || 'Other';
            map[c] = (map[c]||0)+1;
        });
        $scope.categoryLegend = Object.keys(map).map(function (k) {
            return { name:k, count:map[k], color: CAT_COLORS[k]||'#9ca3af' };
        });
    }

    // ── DAILY TICKS ──
    var DAY_KEYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    $scope.dailyTicks = DAY_KEYS.map(function (d) {
        return { day:d, ticks: Array.from({length:8}, function(){ return {done:false}; }), doneCount:0, total:8 };
    });

    $scope.toggleTick = function (dayObj, tick) {
        tick.done    = !tick.done;
        dayObj.doneCount = dayObj.ticks.filter(function(t){ return t.done; }).length;
        updateBarChart();
    };

    // Auto-fill today's ticks from real completed tasks
    function syncTicksFromTasks () {
        var todayIdx = (new Date().getDay() + 6) % 7;   // Mon=0
        var done     = AppService.tasks.filter(function (t){ return t.completed; }).length;
        var dayObj   = $scope.dailyTicks[todayIdx];
        dayObj.ticks.forEach(function (tick, i) {
            tick.done = i < done;
        });
        dayObj.doneCount = Math.min(done, 8);
    }

    // ── HEATMAP (reads from AppService.heatGrid) ──
    $scope.heatDays  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    $scope.heatHours = ['9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm'];
    $scope.heatGrid  = AppService.heatGrid;   // live reference — same array

    $scope.heatColor = function (val) {
        var a = val === 0 ? 0.05 : 0.10 + (val/10)*0.82;
        return 'rgba(0,12,49,' + a.toFixed(2) + ')';
    };

    // ── CHART REFS ──
    var barChart, donutChart, lineChart, scatterChart;

    // ── BAR CHART ──
    var barDatasets = {
        week : { pom:[6,5,8,4,7,5,3],  tasks:[2,1,3,1,3,2,2]  },
        month: { pom:[28,34,30,38],     tasks:[9,11,10,14]      },
        all  : { pom:[110,132,125,148,155,138,160,170,158,180,175,190],
                 tasks:[38,45,42,50,54,47,56,60,52,62,60,68]    }
    };
    var barLabels = {
        week : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        month: ['W1','W2','W3','W4'],
        all  : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    };

    function buildBarData () {
        if ($scope.period !== 'week') {
            return { labels: barLabels[$scope.period], pom: barDatasets[$scope.period].pom, tasks: barDatasets[$scope.period].tasks };
        }
        // overlay live tick counts
        var tasksSeed = barDatasets.week.tasks.slice();
        $scope.dailyTicks.forEach(function (d, i) { tasksSeed[i] = d.doneCount; });

        // overlay real PomLog
        var pomSeed = barDatasets.week.pom.slice();
        var pomMap  = {};
        AppService.pomLog.forEach(function (e) {
            pomMap[e.day] = (pomMap[e.day]||0)+1;
        });
        DAY_KEYS.forEach(function (d, i) { if (pomMap[d]) pomSeed[i] = pomMap[d]; });

        return { labels: barLabels.week, pom: pomSeed, tasks: tasksSeed };
    }

    function updateBarChart () {
        if (!barChart) return;
        var bd = buildBarData();
        barChart.data.labels             = bd.labels;
        barChart.data.datasets[0].data   = bd.pom;
        barChart.data.datasets[1].data   = bd.tasks;
        barChart.update();
    }

    // ── DONUT CHART ──
    function buildDonutData () {
        var map = {};
        AppService.tasks.forEach(function (t) {
            var c = t.category||'Other';
            map[c] = (map[c]||0)+1;
        });
        var keys = Object.keys(map).length ? Object.keys(map) : ['Work','Health','Creative'];
        return {
            labels : keys,
            data   : keys.map(function(k){ return map[k]||1; }),
            colors : keys.map(function(k){ return CAT_COLORS[k]||'#9ca3af'; })
        };
    }

    function updateDonutChart () {
        if (!donutChart) return;
        var dd = buildDonutData();
        donutChart.data.labels           = dd.labels;
        donutChart.data.datasets[0].data = dd.data;
        donutChart.data.datasets[0].backgroundColor = dd.colors;
        donutChart.update();
        buildCategoryLegend();
    }

    // ── LINE CHART ──
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
        var extra = AppService.tasks.filter(function(t){ return t.completed; }).length * 50
                    + AppService.pomLog.length * 30;
        base[base.length-1] += extra;
        lineChart.data.labels           = lineLabels[$scope.period];
        lineChart.data.datasets[0].data = base;
        lineChart.update();
    }

    // ── SCATTER CHART ──
    function buildScatterData () {
        var tasks = AppService.tasks;
        if (!tasks.length) return [{x:5,y:7},{x:10,y:15},{x:15,y:10},{x:20,y:25},{x:8,y:12},{x:25,y:30},{x:12,y:18}];
        return tasks.map(function (t) { return { x:(t.pomodoros||1)*25, y:t.done||0 }; });
    }

    function updateScatterChart () {
        if (!scatterChart) return;
        scatterChart.data.datasets[0].data = buildScatterData();
        scatterChart.update();
    }

    // ── TOOLTIP OPTIONS ──
    var tipOpts = {
        backgroundColor:'#fff', titleColor:'#000c31', bodyColor:'#6b7280',
        borderColor:'rgba(0,0,0,0.1)', borderWidth:1, cornerRadius:8, padding:10
    };

    // ── INIT ALL CHARTS ──
    function initCharts () {
        var barCtx = document.getElementById('anBarChart');
        if (barCtx && !barChart) {
            var bd = buildBarData();
            barChart = new Chart(barCtx, {
                type:'bar',
                data:{
                    labels: bd.labels,
                    datasets:[
                        { label:'Pomodoros', data:bd.pom,   backgroundColor:'#8b5cf6', borderRadius:6, barPercentage:0.5 },
                        { label:'Tasks done',data:bd.tasks, backgroundColor:'#06b6d4', borderRadius:6, barPercentage:0.5 }
                    ]
                },
                options:{ responsive:true, maintainAspectRatio:false,
                    plugins:{ legend:{display:false}, tooltip:tipOpts },
                    scales:{
                        x:{ grid:{display:false}, ticks:{color:'#9ca3af',font:{size:11}} },
                        y:{ grid:{color:'rgba(0,0,0,0.05)'}, ticks:{color:'#9ca3af',font:{size:11}}, border:{display:false} }
                    }
                }
            });
        }

        var donutCtx = document.getElementById('anDonutChart');
        if (donutCtx && !donutChart) {
            var dd = buildDonutData();
            donutChart = new Chart(donutCtx, {
                type:'doughnut',
                data:{ labels:dd.labels, datasets:[{ data:dd.data, backgroundColor:dd.colors, borderWidth:0, hoverOffset:5 }] },
                options:{ responsive:true, maintainAspectRatio:false, cutout:'65%',
                    plugins:{ legend:{display:false}, tooltip:tipOpts } }
            });
            buildCategoryLegend();
        }

        var lineCtx = document.getElementById('anLineChart');
        if (lineCtx && !lineChart) {
            lineChart = new Chart(lineCtx, {
                type:'line',
                data:{
                    labels: lineLabels.week,
                    datasets:[{
                        label:'Score', data:lineDatasets.week,
                        borderColor:'#000c31', backgroundColor:'rgba(0,12,49,0.08)',
                        fill:true, tension:0.4, pointRadius:5,
                        pointBackgroundColor:'#000c31', pointBorderColor:'#fff', pointBorderWidth:2
                    }]
                },
                options:{ responsive:true, maintainAspectRatio:false,
                    plugins:{ legend:{display:false}, tooltip:tipOpts },
                    scales:{
                        x:{ grid:{display:false}, ticks:{color:'#9ca3af',font:{size:11}} },
                        y:{ grid:{color:'rgba(0,0,0,0.05)'}, ticks:{color:'#9ca3af',font:{size:11}}, border:{display:false} }
                    }
                }
            });
        }

        var scatterCtx = document.getElementById('anScatterChart');
        if (scatterCtx && !scatterChart) {
            scatterChart = new Chart(scatterCtx, {
                type:'scatter',
                data:{ datasets:[{ label:'Focus min vs done', data:buildScatterData(), backgroundColor:'#f43f5e', pointRadius:7, pointHoverRadius:10 }] },
                options:{ responsive:true, maintainAspectRatio:false,
                    plugins:{ legend:{display:false}, tooltip:tipOpts },
                    scales:{
                        x:{ title:{display:true,text:'Focus minutes',color:'#9ca3af',font:{size:11}}, grid:{color:'rgba(0,0,0,0.05)'}, ticks:{color:'#9ca3af',font:{size:11}}, border:{display:false} },
                        y:{ title:{display:true,text:'Pomodoros done',color:'#9ca3af',font:{size:11}}, grid:{color:'rgba(0,0,0,0.05)'}, ticks:{color:'#9ca3af',font:{size:11}}, border:{display:false} }
                    }
                }
            });
        }
    }

    // ── FULL REFRESH ──
    function refreshAll () {
        syncTicksFromTasks();
        refreshMetrics();
        buildCategoryLegend();
        updateBarChart();
        updateDonutChart();
        updateLineChart();
        updateScatterChart();
    }

    // ── SUBSCRIBE to AppService pomodoro events ──
    AppService.onPomLog(function () {
        $scope.$applyAsync(function () {
            $scope.heatGrid = AppService.heatGrid;  // re-sync reference
            refreshAll();
        });
    });

    // ── BOOT ──
    $timeout(function () {
        initCharts();
        refreshAll();
        // poll every 5 s for task-completion changes while on this page
        var poll = $interval(function () { refreshAll(); }, 5000);
        $scope.$on('$destroy', function () { $interval.cancel(poll); });
    }, 400);

}]);