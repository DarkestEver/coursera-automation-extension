# Architecture & Implementation Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Chrome Browser                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────┐         ┌──────────────────────────┐   │
│  │   Popup Panel      │         │   Course Page (DOM)      │   │
│  │ (popup.html)       │         │   https://coursera.org   │   │
│  │                    │◄────────┤   /learn/[course]/...    │   │
│  │ - User ID input    │         │                          │   │
│  │ - Scan button      │         │ Contains:                │   │
│  │ - Progress display │         │ - Content links          │   │
│  │ - Modal confirm    │         │ - data-click-value JSON  │   │
│  └────────────────────┘         └──────────────────────────┘   │
│         │                                  ▲                     │
│         │                                  │                     │
│         │                          ┌───────┴────────┐            │
│         │                          │                │            │
│         └──────────────────────────┤                │            │
│              Chrome Runtime        │  Content Script │            │
│              Messages              │  (content.js)  │            │
│                                    │                │            │
│                                    │ - scanLinks()  │            │
│                                    │ - getLinkType()│            │
│                                    │ - extract ID   │            │
│                                    │ - fetch APIs   │            │
│                                    │                │            │
│                                    └────────────────┘            │
│                                            │                     │
│                                            │ HTTP Requests       │
│                                            ▼                     │
│                                   ┌─────────────────┐            │
│                                   │ Coursera Server │            │
│                                   │ coursera.org    │            │
│                                   │                 │            │
│                                   │ /api/opencourse │            │
│                                   │ /api/onDemand...│            │
│                                   └─────────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Popup (User Interface)
**Files**: `popup.html`, `popup.css`, `popup.js`

**Responsibility**: User interaction and progress visualization

**States**:
```
Initial → Input User ID → Scan → Show Results → Confirm Modal → Processing → Done
```

**Key Features**:
- User ID input with storage persistence
- Scan button (disabled when not on /learn/ page)
- Process button (shows after scan)
- Modal confirmation with breakdown
- Real-time progress bar
- Item-by-item result display

**Communication**:
```javascript
// Sends to content script
chrome.tabs.sendMessage(tabId, {
  action: 'scanLinks'  // or 'processLinks'
})

// Receives response
{
  success: true,
  data: {
    courseSlug,
    courseId,
    totalLinks,
    links: [],
    linksByType: {}
  }
}
```

### 2. Content Script (Page Interaction)
**File**: `content.js`

**Responsibility**: Scanning page, extracting data, making API calls

**Key Functions**:

#### `getCourseInfo()`
- Extracts course slug from URL
- Finds course_id from data-click-value attributes
- Returns: `{courseSlug, courseId}`

```javascript
// Input: Window URL + DOM elements
// Output: {courseSlug: "python-data-analysis", courseId: "abc123"}
```

#### `scanAllLinks()`
- Queries all `<a href>` elements containing `/learn/`
- Categorizes each by type
- Extracts itemId from URL
- Aggregates counts by type

```
Process Flow:
1. document.querySelectorAll('a[href*="/learn/"]')
2. For each link:
   - getLinkType(href) → identifies type
   - extractItemIdFromUrl(href) → gets itemId
   - Store in results
3. Return aggregated data
```

#### `processLink(link, userId, courseSlug, courseId)`
- Routes based on link type
- Calls appropriate API
- Returns success/failure

```javascript
switch(type) {
  case 'lecture': → processLecture()
  case 'supplement': → processSupplement()
  case 'ungradedLab': → processSupplement()
  case 'assignment-submission': → processSupplement()
}
```

### 3. Service Worker (Background)
**File**: `background.js`

**Responsibility**: Extension lifecycle and initialization

**Functions**:
- Initialize storage on install
- Update icon state on tab switch
- Preserve extension state

## Data Flow Sequences

### Sequence 1: Page Scanning

```
User clicks Scan button
         │
         ▼
popup.js sendMessage('scanLinks')
         │
         ▼
content.js receives message
         │
         ├─ getCourseInfo()
         │  └─ Extract courseSlug, courseId from page
         │
         ├─ scanAllLinks()
         │  ├─ Get all <a> with /learn/
         │  ├─ For each: getLinkType(), extractItemIdFromUrl()
         │  └─ Aggregate by type
         │
         └─ Return {courseSlug, courseId, links[], linksByType}
                   │
                   ▼
               popup.js receives
                   │
                   ▼
           Display results in popup
```

### Sequence 2: Processing Links

```
User confirms in modal
         │
         ▼
popup.js sendMessage('processLinks', {userId, courseId, links})
         │
         ▼
content.js receives
         │
         ▼
For each link (500ms delay between):
    │
    ├─ processLink(link, userId, courseSlug, courseId)
    │
    ├─ switch(type):
    │  ├─ lecture: POST /api/opencourse.v1/.../videoEvents/ended
    │  └─ other: POST /api/onDemandSupplementCompletions.v1
    │
    └─ Collect result {success, error, status}
    │
    ▼ (after all)
Return results array
    │
    ▼
popup.js receives & displays progress
```

## Link Type Classification

### URL Pattern Recognition

