# 🔥 Firebase Setup - Zootel Business App

## 📱 **SEPARATE FIREBASE APP REQUIRED**

### **1. Creating Firebase Project**
```bash
# New project or add app to existing one
1. Go to https://console.firebase.google.com
2. Create new project: "Zootel Business"
   OR
   Add app to existing project "Zootel"
```

### **2. Platform Configuration**

#### **📱 iOS Configuration**
```bash
Bundle ID: com.zootel.business
App Name: Zootel Business

# Download GoogleService-Info.plist
# Place in: mobile-business/GoogleService-Info.plist
```

#### **🤖 Android Configuration**
```bash
Package Name: com.zootel.business
App Name: Zootel Business

# Download google-services.json
# Place in: mobile-business/google-services.json
```

### **3. Required Firebase Services**

#### **🔔 Firebase Cloud Messaging (FCM)**
```typescript
// For business app push notifications
Notification Types:
- New bookings
- Messages from clients  
- Task reminders
- System notifications
```

#### **📊 Firebase Analytics**
```typescript
// Tracking business app usage
Events:
- employee_login
- booking_completed  
- chat_message_sent
- analytics_viewed
- inventory_updated
```

#### **🐛 Firebase Crashlytics**
```typescript
// Production error monitoring
- Automatic crash reports
- Custom logging for business flows
- Performance monitoring
```

### **4. Installing Dependencies**
```bash
cd mobile-business
npm install @react-native-firebase/app @react-native-firebase/messaging @react-native-firebase/analytics @react-native-firebase/crashlytics expo-notifications expo-device
```

### **5. Push Notifications Configuration**

#### **iOS APNs Setup**
```bash
1. Apple Developer Console
2. Certificates, Identifiers & Profiles
3. Keys → Create new key with APNs enabled
4. Download .p8 file
5. Upload to Firebase Console → Project Settings → Cloud Messaging
```

#### **Android FCM Setup**
```bash
# Already configured through google-services.json
# Additional configuration not required
```

### **6. Environment Configuration**
```typescript
// mobile-business/src/config/firebase.ts
import { initializeApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

// Firebase configuration is automatically loaded from:
// - GoogleService-Info.plist (iOS)
// - google-services.json (Android)

export { messaging, analytics, crashlytics };
```

### **7. Integration Points**

#### **Push Notification Service**
```typescript
// Already created: mobile-business/src/services/pushNotificationService.ts
// Supports:
- Booking reminders
- New booking alerts  
- Customer messages
- System notifications
```

#### **Analytics Integration**
```typescript
// Tracking business app usage:
await analytics().logEvent('employee_action', {
  action_type: 'booking_completed',
  employee_id: employee.id,
  booking_id: booking.id
});
```

#### **Crashlytics Integration**
```typescript
// Error reporting:
import crashlytics from '@react-native-firebase/crashlytics';

crashlytics().recordError(new Error('Business app error'));
crashlytics().log('Employee performed action');
```

### **8. Testing Configuration**
```bash
# Development
- Test notifications on emulator
- Verify analytics events in Firebase Console
- Check crash reports

# Production  
- App Store Connect (iOS)
- Google Play Console (Android)
- Firebase App Distribution for beta testing
```

### **9. Security Rules**
```javascript
// Firestore rules (if used)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Business app can only read data of its own company
    match /companies/{companyId}/employees/{employeeId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == employeeId;
    }
  }
}
```

### **10. Deployment Checklist**
```bash
✅ Firebase project created
✅ iOS app configured (GoogleService-Info.plist)
✅ Android app configured (google-services.json)
✅ FCM notifications enabled
✅ APNs certificates uploaded
✅ Analytics events configured
✅ Crashlytics enabled
✅ Push notification service integrated
✅ Testing completed
✅ Production builds verified
```

---

## 🚨 **IMPORTANT: DIFFERENCES FROM PET OWNER APP**

### **Different Bundle ID / Package Names:**
- **Pet Owner**: `com.zootel.petowner`
- **Business**: `com.zootel.business`

### **Different Notification Types:**
- **Pet Owner**: Booking confirmations, reminders
- **Business**: New bookings, staff alerts, task reminders

### **Different Analytics Events:**
- **Pet Owner**: User behavior, booking flow
- **Business**: Employee productivity, business metrics

### **Different User Audiences:**
- **Pet Owner**: End customers
- **Business**: Company employees and managers

---

## ✅ **READY FOR PRODUCTION**
After completing all steps, Business App will be ready for:
- App Store deployment
- Google Play deployment  
- Enterprise distribution
- Beta testing through Firebase App Distribution 