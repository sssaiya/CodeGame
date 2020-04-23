// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");
const USER_NOT_FOUND = "auth/user-not-found";
const INCORRECT_PASSWORD = "auth/wrong-password";
const INVALID_EMAIL = "auth/invalid-email";

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

  let register = vscode.commands.registerCommand(
    "code-game.Register",
    async function () {
      const email = await vscode.window.showInputBox({
        placeHolder: "Enter your email to log into ClanCode",
      });
      const password = await vscode.window.showInputBox({
        placeHolder: "Enter your password to log into ClanCode",
        password: true,
      });

      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .catch(function (error) {
          console.log(errorMessage);
          // Handle Errors here.
          if ((error.code = INVALID_EMAIL)) {
            vscode.window.showInformationMessage(
              "The email - " + email + "is Invalid"
            );
          }
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log(error.code);
          // ...
        });

      vscode.window.showInformationMessage("Registering " + email);
    }
  );

  let logIn = vscode.commands.registerCommand(
    "code-game.LogIn",
    async function () {
      const email = await vscode.window.showInputBox({
        placeHolder: "Enter your email to log into ClanCode",
      });
      const password = await vscode.window.showInputBox({
        placeHolder: "Enter your password to log into ClanCode",
        password: true,
      });

      firebase
        .auth()
        .signInWithEmailAndPassword(email, password)
        .catch(function (error) {
          console.log(error.code);
          if (error.code == USER_NOT_FOUND) {
            vscode.window.showInformationMessage(
              "User - " +
                email +
                " not found, Please check of you mistyped it, else Register email First using command " +
                "ClanCode: Register your account!"
            );
          }
          if ((error.code = INCORRECT_PASSWORD)) {
            vscode.window.showInformationMessage(
              "Invalid Password ! Try again "
            );
          }
        });

      const checkSignIn = () => {
        vscode.window.showInformationMessage("Here");
        // firebase.auth().isS
        console.log(firebase.auth());
        var isAnonymous = firebase.auth().currentUser.isAnonymous;
        if (isAnonymous) {
          console.log("Signed in As anonymous");
        } else console.log("Not Signed in yet ..");
      };

      //setInterval(checkSignIn, 1000);
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
    logIn,
    register
  );
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
