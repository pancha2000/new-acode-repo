'use strict';

var vscode = require('vscode');
var api = require('./src/api');
var storage = require('./src/storage');
var panel = require('./src/panel');

/**
 * Extension activate වෙද්දී call වෙනවා
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

  // ─── 1. Set API Key ───────────────────────────────────────
  var setApiKeyCmd = vscode.commands.registerCommand(
    'devassist.setApiKey',
    function() {
      vscode.window.showInputBox({
        prompt: 'Claude API Key ඇතුල් කරන්න (sk-ant-...)',
        placeHolder: 'sk-ant-api03-...',
        password: true,
        ignoreFocusOut: true
      }).then(function(key) {
        if (!key || key.trim() === '') {
          vscode.window.showWarningMessage('API Key ඇතුල් නොකළා.');
          return;
        }
        storage.saveApiKey(context, key.trim());
        vscode.window.showInformationMessage('✅ API Key save කළා!');
      });
    }
  );

  // ─── 2. Explain Code ─────────────────────────────────────
  var explainCmd = vscode.commands.registerCommand(
    'devassist.explain',
    function() {
      var editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Editor open නැහැ.');
        return;
      }

      var selectedText = editor.document.getText(editor.selection);
      if (!selectedText || selectedText.trim() === '') {
        vscode.window.showWarningMessage('⚠️ Code select කරන්න!');
        return;
      }

      var apiKey = storage.getApiKey(context);
      if (!apiKey) {
        vscode.window.showErrorMessage(
          'API Key නැහැ!',
          'Set API Key'
        ).then(function(choice) {
          if (choice === 'Set API Key') {
            vscode.commands.executeCommand('devassist.setApiKey');
          }
        });
        return;
      }

      var lang = editor.document.languageId || 'code';
      var prompt =
        'You are a helpful coding assistant.\n' +
        'Explain the following ' + lang + ' code clearly and simply.\n' +
        'Use numbered steps if needed.\n\n' +
        '```' + lang + '\n' +
        selectedText + '\n' +
        '```';

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '🤖 AI Analyzing...',
          cancellable: false
        },
        function() {
          return api.callClaude(prompt, apiKey).then(function(result) {
            panel.showResultPanel('🔍 Code Explanation', result, context);
          }).catch(function(err) {
            vscode.window.showErrorMessage('Error: ' + err.message);
          });
        }
      );
    }
  );

  // ─── 3. Fix Error ─────────────────────────────────────────
  var fixCmd = vscode.commands.registerCommand(
    'devassist.fix',
    function() {
      var editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Editor open නැහැ.');
        return;
      }

      var selectedText = editor.document.getText(editor.selection);
      if (!selectedText || selectedText.trim() === '') {
        vscode.window.showWarningMessage('⚠️ Error code හෝ error message select කරන්න!');
        return;
      }

      var apiKey = storage.getApiKey(context);
      if (!apiKey) {
        vscode.window.showErrorMessage(
          'API Key නැහැ!',
          'Set API Key'
        ).then(function(choice) {
          if (choice === 'Set API Key') {
            vscode.commands.executeCommand('devassist.setApiKey');
          }
        });
        return;
      }

      var lang = editor.document.languageId || 'code';
      var prompt =
        'You are a debugging expert.\n' +
        'Analyze the following ' + lang + ' code/error and:\n' +
        '1. Identify the problem\n' +
        '2. Explain why it happens\n' +
        '3. Provide the fixed code\n\n' +
        '```\n' +
        selectedText + '\n' +
        '```';

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '🐛 AI Fixing...',
          cancellable: false
        },
        function() {
          return api.callClaude(prompt, apiKey).then(function(result) {
            panel.showResultPanel('🐛 Bug Fix', result, context);
          }).catch(function(err) {
            vscode.window.showErrorMessage('Error: ' + err.message);
          });
        }
      );
    }
  );

  // ─── 4. Generate Code ────────────────────────────────────
  var generateCmd = vscode.commands.registerCommand(
    'devassist.generate',
    function() {
      var apiKey = storage.getApiKey(context);
      if (!apiKey) {
        vscode.window.showErrorMessage(
          'API Key නැහැ!',
          'Set API Key'
        ).then(function(choice) {
          if (choice === 'Set API Key') {
            vscode.commands.executeCommand('devassist.setApiKey');
          }
        });
        return;
      }

      var editor = vscode.window.activeTextEditor;
      var lang = editor ? (editor.document.languageId || 'javascript') : 'javascript';

      vscode.window.showInputBox({
        prompt: 'Generate කරන්න ඕන code describe කරන්න',
        placeHolder: 'උදා: user login function with JWT token',
        ignoreFocusOut: true
      }).then(function(description) {
        if (!description || description.trim() === '') {
          vscode.window.showWarningMessage('Description ඇතුල් නොකළා.');
          return;
        }

        var prompt =
          'You are an expert ' + lang + ' developer.\n' +
          'Generate clean, working ' + lang + ' code for:\n' +
          description + '\n\n' +
          'Requirements:\n' +
          '- Clean and readable code\n' +
          '- Add brief comments\n' +
          '- Include error handling where needed\n' +
          '- Return ONLY the code, no extra explanation needed outside the code';

        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: '✨ AI Generating...',
            cancellable: false
          },
          function() {
            return api.callClaude(prompt, apiKey).then(function(result) {
              panel.showResultPanel('✨ Generated Code', result, context);
            }).catch(function(err) {
              vscode.window.showErrorMessage('Error: ' + err.message);
            });
          }
        );
      });
    }
  );

  // ─── 5. AI Chat ──────────────────────────────────────────
  var chatCmd = vscode.commands.registerCommand(
    'devassist.chat',
    function() {
      var apiKey = storage.getApiKey(context);
      if (!apiKey) {
        vscode.window.showErrorMessage(
          'API Key නැහැ!',
          'Set API Key'
        ).then(function(choice) {
          if (choice === 'Set API Key') {
            vscode.commands.executeCommand('devassist.setApiKey');
          }
        });
        return;
      }

      vscode.window.showInputBox({
        prompt: '💬 AI ට ඕනෙ දෙයක් අහන්න',
        placeHolder: 'උදා: How do I use async/await in JavaScript?',
        ignoreFocusOut: true
      }).then(function(question) {
        if (!question || question.trim() === '') {
          vscode.window.showWarningMessage('Question ඇතුල් නොකළා.');
          return;
        }

        var prompt =
          'You are a helpful coding assistant.\n' +
          'Answer the following question clearly:\n\n' +
          question;

        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: '💬 AI Thinking...',
            cancellable: false
          },
          function() {
            return api.callClaude(prompt, apiKey).then(function(result) {
              panel.showResultPanel('💬 AI Answer', result, context);
            }).catch(function(err) {
              vscode.window.showErrorMessage('Error: ' + err.message);
            });
          }
        );
      });
    }
  );

  // ─── Register all commands ────────────────────────────────
  context.subscriptions.push(setApiKeyCmd);
  context.subscriptions.push(explainCmd);
  context.subscriptions.push(fixCmd);
  context.subscriptions.push(generateCmd);
  context.subscriptions.push(chatCmd);

  // ─── Welcome message ─────────────────────────────────────
  var hasShownWelcome = context.globalState.get('devassist_welcomed');
  if (!hasShownWelcome) {
    vscode.window.showInformationMessage(
      '👋 DevAssist AI installed! API Key set කරන්නද?',
      'Set API Key',
      'Later'
    ).then(function(choice) {
      if (choice === 'Set API Key') {
        vscode.commands.executeCommand('devassist.setApiKey');
      }
    });
    context.globalState.update('devassist_welcomed', true);
  }
}

/**
 * Extension deactivate වෙද්දී call වෙනවා
 */
function deactivate() {}

module.exports = {
  activate: activate,
  deactivate: deactivate
};
