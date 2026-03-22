

app.controller('ProgressCtrl', ['$scope', '$timeout', '$interval', 'AppService',
function ($scope, $timeout, $interval, AppService) {

    // ── live data helpers ──
    function sessions()    { return AppService.timerState.sessions || 0; }
    function doneTasks()   { return AppService.tasks.filter(function(t){ return t.completed; }).length; }
    function highPriDone() { return AppService.tasks.filter(function(t){ return t.completed && t.priority==='High'; }).length; }
    function workDone()    { return AppService.tasks.filter(function(t){ return t.completed && t.category==='Work'; }).length; }

    // ── BADGES ──
    $scope.badges = [
        {
            id:'lift_off', icon:'🚀', name:'Lift Off',
            desc:'You completed your very first Pomodoro session!',
            rarity:'Common', xp:50, category:'timer', showProgress:true,
            requirement:'Complete 1 Pomodoro session',
            unlocked:false, isNew:false,
            condition: function(){ return sessions()>=1; },
            progress:  function(){ return Math.min(sessions()/1,1); }
        },
        {
            id:'triple_threat', icon:'🔥', name:'Triple Threat',
            desc:'3 sessions done. You are building a real habit!',
            rarity:'Common', xp:100, category:'timer', showProgress:true,
            requirement:'Complete 3 Pomodoro sessions',
            unlocked:false, isNew:false,
            condition: function(){ return sessions()>=3; },
            progress:  function(){ return Math.min(sessions()/3,1); }
        },
        {
            id:'focus_master', icon:'⚡', name:'Focus Master',
            desc:'10 sessions completed. Your concentration is remarkable.',
            rarity:'Rare', xp:250, category:'timer', showProgress:true,
            requirement:'Complete 10 Pomodoro sessions',
            unlocked:false, isNew:false,
            condition: function(){ return sessions()>=10; },
            progress:  function(){ return Math.min(sessions()/10,1); }
        },
        {
            id:'iron_mind', icon:'🧠', name:'Iron Mind',
            desc:'25 sessions and still going. Nothing breaks your focus.',
            rarity:'Epic', xp:600, category:'timer', showProgress:true,
            requirement:'Complete 25 Pomodoro sessions',
            unlocked:false, isNew:false,
            condition: function(){ return sessions()>=25; },
            progress:  function(){ return Math.min(sessions()/25,1); }
        },
        {
            id:'first_win', icon:'🎯', name:'First Win',
            desc:'First task completed. Every legend starts somewhere!',
            rarity:'Common', xp:75, category:'tasks', showProgress:true,
            requirement:'Complete 1 task',
            unlocked:false, isNew:false,
            condition: function(){ return doneTasks()>=1; },
            progress:  function(){ return Math.min(doneTasks()/1,1); }
        },
        {
            id:'task_crusher', icon:'💪', name:'Task Crusher',
            desc:'5 tasks done. You are crushing your to-do list!',
            rarity:'Rare', xp:200, category:'tasks', showProgress:true,
            requirement:'Complete 5 tasks',
            unlocked:false, isNew:false,
            condition: function(){ return doneTasks()>=5; },
            progress:  function(){ return Math.min(doneTasks()/5,1); }
        },
        {
            id:'priority_slayer', icon:'🔴', name:'Priority Slayer',
            desc:'3 high-priority tasks done. No procrastination here!',
            rarity:'Epic', xp:350, category:'tasks', showProgress:true,
            requirement:'Complete 3 High priority tasks',
            unlocked:false, isNew:false,
            condition: function(){ return highPriDone()>=3; },
            progress:  function(){ return Math.min(highPriDone()/3,1); }
        },
        {
            id:'double_duty', icon:'⚙️', name:'Double Duty',
            desc:'Both a session and a task done. Timer + Tasks = power combo!',
            rarity:'Common', xp:100, category:'combo', showProgress:true,
            requirement:'Complete 1 session + 1 task',
            unlocked:false, isNew:false,
            condition: function(){ return sessions()>=1 && doneTasks()>=1; },
            progress:  function(){ return ((sessions()>=1?1:0)+(doneTasks()>=1?1:0))/2; }
        },
        {
            id:'pomodoro_pro', icon:'🍅', name:'Pomodoro Pro',
            desc:'5 sessions AND 5 tasks. You are the definition of productive.',
            rarity:'Epic', xp:400, category:'combo', showProgress:true,
            requirement:'Complete 5 sessions + 5 tasks',
            unlocked:false, isNew:false,
            condition: function(){ return sessions()>=5 && doneTasks()>=5; },
            progress:  function(){ return (Math.min(sessions()/5,1)+Math.min(doneTasks()/5,1))/2; }
        },
        {
            id:'early_bird', icon:'🌅', name:'Early Bird',
            desc:'Started a session before 8 AM. Dawn belongs to the disciplined.',
            rarity:'Rare', xp:180, category:'special', showProgress:false,
            requirement:'Start a session before 8:00 AM',
            unlocked:false, isNew:false,
            condition: function(){ return !!AppService._earlyBird; },
            progress:  function(){ return AppService._earlyBird?1:0; }
        },
        {
            id:'night_owl', icon:'🌙', name:'Night Owl',
            desc:'Working after 11 PM. The night is your canvas.',
            rarity:'Rare', xp:180, category:'special', showProgress:false,
            requirement:'Start a session after 11:00 PM',
            unlocked:false, isNew:false,
            condition: function(){ return !!AppService._nightOwl; },
            progress:  function(){ return AppService._nightOwl?1:0; }
        },
        {
            id:'legendary_grinder', icon:'👑', name:'Legendary Grinder',
            desc:'20 sessions + 10 tasks. You are an absolute force.',
            rarity:'Legendary', xp:2000, category:'combo', showProgress:true,
            requirement:'Complete 20 sessions AND 10 tasks',
            unlocked:false, isNew:false,
            condition: function(){ return sessions()>=20 && doneTasks()>=10; },
            progress:  function(){ return (Math.min(sessions()/20,1)+Math.min(doneTasks()/10,1))/2; }
        }
    ];

    // ── AWARDS ──
    $scope.awards = [
        { icon:'🎖️', name:'First Session',  desc:'Completed 1st Pomodoro',       earned:false, check:function(){ return sessions()>=1; } },
        { icon:'📋', name:'Task Master',    desc:'Completed 5 tasks',             earned:false, check:function(){ return doneTasks()>=5; } },
        { icon:'⏱️', name:'Time Keeper',   desc:'Ran 10 Pomodoro sessions',      earned:false, check:function(){ return sessions()>=10; } },
        { icon:'🌟', name:'Daily Hero',     desc:'Session + task done together',  earned:false, check:function(){ return sessions()>=1 && doneTasks()>=1; } },
        { icon:'🚀', name:'High Flyer',     desc:'3 high-priority tasks done',    earned:false, check:function(){ return highPriDone()>=3; } },
        { icon:'🔥', name:'Streak Keeper',  desc:'2+ day streak maintained',      earned:false, check:function(){ return !!(AppService.stats && AppService.stats.streak>=2); } }
    ];

    // ── FILTERS ──
    $scope.filters = [
        {key:'all',     label:'All'    },
        {key:'timer',   label:'Timer'  },
        {key:'tasks',   label:'Tasks'  },
        {key:'combo',   label:'Combo'  },
        {key:'special', label:'Special'},
        {key:'unlocked',label:'Earned' },
        {key:'locked',  label:'Locked' }
    ];
    $scope.badgeFilter = 'all';

    $scope.filterFn = function(b){
        var f = $scope.badgeFilter;
        if(f==='all')      return true;
        if(f==='unlocked') return b.unlocked;
        if(f==='locked')   return !b.unlocked;
        return b.category===f;
    };

    $scope.badgePct = function(b){ return Math.round(b.progress()*100); };

    // ── XP + LEVEL ──
    $scope.totalXP      = function(){ return $scope.badges.filter(function(b){return b.unlocked;}).reduce(function(s,b){return s+b.xp;},0); };
    $scope.unlockedCount= function(){ return $scope.badges.filter(function(b){return b.unlocked;}).length; };
    $scope.currentLevel = function(){ return Math.floor($scope.totalXP()/500)+1; };
    $scope.nextLevelXP  = function(){ return $scope.currentLevel()*500; };
    $scope.xpPercent    = function(){
        var prev=($scope.currentLevel()-1)*500, next=$scope.nextLevelXP();
        return Math.min(Math.max(($scope.totalXP()-prev)/(next-prev)*100,0),100);
    };
    $scope.levelTitle   = function(){
        var t=['Beginner','Apprentice','Focused','Committed','Dedicated','Elite','Champion','Master','Grandmaster','Legend'];
        return t[Math.min($scope.currentLevel()-1,t.length-1)];
    };

    // ── MINI STATS ──
    $scope.miniStats = [
        {icon:'🍅', label:'Sessions',  value:'0'},
        {icon:'✅', label:'Tasks Done', value:'0'},
        {icon:'⏱',  label:'Focus Time', value:'0m'},
        {icon:'🔥', label:'Streak',     value:'0'}
    ];

    function refreshStats(){
        var mins = sessions()*25;
        $scope.miniStats[0].value = String(sessions());
        $scope.miniStats[1].value = String(doneTasks());
        $scope.miniStats[2].value = Math.floor(mins/60)>0 ? Math.floor(mins/60)+'h '+(mins%60)+'m' : mins+'m';
        $scope.miniStats[3].value = String((AppService.stats && AppService.stats.streak)||0);
    }

    // ── TOAST ──
    $scope.toast = {visible:false, icon:'', name:'', xp:0};

    function showToast(b){
        $scope.toast = {visible:true, icon:b.icon, name:b.name, xp:b.xp};
        $timeout(function(){ $scope.toast.visible=false; },3200);
    }

    // ── MODAL ──
    $scope.modal = {open:false, badge:{}};
    $scope.openModal  = function(b){ b.isNew=false; $scope.modal={open:true, badge:b}; };
    $scope.closeModal = function(){ $scope.modal.open=false; };

    // ── CHECK BADGES & AWARDS ──
    function checkAll(){
        refreshStats();
        $scope.badges.forEach(function(b){
            if(!b.unlocked && b.condition()){
                b.unlocked=true; b.isNew=true;
                showToast(b);
            }
        });
        $scope.awards.forEach(function(a){ a.earned=a.check(); });
    }

    // subscribe to pomodoro events
    if(AppService.onPomLog) AppService.onPomLog(function(){ $scope.$applyAsync(checkAll); });

    // watch task completions
    $scope.$watch(function(){
        return AppService.tasks.map(function(t){return t.completed;}).join(',');
    }, function(n,o){ if(n!==o) checkAll(); });

    // boot + poll
    $timeout(function(){
        checkAll();
        var poll=$interval(checkAll,3000);
        $scope.$on('$destroy',function(){ $interval.cancel(poll); });
    },300);
}]);


