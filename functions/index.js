/* functions/index.js */
/* eslint-disable */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { ConfidentialClientApplication } = require("@azure/msal-node");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

const msalConfig = {
  auth: {
    clientId:     functions.config().azure.client_id,
    authority:    "https://login.microsoftonline.com/consumers/v2.0",
    clientSecret: functions.config().azure.client_secret,
  }
};
const cca = new ConfidentialClientApplication(msalConfig);

const CALLBACK_URI =
  `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/authOutlookCallback`;

const { importTimetable } = require("./importTimetable");
exports.importTimetable = functions.https.onRequest(importTimetable);

const { fetchTimetableByIdentity } = require("./fetchTimetableByIdentity");
exports.fetchTimetableByIdentity = functions.https.onRequest(fetchTimetableByIdentity);

exports.authOutlook = functions.https.onRequest(async (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).send("Missing uid");
  try {
    const prompt = req.query.prompt;

    const authUrl = await cca.getAuthCodeUrl({
      scopes: ["openid", "offline_access", "User.Read", "Mail.Read"],
      redirectUri: CALLBACK_URI,
      state: uid,
      prompt: prompt === 'login' ? 'login' : undefined,
    });
    res.redirect(authUrl);
  } catch (e) {
    console.error("authOutlook error:", e);
    res.status(500).send("OAuth start failed");
  }
});

exports.authOutlookCallback = functions.https.onRequest(async (req, res) => {
  const { code, state: uid } = req.query;
  if (!code || !uid) return res.status(400).send("Missing code/state");

  try {
    console.log(" Received code:", code);
    console.log("State (uid):", uid);

    const tokenResp = await cca.acquireTokenByCode({
      code,
      scopes: ["openid", "offline_access", "User.Read", "Mail.Read"],
      redirectUri: CALLBACK_URI,
    });

    console.log(" Token response:", tokenResp);

    const tokenData = {
      accessToken: tokenResp.accessToken,
      expiresOn: tokenResp.expiresOn ? tokenResp.expiresOn.getTime() : null,
    };

    if (tokenResp.refreshToken) {
      tokenData.refreshToken = tokenResp.refreshToken;
    }

    await db
      .collection("users")
      .doc(uid)
      .collection("tokens")
      .doc("outlook")
      .set(tokenData);

    console.log(" Token stored for user:", uid);
    res.send(`
      <html>
        <head><title>Outlook Connected</title></head>
        <body>
          <h2> You're all set!</h2>
          <p>You can now return to the app and view your emails.</p>
          <script>
           window.location.href = "myapp://oauthRedirect?provider=outlook&status=success";
          </script>
        </body>
      </html>
    `);
      } catch (e) {
    console.error(" authOutlookCallback error:", e);
    res.status(500).send("Token exchange failed");
  }
});


exports.getOutlookEmails = functions.https.onRequest(async (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).send("Missing uid");

  try {
    const tokenRef = db.collection("users").doc(uid)
      .collection("tokens").doc("outlook");

    const snap = await tokenRef.get();
    if (!snap.exists) return res.status(404).send("No token");

    let { accessToken, refreshToken, expiresOn } = snap.data();

    const now = Date.now();
    if (expiresOn && now > expiresOn - 60000) {
      console.log(" Token expired — trying to refresh...");
      try {
        const newToken = await cca.acquireTokenByRefreshToken({
          refreshToken,
          scopes: ["openid", "offline_access", "User.Read", "Mail.Read"],
        });

        if (!newToken || !newToken.accessToken) {
          throw new Error("Refresh failed: No new accessToken returned");
        }

        accessToken = newToken.accessToken;
        refreshToken = newToken.refreshToken || refreshToken;
        expiresOn = newToken.expiresOn.getTime();

        await tokenRef.set({ accessToken, refreshToken, expiresOn });
        console.log(" Token refreshed");
      } catch (err) {
        console.error(" Refresh token failed:", err.message);
        return res.status(401).send("Refresh failed. Please reconnect your Outlook account.");
      }
    }


    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me/mailfolders/inbox/messages?$top=5",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const contentType = response.headers.get("content-type");
    const status = response.status;

    console.log(" Graph response status:", status);
    console.log(" Content-Type:", contentType);

    let data;

    try {
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error(" Non-JSON or empty response:", text);
        return res
          .status(status)
          .send(`Graph API returned non-JSON response: ${text}`);
      }
    } catch (err) {
      console.error(" JSON parse failed:", err.message);
      const raw = await response.text();
      return res
        .status(status)
        .send(`Failed to parse Graph response. Raw: ${raw}`);
    }

    if (!response.ok) {
      console.error("Graph API error response body:", data);
      return res.status(status).json({
        error: "Graph API returned an error",
        details: data,
      });
    }

    res.json(data);
  } catch (e) {
    console.error("getOutlookEmails error:", e);
    res.status(500).send("Mail fetch failed: " + e.message);
  }
});
