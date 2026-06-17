let currentPageData = null;
let lastProcessedUrl = null;

// DOM Elements
const userIdInput = document.getElementById('userIdInput');
const scanButton = document.getElementById('scanButton');
const processButton = document.getElementById('processButton');
const userIdSection = document.getElementById('userIdSection');
const statusSection = document.getElementById('statusSection');
const errorSection = document.getElementById('errorSection');
const courseInfoSection = document.getElementById('courseInfoSection');
const progressSection = document.getElementById('progressSection');
const confirmModal = document.getElementById('confirmModal');
const modalMessage = document.getElementById('modalMessage');
const modalConfirm = document.getElementById('modalConfirm');
const modalCancel = document.getElementById('modalCancel');
const modalClose = document.getElementById('modalClose');
const pageStatus = document.getElementById('pageStatus');
const errorMessage = document.getElementById('errorMessage');
const courseInfo = document.getElementById('courseInfo');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressList = document.getElementById('progressList');
const linkTypesSummary = document.getElementById('linkTypesSummary');

// Reset popup when URL changes
function resetPopupIfUrlChanged() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0]?.url;
    if (currentUrl && lastProcessedUrl && currentUrl !== lastProcessedUrl) {
      resetPopup();
    }
    lastProcessedUrl = currentUrl;
  });
}

// Reset popup to initial state
function resetPopup() {
  currentPageData = null;
  progressSection.style.display = 'none';
  progressList.innerHTML = '';
  statusSection.style.display = 'none';
  courseInfoSection.style.display = 'none';
  userIdSection.style.display = 'block';
  scanButton.disabled = false;
  scanButton.textContent = 'Scan Page';
  processButton.style.display = 'none';
  console.log('Popup reset for new page');
}

// Initialize popup
function initializePopup() {
  // Reset if URL changed
  resetPopupIfUrlChanged();

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
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}

// Save userId
userIdInput.addEventListener('change', () => {
  if (userIdInput.value.trim()) {
    chrome.storage.local.set({ userId: userIdInput.value.trim() });
  }
});

// Scan button
scanButton.addEventListener('click', scanPage);

// Modal buttons
modalConfirm.addEventListener('click', startProcessing);
modalCancel.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);

function showNotOnCoursPage() {
  scanButton.disabled = true;
  processButton.style.display = 'none';
  userIdSection.style.display = 'none';
  statusSection.style.display = 'none';
  courseInfoSection.style.display = 'none';
  progressSection.style.display = 'none';
  errorSection.style.display = 'block';
  errorMessage.textContent = 'You are not on a Coursera course page.';
}

function scanPage() {
  scanButton.disabled = true;
  scanButton.textContent = 'Scanning...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'scanLinks' }, (response) => {
      scanButton.disabled = false;
      scanButton.textContent = 'Scan Page';

      // Check for runtime errors
      if (chrome.runtime.lastError) {
        console.error('Content script error:', chrome.runtime.lastError.message);
        errorSection.style.display = 'block';
        statusSection.style.display = 'none';
        courseInfoSection.style.display = 'none';
        progressSection.style.display = 'none';
        errorMessage.textContent = 'Content script not loaded. Try refreshing the Coursera page and scanning again.';
        return;
      }

      if (response && response.success) {
        currentPageData = response.data;
        displayScanResults(response.data);
      } else {
        errorSection.style.display = 'block';
        statusSection.style.display = 'none';
        courseInfoSection.style.display = 'none';
        progressSection.style.display = 'none';
        errorMessage.textContent = response?.error || 'Failed to scan page. Please refresh the page and try again.';
      }
    });
  });
}

