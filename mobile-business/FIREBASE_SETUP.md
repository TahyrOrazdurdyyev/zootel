# 🔥 Firebase Setup - Zootel Business App

## 📱 **ОТДЕЛЬНОЕ FIREBASE APP НЕОБХОДИМО**

### **1. Создание Firebase Проекта**
```bash
# Новый проект или добавить app в существующий
1. Перейти на https://console.firebase.google.com
2. Создать новый проект: "Zootel Business"
   ИЛИ
   Добавить приложение в существующий проект "Zootel"
```

### **2. Конфигурация Платформ**

#### **📱 iOS Configuration**
```bash
Bundle ID: com.zootel.business
App Name: Zootel Business

# Скачать GoogleService-Info.plist
# Поместить в: mobile-business/GoogleService-Info.plist
```

#### **🤖 Android Configuration**
```bash
Package Name: com.zootel.business
App Name: Zootel Business

# Скачать google-services.json
# Поместить в: mobile-business/google-services.json
```

### **3. Необходимые Firebase Services**

#### **🔔 Firebase Cloud Messaging (FCM)**
```typescript
// Для push notifications бизнес-приложения
Notification Types:
- Новые бронирования
- Сообщения от клиентов  
- Напоминания о задачах
- Системные уведомления
```

#### **📊 Firebase Analytics**
```typescript
// Отслеживание использования бизнес-приложения
Events:
- employee_login
- booking_completed  
- chat_message_sent
- analytics_viewed
- inventory_updated
```

#### **🐛 Firebase Crashlytics**
```typescript
// Мониторинг ошибок в продакшене
- Автоматические crash reports
- Custom logging для business flows
- Performance monitoring
```

### **4. Установка Зависимостей**
```bash
cd mobile-business
npm install @react-native-firebase/app @react-native-firebase/messaging @react-native-firebase/analytics @react-native-firebase/crashlytics expo-notifications expo-device
```

### **5. Конфигурация Push Notifications**

#### **iOS APNs Setup**
```bash
1. Apple Developer Console
2. Certificates, Identifiers & Profiles
3. Keys → Create new key with APNs enabled
4. Download .p8 file
5. Upload в Firebase Console → Project Settings → Cloud Messaging
```

#### **Android FCM Setup**
```bash
# Уже настроено через google-services.json
# Дополнительная настройка не требуется
```

### **6. Environment Configuration**
```typescript
// mobile-business/src/config/firebase.ts
import { initializeApp } from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

// Firebase конфигурация автоматически загружается из:
// - GoogleService-Info.plist (iOS)
// - google-services.json (Android)

export { messaging, analytics, crashlytics };
```

### **7. Integration Points**

#### **Push Notification Service**
```typescript
// Уже создан: mobile-business/src/services/pushNotificationService.ts
// Поддерживает:
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
- Test notifications на эмуляторе
- Verify analytics events в Firebase Console
- Check crash reports

# Production  
- App Store Connect (iOS)
- Google Play Console (Android)
- Firebase App Distribution для beta testing
```

### **9. Security Rules**
```javascript
// Firestore rules (если используется)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Business app может читать только данные своей компании
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

## 🚨 **ВАЖНО: ОТЛИЧИЯ ОТ PET OWNER APP**

### **Разные Bundle ID / Package Names:**
- **Pet Owner**: `com.zootel.petowner`
- **Business**: `com.zootel.business`

### **Разные Notification Types:**
- **Pet Owner**: Booking confirmations, reminders
- **Business**: New bookings, staff alerts, task reminders

### **Разные Analytics Events:**
- **Pet Owner**: User behavior, booking flow
- **Business**: Employee productivity, business metrics

### **Разные User Audiences:**
- **Pet Owner**: End customers
- **Business**: Company employees and managers

---

## ✅ **ГОТОВО К PRODUCTION**
После выполнения всех шагов Business App будет готов к:
- App Store deployment
- Google Play deployment  
- Enterprise distribution
- Beta testing через Firebase App Distribution 