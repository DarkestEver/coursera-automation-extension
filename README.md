# Coursera Progress Automation Extension

A Chrome extension for automating Coursera course progress tracking. Scan course pages and mark lectures and supplements as completed.

## Features

- **Scan Course Pages**: Automatically detects all course content links
- **Link Type Classification**: Categorizes links by type (Lectures, Supplements, Labs, Assignments)
- **Progress Tracking**: Visual progress indicator while processing
- **User-Friendly UI**: Clean popup interface with confirmation modal
- **Batch Processing**: Process multiple items with adjustable delays
- **Support for Multiple Content Types**:
  - Video Lectures
  - Supplements
  - Ungraded Labs
  - Assignments

## Installation

### Method 1: Load from Source (Development Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the extension folder
6. The extension icon should appear in your Chrome toolbar

### Method 2: Package as CRX (for distribution)

1. Go to `chrome://extensions/`
2. Click the menu (⋮) on the extension card
3. Click "Pack extension"
4. Select the source directory and keep the key file safe

## Usage

### Step 1: Navigate to Course
Go to any Coursera course page:
```
https://www.coursera.org/learn/[course-slug]/home/welcome
```

### Step 2: Click Extension Icon
Click the **Coursera Progress** icon in your Chrome toolbar.

### Step 3: Enter User ID
- Get your **User ID** from the network requests on Coursera
- Enter it in the popup or use a previously saved one
- The ID is typically a numeric value like `131576213`

### Step 4: Scan Page
Click the **Scan Page** button to:
- Find all course content links
- Detect course ID and slug
- Categorize by type
- Show summary

### Step 5: Confirm & Process
1. Review the link types and counts in the modal
2. Click **Confirm & Start** to begin processing
3. Watch the progress bar as items are completed
4. Results show per-item success/failure status

## How to Find Your User ID

### Option 1: From Network Tab
1. Open Course Page
2. Open DevTools (F12 → Network tab)
3. Perform an action (scroll, click)
4. Look for requests to `coursera.org/api/`
5. Check `userId` in request payload or URL

### Option 2: From Page HTML
1. Open DevTools Console
2. Run: `document.body.innerHTML.match(/userId["\s:]*(\d+)/i)`
3. Or search for `data-click-value` attributes

### Option 3: From Local Storage
1. Open DevTools (F12 → Application tab)
2. Go to Local Storage → coursera.org
3. Search for `userId` or `user_id`

## API Endpoints Used

### Lectures
```
POST https://www.coursera.org/api/opencourse.v1/user/{userId}/course/{courseSlug}/item/{itemId}/lecture/videoEvents/ended
```

### Supplements/Labs/Assignments
```
POST https://www.coursera.org/api/onDemandSupplementCompletions.v1
Payload: {"userId": 131576213, "courseId": "xyz", "itemId": "abc"}
```

## Architecture

### Files
- **manifest.json** - Extension configuration
- **popup.html/css/js** - UI and user interaction
- **content.js** - Page scanning and API calls
- **background.js** - Service worker and initialization

### Data Flow
```
Popup (UI)
  ↓ (sendMessage)
Content Script (scanning & API calls)
  ↓ (fetch)
Coursera API
  ↓ (response)
Progress Display
```

## Security Notes

- **No Data Transmission**: All processing happens locally in your browser
- **Authentication**: Uses your browser's existing Coursera session (credentials: 'include')
- **No Storage**: Link data is not persisted, only User ID is stored locally
- **CORS Safe**: Requests go directly to coursera.org (no proxy)

## Troubleshooting

### "You are not on a Coursera course page"
- Ensure you're on a page with URL containing `/learn/`
- Example: `coursera.org/learn/python-data-analysis/home/welcome`

### "No links found"
- Page might still be loading
- Try clicking "Scan Page" again
- Check if course content is fully rendered

### API calls return 401/403
- Your Coursera session might have expired
- Refresh the course page
- Log out and log back into Coursera

### No course ID detected
- Some courses might not include course_id in HTML
- You can manually add it if you know the value
- Check network requests for the correct ID

## Development

### Modify Link Types
Edit `content.js` - `LINK_TYPES` object

### Change API Endpoints
Edit `content.js` - `API_ENDPOINTS` object

### Add New Features
1. Update `manifest.json` permissions if needed
2. Modify content.js for page interaction
3. Update popup.js for UI changes
4. Reload extension on `chrome://extensions/`

## Performance

- **Scan**: < 100ms per course page
- **Per Item**: ~500ms-2.5s (configurable delay)
- **Memory**: < 5MB extension size
- **Network**: ~1 API call per item processed

## Limitations

- Only works on Coursera Learn pages
- Requires active browser session with Coursera
- Cannot process items not found on the page
- API rate limiting may apply (Coursera side)

## Support

For issues or feature requests:
1. Check the troubleshooting section above
2. Verify you're using the latest Chrome version
3. Clear extension cache: Unload/reload on extensions page
4. Review browser console for error messages (F12)

## License

MIT License - Feel free to modify and share!

## Disclaimer

This tool is for educational and personal use. Use responsibly and in accordance with Coursera's Terms of Service.
