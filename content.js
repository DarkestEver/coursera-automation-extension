// Content script for scanning and processing Coursera links

const LINK_TYPES = {
  LECTURE: 'lecture',
  SUPPLEMENT: 'supplement',
  UNGRADED_LAB: 'ungradedLab',
  ASSIGNMENT: 'assignment-submission',
  OTHER: 'other'
};

const API_ENDPOINTS = {
  lecture: 'https://www.coursera.org/api/opencourse.v1/user/{userId}/course/{courseSlug}/item/{itemId}/lecture/videoEvents/ended',
  supplement: 'https://www.coursera.org/api/onDemandSupplementCompletions.v1',
  ungradedLab: 'https://www.coursera.org/api/onDemandSupplementCompletions.v1',
  'assignment-submission': 'https://www.coursera.org/api/onDemandSupplementCompletions.v1'
};

// Create page modal using DOM (avoid CSP issues)
function createPageModal() {
  const overlay = document.createElement('div');
  overlay.id = 'coursera-automation-modal';
  overlay.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 10000; align-items: center; justify-content: center;';

  const modal = document.createElement('div');
  modal.style.cssText = 'background: white; border-radius: 12px; padding: 30px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);';

  const header = document.createElement('div');
  header.style.cssText = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 20px -30px; border-radius: 12px 12px 0 0; text-align: center;';
  header.innerHTML = '<h2 style="margin: 0; font-size: 24px;">Processing Course</h2>';

  const content = document.createElement('div');
  content.id = 'modal-content';

  const progressContainer = document.createElement('div');
  progressContainer.id = 'progress-container';
  progressContainer.style.cssText = 'display: none; margin-top: 20px;';

  const progressBar = document.createElement('div');
  progressBar.style.cssText = 'width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin-bottom: 10px;';

  const progressFill = document.createElement('div');
  progressFill.id = 'progress-fill';
  progressFill.style.cssText = 'height: 100%; background: linear-gradient(90deg, #4caf50 0%, #45a049 100%); width: 0%; transition: width 0.3s ease;';
  progressBar.appendChild(progressFill);

  const progressText = document.createElement('p');
  progressText.id = 'progress-text';
  progressText.style.cssText = 'text-align: center; color: #666; margin: 0; font-size: 14px;';
  progressText.textContent = '0/0 completed';

  progressContainer.appendChild(progressBar);
  progressContainer.appendChild(progressText);

  const resultsList = document.createElement('div');
  resultsList.id = 'results-list';
  resultsList.style.cssText = 'display: none; margin-top: 20px; max-height: 300px; overflow-y: auto;';

  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'button-container';  // Add ID!
  buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.id = 'modal-cancel';
  cancelBtn.textContent = 'CANCEL';
  cancelBtn.style.cssText = 'flex: 1; padding: 12px; border: none; border-radius: 6px; background: #e0e0e0; color: #333; font-weight: 600; cursor: pointer; font-size: 14px;';

  const confirmBtn = document.createElement('button');
  confirmBtn.id = 'modal-confirm';
  confirmBtn.textContent = 'CONFIRM & START';
  confirmBtn.style.cssText = 'flex: 1; padding: 12px; border: none; border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; cursor: pointer; font-size: 14px;';

  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(confirmBtn);

  modal.appendChild(header);
  modal.appendChild(content);
  modal.appendChild(progressContainer);
  modal.appendChild(resultsList);
  modal.appendChild(buttonContainer);

  overlay.appendChild(modal);
  overlay.style.display = 'none';
  document.body.appendChild(overlay);

  console.log('✓ Page modal created');
}

// Create modal on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createPageModal);
} else {
  createPageModal();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanLinks') {
    const data = scanAllLinks();
    sendResponse({ success: true, data });
  } else if (request.action === 'showModal') {
    // Show modal on page
    const modal = document.getElementById('coursera-automation-modal');
    if (modal) {
      const content = document.getElementById('modal-content');
      let html = `<p style="font-size: 16px; margin-top: 0;"><strong>Ready to process ${request.data.totalLinks} links?</strong></p>`;
      html += '<p style="color: #666; font-size: 14px;">Link types:</p>';
      html += '<div style="background: #f5f5f5; padding: 15px; border-radius: 6px;">';

      for (const [type, count] of Object.entries(request.data.linksByType)) {
        html += `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><strong>${type}:</strong> <strong>${count}</strong></div>`;
      }
      html += '</div>';
      content.innerHTML = html;

      // Setup buttons
      document.getElementById('modal-cancel').onclick = () => {
        modal.style.display = 'none';
      };
      document.getElementById('modal-confirm').onclick = () => {
        // Process links directly in content script
        processLinksOnPage(request.data);
      };

      modal.style.display = 'flex';
    }
    sendResponse({ success: true });
  } else if (request.action === 'processLinks') {
    processLinksAsync(request, sendResponse);
    return true; // Indicate async response
  }
});

