// @flow

'use strict';

import type {
  Visit,
  ClientMessage,
  ClientPayload,
} from './types';

// https://api.twitter.com/oauth/authenticate?oauth_token=...
// https://www.facebook.com/login.php?...
const alwaysAllow = [
  /\/facebook\.com\/login\.php/,
  /\/oauth/,
];

type UrlEntry = {
  url: string,
  isBlocked: boolean,
  unblockCount: number,
  visits: Array<Visit>,
};

type Entries = { [url: string]: UrlEntry };

let blockedUrls: Entries = {};

const whitelistTabIds: { [tabId: string]: boolean } = {};

const shouldAlwaysAllow = (url: string): boolean =>
  alwaysAllow.some(rx => url.match(rx));

const whitelistTab = (tabId: number, status: boolean) => {
  console.log('tab: %s, status: %s', tabId, status);
  whitelistTabIds[String(tabId)] = status;
};

const getKey = (url: string): ?string =>
  Object.keys(blockedUrls).find(key =>
    url.includes('://' + key) ||
    url.includes('://www.' + key)
  );

const getEntry = (url: string): ?UrlEntry => {
  const key = getKey(url);

  if (key && blockedUrls[key]) {
    return {
      ...blockedUrls[key],
      url,
    };
  }

  return null;
};

const getLastVisit = (url: UrlEntry): ?Visit => {
  const visits = url.visits;
  return visits[visits.length - 1];
};

const isBlocked = (entry: UrlEntry): boolean => {
  if (!entry) {
    return false;
  }

  if (shouldAlwaysAllow(entry.url)) {
    return false;
  }

  return entry.isBlocked;
};

const setBlock = (entry: UrlEntry, isBlocked: boolean) => {
  entry.isBlocked = isBlocked;

  if (!isBlocked) {
    entry.unblockCount += 1;
    entry.visits.push({
      timestamp: Date.now()
    });
  }

  console.log('url: %s, blocked: %s', entry.url, isBlocked);
};

const setup = () => {
  chrome.storage.sync.get({
    urls: []
  }, (items) => {
    blockedUrls = items.urls.reduce((obj, url) =>
      Object.assign(obj, {
        [url]: {
          url,
          isBlocked: true,
          unblockCount: 0,
          visits: []
        }
      }), {});

    console.log('Installed urls', blockedUrls);
  })
}

const blockedHTMLUrl = chrome.runtime.getURL('index.html');

const encode = (entry: UrlEntry): string => {
  const clientData: ClientPayload = {
    url: entry.url,
    unblockCount: entry.unblockCount,
    lastVisit: getLastVisit(entry),
  };

  return JSON.stringify(clientData);
};

chrome.webRequest.onBeforeRequest.addListener((details) => {
  if (details.url.startsWith('chrome-extension://')) {
    return;
  }
  if (details.url.startsWith('file://')) {
    return;
  }
  if (Number(details.tabId) < 0) {
    return;
  }
  if (whitelistTabIds[String(details.tabId)]) {
    return;
  }

  const entry = getEntry(details.url);

  if (!entry) {
    return;
  }

  const shouldBlockUrl = isBlocked(entry);

  if (!shouldBlockUrl) {
    return;
  }

  const redirectUrl =
    blockedHTMLUrl + '#' +
    encodeURIComponent(encode(entry));

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

chrome.runtime.onMessage.addListener((request: ClientMessage, sender, sendResponse) => {
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

  const entry = getEntry(request.allow);

  if (!entry) {
    return;
  }

  if (isBlocked(entry)) {
    setBlock(entry, false);
    whitelistTab(tabId, true);

    console.log('Will block %s in %s', request.allow, request.time);
    setTimeout(() => {
      setBlock(entry, true);
      whitelistTab(tabId, false);
    }, request.time);

    const response: AllowedResponse = {
      allowed: !isBlocked(entry),
      timeout: request.time,
    };

    sendResponse(response);
  } else {
    sendResponse({ allowed: true });
  }
});

chrome.storage.onChanged.addListener(() => {
  console.log('Storage changed');

  setup();
});

setup();
