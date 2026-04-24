'use strict';

const https = require('https');

/**
 * Claude API call කරනවා
 * @param {string} prompt - User prompt
 * @param {string} apiKey - Claude API key
 * @returns {Promise<string>} - AI response
 */
function callClaude(prompt, apiKey) {
  return new Promise(function(resolve, reject) {
    if (!apiKey || apiKey.trim() === '') {
      reject(new Error('API Key නැහැ. "Set Claude API Key" command run කරන්න.'));
      return;
    }

    var bodyData = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    var options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData),
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01'
      }
    };

    var req = https.request(options, function(res) {
      var data = '';

      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {
        try {
          var parsed = JSON.parse(data);

          if (parsed.error) {
            reject(new Error('API Error: ' + parsed.error.message));
            return;
          }

          if (
            parsed.content &&
            parsed.content.length > 0 &&
            parsed.content[0].text
          ) {
            resolve(parsed.content[0].text);
          } else {
            reject(new Error('Invalid response from Claude API'));
          }
        } catch (e) {
          reject(new Error('Response parse error: ' + e.message));
        }
      });
    });

    req.on('error', function(e) {
      reject(new Error('Network error: ' + e.message));
    });

    req.setTimeout(30000, function() {
      req.destroy();
      reject(new Error('Request timeout. Internet connection check කරන්න.'));
    });

    req.write(bodyData);
    req.end();
  });
}

module.exports = { callClaude };