function getCourseInfo() {
  // Extract course slug from URL
  const urlMatch = window.location.href.match(/\/learn\/([^\/]+)/);
  const courseSlug = urlMatch ? urlMatch[1] : null;

  // Get courseId from data-click-value (search for element with course_id)
  let courseId = null;
  try {
    // Search ALL data-click-value elements to find one with course_id
    const allClickElements = document.querySelectorAll('[data-click-value]');
    for (const element of allClickElements) {
      try {
        const clickValue = element.getAttribute('data-click-value');
        const decoded = decodeHtmlEntities(clickValue);
        const jsonData = JSON.parse(decoded);

        if (jsonData.course_id) {
          courseId = jsonData.course_id;
          console.log('✓ CourseId found from DOM data-click-value:', courseId);
          break; // Found it, stop searching
        }
      } catch (e) {
        // Skip this element and try the next one
        continue;
      }
    }

    // Fallback: Try window.App if DOM method fails
    if (!courseId) {
      if (window.App?.context?.dispatcher?.stores?.ApplicationStore?.courseId) {
        courseId = window.App.context.dispatcher.stores.ApplicationStore.courseId;
        console.log('✓ CourseId found from window.App:', courseId);
      } else {
        console.warn('⚠️ CourseId not found in DOM or window.App');
      }
    }
  } catch (e) {
    console.error('Error getting course data:', e);
  }

  return { courseSlug, courseId };
}

function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function extractItemIdFromUrl(url) {
  // URL format: /learn/course-slug/type/itemId/...
  // Extract itemId (the part after the type)
  const parts = url.split('/');

  for (let i = 0; i < parts.length; i++) {
    if (['lecture', 'supplement', 'ungradedLab', 'assignment-submission'].includes(parts[i])) {
      return parts[i + 1] || null;
    }
  }
  return null;
}

function getLinkType(url) {
  if (url.includes('/lecture/')) return LINK_TYPES.LECTURE;
  if (url.includes('/supplement/')) return LINK_TYPES.SUPPLEMENT;
  if (url.includes('/ungradedLab/')) return LINK_TYPES.UNGRADED_LAB;
  if (url.includes('/assignment-submission/')) return LINK_TYPES.ASSIGNMENT;
  return LINK_TYPES.OTHER;
}

function scanAllLinks() {
  const { courseSlug, courseId } = getCourseInfo();
  const links = [];
  const linksByType = {};

  // Extract userId from window.App (fresh extraction each time)
  let autoDetectedUserId = null;
  try {
    const appStore = window.App?.context?.dispatcher?.stores?.ApplicationStore;

    // Try path 1: userData.id
    if (appStore?.userData?.id) {
      autoDetectedUserId = appStore.userData.id;
      console.log('✓ UserId found (path 1 - userData.id):', autoDetectedUserId);
    }
    // Try path 2: id directly
    else if (appStore?.id) {
      autoDetectedUserId = appStore.id;
      console.log('✓ UserId found (path 2 - id):', autoDetectedUserId);
    }
    // Try path 3: Check window object
    else if (window.userId) {
      autoDetectedUserId = window.userId;
      console.log('✓ UserId found (path 3 - window.userId):', autoDetectedUserId);
    } else {
      console.warn('⚠️ UserId not found. ApplicationStore may not be loaded yet.');
      console.log('Available appStore:', appStore ? Object.keys(appStore).slice(0, 5) : 'null');
    }
  } catch (e) {
    console.error('Error extracting userId:', e);
  }

  // Warn if course ID not found
  if (!courseId) {
    console.warn('⚠️ Course ID not detected from page. Supplement items may not process correctly.');
  }

  // Initialize counts
  for (const type of Object.values(LINK_TYPES)) {
    linksByType[type] = 0;
  }

  // Get all links with /learn/
  const allLinks = document.querySelectorAll('a[href*="/learn/"]');

  allLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || !href.includes('/learn/')) return;

    const type = getLinkType(href);
    const itemId = extractItemIdFromUrl(href);

    if (!itemId) return;

    links.push({
      type,
      itemId,
      href,
      text: link.textContent?.trim() || ''
    });

    linksByType[type]++;
  });

  // Remove types with 0 count
  for (const type of Object.keys(linksByType)) {
    if (linksByType[type] === 0) {
      delete linksByType[type];
    }
  }

  return {
    courseSlug,
    courseId,
    autoDetectedUserId,
    totalLinks: links.length,
    links,
    linksByType
  };
}

