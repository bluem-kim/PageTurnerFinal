# 🔥 Firebase Setup Guide (ELI5 Edition)

Follow these simple steps to get your Google Sign-In working with Firebase.

---

## 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and give it a name (e.g., `PageTurner`).
3. (Optional) Disable Google Analytics if you want it simple.

## 2. Setup Android
1. Click the **Android icon** in the middle of your project dashboard.
2. **Android package name**: Use `com.maria.pageturnerapp` (updated to be unique).
3. **Download `google-services.json`**:
   - Save this file in your project root: `frontend/google-services.json`.
4. **SHA-1 Fingerprint (CRITICAL)**:
   - You need this for Google Sign-In to work.
   - Run this in your terminal: `cd frontend && npx expo run:android` (it will usually show your debug SHA-1).
   - Or run: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`.
   - Copy the **SHA-1** and paste it into the Firebase Android setup.

## 3. Setup iOS
1. Click **Add App** -> **iOS icon**.
2. **iOS bundle ID**: Use `com.maria.pageturnerapp` (updated to be unique).
3. **Download `GoogleService-Info.plist`**:
   - Save this file in your project root: `frontend/GoogleService-Info.plist`.

## 4. Enable Google Sign-In in Firebase
1. In the Firebase sidebar, go to **Build** -> **Authentication**.
2. Click **Get Started**.
3. Go to the **Sign-in method** tab.
4. Click **Add new provider** -> **Google**.
5. Enable it, choose a support email, and click **Save**.
6. **Copy the Web Client ID**:
   - After saving, click the edit (pencil) icon on the Google provider.
   - Look for **Web SDK configuration**.
   - Copy the **Web client ID**.

## 5. Update your `app.json`
Open `frontend/app.json` and update the `extra` section with your new IDs:

```json
"extra": {
  "googleWebClientId": "YOUR_WEB_CLIENT_ID_FROM_FIREBASE",
  "googleAndroidClientId": "YOUR_ANDROID_CLIENT_ID_FROM_FIREBASE"
},
"android": {
  "googleServicesFile": "./google-services.json",
  "package": "com.maria.pageturnerapp"
},
"ios": {
  "googleServicesFile": "./GoogleService-Info.plist",
  "bundleIdentifier": "com.maria.pageturnerapp"
}
```

## 6. Where do files go? 📂
Place your downloaded files exactly here:
- ✅ `frontend/google-services.json`
- ✅ `frontend/GoogleService-Info.plist`

## 7. Setup Environment Variables (.env) 🌐
You need to configure your environment variables for both frontend and backend.

### Frontend (`frontend/.env`)
Set your local IP address so your physical device or emulator can talk to your backend:
```env
EXPO_PUBLIC_BASE_API_URL=http://<YOUR_LOCAL_IP>:4000/api/v1/
```

### Backend (`backend/.env`)
Fill in your database and Google credentials:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
GOOGLE_WEB_CLIENT_ID=your_web_client_id
GOOGLE_ANDROID_CLIENT_ID=your_google_android_client_id
```

## 8. Common Errors & Troubleshooting 🛠️

### `DEVELOPER_ERROR` (Code 10)
This is the most common error. It means Firebase rejected your sign-in attempt because:
1. **Wrong SHA-1**: The fingerprint in Firebase doesn't match the one on your computer.
2. **Package Name Mismatch**: The package in `app.json` (`com.maria.pageturnerapp`) doesn't match the one in Firebase.
3. **Web Client ID**: You're not using the "Web Client ID" from Firebase in your `app.json`'s `googleWebClientId`.

**How to fix SHA-1:**
- Run this: `cd frontend && npx expo run:android` (it usually prints the SHA-1 in the logs).
- Add that SHA-1 to your Firebase project settings.

---
**Done!** Your app is now ready to talk to Firebase.
