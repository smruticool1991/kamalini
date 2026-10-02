import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../config/razorpay_config.dart';
import '../models/candidate_plan.dart';
import '../models/coupon.dart';

class PlanService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static const String _collectionName = 'candidatePlans';

  static Stream<List<CandidatePlan>> activePlans() {
    return _firestore
        .collection(_collectionName)
        .where('isActive', isEqualTo: true)
        .snapshots()
        .map((snap) {
      final plans = snap.docs
          .map((d) => CandidatePlan.fromFirestore(d.data(), d.id))
          .toList();
      plans.sort((a, b) => a.price.compareTo(b.price));
      return plans;
    });
  }

  /// The candidate's current feature flags, or all-empty if there's no
  /// active (unexpired) plan.
  static Future<Map<String, bool>> currentFeatureFlags(String uid) async {
    final doc = await _firestore.collection('users').doc(uid).get();
    final data = doc.data();
    if (data == null) return {};
    final expiresAt = data['planExpiresAt']?.toString();
    if (expiresAt == null) return {};
    final expiry = DateTime.tryParse(expiresAt);
    if (expiry == null || expiry.isBefore(DateTime.now())) return {};
    final rawFlags = data['planFeatureFlags'];
    if (rawFlags is Map) {
      return rawFlags.map((k, v) => MapEntry(k.toString(), v == true));
    }
    return {};
  }

  /// Looks up a coupon by code and validates it's usable right now.
  /// Throws with a user-facing message if invalid.
  static Future<Coupon> validateCoupon(String code) async {
    final trimmed = code.trim().toUpperCase();
    if (trimmed.isEmpty) throw Exception('Enter a coupon code');
    final snap = await _firestore.collection('coupons').where('code', isEqualTo: trimmed).limit(1).get();
    if (snap.docs.isEmpty) throw Exception('Invalid coupon code');
    final coupon = Coupon.fromFirestore(snap.docs.first.data(), snap.docs.first.id);
    if (!coupon.isValid) throw Exception('This coupon is no longer valid');
    return coupon;
  }

  static Future<void> _redeemCoupon(Coupon coupon) async {
    await _firestore.collection('coupons').doc(coupon.id).update({'usedCount': FieldValue.increment(1)});
  }

  /// Activates [plan] for the current candidate, applying [coupon] if given.
  /// Falls back to Razorpay checkout when the coupon-adjusted amount is > 0.
  static Future<void> purchasePlan(CandidatePlan plan, {Coupon? coupon}) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) throw Exception('Not signed in');

    final finalAmount = coupon != null ? coupon.apply(plan.price) : plan.price;

    if (finalAmount <= 0) {
      await _writePlanActivation(user.uid, plan, amount: finalAmount, couponCode: coupon?.code);
      if (coupon != null) await _redeemCoupon(coupon);
      return;
    }

    await _openRazorpayCheckout(
      user: user,
      amount: finalAmount,
      currency: plan.currency,
      description: '${plan.name} Plan — Candidate Subscription',
      onSuccess: () async {
        await _writePlanActivation(user.uid, plan, amount: finalAmount, couponCode: coupon?.code);
        if (coupon != null) await _redeemCoupon(coupon);
      },
    );
  }

  /// Whether admin has made tests subscription-only
  /// (app_settings/tests_subscription.enabled, set in admin-app Settings).
  static Stream<bool> testsSubscriptionEnabled() {
    return _firestore
        .collection('app_settings')
        .doc('tests_subscription')
        .snapshots()
        .map((snap) => snap.data()?['enabled'] == true);
  }

  /// True while the candidate has an unexpired plan that includes the
  /// 'testsAccess' feature.
  static Stream<bool> hasTestsAccess(String uid) {
    return _firestore.collection('users').doc(uid).snapshots().map((snap) {
      final data = snap.data();
      final expiry = DateTime.tryParse(data?['planExpiresAt']?.toString() ?? '');
      if (expiry == null || expiry.isBefore(DateTime.now())) return false;
      final flags = data?['planFeatureFlags'];
      return flags is Map && flags['testsAccess'] == true;
    });
  }

  static Future<void> _writePlanActivation(
    String uid,
    CandidatePlan plan, {
    required num amount,
    String? couponCode,
  }) async {
    final now = DateTime.now();
    final expiresAt = now.add(Duration(days: plan.durationDays));
    await _firestore.collection('candidatePayments').add({
      'userId': uid,
      'planId': plan.id,
      'planName': plan.name,
      'amount': amount,
      'currency': plan.currency,
      'status': 'completed',
      'couponCode': couponCode,
      'paymentDate': now.toIso8601String(),
      'expirationDate': expiresAt.toIso8601String(),
      'createdAt': FieldValue.serverTimestamp(),
    });
    // 0 or null = unlimited applications; a positive number is an enforced cap.
    final applicationsLimit = (plan.jobApplicationsPerMonth == null || plan.jobApplicationsPerMonth == 0)
        ? null
        : plan.jobApplicationsPerMonth;
    await _firestore.collection('users').doc(uid).update({
      'activePlanId': plan.id,
      'activePlanName': plan.name,
      'planExpiresAt': expiresAt.toIso8601String(),
      'planFeatureFlags': plan.featureFlags,
      'planApplicationsLimit': applicationsLimit,
      'planApplicationsUsed': 0,
    });
  }

  /// Opens Razorpay checkout for [amount] (same simplified client-only
  /// pattern as employer-app: no server-side order id, no signature
  /// verification). Completes once the payment succeeds and [onSuccess] has
  /// run; throws on failure/cancel/external-wallet.
  static Future<void> _openRazorpayCheckout({
    required User user,
    required num amount,
    required String currency,
    required String description,
    required Future<void> Function() onSuccess,
  }) {
    final completer = Completer<void>();
    final razorpay = Razorpay();

    razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse response) async {
      try {
        await onSuccess();
        if (!completer.isCompleted) completer.complete();
      } catch (e) {
        if (!completer.isCompleted) completer.completeError(e);
      } finally {
        razorpay.clear();
      }
    });

    razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse response) {
      if (!completer.isCompleted) {
        completer.completeError(Exception(response.message ?? 'Payment failed'));
      }
      razorpay.clear();
    });

    razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse response) {
      if (!completer.isCompleted) {
        completer.completeError(Exception('External wallet selected: ${response.walletName}'));
      }
      razorpay.clear();
    });

    razorpay.open({
      'key': razorpayKeyId,
      'amount': (amount * 100).round(),
      'currency': currency,
      'name': 'JobBoard Pro',
      'description': description,
      'prefill': {'contact': user.phoneNumber ?? '', 'email': user.email ?? ''},
      'theme': {'color': '#1976D2'},
    });

    return completer.future;
  }
}
