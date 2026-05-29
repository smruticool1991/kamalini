# IMMEDIATE ACTION: Fix Google Sign-In for AAB Build

## Your App Information
- **Package Name**: `com.kamaliniapp.india` ✅
- **Release Keystore**: `android/app/upload-keystore.jks` ✅
- **Key Alias**: `upload` ✅

---

## STEP 1: Extract Release SHA-1 Fingerprint

**Open PowerShell and run:**

```powershell
keytool -list -v -keystore "f:\JOB BOARD\kamalini_application\android\app\upload-keystore.jks" -storepass 933870 -keypass 933870 -alias upload
```

**Look for this line in the output:**
```
SHA-1: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
```

**Copy this value (with colons)**

---

## STEP 2: Add to Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: "ka-jobs" (Project ID: ka-jobs)
3. **Click Settings** (⚙️ icon, top left)
4. **Go to "Project Settings"**
5. **Find "Your apps"** section → Click on Android app
6. **Under "SHA certificate fingerprints"** → Click "Add fingerprint"
7. **Paste the SHA-1 value** from Step 1
8. **Click "Save"**

---

## STEP 3: Update google-services.json (If Needed)

After saving in Firebase Console:

1. Download the new `google-services.json` file
2. Replace: `android/app/google-services.json`
3. Rebuild the AAB

```bash
# In Flutter project root:
flutter clean
flutter pub get
flutter build appbundle --release
```

---

## STEP 4: Upload New AAB to Google Play Console

1. **Go to Google Play Console**
2. **Select your app**
3. **Go to "Testing" → "Internal testing"** (or upload to production)
4. **Upload the new AAB** from: `build/app/outputs/bundle/release/app-release.aab`
5. **Test on device**

---

## Expected Result

✅ Google Sign-In should now work on released builds

---

## Troubleshooting

### If still not working:

**Verify the certificate_hash in google-services.json:**

The hash in the file (WITHOUT colons) must match your SHA-1.

Current in your file:
```
"certificate_hash": "17e617694fdf737fd0252705a32cfe6025f0d39d"
```

To convert your SHA-1 `XX:XX:XX:XX:...` to this format:
- Remove all colons (:)
- Convert to lowercase

---

## Why This Happens

| When | Signing Key | Status |
|------|-------------|--------|
| Android Studio | Debug keystore | ✅ Works (already in Firebase) |
| APK Debug Build | Debug keystore | ✅ Works |
| AAB Release Build | Release keystore | ❌ Fails (not in Firebase) |
| APK Release Build | Release keystore | ❌ Fails (not in Firebase) |

Firebase must have **BOTH** SHA-1 fingerprints if you want both debug and release builds to work.
