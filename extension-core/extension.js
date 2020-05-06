// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
var firebase = require("firebase/app");
const ANSI = require("ansi-encode");
require("firebase/auth");
require("firebase/firestore");
require("firebase/database");
const path = require("path");
// const spawn = require("child_process").spawn;
const firebaseConfig = require("../firebaseConfig");
const USER_NOT_FOUND = "auth/user-not-found";
const INCORRECT_PASSWORD = "auth/wrong-password";
const INVALID_EMAIL = "auth/invalid-email";
const gnome = "../ansi-files/gnome.ans";

var channel;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  var userData = {
    _username: null,
    _useremail: null,
    _isInClan: false,
    _clanTag: null,
    _clanName: null,
  };
  var _uid = "0";
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  var provider = new firebase.auth.GithubAuthProvider();
  provider.addScope("repo"); // TODO - Remove if not nesessary but asks for permissions

  channel = vscode.window.createOutputChannel("ClanCode");
  // graphics = new ANSI();
  let mess = "Hello world",
    colorFG = "\u001b[31m",
    resetFG = "\u001b[39m";
  // console.log(colorFG + mess + resetFG);

  // const result = ansiEncode(ansiEscapeStr);

  firebase.auth().onAuthStateChanged(async function (user) {
    console.log("IN AUTH STATE CHANGE");
    if (user) {
      _uid = user.uid;

      // Get userdata from firebase
      await firebase
        .database()
        .ref("/users/" + _uid)
        .once("value")
        .then(function (snapshot) {
          userData._isInClan = snapshot.val()._isInClan;
          userData._username = snapshot.val()._username;
          userData._useremail = snapshot.val()._useremail;
          userData._clanTag = snapshot.val()._clanTag;
          userData._clanName = snapshot.val()._clanName;
          // userData = snapshot.val();
        });

      const getClan = async function () {
        if (userData._isInClan) {
          var clanRef = firebase
            .database()
            .ref("/clans/" + userData._clanTag + "/members");
          clanRef.once("value").then(async function (snapshot) {
            const clanMembers = snapshot;
            getClanStatus(clanMembers);
          });
        }
      };
      //Activate status listener
      console.log("Activated Clan Status Listener");
      getClan();
      setInterval(getClan, 5000); //every 5s

      var displayString = "Hello - " + userData._username;

      if (userData._isInClan) {
        displayString =
          displayString + ", member of clan - " + userData._clanTag;
      } else {
        displayString =
          displayString +
          ", Create or Join a clan via its Clan Tag to get started !";
      }
      vscode.window.showInformationMessage(displayString);

      // * Load Clan Settings * //

      // User is signed in.

      // * START PERSISTENCE WITH FIRESTORE *//
      // Create a reference to this user's specific status node.
      // This is where we will store data about being online/offline.
      var userStatusDatabaseRef = firebase.database().ref("/status/" + _uid);
      // firebase.database().
      var isOfflineForDatabase = {
        state: "offline",
        last_changed: firebase.database.ServerValue.TIMESTAMP,
        user_name: userData._username,
      };
      var isOnlineForDatabase = {
        state: "online",
        last_changed: firebase.database.ServerValue.TIMESTAMP,
        user_name: userData._username,
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

  function getStatus2(clanMembersArray) {
    var clanMembersStatusArray = [];
    for (var i = 0; i < clanMembersArray.length; i++) {
      firebase
        .database()
        .ref("/status/" + clanMembersArray[i])
        .on("value", function (snapshot) {
          const status = snapshot.val().state;
          const username = snapshot.val().user_name; // Change TODO to username (Collect on registration)
          const lastOnline = snapshot.val().last_changed;
          const statusObj = {
            user_name: username,
            last_online: lastOnline,
            status: status,
          };
          console.log(statusObj);
          clanMembersStatusArray.push(statusObj);
        });
    }
    return clanMembersStatusArray;
  }
  // async function asyncForEach(array, callback) {
  //   for (let index = 0; index < array.length; index++) {
  //     await callback(array[index], index, array);
  //   }
  // }

  async function getClanStatus(clanMembers) {
    var clanMembersArray = [];

    clanMembers.forEach((element) => {
      clanMembersArray.push(element.val());
    });
    const clanMembersStatusArray = await getStatus2(clanMembersArray);
    console.log(clanMembersArray);
    console.log(clanMembersStatusArray);

    context.workspaceState.update("clanMembers", clanMembersArray);
    context.workspaceState.update("clanMembersStatus", clanMembersStatusArray);
    // writeToVirtualDocument(clanMembersArray, clanMembersStatusArray);
  }

  function buildTeamMenu() {
    var options = [];

    const clanMembersArray = context.workspaceState.get("clanMembers");
    const clanMembersStatusArray = context.workspaceState.get(
      "clanMembersStatus"
    );

    for (var i = 0; i < clanMembersArray.length; i++) {
      // console.log(state);
      var state = clanMembersStatusArray[i];
      // console.log(state);
      var status;
      var name;
      var activity;
      if (state["status"] == undefined) {
        status = "Loading ...";
      } else {
        if (state["status"] == "away" || state["status"] == "offline") {
          status = state["status"];
          activity = state.last_online;
        } else {
          status = state["status"];
          activity = "TODO";
        }
      }

      var item = {
        label: state["user_name"],
        description: status,
        activity: activity,
      };
      options.push(item);
    }

    const tableheader =
      "-----------------------------------------------------------------";
    const tableheader2 =
      "|    Username     |         Status         |      Activity       |";
    // const clanName =
    channel.clear();
    channel.appendLine(tableheader + "\n" + tableheader2);
    for (var i = 0; i < options.length; i++) {
      const displayString =
        options[i].label +
        "        " +
        options[i].description +
        "        " +
        options[i].activity;
      channel.appendLine(displayString);
    }

    channel.show();
  }

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
        if (userData._isInClan) {
          buildTeamMenu();
        } else {
          vscode.window.showInformationMessage("Create or Join a Clan first !");
          vscode.commands.executeCommand("code-game.CodeGame");
        }
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
        user_name: userData._username,
      };
      if (_uid != "0") {
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
        user_name: userData._username,
      };
      if (_uid != "0") {
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
        placeHolder: "Eg. superstar@clancode.com",
        prompt: "Enter your email to Sign up with ClanCode",
      });
      const userName = await vscode.window.showInputBox({
        placeHolder: "",
        prompt:
          "Enter your Username (This is how your clan mates will see you !)",
      });
      const password = await vscode.window.showInputBox({
        placeHolder: "",
        prompt: "Enter your desired password",
        password: true,
      });
      const password2 = await vscode.window.showInputBox({
        placeHolder: "",
        prompt: "Re-Enter your password",
        password: true,
      });

      if (password != password2) {
        vscode.window.showInformationMessage(
          "Password Didn't Match! Please try again"
        );
        return;
      }

      await firebase
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
          var errorMessage = error.message;
          console.log(error.code);
          // ...
        });

      // if(userCred == null);
      _uid = firebase.auth().currentUser.uid;

      userData._username = userName;
      userData._useremail = email;

      //Add user metaData
      firebase
        .database()
        .ref("/users/" + _uid)
        .set(userData);

      vscode.window.showInformationMessage("Registering " + email);
    }
  );

  let logIn = vscode.commands.registerCommand(
    "code-game.LogIn",
    async function () {
      const email = await vscode.window.showInputBox({
        placeHolder: "superstar@clancode.com",
        prompt: "Enter your email to log into ClanCode",
      });
      const password = await vscode.window.showInputBox({
        placeHolder: "",
        prompt: "Enter your password to log into ClanCode",
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
  let createClanMenu = vscode.commands.registerCommand(
    "code-game.createClan",
    async function createClan() {
      // const checkButton = vscode.QuickInputButtons;
      // Note, Buttons need Typescript, learn it soon
      // const button = vscode.QuickInputButton().;
      const clanName = await vscode.window.showInputBox({
        placeHolder: "Eg. StarHackers",
        prompt: "Enter Clan Name",
      });

      const clanTag = GetUniqueClanTag(6);
      vscode.window.showInformationMessage(clanTag);

      //https://stackoverflow.com/questions/9543715/generating-human-readable-usable-short-but-unique-ids

      //Create the clann in DB
      var newClanDatabaseRef = firebase.database().ref("/clans/" + clanTag);
      newClanDatabaseRef
        .set({
          name: clanName,
          created: firebase.database.ServerValue.TIMESTAMP,
        })
        .catch(function (error) {
          console.log("Create Clan Error -");
          console.log(error);
        });

      //Add Creator to the Clan
      var clanMembersDatabaseRef = firebase
        .database()
        .ref("/clans/" + clanTag + "/members");
      clanMembersDatabaseRef.push(_uid);

      vscode.window.showInformationMessage(
        "Created Clan - " + clanName + " And Clan Tag - " + clanTag
      );

      userData._isInClan = true;
      userData._clanTag = clanTag;
      userData._clanName = clanName;

      //Add user metaData
      firebase
        .database()
        .ref("/users/" + _uid)
        .set(userData);
    }
  );

  let joinClanMenu = vscode.commands.registerCommand(
    "code-game.joinClan",
    async function joinClan() {
      const clanTagLowerCase = await vscode.window.showInputBox({
        placeHolder: "Eg. ******",
        prompt: "Join a Clan via its ClanTag",
      });
      const clanTag = clanTagLowerCase.toUpperCase(); //Configured to be case insensitive in DB :)

      var clanName = null;
      await firebase
        .database()
        .ref("clans/" + clanTag)
        .on("value", function (snapshot) {
          if (snapshot.val() != null) {
            clanName = snapshot.val().name;
          } else {
            console.log("ERROR WRONG CLAN TAG");
          }
        });

      if (clanName == null) {
        vscode.window.showInformationMessage(
          "Clan with Tag -" +
            clanTag +
            " doesn't exist, create or join via Clan Tag"
        );
        return;
      }

      console.log("Attempting to join clan" + clanName);

      //Add to the Clan
      var clanMembersDatabaseRef = firebase
        .database()
        .ref("/clans/" + clanTag + "/members");
      clanMembersDatabaseRef.push(_uid);

      userData._clanTag = clanTag;
      userData._isInClan = true;
      userData._clanName = clanName;

      firebase
        .database()
        .ref("/users/" + _uid)
        .set(userData);
    }
  );

  // Make one command opening this menu to execute the other commands :)
  let CodeGameMenu = vscode.commands.registerCommand(
    "code-game.CodeGame",
    async function showQuickPick() {
      var options = [];
      // _user = context.globalState.get("user");
      // _uid = context.globalState.get("uid");
      // _isInClan = context.globalState.get("isInClan");
      // _clanTag = context.globalState.get("clanTag");
      if (_uid == "0") {
        options.push("Register");
        options.push("Sign in");
      } else {
        // Is Signed in/ Authenticated
        if (!userData._isInClan) {
          options.push("Create Clan");
          options.push("Join Clan");
        }
      }
      const result = await vscode.window.showQuickPick(options, {
        placeHolder: "Welcome To ClanCode",
        onDidSelectItem: (item) => {
          if (item == "Create Clan" || item == "Join Clan") {
            if (_uid == "0") {
              vscode.window.showInformationMessage(
                `Please Sign in before trying to ${item}`
              );
            }
          }
          if (item == "Sign in" || item == "Register") {
            if (_uid != "0") {
              vscode.window.showInformationMessage(
                "Signed in as " + userData._username
              );
            }
          }
        },
      });
      // vscode.window.showInformationMessage(`Got: ${result}`);
      if (result == "Create Clan") {
        vscode.commands.executeCommand("code-game.createClan");
      }
      if (result == "Join Clan") {
        vscode.commands.executeCommand("code-game.joinClan");
      }
      if (result == "Sign in") {
        vscode.commands.executeCommand("code-game.LogIn");
      }
      if (result == "Register") {
        vscode.commands.executeCommand("code-game.Register");
      }
    }
  );

  // Generates Clan tags qunique and not Case Sensitive
  //https:stackoverflow.com/questions/9543715/generating-human-readable-usable-short-but-unique-ids
  function GetUniqueClanTag(length) {
    const _base62chars =
      "123456789BCDFGHJKLMNPQRSTVWXYZabcdefghijklmnopqrstuvwxyz";
    // Removed I as confused with 1
    // Removed O and 0
    // function random = Math.random()
    // Remove Remaninig vowels(U, E, A) to prevent bad word generation
    var tagBuilder = "";

    for (var i = 0; i < length; i++) {
      const keyIndex = Math.floor(Math.random() * 27); // Changed 33 to 27 as removed 6 characters
      tagBuilder = tagBuilder + _base62chars.charAt(keyIndex);
    }
    return tagBuilder;
  }

  context.subscriptions.push(
    disposable,
    barItem,
    goOnline,
    onlineIcon,
    offlineIcon,
    goOffline,
    logIn,
    register,
    CodeGameMenu,
    createClanMenu,
    joinClanMenu
  );
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
