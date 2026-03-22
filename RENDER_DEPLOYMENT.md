# 🚀 Render Deployment Guide (ELI5)

This guide explains how to put your **Backend** on the internet using a service called **Render**. Think of Render as a big computer in the cloud that will run your code 24/7 so your app can work from anywhere.

---

## 🏗️ Step 1: Tell Render About Your Code   

1.  **Push to GitHub**: Make sure all your latest code is on GitHub (we already did this!).
2.  **Go to Render**: Log in to [dashboard.render.com](https://dashboard.render.com).
3.  **New Web Service**: Click the **"New +"** button and pick **"Web Service"**.
4.  **Connect GitHub**: Find your `PageTurnerFinal` repository and click **"Connect"**.

---

## ⚙️ Step 2: Fill in the Settings

When Render asks for details, use these exactly:

-   **Name**: `pageturner-backend`
-   **Environment**: `Node`
-   **Region**: Pick the one closest to you (e.g., Singapore or Oregon).
-   **Branch**: `main`
-   **Root Directory**: `backend`  *(This is very important!)*
-   **Build Command**: `npm install`
-   **Start Command**: `npm start`

--- 

## 🔑 Step 3: Add Your "Secret Recipes" (Environment Variables)

Your app needs special keys to talk to the Database and Firebase. In Render, go to the **"Environment"** tab and click **"Add Environment Variable"** for each of these:

### 1. The Essentials
-   `MONGODB_URI`: Paste your MongoDB connection string here.
-   `APP_JWT_SECRET`: Type a long, random sentence (like a super password).

### 2. Firebase (The tricky part)
-   `FIREBASE_PROJECT_ID`: Your Firebase project ID.
-   `FIREBASE_SERVICE_ACCOUNT_JSON`: Open your `firebase-service-account.json` file, copy **everything** inside, and paste it here.

### 3. Cloudinary (For Images)
-   `CLOUDINARY_CLOUD_NAME`: Your Cloudinary name.
-   `CLOUDINARY_API_KEY`: Your Cloudinary key.
-   `CLOUDINARY_API_SECRET`: Your Cloudinary secret.

- **`GLIBC_2.38` not found error**: 
  - This happens if Render uses a Node.js version that is too new for their current system (like Node 22). 
  - **Fix**: In your `backend/package.json`, I've added an `engines` field to force Render to use **Node 20 (LTS)**. This should fix the issue with `sqlite3`.

---

## 🚀 Step 4: Launch!

1.  Click **"Create Web Service"**.
2.  Wait a few minutes. You will see a black screen with text (logs). 
3.  When it says `Server is running on port 10000`, your backend is live!

---

## 🔗 Step 5: Connect Your Phone App

Once your backend is live, Render will give you a link like `https://pageturner-backend.onrender.com`.

1.  Go to your **Frontend** code.
2.  Find the file where you set the API URL (usually `assets/common/baseurl.js`).
3.  Change the URL to: `https://pageturner-backend.onrender.com/api/v1/`

---

## ✅ Step 6: Check if it Works

Open this link in your browser: 
`https://pageturner-backend.onrender.com/api/v1/health`

If you see `{"ok":true,"message":"API is healthy"}`, you did it! 🎉
