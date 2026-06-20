const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

/**
 * Fires whenever a new testNotification document is created in Firestore
 * (which happens when admin publishes a test in the admin app).
 * Sends a high-priority FCM push notification to ALL devices subscribed
 * to the "new_tests" topic.
 */
exports.sendTestPublishedNotification = onDocumentCreated(
  { document: 'testNotifications/{docId}', region: 'asia-south1' },
  async (event) => {
    const data = event.data?.data();
    if (!data) return null;

    const testTitle = (data.testTitle || 'New Test').toString();

    const message = {
      notification: {
        title: '📝 New Test Available!',
        body: `${testTitle} — Tap to take the test now.`,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'new_tests_channel',
          color: '#7C3AED',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      data: {
        type: 'new_test',
        testId: (data.testId || '').toString(),
      },
      topic: 'new_tests',
    };

    await getMessaging().send(message);
    console.log(`FCM sent for test: "${testTitle}"`);
    return null;
  },
);
