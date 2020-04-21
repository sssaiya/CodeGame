// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
var firebase = require("firebase/app");
const fetch = require("node-fetch");
require("firebase/auth");
require("firebase/firestore");
// _token;
var _token = undefined;

var _isLoggedIn = false;
var _webViewContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    LOADING ...... If this Doesn't work please check your wifi connection
</body>
</html>`;

var firebaseConfig = {
  //TODO Make this secret ... Whoops
  apiKey: "AIzaSyA4tzPbTSAm7G8FUOk0i82rQYWYhSZslq4", // Changed
  authDomain: "teamcode-dff02.firebaseapp.com",
  databaseURL: "https://teamcode-dff02.firebaseio.com",
  projectId: "teamcode-dff02",
  storageBucket: "teamcode-dff02.appspot.com",
  messagingSenderId: "1009085822488",
  appId: "1:1009085822488:web:84617fcae4129cb781356d",
  measurementId: "G-VPBM18RHTL",
};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  var provider = new firebase.auth.GithubAuthProvider();
  provider.addScope("repo"); // TODO - Remove if not nesessary but asks for permissions

  let alignment = 10;
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "code-game" is now active!');
  let barItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    alignment
  );
  let onlineIcon = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    alignment - 0.1
  );
  let offlineIcon = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    alignment - 0.1
  );
  barItem.command = "code-game.onClick";
  barItem.text = "Here !";
  barItem.show();

  offlineIcon.command = "code-game.Online";
  offlineIcon.text = "$(debug-hint)";

  onlineIcon.command = "code-game.Offline";
  onlineIcon.text = "$(circle-filled)";
  // onlineIcon.text.fontcolor TODO MAKE THIS GREEN / make custom icons
  onlineIcon.show();

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "code-game.onClick",
    function () {
      vscode.window.showInformationMessage("Hello World from CodeGame!!");
      if (!isLoggedIn) {
        const panel = vscode.window.createWebviewPanel(
          "gitAuth",
          "ClanCode",
          vscode.ViewColumn.One,
          {}
        );
        const updateWebview = () => {
          if (isLoggedIn) panel.webview.html = _webViewContent;
        };
        getGitLoginWebviewContent();
        panel.webview.html = _webViewContent;
        // And schedule updates to the content every second
        setInterval(updateWebview, 1000);
      }
    }
  );

  let goOnline = vscode.commands.registerCommand(
    "code-game.Online",
    function () {
      vscode.window.showInformationMessage("ONLINE");
      offlineIcon.hide();
      onlineIcon.show();
    }
  );
  let goOffline = vscode.commands.registerCommand(
    "code-game.Offline",
    function () {
      vscode.window.showInformationMessage("OFFLINE");
      onlineIcon.hide();
      offlineIcon.show();
    }
  );

  let signInWithGit = vscode.commands.registerCommand(
    "code-game.SignInWithGit",
    function () {
      vscode.window.showInformationMessage("Loading ...");
      // Note - Cant use Login with popup or redirect functionality from firebase auth Documentation
      // as VSCode lacks some support for hhtp storage etc, have to use GitHub OAuth 2.0 endpoints To integrate
      // sign in flow manually
    }
  );

  context.subscriptions.push(
    disposable,
    barItem,
    goOnline,
    onlineIcon,
    offlineIcon,
    goOffline,
    signInWithGit
  );
}

function getGitLoginWebviewContent() {
  // @ts-ignore
  fetch("https://teamcode-dff02.web.app/index")
    .then((res) => res.text())
    .then((body) => (_webViewContent = body));
  setInterval(getLoggedInContent, 1000);
}
function getLoggedInContent() {
  if (_isLoggedIn) {
    fetch("https://teamcode-dff02.web.app/gitLogin")
      .then((res) => res.text())
      .then((body) => (_webViewContent = body));
  }
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
  _isLoggedIn,
  _token,
};
