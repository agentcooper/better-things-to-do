// @flow

export type ClientMessage = { allow: string, time: number };

export type AllowedResponse = {
  allowed: boolean,
  timeout?: number,
};

export type ClientPayload = {
  url: string,
  unblockCount: number,
  lastVisit: ?Visit,
};

export type Visit = { timestamp: number };
