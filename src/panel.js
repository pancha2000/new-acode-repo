'use strict';

var vscode = require('vscode');
var path = require('path');
var fs = require('fs');

var currentPanel = null;

/**
 * Result panel open කරනවා
 * @param {string} title - Panel title
 * @param {string} content - Content to show
 * @param {object} context - Extension context
 */
function showResultPanel(title, content, context) {
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Beside);
    currentPanel.title = title;
    currentPanel.webview.postMessage({ type: 'update', content: content });
    return;
  }

  currentPanel = vscode.window.createWebviewPanel(
    'devassistResult',
    title,
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  currentPanel.webview.html = getWebviewHtml(content);

  currentPanel.webview.onDidReceiveMessage(function(message) {
    if (message.type === 'copy') {
      vscode.env.clipboard.writeText(message.text).then(function() {
        vscode.window.showInformationMessage('Copied to clipboard!');
      });
    }
  });

  currentPanel.onDidDispose(function() {
    currentPanel = null;
  });
}

/**
 * Webview HTML generate කරනවා
 */
function getWebviewHtml(content) {
  var escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>DevAssist AI</title>\n' +
    '<style>\n' +
    '  * { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    '  body {\n' +
    '    font-family: "Segoe UI", system-ui, sans-serif;\n' +
    '    background: #1e1e2e;\n' +
    '    color: #cdd6f4;\n' +
    '    padding: 16px;\n' +
    '    font-size: 14px;\n' +
    '    line-height: 1.6;\n' +
    '  }\n' +
    '  .header {\n' +
    '    display: flex;\n' +
    '    align-items: center;\n' +
    '    gap: 8px;\n' +
    '    margin-bottom: 16px;\n' +
    '    padding-bottom: 12px;\n' +
    '    border-bottom: 1px solid #313244;\n' +
    '  }\n' +
    '  .header h2 { color: #89b4fa; font-size: 16px; }\n' +
    '  .copy-btn {\n' +
    '    margin-left: auto;\n' +
    '    background: #313244;\n' +
    '    color: #cdd6f4;\n' +
    '    border: none;\n' +
    '    padding: 6px 12px;\n' +
    '    border-radius: 6px;\n' +
    '    cursor: pointer;\n' +
    '    font-size: 12px;\n' +
    '  }\n' +
    '  .copy-btn:hover { background: #45475a; }\n' +
    '  .content {\n' +
    '    background: #181825;\n' +
    '    border: 1px solid #313244;\n' +
    '    border-radius: 8px;\n' +
    '    padding: 16px;\n' +
    '    white-space: pre-wrap;\n' +
    '    word-break: break-word;\n' +
    '    font-family: "JetBrains Mono", "Fira Code", monospace;\n' +
    '    font-size: 13px;\n' +
    '  }\n' +
    '</style>\n' +
    '</head>\n' +
    '<body>\n' +
    '<div class="header">\n' +
    '  <h2>🤖 DevAssist AI</h2>\n' +
    '  <button class="copy-btn" onclick="copyContent()">📋 Copy</button>\n' +
    '</div>\n' +
    '<div class="content" id="content">' + escaped + '</div>\n' +
    '<script>\n' +
    '  var vscode = acquireVsCodeApi();\n' +
    '  function copyContent() {\n' +
    '    var text = document.getElementById("content").innerText;\n' +
    '    vscode.postMessage({ type: "copy", text: text });\n' +
    '  }\n' +
    '  window.addEventListener("message", function(event) {\n' +
    '    if (event.data.type === "update") {\n' +
    '      var escaped = event.data.content\n' +
    '        .replace(/&/g, "&amp;")\n' +
    '        .replace(/</g, "&lt;")\n' +
    '        .replace(/>/g, "&gt;");\n' +
    '      document.getElementById("content").innerHTML = escaped;\n' +
    '    }\n' +
    '  });\n' +
    '</script>\n' +
    '</body>\n' +
    '</html>';
}

module.exports = { showResultPanel };
