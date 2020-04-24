// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");
require("firebase/database");
const firebaseConfig = require("./firebaseConfig");
const USER_NOT_FOUND = "auth/user-not-found";
const INCORRECT_PASSWORD = "auth/wrong-password";
const INVALID_EMAIL = "auth/invalid-email";
var _uid = "0";
var _user = null;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  var provider = new firebase.auth.GithubAuthProvider();
  provider.addScope("repo"); // TODO - Remove if not nesessary but asks for permissions

  firebase.auth().onAuthStateChanged(function (user) {
    console.log("IN AUTH STATE CHANGE");
    if (user) {
      if (user.displayName)
        vscode.window.showInformationMessage("Hello - " + user.displayName);
      else {
        //TODO, Add Username, Email verify reminder hint (Aldready enabled on firebase)
        vscode.window.showInformationMessage("Hello - " + user.email);
        _uid = user.uid;
        _user = user;
      }

      // User is signed in.

      // * START PERSISTENCE WITH FIRESTORE *//
      // Create a reference to this user's specific status node.
      // This is where we will store data about being online/offline.
      var userStatusDatabaseRef = firebase.database().ref("/status/" + _uid);
      // firebase.database().
      var isOfflineForDatabase = {
        state: "offline",
        last_changed: firebase.database.ServerValue.TIMESTAMP,
      };
      var isOnlineForDatabase = {
        state: "online",
        last_changed: firebase.database.ServerValue.TIMESTAMP,
      };
      firebase
        .database()
        .ref(".info/connected")
        .on("value", function (snapshot) {
          // If we're not currently connected, don't do anything.
          if (snapshot.val() == false) {
            return;
          }

          userStatusDatabaseRef
            .onDisconnect()
            .set(isOfflineForDatabase)
            .then(function () {
              userStatusDatabaseRef.set(isOnlineForDatabase);
            })
            .catch(function (error) {
              console.log(error);
            });
        });
    } else {
      console.log("Not Signed in yet");
      // No user is signed in.
    }
  });

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
  barItem.text = "ClanCode";
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
      if (_uid == "0")
        vscode.window.showInformationMessage(
          "Sign in using command Clancode: Sign in"
        );
      else {
        //Load Team on click here
        vscode.window.showInformationMessage("Loading team for " + _user.email);
        // vscode.
      }
    }
  );

  let goOnline = vscode.commands.registerCommand(
    "code-game.Online",
    function () {
      vscode.window.showInformationMessage("ONLINE");
      offlineIcon.hide();
      onlineIcon.show();
      var userStatusDatabaseRef = firebase.database().ref("/status/" + _uid);
      // firebase.database().
      var isActiveForDatabase = {
        state: "Active",
        last_changed: firebase.database.ServerValue.TIMESTAMP,
      };
      if (_user) {
        console.log("Going Active");
        firebase
          .database()
          .ref(".info/connected")
          .on("value", function (snapshot) {
            // If we're not currently connected, don't do anything.
            if (snapshot.val() == false) {
              return;
            }

            userStatusDatabaseRef.set(isActiveForDatabase);
          });
      }
    }
  );
  let goOffline = vscode.commands.registerCommand(
    "code-game.Offline",
    function () {
      vscode.window.showInformationMessage("OFFLINE");
      onlineIcon.hide();
      offlineIcon.show();
      var userStatusDatabaseRef = firebase.database().ref("/status/" + _uid);
      // firebase.database().
      var isAwayForDatabase = {
        state: "away",
        last_changed: firebase.database.ServerValue.TIMESTAMP,
      };
      if (_user) {
        console.log("Going Away");
        firebase
          .database()
          .ref(".info/connected")
          .on("value", function (snapshot) {
            // If we're not currently connected, don't do anything.
            if (snapshot.val() == false) {
              return;
            }

            userStatusDatabaseRef.set(isAwayForDatabase);
          });
      }
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

      // Note - Cant use Login with popup or redirect functionality from firebase auth Documentation
      // as VSCode lacks some support for hhtp storage etc, have to use GitHub OAuth 2.0 endpoints To integrate
      // sign in flow manually
    }
  );

  // Make one command opening this menu to execute the other commands :)
  let CodeGameMenu = vscode.commands.registerCommand(
    "code-game.CodeGame",
    async function showQuickPick() {
      const result = await vscode.window.showQuickPick(
        ["Register", "Sign in", "Create Clan", "Join Clan"],
        {
          placeHolder: "Create or Join Clan",
          onDidSelectItem: (item) => {
            if (item == "Create Clan" || item == "Join Clan") {
              if (_user == null) {
                vscode.window.showInformationMessage(
                  `Please Sign in before trying to ${item}`
                );
              }
            }
            if (item == "Sign in" || item == "Register") {
              if (_user != null) {
                vscode.window.showInformationMessage(
                  "Signed in as " + _user.email
                );
              }
            }
          },
        }
      );
      // vscode.window.showInformationMessage(`Got: ${result}`);
      if (result == "Create Clan") {
      }
      if (result == "Join Clan") {
      }
      if (result == "Sign in") {
        vscode.commands.executeCommand("code-game.LogIn");
      }
      if (result == "Register") {
        vscode.commands.executeCommand("code-game.Register");
      }
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
    register,
    CodeGameMenu
  );
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
