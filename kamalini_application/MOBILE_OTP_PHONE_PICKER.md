# Mobile OTP Login - Phone Number Picker Enhancement

## Overview
Enhanced the mobile OTP login with intelligent phone number selection from device SIM and manual entry options. Phone OTP is now the default login method.

## Features Implemented

### 1. **Phone OTP as Default Tab**
- Changed default login method from Email to Phone OTP
- When users open the app, they see "Phone OTP" tab selected
- Email login available as secondary option

### 2. **Smart Phone Number Picker**
When user taps the phone number field:

#### Dialog Shows Two Options:

**Option 1: Enter Manually**
- Manual phone number entry
- User taps "Continue" → Dialog opens
- Enter 10-digit phone number with +91 prefix
- System validates exactly 10 digits
- On confirmation, number auto-fills in the field

**Option 2: From Device SIM**
- Auto-detect SIM number
- Placeholder for native platform integration
- Ready for `TelephonyManager` (Android) and native iOS implementation

### 3. **Read-Only Phone Field**
- Phone input field is disabled (read-only)
- Shows hint: "Tap to select phone number"
- Displays phone icon on the right
- User must tap to open picker dialog
- Prevents accidental typing

### 4. **Validation**
- Only 10-digit phone numbers accepted
- Automatic +91 country code prepended
- Error message if fewer than 10 digits
- Field only activates on picker selection

## Technical Implementation

### State Variables
```dart
int _selectedTab = 1;                          // Default: Phone OTP
List<String> _availablePhoneNumbers = [];      // For SIM detection
```

### Key Methods

#### `initState()`
- Calls `_loadAvailablePhoneNumbers()`
- Initializes available phone numbers on screen load

#### `_loadAvailablePhoneNumbers()`
- Placeholder for device SIM/contact integration
- Currently returns empty list
- Production: Use platform channels or packages like `sim_data`

#### `_showPhoneNumberPicker()`
- Main dialog showing two options
- Manual entry or SIM detection
- Returns user to manual entry dialog on "Continue"

#### `_showManualPhoneEntry()`
- Dialog for typing phone number
- Validates input
- Updates `_phoneController` on confirmation
- Shows error if validation fails

### UI Changes

#### Phone Number Field
**Before:**
```
Regular TextField with keyboard input
```

**After:**
```
Read-only field with:
- Phone icon suffix
- "Tap to select phone number" hint
- Triggers picker on tap
```

#### Dialogs Added
1. **Phone Selection Dialog**
   - Shows 2 options in styled containers
   - Cancel and Continue buttons

2. **Manual Entry Dialog**
   - Phone number input with +91 prefix
   - Cancel and Confirm buttons
   - Validation feedback

## User Flow

### Step 1: Open App
```
✓ Phone OTP tab shown by default
✓ User sees: "Tap to select phone number" field
```

### Step 2: Tap Phone Field
```
✓ Phone Picker Dialog opens
✓ Two options displayed:
  - Enter Manually (Edit icon)
  - From Device SIM (SIM icon)
```

### Step 3: Select Option
```
✓ User taps "Continue"
✓ Manual Entry Dialog opens
```

### Step 4: Enter Phone Number
```
✓ User types 10-digit number
✓ System shows: +91 [10 digits]
✓ User taps "Confirm"
```

### Step 5: Number Confirmed
```
✓ Dialog closes
✓ Field shows: +91 9876543210
✓ Field displays phone icon
✓ User can tap "Send OTP" button
```

### Step 6: OTP Flow (Existing)
```
✓ Send OTP → SMS received → Enter OTP → Verify → Sign in
```

## Design Details

### Dialog Styling
- Rounded corners (12px)
- Two-column option containers with:
  - Icon (edit/sim)
  - Title and subtitle text
  - Clean borders and backgrounds

### Color Scheme
- Primary: `#2563EB` (Blue)
- Icon colors match purpose
- Text hierarchy (13px title, 12px subtitle)