function displayScanResults(data) {
  // Update the tracked URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    lastProcessedUrl = tabs[0]?.url;
  });

  errorSection.style.display = 'none';
  statusSection.style.display = 'block';
  courseInfoSection.style.display = 'block';
  progressSection.style.display = 'none';

  pageStatus.textContent = `Found ${data.totalLinks} links on page`;

  // Auto-fill User ID if detected (ALWAYS set it)
  if (data.autoDetectedUserId) {
    userIdInput.value = data.autoDetectedUserId;
    chrome.storage.local.set({ userId: data.autoDetectedUserId });
    console.log('✓ Auto-filled User ID:', data.autoDetectedUserId);
  }

  const courseHtml = `
    <strong>Course:</strong> ${data.courseSlug || 'Unknown'}<br>
    <strong>Course ID:</strong> ${data.courseId || 'Not detected'}<br>
    <strong>Links by Type:</strong><br>
    <div style="margin-left: 10px; margin-top: 8px;">
      ${Object.entries(data.linksByType)
        .map(([type, count]) => `<span style="display: inline-block; margin-right: 15px;">
          <strong>${type}:</strong> ${count}
        </span>`)
        .join('')}
    </div>
  `;

  courseInfo.innerHTML = courseHtml;
  processButton.style.display = 'block';
}

function showConfirmModal(data) {
  modalMessage.innerHTML = `
    <strong>Ready to process ${data.totalLinks} links?</strong><br>
    <br>
    The following link types will be processed:<br>
  `;

  let summaryHtml = '';
  for (const [type, count] of Object.entries(data.linksByType)) {
    summaryHtml += `
      <div class="link-type-item">
        <span class="link-type-name">${formatTypeName(type)}</span>
        <span class="link-type-count">${count}</span>
      </div>
    `;
  }

  linkTypesSummary.innerHTML = summaryHtml;
  confirmModal.style.display = 'flex';
}

function formatTypeName(type) {
  const names = {
    'lecture': 'Video Lectures',
    'supplement': 'Supplements',
    'ungradedLab': 'Ungraded Labs',
    'assignment-submission': 'Assignments',
    'other': 'Other'
  };
  return names[type] || type;
}

function closeModal() {
  confirmModal.style.display = 'none';
}

function startProcessing() {
  closeModal();
  if (!currentPageData) return;

  const userId = userIdInput.value.trim();
  if (!userId) {
    alert('❌ User ID is required. It should have been auto-filled. Try scanning the page again.');
    return;
  }

  // Save userId
  chrome.storage.local.set({ userId });

  progressSection.style.display = 'block';
  progressList.innerHTML = '';
  processButton.disabled = true;

  const payload = {
    action: 'processLinks',
    userId,
    courseId: currentPageData.courseId,
    links: currentPageData.links
  };

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, payload, (response) => {
      if (response && response.results) {
        displayProgress(response.results);
      }
      processButton.disabled = false;
    });
  });
}

function displayProgress(results) {
  progressList.innerHTML = '';

  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const percentage = (successful / total) * 100;

  progressFill.style.width = percentage + '%';
  progressText.textContent = `${successful}/${total} completed`;

  results.forEach((result) => {
    const item = document.createElement('div');
    item.className = `progress-item ${result.success ? 'success' : 'error'}`;

    const icon = result.success ? '✓' : '✗';
    const status = result.success ? 'Completed' : 'Failed';

    item.innerHTML = `
      <span class="progress-icon">${icon}</span>
      <span>
        <strong>${formatTypeName(result.type)}:</strong> ${result.itemId}
        ${!result.success ? `<br><small>${result.error || 'Unknown error'}</small>` : ''}
      </span>
    `;

    progressList.appendChild(item);
  });
}

// Handle process button click
processButton.addEventListener('click', () => {
  if (currentPageData) {
    // Check if userId is available
    const userId = userIdInput.value.trim();
    if (!userId) {
      alert('❌ User ID is required. Please enter it manually or try scanning again.');
      return;
    }

    // Add userId to data
    currentPageData.userId = userId;

    // Show modal on the page instead of in popup
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'showModal',
        data: currentPageData
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to show modal:', chrome.runtime.lastError.message);
        } else {
          console.log('Modal shown on page');
        }
      });
    });
  }
});