async function processLinksAsync(request, sendResponse) {
  const { userId, courseId, links } = request;
  const { courseSlug } = getCourseInfo();
  const results = [];

  for (let i = 0; i < links.length; i++) {
    const link = links[i];

    try {
      const result = await processLink(link, userId, courseSlug, courseId);
      results.push({
        ...result,
        type: link.type,
        itemId: link.itemId
      });
    } catch (error) {
      results.push({
        type: link.type,
        itemId: link.itemId,
        success: false,
        error: error.message
      });
    }

    // Small delay between requests
    if (i < links.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  sendResponse({ success: true, results });
}

async function processLink(link, userId, courseSlug, courseId) {
  const { type, itemId } = link;

  // Only process Lecture and Supplement types
  switch (type) {
    case LINK_TYPES.LECTURE:
      return await processLecture(userId, courseSlug, itemId);

    case LINK_TYPES.SUPPLEMENT:
      return await processSupplement(userId, courseId, itemId);

    // Skip ungradedLab, assignment-submission, and other types
    case LINK_TYPES.UNGRADED_LAB:
    case LINK_TYPES.ASSIGNMENT:
    case LINK_TYPES.OTHER:
    default:
      return {
        success: true,
        skipped: true,
        error: `${type} type - skipped (not yet supported)`
      };
  }
}

async function processLecture(userId, courseSlug, itemId) {
  const url = `https://www.coursera.org/api/opencourse.v1/user/${userId}/course/${courseSlug}/item/${itemId}/lecture/videoEvents/ended?autoEnroll=false`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
      error: error.name === 'AbortError' ? 'Request timeout (10s)' : error.message
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function processSupplement(userId, courseId, itemId) {
  const url = 'https://www.coursera.org/api/onDemandSupplementCompletions.v1';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  const payload = {
    userId: parseInt(userId),
    courseId: courseId,
    itemId: itemId
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
      error: error.name === 'AbortError' ? 'Request timeout (10s)' : error.message
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Process links and update modal in real-time
async function processLinksOnPage(data) {
  const { links, autoDetectedUserId, userId: popupUserId, courseId } = data;
  const { courseSlug } = getCourseInfo();

  // Use userId from popup input, or fall back to auto-detected
  const finalUserId = popupUserId || autoDetectedUserId;

  if (!finalUserId) {
    alert('❌ User ID not available. Please enter it in the popup and try again.');
    return;
  }

  console.log('Starting processing with userId:', finalUserId);

  // Get modal elements with error checking
  const modalContent = document.getElementById('modal-content');
  const progressContainer = document.getElementById('progress-container');
  const resultsList = document.getElementById('results-list');
  const buttonContainer = document.getElementById('button-container');

  if (!modalContent || !progressContainer || !resultsList || !buttonContainer) {
    console.error('❌ Modal elements not found! IDs:', {
      modalContent: !!modalContent,
      progressContainer: !!progressContainer,
      resultsList: !!resultsList,
      buttonContainer: !!buttonContainer
    });
    alert('❌ Modal elements not found. Please refresh and try again.');
    return;
  }

  // Show progress UI and hide buttons
  modalContent.style.display = 'none';
  progressContainer.style.display = 'block';
  resultsList.style.display = 'block';
  buttonContainer.style.display = 'none';  // Hide buttons during processing

  let completed = 0;

  for (let i = 0; i < links.length; i++) {
    const link = links[i];

    try {
      let result;
      if (link.type === 'lecture') {
        result = await processLecture(finalUserId, courseSlug, link.itemId);
      } else {
        result = await processSupplement(finalUserId, courseId, link.itemId);
      }

      // Add result to list
      const item = document.createElement('div');
      let icon, bg, color;

      if (result.skipped) {
        icon = '⊘';  // Skipped icon
        bg = '#fff3e0';
        color = '#e65100';
      } else if (result.success) {
        icon = '✓';
        bg = '#f1f8e9';
        color = '#33691e';
      } else {
        icon = '✗';
        bg = '#ffebee';
        color = '#b71c1c';
      }

      item.style.cssText = `padding: 8px 10px; background: ${bg}; color: ${color}; border-radius: 4px; margin-bottom: 5px; font-size: 12px;`;
      item.textContent = `${icon} ${link.type}: ${link.itemId}${result.error ? ' (' + result.error + ')' : ''}`;
      resultsList.appendChild(item);

      completed++;
      const percentage = (completed / links.length) * 100;
      const progressFill = document.getElementById('progress-fill');
      const progressText = document.getElementById('progress-text');
      if (progressFill) progressFill.style.width = percentage + '%';
      if (progressText) progressText.textContent = `${completed}/${links.length} completed`;

      // Small delay between requests
      if (i < links.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error processing link:', error);
      completed++;
    }
  }

  console.log('✓ Processing complete!');

  // Show done button
  if (buttonContainer) {
    buttonContainer.style.display = 'flex';
  }
  const cancelBtn = document.getElementById('modal-cancel');
  const confirmBtn = document.getElementById('modal-confirm');
  if (cancelBtn) cancelBtn.textContent = 'CLOSE';
  if (confirmBtn) confirmBtn.style.display = 'none';
}