### Validation Messages
- Success: Auto-fills field
- Error: "Please enter exactly 10 digits"
- Red background snackbar

## Future Enhancements

### Phase 1 (Current)
- ✅ Manual phone number entry
- ✅ Placeholder for SIM detection

### Phase 2 (Native Integration)
1. **Android Implementation**
   - Use `TelephonyManager` class
   - Get SIM phone number from `LineNumberManager`
   - Handle multi-SIM devices
   - Permissions: `READ_PHONE_NUMBERS`, `READ_PHONE_STATE`

2. **iOS Implementation**
   - CoreTelephony framework
   - Get phone number from CTCarrier
   - Handle private number scenarios

### Phase 3 (Contacts Integration)
- Load recent contacts
- Show frequently called numbers
- Select from contact list

### Phase 4 (Auto-Detection)
- Detect SIM number automatically
- Show in picker with badge
- One-click selection

## Code Location
- **File**: `lib/main.dart`
- **Class**: `SignInScreen` → `_SignInScreenState`
- **Methods**:
  - `_showPhoneNumberPicker()` - Main picker dialog
  - `_showManualPhoneEntry()` - Manual entry dialog
  - `_loadAvailablePhoneNumbers()` - Device number detection
- **Line Range**: ~1020-1320 (UI) + ~498-600 (Methods)

## Testing Checklist

- [x] Phone OTP tab loads as default
- [x] Phone field is read-only
- [x] Tapping field opens picker dialog
- [x] Manual entry option works
- [x] 10-digit validation works
- [x] Error handling for < 10 digits
- [x] Number auto-fills on confirmation
- [x] Phone icon displays correctly
- [x] Dialog dismisses properly
- [x] Tab switching works

## Error Scenarios

1. **Less than 10 digits**
   - Shows: "Please enter exactly 10 digits"
   - Red snackbar
   - Dialog stays open

2. **Empty field on confirm**
   - Shows: "Please enter exactly 10 digits"
   - User can retry

3. **Dialog cancellation**
   - Closes dialog
   - Field remains unchanged
   - User can try again

## Permissions Required

### Android (Future SIM Detection)
```xml
<uses-permission android:name="android.permission.READ_PHONE_NUMBERS" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
```

### iOS (Future SIM Detection)
```swift
import CoreTelephony
```

## State Management

| State | Value | Purpose |
|-------|-------|---------|
| `_selectedTab` | 1 | Default Phone OTP |
| `_isOtpSent` | false | Tracks OTP flow |
| `_phoneController` | "" | Stores phone number |
| `_availablePhoneNumbers` | [] | SIM numbers list |

## Integration with Existing OTP Flow

The phone picker feeds into existing OTP system:

```
Phone Picker ──> _phoneController filled
                      ↓
                  User taps "Send OTP"
                      ↓
                  _sendOTP() method
                      ↓
                  Firebase verification
                      ↓
                  OTP dialog / timer
                      ↓
                  _verifyOTP() on entry
                      ↓
                  Auto sign-in on success
```

## Production Deployment Notes

1. **SIM Detection**: Currently placeholder
   - Implement native channel for device number
   - Test with multi-SIM devices
   - Handle permission requests

2. **Input Validation**: Works as-is
   - 10-digit validation active
   - +91 prefix auto-added
   - Error messages clear

3. **User Experience**: Ready
   - Clean UI
   - Clear instructions
   - Smooth transitions
   - Error feedback

## Performance Notes

- Dialog opens instantly
- No network calls before OTP sent
- Lightweight state management
- TextField disabled = no keyboard overhead

## Accessibility

- Icons clear and distinct
- Text descriptions provided
- Touch targets adequate (12px padding)
- Error messages visible
- Navigation clear

## Backwards Compatibility

- Email login still available
- Existing OTP flow unchanged
- Can revert tab order if needed
- No breaking changes to authentication
