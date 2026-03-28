// ============================================================
//  ai.service.js — ChronoPom AI (Google Gemini - FREE)
//
//  HOW TO GET YOUR FREE API KEY:
//  1. Go to https://aistudio.google.com
//  2. Sign in with your Google account
//  3. Click "Get API Key" (top left)
//  4. Click "Create API Key"
//  5. Copy the key and paste it below
//
//  FREE LIMITS: 1,500 requests/day — more than enough!
//  No credit card required.
// ============================================================

var GEMINI_API_KEY = 'AIzaSyAOISVRtT6WUoeeHCYUh74mt5cEC6EBOpA';  // <-- paste your key here

var GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/'
               + 'gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY;


app.service('AiService', ['$http', function($http) {

  var svc = this;

  // ── Main function: takes a task object, returns subtasks array ──
  svc.breakIntoSubtasks = function(task) {

    var prompt =
      'You are a productivity assistant for a Pomodoro timer app called ChronoPom.\n' +
      'A user has a task they want to complete using Pomodoro sessions (25 min each).\n\n' +
      'Task name: "' + task.name + '"\n' +
      'Category: '   + (task.category || 'Work')   + '\n' +
      'Priority: '   + (task.priority || 'Medium')  + '\n' +
      'Estimated pomodoros: ' + (task.pomodoros || 1) + '\n\n' +
      'Break this task into 3 to 5 clear, specific, actionable subtasks.\n' +
      'Each subtask must be completable in one 25-minute Pomodoro session.\n\n' +
      'Return ONLY a valid JSON array. No explanation. No markdown. Example:\n' +
      '[{"subtask":"Research the topic","estimatedPomodoros":1},' +
       '{"subtask":"Write a rough outline","estimatedPomodoros":1}]';

    return $http({
      method : 'POST',
      url    : GEMINI_URL,
      headers: { 'Content-Type': 'application/json' },
      data   : {
        contents: [
          { parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature    : 0.4,
          maxOutputTokens: 500
        }
      }
    }).then(function(response) {
      // Gemini returns: response.data.candidates[0].content.parts[0].text
      var text = response.data.candidates[0].content.parts[0].text.trim();
      // Strip accidental markdown fences like ```json ... ```
      text = text.replace(/```json|```/g, '').trim();
      return JSON.parse(text);
    });
  };

}]);