// @flow

import {
  ClientMessage,
  AllowedResponse,
} from './types';

type ErrorResponse = { error: 'WTF?' };

type ChromeOnMessageHandlerSendResponse = (response: AllowedResponse | ErrorResponse) => void;

type ChromeOnMessageHandler = (
  request: ClientMessage,
  sender: { tab: { id: number } },
  sendResponse: ChromeOnMessageHandlerSendResponse
) => void | Object;

type ChromeOnBeforeRequestHandler =
  (details: { url: string, tabId: number }) => void | Object;

declare class Chrome {
  storage: {
    sync: {
      get: (obj: Object, callback: (items: { urls: Array<string> }) => void) => void,
    },
    onChanged: {
      addListener: (fn: () => void) => void,
    },
  };
  runtime: {
    getURL: (resource: string) => string,
    onMessage: {
      addListener: (handler: ChromeOnMessageHandler) => void,
    },
    sendMessage: (message: ClientMessage, fn: (response: AllowedResponse) => void) => void,
  };
  webRequest: {
    onBeforeRequest: {
      addListener: (handler: ChromeOnBeforeRequestHandler) => void,
    },
  };
}

declare var chrome: Chrome;
