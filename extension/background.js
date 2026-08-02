chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    tab.url.includes('football.fantasysports.yahoo.com/f1/')
  ) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    }).catch(err => console.log('Script injection error:', err));
  }
});