```
/learn/[courseSlug]/lecture/[itemId]/...
                    ▲
                    └─ Lecture Type

/learn/[courseSlug]/supplement/[itemId]/...
                    ▲
                    └─ Supplement Type

/learn/[courseSlug]/ungradedLab/[itemId]/...
                    ▲
                    └─ Lab Type

/learn/[courseSlug]/assignment-submission/[itemId]/...
                    ▲
                    └─ Assignment Type
```

### itemId Extraction

```
Input:  "/learn/python-for-data/supplement/YD08f/batch-tools"
                                           ▲
                                           └─ This is itemId
Output: "YD08f"
```

## API Endpoints

### Type 1: Lecture (Video Events)
```
Endpoint: /api/opencourse.v1/user/{userId}/course/{courseSlug}/item/{itemId}/lecture/videoEvents/ended

Method:   POST
Payload:  {"contentRequestBody": {}}
Purpose:  Mark lecture video as watched/completed
Response: {status: 200}
```

**Used for**:
- Lecture videos
- Course videos

### Type 2: Supplement (On-Demand Completions)
```
Endpoint: /api/onDemandSupplementCompletions.v1

Method:   POST
Payload:  {
  "userId": 131576213,
  "courseId": "mqlYA8RuEe6kghKtIX5xRw",
  "itemId": "YD08f"
}
Purpose:  Mark supplement/lab/assignment as completed
Response: {status: 201}
```

**Used for**:
- Supplemental materials
- Ungraded labs
- Assignments

## State Management

### Popup State Variables

```javascript
let currentPageData = null  // Stores scan results between actions
```

### Storage Persistence

```javascript
// chrome.storage.local
{
  userId: "131576213"  // Persists across sessions
}
```

### Page (Content Script) State

```javascript
// Implicit from DOM
// No persistent state - fresh scan each time
```

## Error Handling

### Network Errors
```javascript
try {
  const response = await fetch(url, {...})
  if (!response.ok) throw new Error(`HTTP ${status}`)
  return { success: true, status }
} catch (error) {
  return { success: false, error: error.message }
}
```

### User Validation
```javascript
// Popup validates User ID before sending
if (!userIdInput.value.trim()) {
  alert('Please enter User ID')
  return
}
```

### Page Context Validation
```javascript
// Check current page before showing UI
if (!url.includes('coursera.org/learn/')) {
  showNotOnCoursPage()
}
```

## Security Considerations

### Authentication
- Uses `credentials: 'include'` → browser sends cookies automatically
- Relies on user's existing Coursera session
- No tokens/passwords stored or transmitted

### API Requests
- Direct to coursera.org (same-origin for extension)
- HTTPS only (manifest specifies coursera.org)
- Standard CORS (works because coursera.org accepts these requests)

### Data Privacy
- No analytics or tracking
- User ID only saved locally in browser
- Links data only in memory
- No third-party connections

## Extension Lifecycle

```
Installation
    │
    ├─ manifest.json loaded
    ├─ background.js service worker starts
    ├─ Initialize chrome.storage.local
    │
    ▼
Activation
    │
    ├─ Icon appears in toolbar
    ├─ content.js injected on /learn/ pages
    │
    ▼
Runtime
    │
    ├─ User interacts with popup
    ├─ Content script scans/processes
    ├─ APIs called with credentials
    │
    ▼
Results
    │
    └─ Progress displayed to user
```

## Performance Optimization

### Scanning
- Single DOM traversal: O(n) where n = links on page
- Typical: < 100 items on page
- Time: < 100ms

### Processing
- Sequential with delays (prevents rate limiting)
- 500ms between requests
- Per-item time: ~500ms-2.5s API latency
- 100 items: ~50-250 seconds

### Memory
- Extension: < 5MB (stored locally)
- Per popup: < 1MB (cleared on close)
- Link data: ~100 bytes per link

## Extension Permissions Explanation

```json
{
  "permissions": [
    "activeTab",           // Access current tab
    "scripting",           // Inject content.js
    "storage",             // Store User ID
    "tabs"                 // Query tab info
  ],
  "host_permissions": [
    "https://www.coursera.org/*"  // Make API requests
  ],
  "content_scripts": [{
    "matches": ["https://www.coursera.org/learn/*"],
    "js": ["content.js"],
    "run_at": "document_end"  // After DOM ready
  }]
}
```

## Testing & Debugging

### In Popup
```javascript
// DevTools for popup
Right-click icon → "Inspect popup"
See console logs and network requests
```

### On Course Page
```javascript
// DevTools on page
F12 → Console
See content script logs
```

### Network Requests
```javascript
// View API calls
DevTools → Network tab
Filter by "coursera.org/api"
```

## Future Enhancement Possibilities

1. **Selective Processing**: Checkbox to only process certain types
2. **Custom Delays**: Adjustable delay slider in popup
3. **Batch Operations**: Save/load link sets for later
4. **Statistics**: Track completed courses and items
5. **Notifications**: Toast/badge when complete
6. **Context Menu**: Right-click link to process single item
7. **Course Presets**: Save common course configurations

---

## File Dependency Graph

```
manifest.json
├── popup.html
│   ├── popup.css
│   └── popup.js
│       └── chrome runtime API
├── content.js
│   └── Coursera APIs
├── background.js
│   └── chrome runtime API
└── images/icon.svg
```

