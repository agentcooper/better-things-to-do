'use strict';

let blockedUrls = {};

const whitelistTabIds = {};

const whitelistTab = (tabId, status) => {
  console.log('tab: %s, status: %s', tabId, status);
  whitelistTabIds[tabId] = status;
};

const getKey = (url) =>
  Object.keys(blockedUrls).find(key =>
    url.includes('://' + key) ||
    url.includes('://www.' + key)
  );

const getUnblockCount = (url) => blockedUrls[getKey(url)].unblockCount;

const getLastVisit = (url) => {
  const visits = blockedUrls[getKey(url)].visits;
  return visits[visits.length - 1];
};

const isBlocked = (url) => {
  const blockedUrl = blockedUrls[getKey(url)];

  return blockedUrl ? blockedUrl.isBlocked : false;
};

const setBlock = (url, isBlocked) => {
  blockedUrls[getKey(url)].isBlocked = isBlocked;

  if (!isBlocked) {
    blockedUrls[getKey(url)].unblockCount += 1;
    blockedUrls[getKey(url)].visits.push({
      timestamp: Date.now()
    });
  }

  console.log('url: %s, blocked: %s', url, isBlocked);
};

const setup = () => {
  chrome.storage.sync.get({
    urls: []
  }, (items) => {
    blockedUrls = items.urls.reduce((obj, url) =>
      Object.assign(obj, {
        [url]: {
          isBlocked: true,
          unblockCount: 0,
          visits: []
        }
      }), {});

    console.log('Installed urls', blockedUrls);
  })
}

const blockedHTMLUrl = chrome.runtime.getURL('index.html');

chrome.webRequest.onBeforeRequest.addListener((details) => {
  if (details.url.startsWith('chrome-extension://')) {
    return;
  }
  if (details.url.startsWith('file://')) {
    return;
  }
  if (details.tabId < 0) {
    return;
  }
  if (whitelistTabIds[details.tabId]) {
    return;
  }

  const shouldBlockUrl = isBlocked(details.url);

  if (!shouldBlockUrl) {
    return;
  }

  const redirectUrl =
    blockedHTMLUrl + '#' +
    encodeURIComponent(
      JSON.stringify({
        url: details.url,
        unblockCount: getUnblockCount(details.url),
        lastVisit: getLastVisit(details.url),
      })
    );

  if (details.type === 'main_frame') {
    console.log('Blocking request to %s', details.url);
    console.log('Redirect to %s', redirectUrl);

    return {
      redirectUrl: redirectUrl
    };
  }
}, {
  urls: ['<all_urls>']
}, ['blocking']);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!sender.tab) {
    return;
  }

  const tabId = sender.tab.id;

  if (tabId < 0) {
    return;
  }


  if (!request.allow) {
    return sendResponse({ error: 'WTF?' });
  }

  if (isBlocked(request.allow)) {
    setBlock(request.allow, false);
    whitelistTab(tabId, true);

    console.log('Will block %s in %s', request.allow, request.time);
    setTimeout(() => {
      setBlock(request.allow, true);
      whitelistTab(tabId, false);
    }, request.time);

    sendResponse({ allowed: !isBlocked(request.allow), timeout: request.time });
  } else {
    sendResponse({ allowed: true });
  }
});

chrome.storage.onChanged.addListener(() => {
  console.log('Storage changed');

  setup();
});

setup();

