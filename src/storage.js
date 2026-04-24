'use strict';

var KEY_NAME = 'devassist_api_key';

/**
 * API Key save කරනවා (globalState)
 * @param {object} context - VS Code extension context
 * @param {string} key - API Key
 */
function saveApiKey(context, key) {
  context.globalState.update(KEY_NAME, key);
}

/**
 * Saved API Key ගන්නවා
 * @param {object} context - VS Code extension context
 * @returns {string|undefined}
 */
function getApiKey(context) {
  return context.globalState.get(KEY_NAME);
}

/**
 * API Key delete කරනවා
 * @param {object} context - VS Code extension context
 */
function clearApiKey(context) {
  context.globalState.update(KEY_NAME, undefined);
}

module.exports = { saveApiKey, getApiKey, clearApiKey };
