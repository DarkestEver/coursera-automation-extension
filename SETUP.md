# Quick Start Guide

## Installation (5 minutes)

### 1. Open Chrome Extensions
- Open Chrome
- Type `chrome://extensions` in address bar
- Enable **Developer mode** (top-right toggle)

### 2. Load Extension
- Click **Load unpacked**
- Navigate to this folder and select it
- The "Coursera Progress" icon will appear in toolbar

### 3. Test on Course Page
- Go to: `https://www.coursera.org/learn/python-data-analysis/home/welcome`
- (Replace with your actual course)
- Click the extension icon
- Should show "Scan Page" button

## Get Your User ID

### Quick Method (Console)
1. On any Coursera page, open DevTools: **F12**
2. Go to **Console** tab
3. Paste and run:
```javascript
// Method 1: From page data attributes
const elem = document.querySelector('[data-click-value]');
if (elem) {
  const data = JSON.parse(elem.getAttribute('data-click-value').replace(/&quot;/g, '"'));
  console.log('User ID (if available in data):', data.user_id);
}

// Method 2: From network requests
// Check Network tab → any Coursera API request → copy userId from request/response
```

### Network Tab Method
1. Open DevTools: **F12**
2. Go to **Network** tab
3. Scroll or interact with the page
4. Look for requests to `api.coursera.org` or `coursera.org/api`
5. Click a request → **Payload** or **Request** tab
6. Find `userId` (usually a number like `131576213`)

## First Run

1. **Open Course Page** (with /learn/ in URL)
2. **Click Extension Icon** (Coursera Progress)
3. **Paste User ID** in the popup
4. **Click "Scan Page"** button
5. **Review Results**:
   - Shows course slug
   - Shows found links by type
   - Shows total count
6. **Click "Start Process"** button
7. **Confirm in Modal** with link breakdown
8. **Watch Progress** in real-time
9. **Done!** Results show success/failure per item

## What Gets Processed?

By default, the extension processes:

| Type | API Used | Status |
|------|----------|--------|
| Video Lectures | `/lecture/videoEvents/ended` | ✓ Active |
| Supplements | `/onDemandSupplementCompletions.v1` | ✓ Active |
| Ungraded Labs | `/onDemandSupplementCompletions.v1` | ✓ Active |
| Assignments | `/onDemandSupplementCompletions.v1` | ✓ Active |

## Understanding Results

### Success (Green ✓)
- API returned 200/201
- Item marked as completed
- No additional action needed

### Error (Red ✗)
- API returned error or timeout
- See error message for details
- Common causes:
  - Invalid User ID
  - Expired session (refresh Coursera page)
  - Item already completed
  - Course ID mismatch

## Keyboard Shortcut (Optional)

To add a keyboard shortcut:

1. Go to `chrome://extensions/shortcuts`
2. Find "Coursera Progress Automation"
3. Click "Set shortcut" field
4. Press desired shortcut (e.g., `Ctrl+Shift+P`)
5. Scope: Keep as "This extension"

## Persistence

The extension stores:
- **User ID**: Saved locally, survives browser restarts
- **Link Data**: Only in memory, cleared when popup closes
- **No Tracking**: No data sent anywhere except Coursera

## Troubleshooting

### Extension not showing
- Reload extension: Go to `chrome://extensions`, click refresh icon
- Verify enabled: Make sure the toggle is ON

### Scan button disabled
- You're not on a Coursera /learn/ page
- Go to: `https://www.coursera.org/learn/[course-slug]/home/welcome`

### "No course ID found" warning
- Some courses don't expose course_id in HTML
- Check network tab for actual course_id
- Courses still process correctly for lectures

### API calls failing (401/403)
- Session expired: Refresh the course page in browser
- Invalid User ID: Get a fresh one from network tab
- Clear cookies: Try incognito mode

### Progress bar not moving
- Might be network latency (2.5s default delay)
- Check browser console (F12) for real-time logs
- API requests take ~500ms-2s each

## Advanced Usage

### Console Functions
The extension exposes these via content script:

```javascript
// In DevTools console on a Coursera /learn/ page:
scanAllLinks()  // Get all links data
```

### Custom Delays
Edit `content.js` line 115: Change `setTimeout(resolve, 500)` to desired ms

### Only Process Specific Types
Edit `content.js` in `processLink()` function - add type filters

## File Structure
```
coursera-automation-extension-master/
├── manifest.json          # Extension config
├── popup.html             # Popup UI
├── popup.css              # Popup styles
├── popup.js               # Popup logic
├── content.js             # Page interaction & APIs
├── background.js          # Service worker
├── images/
│   └── icon.svg          # Extension icon
├── README.md             # Full documentation
├── SETUP.md              # This file
└── api-call.js           # Legacy script (reference)
```

## Security Checklist

- ✓ No password stored
- ✓ No authentication tokens saved
- ✓ Uses browser session (you must be logged in)
- ✓ All requests go directly to coursera.org
- ✓ No data transmitted to third parties
- ✓ No background tracking

## Next Steps

1. ✅ Install extension
2. ✅ Get User ID
3. ✅ Test on one course
4. ✅ If working, use on other courses
5. ✅ Adjust delay if needed (content.js line 115)

---

**Need Help?** See README.md for detailed documentation and troubleshooting.
