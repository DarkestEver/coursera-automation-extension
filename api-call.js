// API POST request script

const urls = [
  'https://www.coursera.org/api/opencourse.v1/user/131576213/course/intro-to-data-engineering/item/mFkUs/lecture/videoEvents/play?autoEnroll=false',
  'https://www.coursera.org/api/opencourse.v1/user/131576213/course/intro-to-data-engineering/item/mFkUs/lecture/videoEvents/ended?autoEnroll=false'
];

// Configuration
const config = {
  authToken: null, // Set your token here, or load from localStorage/environment
  userId: '131576213'
};

// Payload
const payload = {
  contentRequestBody: {}
};

// Auto-load token from localStorage if available
function loadAuthToken() {
  if (typeof localStorage !== 'undefined') {
    config.authToken = localStorage.getItem('coursera_auth_token');
  }
}

// Method 1: Using Fetch API with automatic cookies (Modern, recommended)
async function callAPIsWithFetch() {
  try {
    for (const url of urls) {
      console.log(`Calling: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // Automatically include cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Method 2: Using Fetch with auto auth and cookies
async function callAPIsWithAutoAuth() {
  loadAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0'
  };

  // Add auth token if available
  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }

  try {
    for (const url of urls) {
      console.log(`Calling: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // Include cookies automatically
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Method 3: Using XMLHttpRequest with auto auth and cookies
function callAPIsWithXHRAuth() {
  loadAuthToken();

  urls.forEach(url => {
    console.log(`Calling: ${url}`);
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true; // Include cookies automatically
    xhr.open('POST', url, true);

    // Set auth headers if token available
    if (config.authToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${config.authToken}`);
    }
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function() {
      if (xhr.status === 200) {
        console.log('Response:', JSON.parse(xhr.responseText));
      } else {
        console.error(`Error: ${xhr.status} - ${xhr.statusText}`);
      }
    };
    xhr.onerror = function() {
      console.error('Network error');
    };
    xhr.send(JSON.stringify(payload));
  });
}

// Run the fetch API POST method with automatic cookies (uncomment to use)
 callAPIsWithFetch();

// Or run POST with auto auth and cookies:
// callAPIsWithAutoAuth();

// Or run XMLHttpRequest POST version with auto auth and cookies:
// callAPIsWithXHRAuth();
