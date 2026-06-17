// Page Modal Handler - Injected into Coursera page via content script

class PageModal {
  constructor() {
    this.modal = null;
    this.currentData = null;
    this.init();
  }

  init() {
    // Inject modal HTML into page
    const modalHTML = `
      <div id="coursera-automation-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 12px; padding: 30px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 20px -30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h2 style="margin: 0; font-size: 24px;">Processing Course</h2>
          </div>

          <div id="modal-content"></div>

          <div id="progress-container" style="display: none; margin-top: 20px;">
            <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin-bottom: 10px;">
              <div id="progress-fill" style="height: 100%; background: linear-gradient(90deg, #4caf50 0%, #45a049 100%); width: 0%; transition: width 0.3s ease;"></div>
            </div>
            <p id="progress-text" style="text-align: center; color: #666; margin: 0; font-size: 14px;">0/0 completed</p>
          </div>

          <div id="results-list" style="display: none; margin-top: 20px; max-height: 300px; overflow-y: auto;"></div>

          <div id="button-container" style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="modal-cancel" style="flex: 1; padding: 12px; border: none; border-radius: 6px; background: #e0e0e0; color: #333; font-weight: 600; cursor: pointer; font-size: 14px;">CANCEL</button>
            <button id="modal-confirm" style="flex: 1; padding: 12px; border: none; border-radius: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; cursor: pointer; font-size: 14px;">CONFIRM & START</button>
          </div>
        </div>
      </div>
    `;

    // Create and inject modal
    const container = document.createElement('div');
    container.innerHTML = modalHTML;
    document.body.appendChild(container);

    this.modal = document.getElementById('coursera-automation-modal');
    this.setupEventListeners();
  }

  setupEventListeners() {
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    confirmBtn.addEventListener('click', () => this.confirm());
    cancelBtn.addEventListener('click', () => this.close());
  }

  show(data) {
    this.currentData = data;

    const content = document.getElementById('modal-content');
    const linkTypes = data.linksByType;

    let html = `
      <p style="font-size: 16px; margin-top: 0;"><strong>Ready to process ${data.totalLinks} links?</strong></p>
      <p style="color: #666; font-size: 14px;">The following link types will be processed:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 6px;">
    `;

    for (const [type, count] of Object.entries(linkTypes)) {
      html += `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
          <span style="font-weight: 600; color: #667eea;">${this.formatTypeName(type)}</span>
          <span style="background: #667eea; color: white; padding: 2px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${count}</span>
        </div>
      `;
    }

    html += `</div>`;
    content.innerHTML = html;

    this.modal.style.display = 'flex';
  }

  formatTypeName(type) {
    const names = {
      'lecture': 'Video Lectures',
      'supplement': 'Supplements',
      'ungradedLab': 'Ungraded Labs',
      'assignment-submission': 'Assignments',
      'other': 'Other'
    };
    return names[type] || type;
  }

  showProgress() {
    document.getElementById('modal-content').style.display = 'none';
    document.getElementById('progress-container').style.display = 'block';
    document.getElementById('results-list').style.display = 'block';
  }

  updateProgress(completed, total) {
    const percentage = (completed / total) * 100;
    document.getElementById('progress-fill').style.width = percentage + '%';
    document.getElementById('progress-text').textContent = `${completed}/${total} completed`;
  }

  addResult(result) {
    const resultsList = document.getElementById('results-list');
    const item = document.createElement('div');
    const icon = result.success ? '✓' : '✗';
    const bg = result.success ? '#f1f8e9' : '#ffebee';
    const color = result.success ? '#33691e' : '#b71c1c';

    item.style.cssText = `
      padding: 8px 10px;
      background: ${bg};
      color: ${color};
      border-radius: 4px;
      margin-bottom: 5px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    item.innerHTML = `
      <strong>${icon}</strong>
      <span>
        <strong>${this.formatTypeName(result.type)}:</strong> ${result.itemId}
        ${!result.success ? `<br><small>${result.error || 'Unknown error'}</small>` : ''}
      </span>
    `;

    resultsList.appendChild(item);
  }

  confirm() {
    // Send message to popup to start processing
    chrome.runtime.sendMessage({
      action: 'startProcessing',
      data: this.currentData
    }, (response) => {
      if (response && response.success) {
        console.log('Processing started');
      }
    });
  }

  close() {
    this.modal.style.display = 'none';
    this.currentData = null;
  }

  reset() {
    document.getElementById('modal-content').style.display = 'block';
    document.getElementById('progress-container').style.display = 'none';
    document.getElementById('results-list').style.display = 'none';
    document.getElementById('results-list').innerHTML = '';
  }
}

// Create global instance
window.pageModal = new PageModal();

console.log('✓ Page Modal initialized');
