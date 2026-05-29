# Google Sign-In AAB Release Build Fix

## Problem
Google sign-in works in Android Studio debug mode but fails after uploading AAB to Google Play Console.

## Root Cause
The **SHA-1 fingerprint of your release keystore is not registered in Firebase Console**.

- ✅ Android Studio uses **debug keystore** (SHA-1 already in Firebase)
- ❌ AAB uses **release keystore** (SHA-1 NOT in Firebase)

## Solution: Add Release SHA-1 to Firebase Console

### Step 1: Get the SHA-1 Fingerprint of Your Release Keystore

You have your keystore at: `android/app/upload-keystore.jks`

**Run this command in PowerShell:**

```powershell
keytool -list -v -keystore "f:\JOB BOARD\kamalini_application\android\app\upload-keystore.jks" -storepass 933870 -keypass 933870 -alias upload
```

**Expected Output:**
```
Alias name: upload
...
Certificate fingerprints:
         SHA-1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
         ...
```

**Copy the SHA-1 value (without colons if Firebase asks for it without colons)**

### Step 2: Get Your Package Name

Check your package name in: `android/app/src/main/AndroidManifest.xml`

Or check in: `android/app/build.gradle.kts`

Look for: `namespace = "com.example.myapp"`

### Step 3: Add SHA-1 to Firebase Console

1. Go to **Firebase Console** → Your Project
2. Click **Project Settings** (gear icon)
3. Go to **Your Apps** section
4. Click on your **Android App**
5. Under **SHA certificate fingerprints**, click **Add fingerprint**
6. Paste your **Release SHA-1** (from Step 1)
7. Click **Save**

### Step 4: Verify

After adding the SHA-1 to Firebase:

1. Download the updated `google-services.json`
2. Place it in: `android/app/google-services.json`
3. Rebuild and upload new AAB file
4. Test Google sign-in

---

## Alternative: Check Your Current Fingerprints

To see ALL fingerprints currently in your keystore:

```powershell
keytool -list -v -keystore "f:\JOB BOARD\kamalini_application\android\app\upload-keystore.jks" -storepass 933870
```

---

## Debug Keystore SHA-1 (for reference)

If you also want to verify your debug SHA-1:

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

---

## Google-Services.json Location Check

Make sure your `google-services.json` has the correct package name:

```bash
# Current location:
f:\JOB BOARD\kamalini_application\android\app\google-services.json
```

The package name in `google-services.json` **MUST MATCH** your app's package name exactly.