// ── Extend AppService with time-of-day flags (safe to call multiple times) ──
app.run(['AppService', function(AppService){
    if(!AppService._earlyBird) AppService._earlyBird = false;
    if(!AppService._nightOwl)  AppService._nightOwl  = false;
    if(!AppService.timerState._breaks) AppService.timerState._breaks = 0;
}]);


// ── Final TimerCtrl — writes time-of-day flags + all previous features ──
app.controller('TimerCtrl', ['$scope','$interval','$timeout','AppService',
function($scope,$interval,$timeout,AppService){

    $scope.t     = AppService.timerState;
    $scope.tasks = AppService.tasks;
    $scope.stats = AppService.stats;

    var DAY_KEYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var HEAT_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    function tick(){
        var t=AppService.timerState;
        if(t.timeLeft>0){
            t.timeLeft--;
            AppService.updateDisplay();
            var active=AppService.activeTask();
            if(active && t.mode==='pomodoro'){
                if(!active._secThisSession) active._secThisSession=0;
                active._secThisSession++;
                active._progress=Math.round(active._secThisSession/t.totalTime*100);
            }
        } else {
            t.running=false;
            $interval.cancel(AppService._timerInterval);
            AppService._timerInterval=null;

            if(t.mode==='pomodoro'){
                t.sessions++;
                AppService.stats.dailyScore+=50;

                var hour=new Date().getHours();
                if(hour<8)   AppService._earlyBird=true;
                if(hour>=23) AppService._nightOwl=true;

                AppService.refreshStreak && AppService.refreshStreak();

                var active=AppService.activeTask();
                if(active){
                    active.done=Math.min((active.done||0)+1,active.pomodoros);
                    active._secThisSession=0;
                    active._progress=Math.round(active.done/active.pomodoros*100);
                    if(active.done>=active.pomodoros) active.completed=true;
                }

                var now=new Date(), dayStr=DAY_KEYS[now.getDay()];
                if(AppService.logPomodoro){
                    AppService.logPomodoro({
                        day:dayStr, hour:hour,
                        category:(active&&active.category)?active.category:'Work',
                        focusMins:Math.round(t.totalTime/60)
                    });
                }
                var di=HEAT_DAYS.indexOf(dayStr), hi=hour-9;
                if(AppService.heatGrid&&di>=0&&hi>=0&&hi<10) AppService.heatGrid[hi][di]++;

                alert('🍅 Pomodoro done! Take a break.');
            } else {
                AppService.timerState._breaks=(AppService.timerState._breaks||0)+1;
                alert('⏰ Break over! Back to focus.');
            }
        }
    }

    $scope.start=function(){
        var t=AppService.timerState;
        if(t.running) return;
        t.running=true;
        if(t.activeTaskIndex===-1){
            var idx=AppService.tasks.findIndex(function(tk){return !tk.completed;});
            if(idx>=0) t.activeTaskIndex=idx;
        }
        AppService._timerInterval=$interval(tick,1000);
    };
    $scope.pause=function(){
        AppService.timerState.running=false;
        if(AppService._timerInterval){$interval.cancel(AppService._timerInterval); AppService._timerInterval=null;}
    };
    $scope.reset=function(){
        $scope.pause();
        var t=AppService.timerState;
        t.timeLeft=t.totalTime;
        AppService.updateDisplay();
    };
    $scope.setMode=function(mode){
        $scope.pause();
        var t=AppService.timerState;
        t.mode=mode; t.totalTime=AppService.MODE_TIMES[mode]; t.timeLeft=t.totalTime;
        AppService.updateDisplay();
    };
    $scope.setActiveTask=function(i){ AppService.timerState.activeTaskIndex=i; };
    $scope.isActive  =function(i){ return AppService.timerState.activeTaskIndex===i; };
    $scope.activeTask=function(){ return AppService.activeTask(); };
    $scope.completedCount=function(){ return AppService.completedCount(); };
    $scope.totalTasks    =function(){ return AppService.tasks.length; };
    $scope.completionPct =function(){ return AppService.completionPct(); };

    $timeout(function(){
        if(window.gsap&&!AppService._gsapDone){
            AppService._gsapDone=true;
            try{
                if(document.querySelector('.lefthead h1')){
                    var tl=gsap.timeline();
                    tl.from('.lefthead h1',{x:-50,duration:1.2,opacity:0});
                    tl.from('.righthead p',{x:50,duration:1.2,opacity:0},'-=0.8');
                    tl.from('.lefthead p',{y:20,duration:1,opacity:0},'-=0.6');
                }
                if(window.ScrollTrigger){
                    ScrollTrigger.refresh();
                    if(document.querySelector('.keep'))
                        gsap.from('.ks .keep',{y:50,opacity:0,duration:0.8,scrollTrigger:{trigger:'.keep',scroller:'body',start:'top 70%'}});
                    if(document.querySelector('.box'))
                        gsap.from('.box',{y:50,opacity:0,duration:1,stagger:0.3,scrollTrigger:{trigger:'.keep',scroller:'body',start:'top 60%'}});
                }
            }catch(e){}
        }
    },200);

    $scope.$on('$destroy',function(){/* keep timer alive */});
}]);