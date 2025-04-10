/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


const functions = require("firebase-functions");
const {importTimetable} = require("./importTimetable");
exports.importTimetable = functions.https.onRequest(importTimetable);

const {fetchTimetableByIdentity} = require("./fetchTimetableByIdentity");
exports.fetchTimetableByIdentity =
  functions.https.onRequest(fetchTimetableByIdentity);


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
