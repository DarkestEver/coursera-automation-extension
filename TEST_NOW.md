# Test the Fixed Extension Now

## 3-Minute Quick Test

### Step 1: Reload Extension (30 seconds)
1. Open `chrome://extensions`
2. Find "Coursera Progress Automation"
3. Click the **refresh icon** ↻
4. Close the tab

### Step 2: Test on Coursera (2 minutes)
1. Go to: https://www.coursera.org/learn/[any-course]/home/welcome
   - (Use ANY Coursera course you're enrolled in)
2. Click the **Coursera Progress** icon in toolbar
3. You should now see:
   - ✅ Purple header
   - ✅ User ID input field
   - ✅ "Scan Page" button
   - ✅ Error box (if not on /learn/ page)

### Step 3: Verify Functionality (1 minute)
**If on /learn/ page**:
- [ ] User ID input visible?
- [ ] Scan button clickable?
- [ ] Click Scan → shows results?

**If NOT on /learn/ page**:
- [ ] Error message visible: "You are not on a Coursera course page"?

---

## Full Functionality Test (10 minutes)

### Prerequisites
- [ ] Coursera course page open (with /learn/ in URL)
- [ ] User ID ready (see SETUP.md for how to find it)
- [ ] Browser console visible (F12)

### Test Flow

#### Test 1: Popup Loading
```
1. Click extension icon
2. Should see:
   - Purple header
   - User ID input (with stored value if available)
   - "Scan Page" button enabled
3. Check console: No red errors?
```

#### Test 2: Scan Page
```
1. Enter User ID (or use stored one)
2. Click "Scan Page"
3. Button shows "Scanning..." then changes back
4. Should display:
   - Course name
   - Course ID
   - Link counts by type
   - Process button
```

#### Test 3: Error Handling
```
1. Navigate to NON-Coursera page (Google, YouTube, etc.)
2. Click extension icon
3. Should show error: "You are not on a Coursera course page"
4. Navigate back to Coursera /learn/ page
5. Click extension icon again
6. Error should be gone, UI should work normally
```

#### Test 4: Request Timeout (Optional)
```
1. Open DevTools (F12)
2. Go to Network tab
3. Throttle to "Slow 3G" (DevTools → Network conditions)
4. Click Scan
5. Wait 10+ seconds
6. Should show "Request timeout (10s)" if API is too slow
7. Return to normal throttling
```

---

## Troubleshooting During Testing

### Popup Still Blank?
1. Hard reload extension: `chrome://extensions` → refresh icon
2. Check console (F12) for red errors
3. Try different Coursera course page

### User ID Input Not Showing?
1. Verify you're on `/learn/` URL page
2. Check F12 console for errors
3. Try refreshing the Coursera page first

### Scan Button Not Working?
1. Check console for errors (might be content script issue)
2. Refresh Coursera page
3. Close and reopen popup

### Scan Shows No Links?
1. Course page might still be loading
2. Scroll down to load more content
3. Try clicking Scan again

---

## What Should Happen Now

### Before Fixes
- Popup opened with blank/gray content
- No visible controls
- No error messages
- Extension didn't work

### After Fixes
- Popup opens with full UI visible
- All buttons and inputs work
- Clear error messages on issues
- Extension scans and processes links

---

## Verification Checklist

- [ ] Popup appears with header + content
- [ ] User ID input is visible and editable
- [ ] Scan button is clickable
- [ ] Error message shows on non-/learn/ pages
- [ ] Scan results appear after clicking Scan
- [ ] Console shows no red errors
- [ ] No hanging or freezing

---

## Next Steps After Testing

### If Everything Works ✅
1. Try full processing (enter User ID → Scan → Process)
2. Watch progress bar update
3. Review results

### If Still Having Issues ❌
1. Check TROUBLESHOOTING section in README.md
2. Review browser console for error messages
3. Try the fixes in AUDIT_REPORT.md manually
4. Check if Coursera page is fully loaded

---

## Common Errors & Solutions

| Error | Solution |
|-------|----------|
| "Content script not loaded" | Refresh Coursera page, try again |
| "You are not on Coursera page" | Go to coursera.org/learn/[course] URL |
| "No links found" | Course page still loading, scroll down, try again |
| "Request timeout" | Coursera servers slow, wait and retry |
| Blank popup | Reload extension (F5), hard refresh |

---

## Files That Were Fixed

1. **popup.js** - DOMContentLoaded issue fixed, error handling added
2. **content.js** - Timeout handling added, courseId validation added

**No other files needed changes.**

---

## After Testing Complete

If all tests pass:
1. ✅ Extension is ready to use
2. ✅ Create your User ID
3. ✅ Start automating course progress!

If tests fail:
1. Check console errors (F12)
2. Read error message carefully
3. Follow SETUP.md troubleshooting section
4. Try refreshing everything

---

## Still Not Working?

Check these in order:
1. Is extension enabled? → `chrome://extensions` toggle
2. Are you on /learn/ page? → Check URL
3. Is script loaded? → Open F12 console
4. Any red errors? → Copy error message
5. Extension refreshed? → Click refresh icon

---

**Good luck testing! The extension should now work correctly.** 🎉

