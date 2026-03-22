const { Expo } = require("expo-server-sdk");
const admin = require("firebase-admin");
const User = require("../models/User");
const path = require("path");

const expo = new Expo();

console.log("[Push] Initializing Push Notifications Utility...");

// Initialize Firebase Admin for Android Direct Push
try {
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("[Push] Found FIREBASE_SERVICE_ACCOUNT environment variable.");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    const serviceAccountPath = path.resolve(__dirname, "firebase-service-account.json");
    console.log(`[Push] Looking for service account file at: ${serviceAccountPath}`);
    serviceAccount = require(serviceAccountPath);
  }
  
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("[Push] Firebase Admin initialized successfully for Android.");
  } else {
    console.log("[Push] Firebase Admin already initialized.");
  }
} catch (error) {
  console.error("[Push] CRITICAL: Firebase initialization failed.");
  console.error("[Push] Error Detail:", error.message);
  console.warn("[Push] To fix for Render: Add FIREBASE_SERVICE_ACCOUNT as an environment variable with the JSON content.");
}

/**
 * Sends a push notification to all users with registered tokens.
 */
const sendPushNotificationToAll = async (title, body, data = {}) => {
  const users = await User.find({ "pushTokens.0": { $exists: true } });
  const expoMessages = [];
  const firebaseTokens = [];

  console.log(`[Push] Notifying ${users.length} users.`);

  for (const user of users) {
    for (const pushToken of user.pushTokens) {
      if (pushToken.platform === "android") {
        firebaseTokens.push(pushToken.token);
      } else if (Expo.isExpoPushToken(pushToken.token)) {
        expoMessages.push({
          to: pushToken.token,
          sound: "default",
          title,
          body,
          data,
        });
      }
    }
  }

  // Send via Firebase (Android)
  if (firebaseTokens.length > 0) {
    const payload = {
      notification: { title, body },
      data: Object.keys(data).reduce((acc, key) => {
        acc[key] = String(data[key]);
        return acc;
      }, {}),
    };
    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: firebaseTokens,
        ...payload,
      });
      console.log(`[Push] Firebase response: ${response.successCount} success, ${response.failureCount} failure.`);
    } catch (error) {
      console.error("[Push] Firebase error:", error.message);
    }
  }

  // Send via Expo (iOS/Other)
  if (expoMessages.length > 0) {
    const chunks = expo.chunkPushNotifications(expoMessages);
    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error("[Push] Expo error:", error.message);
      }
    }
  }

  return { expoCount: expoMessages.length, firebaseCount: firebaseTokens.length };
};

/**
 * Sends a push notification to a specific user.
 */
const sendPushNotificationToUser = async (user, title, body, data = {}) => {
  if (!user) {
    console.warn("[Push] Cannot send notification: User is null");
    return { success: false, reason: "user_null" };
  }
  
  if (!user.pushTokens || !user.pushTokens.length) {
    console.warn(`[Push] User ${user.email} has no registered push tokens.`);
    return { success: false, reason: "no_tokens" };
  }

  const expoMessages = [];
  const firebaseTokens = [];

  console.log(`[Push] Sending to ${user.email} (${user.pushTokens.length} tokens)`);

  for (const pushToken of user.pushTokens) {
    if (pushToken.platform === "android") {
      firebaseTokens.push(pushToken.token);
    } else if (Expo.isExpoPushToken(pushToken.token)) {
      expoMessages.push({
        to: pushToken.token,
        sound: "default",
        title,
        body,
        data,
      });
    }
  }

  // Send via Firebase
  if (firebaseTokens.length > 0) {
    const messagePayload = {
      notification: { title, body },
      data: Object.keys(data).reduce((acc, key) => {
        acc[key] = String(data[key]);
        return acc;
      }, {}),
      android: {
        priority: "high",
        notification: {
          channelId: "default",
          sound: "default",
          priority: "high",
        },
      },
    };
    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: firebaseTokens,
        ...messagePayload,
      });
      console.log(`[Push] Firebase response for ${user.email}: ${response.successCount} success, ${response.failureCount} failure.`);
    } catch (error) {
      console.error(`[Push] Firebase error for user ${user.email}:`, error.message);
    }
  }

  // Send via Expo
  if (expoMessages.length > 0) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(expoMessages);
      console.log(`[Push] Expo response for ${user.email}:`, tickets);
    } catch (error) {
      console.error(`[Push] Expo error for user ${user.email}:`, error.message);
    }
  }

  return { success: true };
};

module.exports = {
  sendPushNotificationToAll,
  sendPushNotificationToUser,
};
