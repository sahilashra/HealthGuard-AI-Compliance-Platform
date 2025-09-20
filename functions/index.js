const functions = require("firebase-functions");
const server = require("./backend/server");

exports.apiV2 = functions.https.onRequest(server);
