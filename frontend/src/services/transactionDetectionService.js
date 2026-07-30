/**
 * Transaction Detection Service
 * 
 * Simulates reading SMS messages and Android payment notifications.
 * In production, this would use native modules:
 *   - react-native-get-sms-android (for SMS)
 *   - react-native-android-notification-listener (for notifications)
 * 
 * Currently provides a simulation layer with realistic Indian banking SMS
 * templates that exercises the full detection → parse → confirm pipeline.
 */

import { parseTransaction } from './transactionParserService';
import { mapCategory } from './categoryMapperService';

// ── Realistic SMS templates for simulation ───────────────────
const MOCK_SMS_MESSAGES = [
  'Rs.500 paid to AMAZON via UPI Ref 412345678901',
  'INR 150.00 debited from A/c XX4521 for SWIGGY order. Ref 523456789012',
  'Rs.1200 paid to UBER INDIA via UPI. Txn ID 634567890123',
  'Payment of Rs.799 to NETFLIX via credit card ending 4532. Ref 745678901234',
  'Rs.350 sent to FLIPKART via UPI Ref 856789012345',
  'INR 2,500.00 debited at CROMA ELECTRONICS. Ref 967890123456',
  'Rs.450 paid to ZOMATO via UPI Ref 178901234567',
  'INR 899.00 debited for SPOTIFY PREMIUM subscription. Ref 289012345678',
  'Rs.85 paid to OLA CABS via UPI Ref 390123456789',
  'Rs.1,999 paid to MYNTRA via UPI Ref 401234567890',
  'INR 300 credited from CASHBACK reward. Ref 512345678901',
  'Rs.249 paid to HOTSTAR via UPI Ref 623456789012',
];

// ── Mock notification payloads ───────────────────────────────
const MOCK_NOTIFICATIONS = [
  { app: 'Google Pay', text: 'Paid ₹200 to Swiggy', icon: 'logo-google' },
  { app: 'PhonePe', text: 'Rs.500 sent to Amazon Pay', icon: 'phone-portrait' },
  { app: 'Paytm', text: 'Payment of ₹150 to Uber successful', icon: 'wallet' },
  { app: 'Amazon Pay', text: '₹349 paid to Flipkart', icon: 'bag-handle' },
  { app: 'Google Pay', text: 'Received ₹1,000 from John Doe', icon: 'logo-google' },
  { app: 'PhonePe', text: 'Rs.599 paid to BookMyShow', icon: 'phone-portrait' },
  { app: 'Bank App', text: 'INR 2,000 debited from A/c XX1234 at PVR Cinemas. Ref 734567890123', icon: 'business' },
];

// ── Event listeners ──────────────────────────────────────────
let listeners = [];
let isListening = false;

/**
 * Register a listener for detected transactions
 * @param {function} callback - Called with { parsed, source, raw } when transaction detected
 * @returns {function} Unsubscribe function
 */
export function onTransactionDetected(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

/**
 * Notify all listeners of a detected transaction
 */
function notifyListeners(data) {
  listeners.forEach(callback => {
    try {
      callback(data);
    } catch (err) {
      console.log('Transaction listener error:', err);
    }
  });
}

/**
 * Start listening for transactions (simulation mode)
 * In production, this would:
 *   1. Request SMS permission (android.permission.READ_SMS, RECEIVE_SMS)
 *   2. Register a BroadcastReceiver for incoming SMS
 *   3. Start NotificationListenerService for payment app notifications
 */
export function startListening() {
  isListening = true;
  console.log('[TransactionDetection] Listening started (simulation mode)');
  return true;
}

/**
 * Stop listening for transactions
 */
export function stopListening() {
  isListening = false;
  listeners = [];
  console.log('[TransactionDetection] Listening stopped');
}

/**
 * Check if detection is currently active
 */
export function isDetectionActive() {
  return isListening;
}

/**
 * Simulate an incoming SMS transaction
 * Returns the parsed transaction or null if message was filtered out
 */
export function simulateIncomingSMS() {
  if (!isListening) {
    console.log('[TransactionDetection] Not listening — start listening first');
    return null;
  }

  const randomIndex = Math.floor(Math.random() * MOCK_SMS_MESSAGES.length);
  const rawMessage = MOCK_SMS_MESSAGES[randomIndex];

  const parsed = parseTransaction(rawMessage, 'SMS');
  if (!parsed) return null;

  const categoryResult = mapCategory(parsed.merchant);
  const enriched = {
    ...parsed,
    category: categoryResult.category,
    confidenceScore: categoryResult.confidence,
  };

  notifyListeners({ parsed: enriched, source: 'SMS', raw: rawMessage });
  return enriched;
}

/**
 * Simulate an incoming payment notification
 * Returns the parsed transaction or null
 */
export function simulateNotification() {
  if (!isListening) {
    console.log('[TransactionDetection] Not listening — start listening first');
    return null;
  }

  const randomIndex = Math.floor(Math.random() * MOCK_NOTIFICATIONS.length);
  const notification = MOCK_NOTIFICATIONS[randomIndex];

  const parsed = parseTransaction(notification.text, 'NOTIFICATION');
  if (!parsed) return null;

  const categoryResult = mapCategory(parsed.merchant);
  const enriched = {
    ...parsed,
    category: categoryResult.category,
    confidenceScore: categoryResult.confidence,
    appName: notification.app,
    appIcon: notification.icon,
  };

  notifyListeners({ parsed: enriched, source: 'NOTIFICATION', raw: notification.text });
  return enriched;
}

/**
 * Simulate a custom SMS message for testing
 * @param {string} message - Custom SMS text
 */
export function simulateCustomSMS(message) {
  if (!isListening) return null;

  const parsed = parseTransaction(message, 'SMS');
  if (!parsed) return null;

  const categoryResult = mapCategory(parsed.merchant);
  const enriched = {
    ...parsed,
    category: categoryResult.category,
    confidenceScore: categoryResult.confidence,
  };

  notifyListeners({ parsed: enriched, source: 'SMS', raw: message });
  return enriched;
}

/**
 * Check SMS permission status (simulation — always returns mock value)
 * In production: check PermissionsAndroid.check(PERMISSIONS.READ_SMS)
 */
export async function checkSmsPermission() {
  // Simulated — in production, use PermissionsAndroid
  return 'simulation';
}

/**
 * Check notification listener permission (simulation)
 * In production: check if NotificationListenerService is enabled
 */
export async function checkNotificationPermission() {
  // Simulated — in production, check system settings
  return 'simulation';
}

export default {
  onTransactionDetected,
  startListening,
  stopListening,
  isDetectionActive,
  simulateIncomingSMS,
  simulateNotification,
  simulateCustomSMS,
  checkSmsPermission,
  checkNotificationPermission,
};
