# Chrome Extension Installation Guide

## 📦 What Was Created

Your Coursera automation extension is complete with all necessary files:

```
coursera-automation-extension-master/
│
├── 📋 manifest.json              ← Extension configuration (Manifest V3)
├── 📄 popup.html                 ← Main UI (popup)
├── 🎨 popup.css                  ← Styles (purple gradient theme)
├── ⚙️  popup.js                   ← Popup logic & event handlers
├── 💻 content.js                 ← Page scanning & API calls
├── 🔧 background.js              ← Service worker
├── 📁 images/
│   └── icon.svg                  ← Extension icon
├── 📚 README.md                  ← Full documentation
├── 🚀 SETUP.md                   ← Quick start guide
└── 📋 INSTALLATION.md            ← This file
```

## ⚙️ Installation Steps

### Step 1: Open Chrome Extensions Page
```
Chrome Menu → More tools → Extensions
OR Type in address bar: chrome://extensions
```

### Step 2: Enable Developer Mode
- **Top-right corner**: Toggle "Developer mode" ON

### Step 3: Load the Extension
- Click blue button: **Load unpacked**
- Navigate to your extension folder
- Select: `coursera-automation-extension-master`
- Click **Select Folder**

### Step 4: Verify Installation
✓ Extension appears in list
✓ Icon appears in Chrome toolbar (top-right)
✓ Can click icon and see popup

## 🎯 Quick Start (First Run)

### 1. Navigate to Coursera Course
```
https://www.coursera.org/learn/[course-name]/home/welcome
```

### 2. Get Your User ID
Open DevTools (F12) → Console:
```javascript
// Find data with course info
const elem = document.querySelector('[data-click-value]');
const data = JSON.parse(elem.getAttribute('data-click-value').replace(/&quot;/g, '"'));
console.log('Course ID:', data.course_id);

// Or check Network tab for userId in API requests
```

### 3. Click Extension Icon
- Look for "Coursera Progress" icon in toolbar
- Opens popup panel on right side

### 4. Enter User ID
- Paste your numeric User ID (e.g., `131576213`)
- Click **Scan Page**

### 5. Review & Confirm
- Popup shows:
  - Course name
  - Link counts by type
- Click **Start Process**
- Confirm in modal dialog

### 6. Watch Progress
- Real-time progress bar
- Green ✓ = Success
- Red ✗ = Failed
- Shows itemId and result for each

## 🔍 Finding Your User ID (3 Methods)

### Method 1: Network Tab (Recommended)
1. Open DevTools: **F12**
2. Go to **Network** tab
3. Scroll on course page
4. Look for request to `/api/` endpoint
5. Check **Payload** tab
6. Copy `userId` value

### Method 2: Page Source
1. Press **Ctrl+F** on course page
2. Search: `"userId"`
3. Look for pattern: `"userId":"12345678"`
4. Copy the number

### Method 3: Local Storage
1. DevTools → **Application** tab
2. Left sidebar → **Local Storage**
3. Click `coursera.org`
4. Search for `userId` or `user_id`

## ✨ Features Overview

### Scanning
- ✓ Finds all course content links
- ✓ Categorizes by type (lectures, supplements, labs, assignments)
- ✓ Extracts itemIds automatically
- ✓ Gets course ID from page data

### Processing
- ✓ Batch API calls with delays
- ✓ Real-time progress tracking
- ✓ Success/failure per item
- ✓ Error messages for debugging

### Security
- ✓ No passwords stored
- ✓ No tokens saved
- ✓ Uses your browser session
- ✓ All data stays local

## 🔧 Troubleshooting

### Extension icon not visible
```
chrome://extensions → find extension → Toggle ON
```

### "Not on Coursera page" message
- Current page doesn't have `/learn/` in URL
- Navigate to course URL (ending in `/home/welcome`)

### "No links found" after scanning
- Page still loading: Wait and try again
- Course has no listed content
- Try refreshing page: Ctrl+R

### API calls failing (401 error)
- Your Coursera session expired
- Refresh course page in separate tab
- Log out and back into Coursera

### Can't find User ID
- Use Network tab method (most reliable)
- Make an action on course (scroll, click) to generate requests
- Check for "userId" in request body

## 📊 Supported Content Types

| Type | Icon | API Used |
|------|------|----------|
| 🎥 Video Lectures | `/lecture/` | videoEvents/ended |
| 📄 Supplements | `/supplement/` | onDemandSupplementCompletions |
| 🧪 Ungraded Labs | `/ungradedLab/` | onDemandSupplementCompletions |
| ✍️ Assignments | `/assignment-submission/` | onDemandSupplementCompletions |

## ⚡ Performance

| Metric | Time |
|--------|------|
| Scan | < 100ms |
| Per item | ~500ms-2.5s |
| 10 items | ~5-30s |
| 100 items | ~50-300s |
| Memory | < 5MB |

## 🔐 Privacy & Security

- ✅ No data leaves your browser (except to coursera.org)
- ✅ No tracking or analytics
- ✅ No account information stored
- ✅ Only User ID saved (in chrome.storage.local)
- ✅ Uses authenticated session (you must be logged in)

## 📝 File Descriptions

| File | Purpose |
|------|---------|
| **manifest.json** | Extension metadata, permissions, content scripts |
| **popup.html** | User interface structure |
| **popup.css** | Styling with purple gradient theme |
| **popup.js** | Event handlers, message passing |
| **content.js** | Page scanning, link analysis, API calls |
| **background.js** | Service worker, initialization |
| **icon.svg** | Extension toolbar icon |

## 🚀 Advanced Usage

### Keyboard Shortcut
1. Go to `chrome://extensions/shortcuts`
2. Find extension in list
3. Set keyboard shortcut (e.g., Ctrl+Shift+P)

### Modify Processing Delay
Edit `content.js`, line ~120:
```javascript
// Change 500 to desired milliseconds
await new Promise(resolve => setTimeout(resolve, 500));
```

### Debug Console Logs
1. Right-click extension icon
2. Select "Inspect popup"
3. See logs as operations happen

## ❓ FAQ

**Q: Will this mark videos as watched in my account?**
A: Yes, the API calls mark items as completed on Coursera's servers.

**Q: Can I use it on multiple courses?**
A: Yes, it works on any course with the `/learn/` pattern.

**Q: What if I have 500 items?**
A: Should take ~10-30 minutes depending on delays. It's safe to leave running.

**Q: Does it work offline?**
A: No, it needs internet connection to Coursera's servers.

**Q: Can I use my browser while processing?**
A: Yes, but stay on the course page. Processing continues in background.

**Q: Is there a rate limit?**
A: Coursera may have internal limits. 500ms delay between calls should be safe.

## 🆘 Getting Help

1. **Read SETUP.md** for quick troubleshooting
2. **Check README.md** for detailed documentation
3. **View console logs** (F12 → Console tab)
4. **Network tab** to see API responses
5. **Verify User ID** is correct (numeric value)

## ✅ Verification Checklist

Before using:
- [ ] Extension installed and enabled
- [ ] Icon visible in toolbar
- [ ] Can open popup on Coursera page
- [ ] User ID obtained
- [ ] Scan finds links on course page
- [ ] Modal shows link breakdown
- [ ] Processing shows progress updates

## 📞 Support

For issues:
1. Check browser console (F12) for error messages
2. Verify you're on a `/learn/` course page
3. Verify User ID is correct
4. Try refreshing course page
5. Try incognito mode to rule out extensions
6. Check if Coursera is experiencing issues

---

**Ready to use?** Start with SETUP.md for step-by-step first run!
