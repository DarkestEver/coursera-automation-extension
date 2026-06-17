// Background Service Worker
// Handles extension initialization and tab updates

chrome.runtime.onInstalled.addListener(() => {
  console.log('Coursera Progress Automation extension installed');

  // Initialize storage
  chrome.storage.local.get('userId', (result) => {
    if (!result.userId) {
      chrome.storage.local.set({ userId: '' });
    }
  });
});

// Update icon based on active tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateIcon(activeInfo.tabId);
});

function updateIcon(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    if (tab?.url?.includes('coursera.org/learn/')) {
      chrome.action.setTitle({ tabId, title: 'Click to open Coursera Progress Tool' });
    } else {
      chrome.action.setTitle({ tabId, title: 'Coursera Progress Tool (Not on Learn page)' });
    }
  });
}
