const functions = require("firebase-functions");
const admin = require("firebase-admin");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

var express = require("express");
var cors = require("cors");

var twitterRouter = require("./routes/twitter");

var app = express();

admin.initializeApp(functions.config().firebase);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/twitterapi", twitterRouter);

exports.apifunc = functions.https.onRequest(app);
