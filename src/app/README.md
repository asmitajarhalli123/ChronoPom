# AngularJS Productivity Tracker with Routing

This application now includes full routing functionality using AngularJS's `ngRoute` module.

## 🚀 What's New

### Routing Implementation
- **Timer Route** (`#!/timer`) - Main timer interface with focus sessions
- **Tasks Route** (`#!/tasks`) - Task management with add/edit/delete functionality
- **Analytics Route** (`#!/analytics`) - Weekly performance charts and insights
- **Progress Route** (`#!/progress`) - Goals tracking and achievements

## 📁 File Structure

```
├── app.html          # Main HTML file with navigation
├── app.js            # AngularJS app configuration and controllers
├── app.css           # Comprehensive styling for all routes
├── timer.html        # Timer page template
├── tasks.html        # Tasks page template
├── analytics.html    # Analytics page template
└── progress.html     # Progress page template
```

## 🔧 Key Changes

### 1. app.html
- Added AngularJS and AngularJS Route CDN links
- Updated navigation links to use routing (`href="#!/timer"`, etc.)
- Added `ng-class` for active route highlighting
- Moved main content to route templates

### 2. app.js
- Added `ngRoute` dependency to the app module
- Configured routes using `$routeProvider`
- Created separate controllers for each route:
  - `TimerController` - Timer logic with start/pause/reset
  - `TasksController` - Task CRUD operations
  - `AnalyticsController` - Weekly data and insights
  - `ProgressController` - Goals and achievements tracking
- Added route change listener for active navigation highlighting

### 3. Template Files
Each route has its own template file with dedicated functionality:
- **timer.html** - Focus timer with live countdown and controls
- **tasks.html** - Full task management system
- **analytics.html** - Visual charts and performance metrics
- **progress.html** - Goals, achievements, and milestones

### 4. app.css
- Complete responsive styling for all routes
- Gradient backgrounds and modern UI elements
- Hover effects and transitions
- Mobile-responsive design

## 🎯 Features

### Timer Page
- 25-minute Pomodoro timer
- Start, pause, and reset controls
- Progress percentage display
- Daily score tracking
- Streak counter

### Tasks Page
- Add new tasks with priority levels (high/medium/low)
- Mark tasks as complete/incomplete
- Delete tasks
- Task statistics (total, completed, pending, completion rate)
- Priority-based color coding

### Analytics Page
- Weekly session and points tracking
- Visual bar charts
- Performance insights
- Best day identification
- Trend analysis

### Progress Page
- Goal tracking with progress bars
- Achievement system (locked/unlocked)
- Timeline of milestones
- Percentage-based goal completion

## 🌐 How Routing Works

### Route Configuration
```javascript
app.config(function($routeProvider) {
  $routeProvider
    .when("/timer", {
      templateUrl: "timer.html",
      controller: "TimerController"
    })
    // ... other routes
    .otherwise({
      redirectTo: "/timer"  // Default route
    });
});
```

### Navigation
- Click navigation links to switch between routes
- URL updates with `#!/routename` (hashbang mode)
- Active route is highlighted in navigation
- Content is dynamically loaded into `<div ng-view></div>`

### Active Route Highlighting
The main controller tracks the current route and applies the `active` class:
```javascript
$scope.$on('$routeChangeSuccess', function() {
  $scope.currentRoute = $location.path();
});
```

## 🚀 Getting Started

1. **Open app.html in a web browser**
   - Make sure all files are in the same directory
   - Open app.html in your browser

2. **Navigate using the menu**
   - Click on TIMER, TASKS, ANALYTICS, or PROGRESS
   - Notice the URL changes and content updates

3. **Interact with features**
   - Start timer sessions
   - Add and manage tasks
   - View analytics and progress

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1400px and above)
- Tablets (768px - 1399px)
- Mobile devices (below 768px)

## 🎨 Customization

### Colors
Main colors are defined using CSS variables concepts:
- Primary: `#667eea` (Purple-blue)
- Secondary: `#764ba2` (Purple)
- Accent: `#ffd700` (Gold)

### Modify Routes
To add a new route:
1. Create a new template HTML file
2. Add route configuration in `app.js`
3. Create a controller for the route
4. Add navigation link in `app.html`

## 💡 Tips

- The timer uses AngularJS `$interval` service for countdown
- All data is stored in controller scope (resets on page refresh)
- For persistence, consider adding localStorage or backend integration
- The charts are CSS-based (no external chart libraries required)

## 🐛 Troubleshooting

**Routes not working?**
- Ensure all template files are in the same directory as app.html
- Check browser console for errors
- Verify AngularJS and AngularJS Route CDN links are loaded

**Styles not applying?**
- Ensure app.css is in the same directory
- Check for CSS syntax errors
- Clear browser cache

## 📝 Future Enhancements

Potential additions:
- LocalStorage for data persistence
- Backend API integration
- More detailed analytics
- Custom timer durations
- Task categories and tags
- Export/import functionality
- User authentication

## 📄 License

This is a sample project for learning AngularJS routing concepts.
