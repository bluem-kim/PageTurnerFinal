const { Expo } = require("expo-server-sdk");
const admin = require("firebase-admin");
const User = require("../models/User");
const path = require("path");

const expo = new Expo();

// Initialize Firebase Admin for Android Direct Push
try {
  const serviceAccount = require("./firebase-service-account.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("[Push] Firebase Admin initialized for Android.");
} catch (error) {
  console.error("[Push] Firebase initialization failed:", error.message);
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
  if (!user || !user.pushTokens || !user.pushTokens.length) return [];

  const expoMessages = [];
  const firebaseTokens = [];

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
    const payload = {
      notification: { title, body },
      data: Object.keys(data).reduce((acc, key) => {
        acc[key] = String(data[key]);
        return acc;
      }, {}),
    };
    try {
      await admin.messaging().sendEachForMulticast({
        tokens: firebaseTokens,
        ...payload,
      });
    } catch (error) {
      console.error("[Push] Firebase error for user:", error.message);
    }
  }

  // Send via Expo
  if (expoMessages.length > 0) {
    try {
      await expo.sendPushNotificationsAsync(expoMessages);
    } catch (error) {
      console.error("[Push] Expo error for user:", error.message);
    }
  }

  return { success: true };
};

module.exports = {
  sendPushNotificationToAll,
  sendPushNotificationToUser,
};
