import 'whatwg-fetch';

import { analyticsSvc } from './module/analytics';
import { authSvc } from './module/auth';
import store from './redux';

const initDefaults = {
  credentials: 'same-origin'
};

const validateStatus = (response) => {
  if (response.ok) {
    return response;
  }
  if (response.status === 401) {
    authSvc.logout(window.location.pathname);
  }
  if (response.status === 403) {
    const error = new Error('Access denied due to cluster policy.');
    error.response = response;
    throw error;
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || contentType.indexOf('json') === -1) {
    const error = new Error(response.statusText);
    error.response = response;
    throw error;
  }

  return response.json().then(json => {
    const cause = _.get(json, 'details.causes[0]');
    let reason;
    if (cause) {
      reason = `Error "${cause.message}" for field "${cause.field}".`;
    }
    if (!reason) {
      reason = json.message;
    }
    if (!reason) {
      reason = response.statusText;
    }
    const error = new Error(reason);
    error.response = response;
    throw error;
  });
};

export const coFetch = (url, options = {}) => {
  const allOptions = _.defaultsDeep({}, initDefaults, options);

  // Initiate both the fetch promise and a timeout promise
  return Promise.race([
    fetch(url, allOptions).then(validateStatus),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Call to ${url} timed out`)), 5000)),
  ]);
};

const parseJson = (response) => response.json();

export const coFetchUtils = {
  parseJson
};

export const coFetchJSON = (url, method = 'GET', options = {}) => {
  const headers = {Accept: 'application/json'};
  const {kind, name} = store.getState().UI.get('impersonate', {});
  if ((kind === 'User' || kind === 'Group') && name) {
    // Even if we are impersonating a group, we still need to set Impersonate-User to something or k8s will complain
    headers['Impersonate-User'] = name;
    if (kind === 'Group') {
      headers['Impersonate-Group'] = name;
    }
  }
  const allOptions = _.defaultsDeep({method, headers}, options);

  return coFetch(url, allOptions).then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        analyticsSvc.error(`${text}: ${method} ${response.url}`);
      });
    }

    // If the response has no body, return promise that resolves with an empty object
    if (response.headers.get('Content-Length') === '0') {
      return Promise.resolve({});
    }
    return response.json();
  });
};

const coFetchSendJSON = (url, method, json = undefined, options = {}) => {
  const allOptions = {
    headers: {
      Accept: 'application/json',
      'Content-Type': `application/${method === 'PATCH' ? 'json-patch+json' : 'json'};charset=UTF-8`,
    },
  };
  if(json) {
    allOptions.body = JSON.stringify(json);
  }
  return coFetchJSON(url, method, _.defaultsDeep(allOptions, options));
};

coFetchJSON.delete = (url, options = {}) => coFetchJSON(url, 'DELETE', options);
coFetchJSON.post = (url, json, options = {}) => coFetchSendJSON(url, 'POST', json, options);
coFetchJSON.put = (url, json, options = {}) => coFetchSendJSON(url, 'PUT', json, options);
coFetchJSON.patch = (url, json, options = {}) => coFetchSendJSON(url, 'PATCH', json, options);