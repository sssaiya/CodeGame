// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");

var firebaseConfig = {
  //TODO Make this secret ... Whoops
  apiKey: "AIzaSyA4tzPbTSAm7G8FUOk0i82rQYWYhSZslq4",
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
      firebase.auth().signInWithRedirect(provider);
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
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
