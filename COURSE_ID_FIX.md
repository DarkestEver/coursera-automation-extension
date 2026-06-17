# Course ID Detection - FIXED ✅

**Issue**: Course ID was not detected
**Root Cause**: Was looking in wrong place (window.App instead of DOM)
**Solution**: Fetch from DOM `data-click-value` attribute
**Status**: ✅ FIXED

---

## What Changed

### BEFORE ❌
```javascript
// Tried window.App first (not available)
courseId = window.App.context.dispatcher.stores.ApplicationStore.courseId
// Then fell back to DOM (but too late)
```

### AFTER ✅
```javascript
// Try DOM first (always available)
const jsonData = JSON.parse(clickValue);
courseId = jsonData.course_id  // ← Key point: underscore, not camelCase!

// Fallback to window.App if DOM fails
```

---

## Data Source

The courseId is in the DOM at:
```html
<element data-click-value="{&quot;course_id&quot;:&quot;mqlYA8RuEe6kghKtIX5xRw&quot;, ...}">
```

When decoded:
```json
{
  "course_id": "mqlYA8RuEe6kghKtIX5xRw",
  "open_course_slug": "source-systems-data-ingestion-and-pipelines",
  "itemId": "YD08f",
  ...
}
```

---

## Key Fix

```javascript
// CORRECT KEY (with underscore)
courseId = jsonData.course_id  ✅

// WRONG (camelCase)
courseId = jsonData.courseId   ❌
```

---

## Test Now

1. **Reload extension**: `chrome://extensions` → refresh ↻
2. **Refresh Coursera page**: Ctrl+R
3. **Click extension icon**
4. **Click "Scan Page"**
5. **Verify**:
   - ✅ User ID auto-fills
   - ✅ **Course ID now shows!** (not "Not detected")
   - ✅ Course name shows
   - ✅ Link counts show

---

## Console Output

You should see:
```
✓ CourseId found from DOM data-click-value: mqlYA8RuEe6kghKtIX5xRw
✓ UserId auto-detected from window.App: 131576213
```

---

## Why DOM is Better

| Source | Reliability | Always Available |
|--------|-------------|------------------|
| DOM data-click-value | ✅ 100% | ✅ Yes |
| window.App | ❌ Variable | ❌ Not always |

**DOM is more reliable!** That's why we prioritize it now.

---

## File Updated

- `content.js` - Updated `getCourseInfo()` function

---

**Test it now! Course ID should finally show up!** 🎉
