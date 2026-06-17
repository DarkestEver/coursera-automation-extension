  // Build Coursera API URLs from course-provider links

  // Method 1: Build API URLs from itemId and open_course_slug
  function buildAPIUrlsFromClickData() {
    const userId = '131576213';
    const container = document.querySelector('[data-testid="course-provider"]');

    if (!container) {
      console.error('No element with data-testid="course-provider" found');
      return [];
    }

    const apiUrls = Array.from(container.querySelectorAll('[data-track-href]'))
      .filter(el => {
        const href = el.getAttribute('data-track-href');
        return href && href.includes('/learn/') && href.includes('/lecture/');
      })
      .map(el => {
        try {
          const clickValueJson = el.getAttribute('data-click-value');
          if (!clickValueJson) return null;

          // Parse the JSON data
          const clickData = JSON.parse(clickValueJson);
          const itemId = clickData.itemId;
          const courseSlug = clickData.open_course_slug;
          const href = clickData.href;

          if (!itemId || !courseSlug) return null;

          return {
            href: href,
            itemId: itemId,
            courseSlug: courseSlug,
            text: el.textContent?.trim() || '',
            apiUrl: `https://www.coursera.org/api/opencourse.v1/user/${userId}/course/${courseSlug}/item/${itemId}/lecture/videoEvents/ended?autoEnroll=false`
          };
        } catch (e) {
          console.error('Error parsing click data:', e);
          return null;
        }
      })
      .filter(item => item !== null);

    console.log(`Built ${apiUrls.length} API URLs:`);
    apiUrls.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.apiUrl}`);
    });
    return apiUrls;
  }

  // Method 2: Copy built API URLs to clipboard
  function copyBuiltAPIUrlsToClipboard() {
    const apiUrls = buildAPIUrlsFromClickData();
    const text = apiUrls.map(item => item.apiUrl).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      console.log(`Copied ${apiUrls.length} API URLs to clipboard`);
    });
  }

  // Method 3: Export built API URLs as JSON
  function exportBuiltAPIUrlsAsJSON() {
    const apiUrls = buildAPIUrlsFromClickData();

    const json = JSON.stringify(apiUrls, null, 2);
    console.log(json);

    // Download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-urls-from-click-data.json';
    a.click();

    return apiUrls;
  }

  // Method 4: Get just the API URLs as array
  function getBuiltAPIUrls() {
    const apiUrls = buildAPIUrlsFromClickData();
    return apiUrls.map(item => item.apiUrl);
  }

  // Method 5: Call all built API URLs with POST request
  async function callAllBuiltAPIs(delayMs = 2500) {
    const payload = {
      contentRequestBody: {}
    };

    const apiUrls = buildAPIUrlsFromClickData();
    const results = [];

    console.log(`Starting to call ${apiUrls.length} APIs with ${delayMs}ms delay between calls...`);

    for (let i = 0; i < apiUrls.length; i++) {
      const item = apiUrls[i];

      try {
        console.log(`[${i + 1}/${apiUrls.length}] Calling: ${item.apiUrl}`);

        const response = await fetch(item.apiUrl, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        results.push({
          success: response.ok,
          status: response.status,
          apiUrl: item.apiUrl,
          itemId: item.itemId,
          courseSlug: item.courseSlug,
          response: data,
          timestamp: new Date().toISOString()
        });

        console.log(`✓ Success: ${response.status} - ${item.apiUrl}`);

        // Wait before next request (except for last one)
        if (i < apiUrls.length - 1) {
          console.log(`Waiting ${delayMs}ms before next call...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          apiUrl: item.apiUrl,
          itemId: item.itemId,
          courseSlug: item.courseSlug,
          timestamp: new Date().toISOString()
        });
        console.error(`✗ Error: ${error.message} - ${item.apiUrl}`);

        // Still wait before next request
        if (i < apiUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    console.log(`\nCompleted! Results summary:`);
    console.table(results);
    return results;
  }

  // Method 6: Export API call results as JSON
  function exportAPICallResults(results) {
    const json = JSON.stringify(results, null, 2);
    console.log(json);

    // Download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-call-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    return results;
  }

  // Main function: Run the entire process
  async function runCourseLectureProcess(delayMs = 2500) {
    console.log('========================================');
    console.log('Coursera Lecture Process Started');
    console.log('========================================\n');

    try {
      // Step 1: Build API URLs
      console.log('STEP 1: Building API URLs from course-provider...');
      const apiUrls = buildAPIUrlsFromClickData();

      if (apiUrls.length === 0) {
        console.warn('No API URLs found. Make sure you are on a Coursera course page.');
        return;
      }

      console.log(`Found ${apiUrls.length} URLs to process.\n`);

      // Step 2: Call all APIs
      console.log(`STEP 2: Calling all APIs with ${delayMs}ms delay...\n`);
      const results = await callAllBuiltAPIs(delayMs);

      // Step 3: Export results
      console.log('\nSTEP 3: Exporting results...');
      exportAPICallResults(results);

      // Step 4: Summary
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      console.log('\n========================================');
      console.log('Process Completed!');
      console.log('========================================');
      console.log(`Total Calls: ${results.length}`);
      console.log(`✓ Success: ${successCount}`);
      console.log(`✗ Failed: ${failureCount}`);
      console.log(`Delay Between Calls: ${delayMs}ms`);
      console.log(`Total Time: ~${(results.length * delayMs / 1000).toFixed(1)}s`);
      console.log('========================================\n');

      return results;
    } catch (error) {
      console.error('Fatal error:', error);
      throw error;
    }
  }

  // Usage:
  // Main function - Run everything:
  // runCourseLectureProcess()                 - Run with default 2.5s delay
  // runCourseLectureProcess(3000)             - Run with 3s delay
  // runCourseLectureProcess(5000)             - Run with 5s delay

  // Individual functions:
  // buildAPIUrlsFromClickData()               - Build and show API URLs from click data
  // callAllBuiltAPIs()                        - Call all APIs with 2.5s delay (async)
  // callAllBuiltAPIs(3000)                    - Call all APIs with 3s delay
  // copyBuiltAPIUrlsToClipboard()             - Copy built API URLs
  // getBuiltAPIUrls()                         - Get just the API URLs
  // exportBuiltAPIUrlsAsJSON()                - Download with all metadata
  runCourseLectureProcess()