// This service worker handles background notifications for Firebase Cloud Messaging.

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.21.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.21.0/firebase-messaging-compat.js');

// =====================================================================================
// Firebase project configuration from .env file
// =====================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyB-VYmXVH3Sed_b_foS5NhVBhSftkLAhW0",
  authDomain: "xpr-stake-alert.firebaseapp.com",
  projectId: "xpr-stake-alert",
  storageBucket: "xpr-stake-alert.firebasestorage.app",
  messagingSenderId: "1061453498887",
  appId: "1:1061453498887:web:c1e2be6ecba17e5c47f8a2",
};

// =====================================================================================

// Initialize Firebase
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized, use that one
}

const messaging = firebase.messaging();

// This handler will be executed when a message is received in the background.
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here for "최애의 알리미"
  const notificationTitle = payload.data.title || '최애의 알리미';
  let notificationBody = payload.data.body || '새로운 알림이 도착했습니다.';
  const biasTone = payload.data.biasTone;

  if (biasTone) {
    notificationBody += ` ${biasTone}`;
  }

  const notificationOptions = {
    body: notificationBody,
    icon: '/pwa-192x192.png' // Use a generic PWA icon
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
