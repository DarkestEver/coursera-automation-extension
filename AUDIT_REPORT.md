# Chrome Extension Audit Report

**Extension**: Coursera Progress Automation
**Status**: ⚠️ ISSUES FOUND - NEEDS FIXES
**Date**: 2026-06-17

---

## 🔴 CRITICAL ISSUES

### 1. **DOMContentLoaded Event May Not Fire**
**Severity**: HIGH
**File**: `popup.js` (line 26)
**Problem**:
```javascript
document.addEventListener('DOMContentLoaded', () => {
  // Initialization code
});
```

When the popup loads, the script tag executes AFTER the DOM is already parsed. By the time `popup.js` loads, the `DOMContentLoaded` event may have already fired. Since events don't re-trigger for late listeners, the initialization code never runs!

**Impact**:
- User sees blank popup (purple header only)
- Scan button not functional
- No error messages
- User ID not loaded from storage

**Fix**: Move initialization outside DOMContentLoaded or check document.readyState

---

### 2. **Missing Error Handling for chrome.tabs.sendMessage()**
**Severity**: HIGH
**File**: `popup.js` (line 74-75)
**Problem**:
```javascript
chrome.tabs.sendMessage(tabs[0].id, { action: 'scanLinks' }, (response) => {
  // No error handling for chrome.runtime.lastError
});
```

If the content script fails to load or isn't ready, the callback might not receive a proper response. Chrome will log an error to the console but the UI won't show an error message to the user.

**Fix**: Add `chrome.runtime.lastError` check in the callback

---

### 3. **Content Script May Not Load On Page**
**Severity**: MEDIUM
**File**: `manifest.json` (line 24)
**Issue**:
```json
"matches": ["https://www.coursera.org/learn/*"]
```

Content script only runs on `/learn/` pages. If the popup is opened on a different domain or path, the script won't be available.

**Current behavior**: Works correctly but lacks fallback

---

## 🟡 MODERATE ISSUES

### 4. **No Console Error Visibility**
**Severity**: MEDIUM
**File**: All files
**Problem**:
- No error logging to help users debug
- No warning messages for missing courseId
- Silent failures in API calls

**Fix**: Add console.log/error statements and user-facing error messages

---

### 5. **Potential Race Condition in Initial Tab Check**
**Severity**: LOW-MEDIUM
**File**: `popup.js` (line 34)
**Problem**:
```javascript
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]?.url?.includes('coursera.org/learn/')) {
    // ...
  }
});
```

This is async and may take time. If the user closes the popup before it completes, there's no cleanup.

---

### 6. **HTML Entities Not Fully Decoded**
**Severity**: LOW-MEDIUM
**File**: `content.js` (line 51-54)
**Problem**:
```javascript
function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}
```

While this works, it's a DOM-based approach that could fail with certain HTML patterns. Better to use a parser.

---

## 🟢 MINOR ISSUES

### 7. **No Response Timeout Handling**
**File**: `content.js` (line 222-229)
**Problem**: API calls with `fetch` have no timeout. Slow networks could hang the UI.
**Impact**: User sees progress bar stuck
**Fix**: Add AbortController timeout

---

### 8. **No Validation of courseId**
**File**: `content.js` (line 42)
**Problem**: If courseId is null, the API call will still be attempted
**Impact**: API returns 400 error
**Fix**: Validate courseId exists before processing

---

### 9. **Missing Input Validation**
**File**: `popup.js` (line 155-159)
**Problem**: User ID is only validated to not be empty
**Impact**: Non-numeric IDs accepted but cause API errors later
**Fix**: Add regex validation for numeric User ID

---

## ✅ VALIDATION RESULTS

| Component | Status | Notes |
|-----------|--------|-------|
| manifest.json | ✅ Valid | Proper Manifest V3 syntax |
| popup.html | ✅ Valid | Proper HTML structure |
| popup.css | ✅ Valid | CSS is clean and correct |
| popup.js | ⚠️ Issues | DOMContentLoaded bug, missing error handling |
| content.js | ✅ Valid | Logic is sound, minor error handling |
| background.js | ✅ Valid | Service worker setup is correct |

---

## RECOMMENDED FIXES (Priority Order)

### FIX #1 - CRITICAL: DOMContentLoaded Issue
**Replace popup.js initialization section:**

```javascript
// Initialize immediately instead of waiting for DOMContentLoaded
function initialize() {
  chrome.storage.local.get('userId', (result) => {
    if (result.userId) {
      userIdInput.value = result.userId;
    }
  });

  // Check if we're on a Coursera learn page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.url?.includes('coursera.org/learn/')) {
      scanButton.disabled = false;
      userIdSection.style.display = 'block';
    } else {
      showNotOnCoursPage();
    }
  });
}

// Run immediately if DOM is ready, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
```

---

### FIX #2 - CRITICAL: Add Error Handling to sendMessage
**Replace scanPage function in popup.js:**

```javascript
function scanPage() {
  scanButton.disabled = true;
  scanButton.textContent = 'Scanning...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'scanLinks' }, (response) => {
      scanButton.disabled = false;
      scanButton.textContent = 'Scan Page';

      // Check for errors
      if (chrome.runtime.lastError) {
        errorSection.style.display = 'block';
        errorMessage.textContent = 'Content script not loaded. Try refreshing the page.';
        return;
      }

      if (response && response.success) {
        currentPageData = response.data;
        displayScanResults(response.data);
      } else {
        errorSection.style.display = 'block';
        errorMessage.textContent = response?.error || 'Failed to scan page. Please refresh and try again.';
      }
    });
  });
}
```

---

### FIX #3 - HIGH: Validate courseId
**Update content.js scanAllLinks() function:**

```javascript
function scanAllLinks() {
  const { courseSlug, courseId } = getCourseInfo();

  if (!courseId) {
    console.warn('Course ID not detected. Some items may not process correctly.');
  }

  // ... rest of function
}
```

---

### FIX #4 - MEDIUM: Add Timeout to Fetch Calls
**Update both processLecture and processSupplement functions:**

```javascript
async function processLecture(userId, courseSlug, itemId) {
  const url = `https://www.coursera.org/api/opencourse.v1/user/${userId}/course/${courseSlug}/item/${itemId}/lecture/videoEvents/ended?autoEnroll=false`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  const payload = {
    contentRequestBody: {}
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return {
      success: true,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.name === 'AbortError' ? 'Request timeout' : error.message
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

## TESTING CHECKLIST

- [ ] Install extension and open popup on Coursera /learn/ page
- [ ] Verify User ID input is visible and editable
- [ ] Verify "Scan Page" button is clickable
- [ ] Click Scan - verify it doesn't hang
- [ ] Check browser console for errors
- [ ] Verify error messages appear for invalid User IDs
- [ ] Test on a Coursera page with multiple link types
- [ ] Verify progress bar updates in real-time
- [ ] Test canceling during processing
- [ ] Verify User ID persistence (reload popup, ID should still be there)

---

## DEPLOYMENT CHECKLIST

Before using in production:
- [ ] Apply all CRITICAL fixes
- [ ] Test DOMContentLoaded fix works
- [ ] Test error messages display properly
- [ ] Verify scanLinks callback handles errors
- [ ] Add console logging for debugging
- [ ] Test on real Coursera course
- [ ] Monitor console for runtime errors

---

## SUMMARY

**Total Issues**: 9
- Critical: 2
- Moderate: 3
- Minor: 4

**Estimated Fix Time**: 30 minutes

**Priority**: APPLY FIXES #1 AND #2 IMMEDIATELY - these prevent the extension from working at all.

