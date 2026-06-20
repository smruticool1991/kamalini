import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'screens/splash_screen.dart';
import 'screens/search_job_screen.dart';
import 'screens/tests_screen.dart';
import 'services/recommendation_service.dart';
import 'firebase_options.dart';

// ── FCM: top-level plugin and notification channel ──────────────────────────

final FlutterLocalNotificationsPlugin _localNotif =
    FlutterLocalNotificationsPlugin();

const AndroidNotificationChannel _notifChannel = AndroidNotificationChannel(
  'new_tests_channel',
  'New Tests',
  description: 'Notifications when new tests are published',
  importance: Importance.high,
);

// Single shared GoogleSignIn instance
final _googleSignInClient = GoogleSignIn();

/// Gets the Google OAuth credential without signing into Firebase.
Future<OAuthCredential?> _getGoogleCredential() async {
  final googleUser = await _googleSignInClient.signIn();
  if (googleUser == null) return null;
  final googleAuth = await googleUser.authentication;
  return GoogleAuthProvider.credential(
    accessToken: googleAuth.accessToken,
    idToken: googleAuth.idToken,
  );
}

/// Signs in with Google. If the email already exists under email/password,
/// shows a dialog to link both providers onto the same account (same UID).
/// Returns null if the user cancelled.
Future<UserCredential?> _signInOrLinkGoogle(BuildContext context) async {
  final oauthCred = await _getGoogleCredential();
  if (oauthCred == null) return null;

  try {
    return await FirebaseAuth.instance.signInWithCredential(oauthCred);
  } on FirebaseAuthException catch (e) {
    if (e.code == 'account-exists-with-different-credential' && e.email != null) {
      return _linkGoogleToEmailAccount(context, e.email!, oauthCred);
    }
    rethrow;
  }
}

/// Prompts for the existing password, then links Google onto the same account.
Future<UserCredential?> _linkGoogleToEmailAccount(
  BuildContext context,
  String email,
  OAuthCredential googleCred,
) async {
  final passCtrl = TextEditingController();
  final confirmed = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (_) => _LinkAccountDialog(email: email, passCtrl: passCtrl),
  );
  if (confirmed != true) {
    passCtrl.dispose();
    return null;
  }
  final password = passCtrl.text.trim();
  passCtrl.dispose();

  final existing = await FirebaseAuth.instance.signInWithEmailAndPassword(
    email: email,
    password: password,
  );
  await existing.user!.linkWithCredential(googleCred);
  return existing;
}

/// Ensures a Firestore user document exists for a Google sign-in.
/// For existing users (linked accounts), preserves name/photo set during
/// onboarding — only fills in fields that are missing.
Future<void> _ensureGoogleUserDoc(User user, {bool isNew = false}) async {
  final docRef = FirebaseFirestore.instance.collection('users').doc(user.uid);
  if (isNew) {
    await docRef.set({
      'name': user.displayName ?? '',
      'email': user.email ?? '',
      'photoURL': user.photoURL ?? '',
      'profileComplete': false,
      'signInMethod': 'google',
      'createdAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  } else {
    // Read existing doc so we don't overwrite name/photo the user already set.
    final snap = await docRef.get();
    final existing = (snap.data() ?? {}) as Map<String, dynamic>;
    final updates = <String, dynamic>{
      'email': user.email ?? '',
    };
    if ((existing['name'] ?? '').toString().trim().isEmpty) {
      updates['name'] = user.displayName ?? '';
    }
    if ((existing['photoURL'] ?? '').toString().trim().isEmpty &&
        (user.photoURL ?? '').isNotEmpty) {
      updates['photoURL'] = user.photoURL!;
    }
    await docRef.set(updates, SetOptions(merge: true));
  }
}

/// Must be a top-level function — called when app is killed/background.
@pragma('vm:entry-point')
Future<void> _fcmBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}

Future<void> _initFcm() async {
  try {
    FirebaseMessaging.onBackgroundMessage(_fcmBackgroundHandler);
    await _localNotif
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_notifChannel);
    await _localNotif.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      ),
    );
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    await FirebaseMessaging.instance.subscribeToTopic('new_tests');
  } catch (_) {}
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Determine start screen based on saved session
  final bool isLoggedIn = FirebaseAuth.instance.currentUser != null;
  bool profileComplete = false;
  if (isLoggedIn) {
    try {
      final uid = FirebaseAuth.instance.currentUser!.uid;
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .get();
      profileComplete = (doc.data()?['profileComplete'] == true);
    } catch (_) {}
  }
  runApp(MainApp(isLoggedIn: isLoggedIn, profileComplete: profileComplete));

  // FCM runs after runApp() so the permission dialog has a live UI context.
  _initFcm();
}

class MainApp extends StatelessWidget {
  final bool isLoggedIn;
  final bool profileComplete;
  const MainApp({super.key, required this.isLoggedIn, this.profileComplete = false});

  @override
  Widget build(BuildContext context) {
    Widget nextScreen;
    if (!isLoggedIn) {
      nextScreen = const WelcomeScreen();
    } else if (!profileComplete) {
      nextScreen = const ProfileOnboardingFlow();
    } else {
      nextScreen = const JobBoardHome();
    }
    return MaterialApp(
      title: 'KA Jobs',
      theme: ThemeData(
        primaryColor: const Color(0xFF2563EB),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        useMaterial3: true,
      ),
      home: SplashScreen(
        nextScreen: nextScreen,
      ),
      debugShowCheckedModeBanner: false,
    );
  }
}

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  int _currentPage = 0;
  late PageController _pageController;

  // Tags per page: label, color — diverse across all industries
  final List<List<Map<String, dynamic>>> _pageTags = [
    [
      {'label': '#Designer',       'color': Color(0xFF8B5CF6)},
      {'label': '#Manager',        'color': Color(0xFFEF4444)},
      {'label': '#React Dev',      'color': Color(0xFF3B82F6)},
      {'label': '#UX Designer',    'color': Color(0xFF0D9488)},
      {'label': '#Developer',      'color': Color(0xFFF97316)},
    ],
    [
      {'label': '#Accountant',     'color': Color(0xFF8B5CF6)},
      {'label': '#Nurse',          'color': Color(0xFFEF4444)},
      {'label': '#Consultant',     'color': Color(0xFF3B82F6)},
      {'label': '#Marketer',       'color': Color(0xFF0D9488)},
      {'label': '#Analyst',        'color': Color(0xFFF97316)},
    ],
    [
      {'label': '#Teacher',        'color': Color(0xFF8B5CF6)},
      {'label': '#Engineer',       'color': Color(0xFFEF4444)},
      {'label': '#Sales Lead',     'color': Color(0xFF3B82F6)},
      {'label': '#HR Manager',     'color': Color(0xFF0D9488)},
      {'label': '#Architect',      'color': Color(0xFFF97316)},
    ],
  ];

  final List<Map<String, String>> _welcomeData = [
    {
      'title': 'Finding Your Perfect Career Path Starts Here!',
      'subtitle': 'Confused looking for updated jobs and let\'s see here lots of job listings',
    },
    {
      'title': 'Explore Amazing Opportunities',
      'subtitle': 'Browse through thousands of job listings tailored to your skills',
    },
    {
      'title': 'Build Your Professional Profile',
      'subtitle': 'Create a stunning profile to attract top employers in your field',
    },
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Main content with PageView
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _welcomeData.length,
                itemBuilder: (context, index) {
                  return _buildWelcomePage(index);
                },
              ),
            ),
            // Pagination and Navigation
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: Column(
                children: [
                  // Dot indicators and arrow buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Previous button
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(50),
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back),
                          onPressed: _currentPage > 0
                              ? () {
                                  _pageController.previousPage(
                                    duration: const Duration(milliseconds: 300),
                                    curve: Curves.easeInOut,
                                  );
                                }
                              : null,
                          color: Colors.black54,
                        ),
                      ),
                      // Dot indicators
                      Row(
                        children: List.generate(
                          _welcomeData.length,
                          (index) => Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Container(
                              width: _currentPage == index ? 24 : 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: _currentPage == index
                                    ? const Color(0xFF2563EB)
                                    : const Color(0xFFD1D5DB),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ),
                      ),
                      // Next button
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(50),
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.arrow_forward),
                          onPressed: _currentPage < _welcomeData.length - 1
                              ? () {
                                  _pageController.nextPage(
                                    duration: const Duration(milliseconds: 300),
                                    curve: Curves.easeInOut,
                                  );
                                }
                              : null,
                          color: Colors.black54,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Let's get Started button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const SignInScreen(),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Let\'s get Started',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Sign In link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Already have and account? ',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const SignInScreen(),
                            ),
                          );
                        },
                        child: const Text(
                          'Sign In',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF2563EB),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomePage(int index) {
    final tags = _pageTags[index];
    // Fixed positions: [top-left, top-right, mid-left, mid-right, bottom-left]
    // Expressed as fractions of the 300×300 Stack area
    const tagPositions = [
      _TagPos(top: 18,  left: 0),
      _TagPos(top: 55,  right: 0),
      _TagPos(top: 148, left: 0),
      _TagPos(top: 170, right: 0),
      _TagPos(bottom: 18, left: 28),
    ];

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        child: Column(
          children: [
            // ── Round circle with person + floating tags ──
            SizedBox(
              width: 300,
              height: 300,
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  // Outer light-grey circle
                  Container(
                    width: 270,
                    height: 270,
                    decoration: const BoxDecoration(
                      color: Color(0xFFF1F2F6),
                      shape: BoxShape.circle,
                    ),
                  ),
                  // Inner slightly-darker circle with person icon
                  Container(
                    width: 210,
                    height: 210,
                    decoration: const BoxDecoration(
                      color: Color(0xFFE2E4EA),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.person,
                      size: 110,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                  // Floating designation tags
                  ...List.generate(tags.length, (i) {
                    final pos = tagPositions[i];
                    return _FloatingTag(
                      label: tags[i]['label'] as String,
                      color: tags[i]['color'] as Color,
                      top: pos.top,
                      bottom: pos.bottom,
                      left: pos.left,
                      right: pos.right,
                      delay: Duration(milliseconds: i * 200),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 36),
            // Title
            Text(
              _welcomeData[index]['title']!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 12),
            // Subtitle
            Text(
              _welcomeData[index]['subtitle']!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF9CA3AF),
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Tag position helper ──────────────────────────────────────────────────────
class _TagPos {
  final double? top, bottom, left, right;
  const _TagPos({this.top, this.bottom, this.left, this.right});
}

// ── Floating animated tag chip ───────────────────────────────────────────────
class _FloatingTag extends StatefulWidget {
  final String label;
  final Color color;
  final double? top, bottom, left, right;
  final Duration delay;

  const _FloatingTag({
    required this.label,
    required this.color,
    this.top,
    this.bottom,
    this.left,
    this.right,
    required this.delay,
  });

  @override
  State<_FloatingTag> createState() => _FloatingTagState();
}

class _FloatingTagState extends State<_FloatingTag>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _float;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    );
    _float = Tween(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
    Future.delayed(widget.delay, () {
      if (mounted) _ctrl.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: widget.top,
      bottom: widget.bottom,
      left: widget.left,
      right: widget.right,
      child: AnimatedBuilder(
        animation: _float,
        builder: (_, child) => Transform.translate(
          offset: Offset(0, -5 * _float.value),
          child: child,
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: widget.color,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: widget.color.withOpacity(0.35),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Text(
            widget.label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Firebase SMS Phone Authentication — clean two-step implementation
// Step 1: Enter phone number → Firebase sends SMS OTP
// Step 2: Enter OTP manually → Firebase verifies → navigate
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {

  bool _isEmailLoading = false;
  bool _isGoogleLoading = false;
  bool _obscurePassword = true;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // ── Email / Password Sign-In ──────────────────────────────────────────────
  Future<void> _signInWithEmail() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _isEmailLoading = true);
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );
      await _navigateAfterLogin();
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      String msg;
      bool offerGoogle = false;
      switch (e.code) {
        case 'user-not-found':
          msg = 'No account found for this email.';
          break;
        case 'wrong-password':
        case 'invalid-credential':
          // Check if this email belongs to a Google-only account so we can
          // suggest the right sign-in method instead of a confusing error.
          final methods = await FirebaseAuth.instance
              .fetchSignInMethodsForEmail(_emailController.text.trim())
              .catchError((_) => <String>[]);
          if (methods.contains('google.com') && !methods.contains('password')) {
            msg = 'This account uses Google Sign-In. Tap "Continue with Google" below to sign in.';
            offerGoogle = true;
          } else {
            msg = e.code == 'wrong-password'
                ? 'Incorrect password. Please try again.'
                : 'Invalid email or password.';
          }
          break;
        case 'invalid-email':
          msg = 'Please enter a valid email address.';
          break;
        case 'user-disabled':
          msg = 'This account has been disabled.';
          break;
        default:
          msg = e.message ?? 'Sign-in failed. Try again.';
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: offerGoogle ? const Color(0xFF1D4ED8) : Colors.red,
          duration: Duration(seconds: offerGoogle ? 5 : 3),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign-in failed. Try again.'),
            backgroundColor: Colors.red, duration: Duration(seconds: 3)),
      );
    } finally {
      if (mounted) setState(() => _isEmailLoading = false);
    }
  }

  // ── Forgot Password ───────────────────────────────────────────────────────
  Future<void> _forgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter your email above first.'),
            backgroundColor: Colors.orange, duration: Duration(seconds: 3)),
      );
      return;
    }
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password reset email sent!'),
            backgroundColor: Colors.green, duration: Duration(seconds: 3)),
      );
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message ?? 'Could not send reset email.'),
            backgroundColor: Colors.red, duration: const Duration(seconds: 3)),
      );
    }
  }

  // ── Google Sign-In ────────────────────────────────────────────────────────
  Future<void> _signInWithGoogle() async {
    setState(() => _isGoogleLoading = true);
    try {
      final cred = await _signInOrLinkGoogle(context);
      if (cred == null) return; // user cancelled
      if (cred.user != null) {
        await _ensureGoogleUserDoc(
          cred.user!,
          isNew: cred.additionalUserInfo?.isNewUser ?? false,
        );
      }
      await _navigateAfterLogin();
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.message ?? 'Google sign-in failed.'),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Google sign-in failed. Please try again.'),
        backgroundColor: Colors.red,
        duration: Duration(seconds: 3),
      ));
    } finally {
      if (mounted) setState(() => _isGoogleLoading = false);
    }
  }

  // ── Navigate after successful sign-in ──────────────────────────────────────
  Future<void> _navigateAfterLogin() async {
    if (!mounted) return;
    final uid = FirebaseAuth.instance.currentUser?.uid;
    bool profileComplete = false;
    if (uid != null) {
      try {
        // Try cache first for speed; fall back to network
        DocumentSnapshot doc;
        try {
          doc = await FirebaseFirestore.instance
              .collection('users')
              .doc(uid)
              .get(const GetOptions(source: Source.cache));
        } catch (_) {
          doc = await FirebaseFirestore.instance
              .collection('users')
              .doc(uid)
              .get();
        }
        profileComplete = doc.data() != null &&
            (doc.data() as Map<String, dynamic>)['profileComplete'] == true;
      } catch (_) {}
    }
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(
        builder: (_) =>
            profileComplete ? const JobBoardHome() : const ProfileOnboardingFlow(),
      ),
      (route) => false, // remove every route beneath
    );
  }



  // ── UI ─────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final bool anyLoading = _isEmailLoading || _isGoogleLoading;
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                // Back
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE5E7EB),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(Icons.arrow_back, color: Colors.black),
                  ),
                ),
                const SizedBox(height: 32),
                // Icon
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE0E7FF),
                      borderRadius: BorderRadius.circular(40),
                    ),
                    child: const Icon(Icons.work_outline,
                        size: 40, color: Color(0xFF2563EB)),
                  ),
                ),
                const SizedBox(height: 20),
                // Heading
                const Center(
                  child: Column(
                    children: [
                      Text(
                        'Welcome Back!',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Sign in to continue to KA Jobs',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // ── Email field ──────────────────────────────────────────────
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: 'Email address',
                    hintText: 'you@example.com',
                    prefixIcon: const Icon(Icons.email_outlined, color: Color(0xFF6B7280)),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF9FAFB),
                    contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Email is required';
                    if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(v.trim())) {
                      return 'Enter a valid email address';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // ── Password field ────────────────────────────────────────────
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => anyLoading ? null : _signInWithEmail(),
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: '••••••••',
                    prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF6B7280)),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        color: const Color(0xFF6B7280),
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF9FAFB),
                    contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Password is required';
                    if (v.length < 6) return 'Password must be at least 6 characters';
                    return null;
                  },
                ),

                // ── Forgot password ───────────────────────────────────────────
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: anyLoading ? null : _forgotPassword,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'Forgot password?',
                      style: TextStyle(fontSize: 13, color: Color(0xFF2563EB)),
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                // ── Sign In button ────────────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: anyLoading ? null : _signInWithEmail,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                    child: _isEmailLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.5, color: Colors.white),
                          )
                        : const Text(
                            'Sign In',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w600),
                          ),
                  ),
                ),
                const SizedBox(height: 24),

                // ── OR divider ────────────────────────────────────────────────
                const _OrDivider(),
                const SizedBox(height: 16),

                // ── Google Sign-In button ─────────────────────────────────────
                _GoogleSignInButton(
                  loading: _isGoogleLoading,
                  disabled: anyLoading,
                  onPressed: _signInWithGoogle,
                ),
                const SizedBox(height: 24),

                // ── Don't have an account? ────────────────────────────────────
                Center(
                  child: RichText(
                    text: TextSpan(
                      text: "Don't have an account? ",
                      style: const TextStyle(
                          fontSize: 14, color: Color(0xFF6B7280)),
                      children: [
                        TextSpan(
                          text: 'Sign Up',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF2563EB),
                            fontWeight: FontWeight.w600,
                          ),
                          recognizer: TapGestureRecognizer()
                            ..onTap = () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) => const SignUpScreen()),
                                ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Terms
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(
                      'By continuing, you agree to our Terms of Service and Privacy Policy',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 12,
                          color: const Color(0xFF6B7280).withOpacity(0.8)),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _agreeToTerms = false;
  bool _isLoading = false;
  bool _isGoogleLoading = false;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<void> _signInWithGoogle() async {
    setState(() => _isGoogleLoading = true);
    try {
      final cred = await _signInOrLinkGoogle(context);
      if (cred == null) return;
      if (cred.user != null) {
        await _ensureGoogleUserDoc(
          cred.user!,
          isNew: cred.additionalUserInfo?.isNewUser ?? false,
        );
      }
      if (mounted) await _navigateAfterLogin(context);
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.message ?? 'Google sign-in failed.'),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Google sign-in failed. Please try again.'),
        backgroundColor: Colors.red,
        duration: Duration(seconds: 3),
      ));
    } finally {
      if (mounted) setState(() => _isGoogleLoading = false);
    }
  }

  Future<void> _navigateAfterLogin(BuildContext ctx) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    bool complete = false;
    if (uid != null) {
      try {
        final doc = await FirebaseFirestore.instance.collection('users').doc(uid).get();
        complete = (doc.data()?['profileComplete'] == true);
      } catch (_) {}
    }
    if (!ctx.mounted) return;
    Navigator.pushAndRemoveUntil(ctx, MaterialPageRoute(
      builder: (_) => complete ? const JobBoardHome() : const ProfileOnboardingFlow(),
    ), (route) => false);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _validateAndSignUp() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all fields'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    if (!email.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid email'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    if (password.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password must be at least 6 characters'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please agree to terms and conditions'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    try {
      setState(() => _isLoading = true);

      await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Update user display name
      await _auth.currentUser?.updateDisplayName(name);

      // Save name to Firestore so admin panel can display it
      final uid = _auth.currentUser?.uid;
      if (uid != null) {
        await FirebaseFirestore.instance.collection('users').doc(uid).set({
          'name': name,
          'email': email,
        }, SetOptions(merge: true));
      }

      if (mounted) {
        await _navigateAfterLogin(context);
      }
    } on FirebaseAuthException catch (e) {
      String errorMessage = 'Sign up failed';
      if (e.code == 'weak-password') {
        errorMessage = 'Password is too weak';
      } else if (e.code == 'email-already-in-use') {
        errorMessage = 'Email already exists';
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                // Back button
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE5E7EB),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(Icons.arrow_back, color: Colors.black),
                  ),
                ),
                const SizedBox(height: 24),
                // Icon
                Center(
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE0E7FF),
                      borderRadius: BorderRadius.circular(50),
                    ),
                    child: const Icon(
                      Icons.person,
                      size: 50,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                // Title
                Center(
                  child: Column(
                    children: [
                      const Text(
                        'Create Your Account',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Welcome back! Please enter your details',
                        style: TextStyle(
                          fontSize: 14,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                // Name field
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: const TextSpan(
                        children: [
                          TextSpan(
                            text: 'Name',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          TextSpan(
                            text: '*',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.red,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        hintText: 'Enter your name',
                        hintStyle: const TextStyle(
                          color: Color(0xFFD1D5DB),
                          fontSize: 13,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFEEF2F7),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Email field
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: const TextSpan(
                        children: [
                          TextSpan(
                            text: 'Email Address',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          TextSpan(
                            text: '*',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.red,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _emailController,
                      decoration: InputDecoration(
                        hintText: 'Enter your email',
                        hintStyle: const TextStyle(
                          color: Color(0xFFD1D5DB),
                          fontSize: 13,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFEEF2F7),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Password field
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      text: const TextSpan(
                        children: [
                          TextSpan(
                            text: 'Password',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1F2937),
                            ),
                          ),
                          TextSpan(
                            text: '*',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.red,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        hintText: 'Enter your password',
                        hintStyle: const TextStyle(
                          color: Color(0xFFD1D5DB),
                          fontSize: 13,
                        ),
                        filled: true,
                        fillColor: const Color(0xFFEEF2F7),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_off
                                : Icons.visibility,
                            color: const Color(0xFF9CA3AF),
                          ),
                          onPressed: () {
                            setState(() {
                              _obscurePassword = !_obscurePassword;
                            });
                          },
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Terms checkbox
                Row(
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: Checkbox(
                        value: _agreeToTerms,
                        onChanged: (value) {
                          setState(() {
                            _agreeToTerms = value ?? false;
                          });
                        },
                        side: const BorderSide(
                          color: Color(0xFFD1D5DB),
                          width: 1,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: RichText(
                        text: TextSpan(
                          children: [
                            const TextSpan(
                              text: 'I agree to all ',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                            TextSpan(
                              text: 'Term, Privacy and Fees',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF2563EB),
                                fontWeight: FontWeight.w600,
                              ),
                              recognizer: TapGestureRecognizer()
                                ..onTap = () {},
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Sign Up button
                SizedBox(
                  width: double.infinity,
                  child: _isLoading
                      ? ElevatedButton(
                          onPressed: null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          ),
                        )
                      : ElevatedButton(
                          onPressed: _validateAndSignUp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text(
                            'Sign Up',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                ),
                const SizedBox(height: 20),

                // ── OR divider ────────────────────────────────────────────────
                const _OrDivider(),
                const SizedBox(height: 16),

                // ── Google Sign-In button ─────────────────────────────────────
                _GoogleSignInButton(
                  loading: _isGoogleLoading,
                  disabled: _isLoading || _isGoogleLoading,
                  onPressed: _signInWithGoogle,
                ),
                const SizedBox(height: 20),

                // Sign in link
                Center(
                  child: RichText(
                    text: TextSpan(
                      children: [
                        const TextSpan(
                          text: 'Already have and account? ',
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                        TextSpan(
                          text: 'Sign In',
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF2563EB),
                            fontWeight: FontWeight.w600,
                          ),
                          recognizer: TapGestureRecognizer()
                            ..onTap = () {
                              Navigator.pop(context);
                            },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Shared auth UI widgets ────────────────────────────────────────────────────

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Text(
            'OR',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade500,
              letterSpacing: 1,
            ),
          ),
        ),
        Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
      ],
    );
  }
}

class _GoogleSignInButton extends StatelessWidget {
  final bool loading;
  final bool disabled;
  final VoidCallback onPressed;

  const _GoogleSignInButton({
    required this.loading,
    required this.disabled,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: OutlinedButton(
        onPressed: disabled ? null : onPressed,
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: Colors.grey.shade300, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF1F2937),
        ),
        child: loading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Color(0xFF4285F4),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _GoogleLogo(),
                  const SizedBox(width: 12),
                  const Text(
                    'Continue with Google',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _GoogleLogo extends StatelessWidget {
  // Official Google "G" logo SVG paths (18×18 viewBox).
  static const _svg = '''
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
  <path fill="#4285f4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
  <path fill="#34a853" d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"/>
  <path fill="#fbbc05" d="M3.965 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.008-2.332z"/>
  <path fill="#ea4335" d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9.003 0 5.485 0 2.44 2.017.957 4.958L3.965 7.29c.708-2.127 2.692-3.71 5.038-3.71z"/>
</svg>''';

  @override
  Widget build(BuildContext context) {
    return SvgPicture.string(_svg, width: 20, height: 20);
  }
}

/// Dialog shown when a Google sign-in email already exists under email/password.
/// Collects the existing password so the two providers can be linked.
class _LinkAccountDialog extends StatefulWidget {
  final String email;
  final TextEditingController passCtrl;
  const _LinkAccountDialog({required this.email, required this.passCtrl});

  @override
  State<_LinkAccountDialog> createState() => _LinkAccountDialogState();
}

class _LinkAccountDialogState extends State<_LinkAccountDialog> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Link Accounts', style: TextStyle(fontWeight: FontWeight.w700)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              style: TextStyle(fontSize: 13.5, color: Colors.grey.shade700, height: 1.45),
              children: [
                const TextSpan(text: 'The email '),
                TextSpan(
                  text: widget.email,
                  style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1F2937)),
                ),
                const TextSpan(
                  text: ' is already registered with a password. Enter your password to link your Google account so you can use both.',
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: widget.passCtrl,
            obscureText: _obscure,
            decoration: InputDecoration(
              labelText: 'Password',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              suffixIcon: IconButton(
                icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, size: 18),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: Text('Cancel', style: TextStyle(color: Colors.grey.shade600)),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, true),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: const Text('Link & Sign In'),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class JobBoardHome extends StatefulWidget {
  const JobBoardHome({super.key});

  @override
  State<JobBoardHome> createState() => _JobBoardHomeState();
}

class _JobBoardHomeState extends State<JobBoardHome> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  double _profileCompletion = 0.0;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  int _pendingTestsCount = 0;

  @override
  void initState() {
    super.initState();
    _calculateProfileCompletion();
    _listenPendingTests();
    _setupFCMHandlers();
  }

  void _setupFCMHandlers() {
    // Foreground: app is open → show as a system notification via local plugin
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final notification = message.notification;
      final android = message.notification?.android;
      if (notification != null && android != null) {
        _localNotif.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              _notifChannel.id,
              _notifChannel.name,
              channelDescription: _notifChannel.description,
              icon: '@mipmap/ic_launcher',
              color: const Color(0xFF7C3AED),
              importance: Importance.high,
              priority: Priority.high,
            ),
          ),
        );
      }
    });

    // Background → foreground: user tapped the notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (mounted) setState(() => _selectedIndex = 3); // Tests tab
    });

    // Killed → opened via notification tap
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null && mounted) {
        setState(() => _selectedIndex = 3); // Tests tab
      }
    });
  }

  void _listenPendingTests() {
    final user = _auth.currentUser;
    if (user == null) return;

    _firestore
        .collection('tests')
        .where('status', isEqualTo: 'published')
        .snapshots()
        .listen((testSnap) async {
      if (!mounted) return;
      final publishedIds = testSnap.docs.map((d) => d.id).toSet();
      if (publishedIds.isEmpty) {
        if (mounted) setState(() => _pendingTestsCount = 0);
        return;
      }
      final resultSnap = await _firestore
          .collection('testResults')
          .where('userId', isEqualTo: user.uid)
          .get();
      final doneIds = resultSnap.docs
          .map((d) => (d.data()['testId'] ?? '') as String)
          .toSet();
      if (mounted) {
        setState(() {
          _pendingTestsCount = publishedIds.difference(doneIds).length;
        });
      }
    });
  }

  Future<void> _calculateProfileCompletion() async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        
        int completedFields = 0;
        const int totalFields = 10;

        // Must match the same fields as the Profile tab's _loadProfileData()
        if ((data['name'] ?? data['firstName'] ?? '').isNotEmpty) completedFields++;
        if ((data['dateOfBirth'] ?? '').isNotEmpty) completedFields++;
        if ((data['gender'] ?? '').isNotEmpty) completedFields++;
        if ((data['phone'] ?? '').isNotEmpty) completedFields++;
        if ((data['currentCity'] ?? data['location'] ?? '').isNotEmpty) completedFields++;
        if ((data['profileSummary'] ?? '').isNotEmpty) completedFields++;
        if ((data['employmentHistory'] ?? []).isNotEmpty || (data['companyName'] ?? '').isNotEmpty) completedFields++;
        if ((data['educationHistory'] ?? []).isNotEmpty || (data['collegeName'] ?? data['school'] ?? '').isNotEmpty) completedFields++;
        if ((data['keySkills'] ?? '').isNotEmpty) completedFields++;
        if ((data['preferredJobRoles'] ?? []).isNotEmpty) completedFields++;

        double completion = (completedFields / totalFields) * 100;
        
        if (mounted) {
          setState(() {
            _profileCompletion = completion;
          });
        }
      }
    } catch (e) {
      print('Error calculating profile completion: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) {
        if (didPop) return;
        // Prevent back navigation to login screen
        return;
      },
      child: Scaffold(
        key: _scaffoldKey,
        drawer: _buildDrawer(),
        body: _buildBody(),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) => setState(() => _selectedIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: const Color(0xFF2563EB),
          unselectedItemColor: Colors.grey,
          items: [
            const BottomNavigationBarItem(
              icon: Icon(Icons.home),
              label: 'Home',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.bookmark),
              label: 'Bookmark',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.school_outlined),
              label: 'Training',
            ),
            BottomNavigationBarItem(
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.quiz_outlined),
                  if (_pendingTestsCount > 0)
                    Positioned(
                      top: -4,
                      right: -6,
                      child: Container(
                        width: 16,
                        height: 16,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            _pendingTestsCount > 9 ? '9+' : '$_pendingTestsCount',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              label: 'Tests',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawer() {
    final user = FirebaseAuth.instance.currentUser;
    final userName = user?.displayName ?? 'User';
    final userEmail = user?.email ?? '';

    return Drawer(
      child: SafeArea(
        child: Container(
          color: Colors.white,
          child: Column(
            children: [
              const SizedBox(height: 16),
              // Profile Section
              Container(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Profile Avatar with Progress
                        Stack(
                          alignment: Alignment.center,
                          children: [
                            SizedBox(
                              width: 70,
                              height: 70,
                              child: CircularProgressIndicator(
                                value: _profileCompletion / 100,
                                strokeWidth: 3,
                                valueColor: const AlwaysStoppedAnimation<Color>(
                                  Color(0xFF2563EB),
                                ),
                                backgroundColor: const Color(0xFFE5E7EB),
                              ),
                            ),
                            Text(
                              '${_profileCompletion.toInt()}%',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF2563EB),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 16),
                        // Profile Info
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 8),
                              Text(
                                userName,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1F2937),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                userEmail,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF6B7280),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${_profileCompletion.toInt()}% Complete',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: const Color(0xFF2563EB).withOpacity(0.7),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Edit Icon
                        IconButton(
                          icon: const Icon(Icons.edit),
                          onPressed: () {
                            Navigator.pop(context);
                            _selectedIndex = 4;
                            setState(() {});
                          },
                          color: const Color(0xFF2563EB),
                          iconSize: 20,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // Menu Items
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  children: [
                    _buildDrawerItem(
                      icon: Icons.search,
                      label: 'Search Jobs',
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const SearchJobScreen()),
                        );
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.bookmark,
                      label: 'Saved Jobs',
                      onTap: () {
                        Navigator.pop(context);
                        setState(() => _selectedIndex = 1);
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.description,
                      label: 'My Application',
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const _MyApplicationsScreen()),
                        );
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.school,
                      label: 'Training',
                      onTap: () {
                        Navigator.pop(context);
                        setState(() => _selectedIndex = 2);
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.quiz_outlined,
                      label: 'Tests',
                      onTap: () {
                        Navigator.pop(context);
                        setState(() => _selectedIndex = 3);
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.person,
                      label: 'My Profile',
                      onTap: () {
                        Navigator.pop(context);
                        setState(() => _selectedIndex = 4);
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.category,
                      label: 'Job Categories',
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const JobCategoriesScreen()),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // Footer
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Kamalini Jobs',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Version 1.0.0',
                      style: TextStyle(
                        fontSize: 11,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: const Color(0xFF6B7280),
        size: 22,
      ),
      title: Text(
        label,
        style: const TextStyle(
          fontSize: 14,
          color: Color(0xFF1F2937),
          fontWeight: FontWeight.w500,
        ),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      dense: true,
      visualDensity: const VisualDensity(vertical: -2),
      onTap: onTap,
    );
  }

  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return HomeScreen(scaffoldKey: _scaffoldKey);
      case 1:
        return const BookmarkScreen();
      case 2:
        return const TrainingScreen();
      case 3:
        return const TestsScreen();
      case 4:
        return ProfileScreen(
          onBackPressed: () {
            setState(() {
              _selectedIndex = 0;
            });
          },
        );
      default:
        return HomeScreen(scaffoldKey: _scaffoldKey);
    }
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.scaffoldKey});

  final GlobalKey<ScaffoldState> scaffoldKey;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Map<String, dynamic>> _recommendedJobs = [];
  bool _isLoadingRecommendations = true;

  // Jobs for you pagination
  final List<Map<String, dynamic>> _jobsForYou = [];
  bool _isLoadingJobs = false;
  bool _hasMoreJobs = true;
  DocumentSnapshot? _lastJobDoc;
  static const int _jobsPageSize = 10;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadRecommendedJobs();
    _fetchJobsForYou();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _fetchJobsForYou();
    }
  }

  Future<void> _fetchJobsForYou() async {
    if (_isLoadingJobs || !_hasMoreJobs) return;
    setState(() => _isLoadingJobs = true);
    try {
      Query query = FirebaseFirestore.instance
          .collection('jobs')
          .orderBy('createdAt', descending: true)
          .limit(_jobsPageSize);
      if (_lastJobDoc != null) {
        query = query.startAfterDocument(_lastJobDoc!);
      }
      final snapshot = await query.get();
      final newDocs = snapshot.docs.where((doc) {
        final data = doc.data() as Map<String, dynamic>;
        final status = (data['status'] ?? 'approved').toString();
        return status == 'approved' || status == 'active';
      }).toList();
      if (mounted) {
        setState(() {
          if (snapshot.docs.isNotEmpty) {
            _lastJobDoc = snapshot.docs.last;
          }
          for (final doc in newDocs) {
            final data = doc.data() as Map<String, dynamic>;
            _jobsForYou.add({...data, 'id': doc.id});
          }
          if (snapshot.docs.length < _jobsPageSize) {
            _hasMoreJobs = false;
          }
          _isLoadingJobs = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingJobs = false);
    }
  }

  Future<void> _loadRecommendedJobs() async {
    try {
      final jobs = await RecommendationService.getRecommendedJobs();
      if (mounted) {
        setState(() {
          _recommendedJobs = jobs;
          _isLoadingRecommendations = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingRecommendations = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      controller: _scrollController,
      physics: const BouncingScrollPhysics(),
      slivers: [
        // Sticky Header
        SliverAppBar(
          pinned: true,
          floating: false,
          elevation: 0,
          backgroundColor: Colors.white,
          automaticallyImplyLeading: false,
          toolbarHeight: 60,
          title: Row(
            children: [
              // Menu Toggle Button
              IconButton(
                icon: const Icon(Icons.menu),
                onPressed: () {
                  widget.scaffoldKey.currentState?.openDrawer();
                },
                color: Colors.black,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 8),
              // Search Bar
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const SearchJobScreen(),
                      ),
                    );
                  },
                  child: Container(
                    height: 45,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2F7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const AbsorbPointer(
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Search Area',
                          prefixIcon: Icon(Icons.search, color: Colors.grey),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(
                            vertical: 10,
                            horizontal: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Notification Icon
              Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: () {},
                    color: Colors.black,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        // Content
        SliverList(
          delegate: SliverChildListDelegate([
            const SizedBox(height: 16),
            // Recommend Job Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Recommended for You',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Based on your profile & skills',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchJobScreen())),
                    child: const Text(
                      'See All',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF2563EB),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // Job Cards - Dynamic Recommendations
            SizedBox(
              height: 195,
              child: _isLoadingRecommendations
                  ? const Center(child: CircularProgressIndicator())
                  : _recommendedJobs.isEmpty
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: Text(
                              'Complete your profile to get personalized recommendations',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Colors.grey),
                            ),
                          ),
                        )
                      : ListView.separated(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _recommendedJobs.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (context, index) {
                            final job = _recommendedJobs[index];
                            // Calculate time ago
                            String timeAgo = 'Recently';
                            if (job['createdAt'] != null && job['createdAt'].toString().isNotEmpty) {
                              try {
                                final created = DateTime.parse(job['createdAt']);
                                final diff = DateTime.now().difference(created);
                                if (diff.inDays > 0) {
                                  timeAgo = '${diff.inDays} Day${diff.inDays > 1 ? 's' : ''} ago';
                                } else if (diff.inHours > 0) {
                                  timeAgo = '${diff.inHours} Hour${diff.inHours > 1 ? 's' : ''} ago';
                                }
                              } catch (_) {}
                            }
                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => JobDetailsScreen(
                                      jobId: job['id'] ?? '',
                                      companyId: job['companyId'] ?? '',
                                      title: job['title'] ?? '',
                                      company: job['company'] ?? '',
                                      location: job['location'] ?? '',
                                      rating: job['rating'] ?? '4.5',
                                      badges: List<String>.from(job['badges'] ?? []),
                                      posted_days_ago: timeAgo,
                                      salary: job['salary'] ?? '',
                                      description: job['description'] ?? '',
                                      experience: job['experience'] ?? '',
                                      category: job['category'] ?? '',
                                      currency: job['currency'] ?? '₹',
                                    ),
                                  ),
                                );
                              },
                              child: JobCard(
                                title: job['title'] ?? 'Job Title',
                                company: job['company'] ?? 'Company',
                                salary: job['salary'] ?? '',
                                rating: job['rating'] ?? '4.5',
                                salary_range: job['salary'] ?? '',
                                location: job['location'] ?? '',
                                badges: List<String>.from(job['badges'] ?? ['Full-Time']),
                                posted_days_ago: timeAgo,
                                experience: job['experience'] ?? '',
                                skills: job['category'] ?? '',
                              ),
                            );
                          },
                        ),
            ),
            const SizedBox(height: 20),
            // Interview Boost Banner - Full Width
            Container(
              margin: const EdgeInsets.only(left: 16, right: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFFBFDBFE),
                  width: 1,
                ),
              ),
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Left Side - Text and Button
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Boost Your Interview Success with JobBoard Team Tips',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1F2937),
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 10,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text(
                            'Start Preparing',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Right Side - Team Illustrations
                  SizedBox(
                    height: 100,
                    width: 120,
                    child: Stack(
                      alignment: Alignment.centerRight,
                      children: [
                        // Person 1 - Left (Woman with brown hair)
                        Positioned(
                          left: 0,
                          child: _buildTeamMember(
                            backgroundColor: const Color(0xFFD4A5A5),
                            size: 60,
                          ),
                        ),
                        // Person 2 - Middle (Woman with red/pink hair)
                        Positioned(
                          left: 30,
                          child: _buildTeamMember(
                            backgroundColor: const Color(0xFFC97C9C),
                            size: 65,
                          ),
                        ),
                        // Person 3 - Right (Man with orange hair)
                        Positioned(
                          right: 0,
                          child: _buildTeamMember(
                            backgroundColor: const Color(0xFFD4A574),
                            size: 70,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Browse Categories & Skills Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Quick Browse',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Browse Categories
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const JobCategoriesScreen(),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0F9FF),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFF2563EB),
                                width: 1.5,
                              ),
                            ),
                            child: const Column(
                              children: [
                                Text(
                                  '📂',
                                  style: TextStyle(fontSize: 28),
                                ),
                                SizedBox(height: 8),
                                Text(
                                  'Job Categories',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF2563EB),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Browse Skills
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const SkillsScreen(),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFAF5FF),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFF7C3AED),
                                width: 1.5,
                              ),
                            ),
                            child: const Column(
                              children: [
                                Text(
                                  '⭐',
                                  style: TextStyle(fontSize: 28),
                                ),
                                SizedBox(height: 8),
                                Text(
                                  'Skills',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF7C3AED),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Jobs For You Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Jobs for you',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchJobScreen())),
                    child: const Text(
                      'See All',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF2563EB),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            // Job List Items - Paginated from Firestore
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _jobsForYou.isEmpty && _isLoadingJobs
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  : _jobsForYou.isEmpty
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(20),
                            child: Column(
                              children: [
                                Icon(Icons.work_off_outlined, size: 48, color: Colors.grey),
                                SizedBox(height: 8),
                                Text('No jobs available'),
                                Text('Check back later for new opportunities'),
                              ],
                            ),
                          ),
                        )
                      : Column(
                          children: [
                            ..._jobsForYou.map((data) {
                              List<String> jobTypes = [];
                              final experience = (data['experience'] ?? '').toString();
                              if (experience.toLowerCase().contains('senior') ||
                                  experience.toLowerCase().contains('lead')) {
                                jobTypes.add('Executive');
                              } else if (experience.toLowerCase().contains('entry')) {
                                jobTypes.add('Entry Level');
                              }
                              jobTypes.add('Full-Time');
                              jobTypes.add('Remote');

                              String timeAgo = '5 Day ago';
                              if (data['createdAt'] != null) {
                                try {
                                  final createdDate = DateTime.parse(data['createdAt']);
                                  final diff = DateTime.now().difference(createdDate);
                                  if (diff.inDays > 0) {
                                    timeAgo = '${diff.inDays} Day${diff.inDays > 1 ? 's' : ''} ago';
                                  } else if (diff.inHours > 0) {
                                    timeAgo = '${diff.inHours} Hour${diff.inHours > 1 ? 's' : ''} ago';
                                  }
                                } catch (_) {}
                              }

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: JobListItem(
                                  jobId: data['id'] ?? '',
                                  companyId: data['companyId'] ?? '',
                                  title: data['title'] ?? 'Job Title',
                                  company: data['company'] ?? 'Company',
                                  location: data['location'] ?? 'Location',
                                  rating: '4.5',
                                  badges: jobTypes,
                                  posted_days_ago: timeAgo,
                                  salary_range: data['salary'] ?? '',
                                  description: data['description'] ?? '',
                                  experience: data['experience'] ?? '',
                                  category: data['category'] ?? '',
                                  currency: data['currency'] ?? '₹',
                                ),
                              );
                            }),
                            if (_isLoadingJobs)
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 16),
                                child: Center(child: CircularProgressIndicator()),
                              ),
                            if (!_hasMoreJobs && _jobsForYou.isNotEmpty)
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 16),
                                child: Center(
                                  child: Text(
                                    'No more jobs',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                ),
                              ),
                          ],
                        ),
            ),
            const SizedBox(height: 20),
          ]),
        ),
      ],
    );
  }

  Widget _buildTeamMember({
    required Color backgroundColor,
    required double size,
  }) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(size / 2),
      ),
      child: const Icon(Icons.person, color: Colors.white, size: 24),
    );
  }
}

class JobCard extends StatelessWidget {
  final String title;
  final String company;
  final String salary;
  final String rating;
  final String salary_range;
  final String location;
  final List<String> badges;
  final String posted_days_ago;
  final String experience;
  final String skills;

  const JobCard({
    super.key,
    required this.title,
    required this.company,
    required this.salary,
    required this.rating,
    required this.salary_range,
    required this.location,
    required this.badges,
    required this.posted_days_ago,
    this.experience = '',
    this.skills = '',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      company,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF2563EB),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.work, color: Colors.white, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.currency_rupee, size: 14, color: Color(0xFF2563EB)),
              const SizedBox(width: 2),
              Text(
                salary_range,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF1F2937),
                ),
              ),
            ],
          ),
          if (experience.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.work_history, size: 14, color: Color(0xFF7C3AED)),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    experience,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF4B5563),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ],
          if (skills.isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.star_outline, size: 14, color: Color(0xFFF59E0B)),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    skills,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(Icons.location_on,
                        size: 14, color: Color(0xFF6B7280)),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        location,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF6B7280),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                posted_days_ago,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF6B7280),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class JobListItem extends StatefulWidget {
  final String jobId;
  final String companyId;
  final String title;
  final String company;
  final String location;
  final String rating;
  final List<String> badges;
  final String posted_days_ago;
  final String salary_range;
  final String description;
  final String experience;
  final String category;
  final String currency;

  const JobListItem({
    super.key,
    this.jobId = '',
    this.companyId = '',
    required this.title,
    required this.company,
    required this.location,
    required this.rating,
    required this.badges,
    required this.posted_days_ago,
    this.salary_range = '',
    this.description = '',
    this.experience = '',
    this.category = '',
    this.currency = '₹',
  });

  @override
  State<JobListItem> createState() => _JobListItemState();
}

class _JobListItemState extends State<JobListItem> {
  bool _isBookmarked = false;

  @override
  void initState() {
    super.initState();
    _checkBookmark();
  }

  Future<void> _checkBookmark() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null || widget.jobId.isEmpty) return;
    final doc = await FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .collection('bookmarks')
        .doc(widget.jobId)
        .get();
    if (mounted) setState(() => _isBookmarked = doc.exists);
  }

  Future<void> _toggleBookmark() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final ref = FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .collection('bookmarks')
        .doc(widget.jobId);
    if (_isBookmarked) {
      await ref.delete();
    } else {
      await ref.set({
        'jobId': widget.jobId,
        'companyId': widget.companyId,
        'title': widget.title,
        'company': widget.company,
        'location': widget.location,
        'rating': widget.rating,
        'badges': widget.badges,
        'salary': widget.salary_range,
        'currency': widget.currency,
        'description': widget.description,
        'experience': widget.experience,
        'category': widget.category,
        'savedAt': FieldValue.serverTimestamp(),
      });
    }
    if (mounted) {
      setState(() => _isBookmarked = !_isBookmarked);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_isBookmarked ? 'Job saved!' : 'Bookmark removed'),
        duration: const Duration(seconds: 1),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => JobDetailsScreen(
              jobId: widget.jobId,
              companyId: widget.companyId,
              title: widget.title,
              company: widget.company,
              location: widget.location,
              rating: widget.rating,
              badges: widget.badges,
              posted_days_ago: widget.posted_days_ago,
              salary: widget.salary_range,
              description: widget.description,
              experience: widget.experience,
              category: widget.category,
              currency: widget.currency,
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            widget.company,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF2563EB),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (widget.salary_range.isNotEmpty) ...[
                            const Icon(Icons.currency_rupee, size: 13, color: Color(0xFF2563EB)),
                            Text(
                              widget.salary_range,
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF2563EB),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ] else ...[
                            const Icon(Icons.star, size: 14, color: Colors.orange),
                            const SizedBox(width: 2),
                            Text(
                              '${widget.rating} Review',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(
                    _isBookmarked ? Icons.bookmark : Icons.bookmark_outline,
                    color: _isBookmarked
                        ? const Color(0xFF2563EB)
                        : const Color(0xFF6B7280),
                  ),
                  onPressed: _toggleBookmark,
                  iconSize: 20,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: widget.badges
                  .map((badge) => Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF2F7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          badge,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF4B5563),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ))
                  .toList(),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(Icons.location_on,
                          size: 14, color: Color(0xFF6B7280)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          widget.location,
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B7280),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  widget.posted_days_ago,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// Basic Details Screen
class BasicDetailsScreen extends StatefulWidget {
  final VoidCallback? onBackPressed;

  const BasicDetailsScreen({super.key, this.onBackPressed});

  @override
  State<BasicDetailsScreen> createState() => _BasicDetailsScreenState();
}

class _BasicDetailsScreenState extends State<BasicDetailsScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  late TextEditingController _nameController;
  late TextEditingController _dobController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _locationController;
  late TextEditingController _experienceYearController;
  late TextEditingController _experienceMonthController;
  late TextEditingController _salaryController;
  String _gender = '';
  String _educationLevel = '';
  
  bool _isLoading = false;

  static const _teal = Color(0xFF2D8C6B);
  static const _tealLight = Color(0xFFE8F5F0);
  static const _eduLevels = ['10th or Below 10th', '12th Pass', 'Diploma', 'ITI', 'Graduate', 'Post Graduate'];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _dobController = TextEditingController();
    _emailController = TextEditingController();
    _phoneController = TextEditingController();
    _locationController = TextEditingController();
    _experienceYearController = TextEditingController();
    _experienceMonthController = TextEditingController();
    _salaryController = TextEditingController();
    _loadBasicDetails();
  }

  Future<void> _loadBasicDetails() async {
    final user = _auth.currentUser;
    if (user == null) return;
    try {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        setState(() {
          _nameController.text = data['name'] ?? data['firstName'] ?? '';
          _dobController.text = data['dateOfBirth'] ?? '';
          _gender = data['gender'] ?? '';
          _educationLevel = data['educationLevel'] ?? '';
          _emailController.text = data['email'] ?? user.email ?? '';
          _phoneController.text = data['phone'] ?? user.phoneNumber ?? '';
          _locationController.text = data['currentCity'] ?? data['location'] ?? '';
          _experienceYearController.text = data['experienceYear']?.toString() ?? '';
          _experienceMonthController.text = data['experienceMonth']?.toString() ?? '';
          _salaryController.text = data['salary'] ?? '';
        });
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading: $e'), backgroundColor: Colors.red));
    }
  }

  Future<void> _saveBasicDetails() async {
    final user = _auth.currentUser;
    if (user == null) return;
    try {
      setState(() => _isLoading = true);
      await _firestore.collection('users').doc(user.uid).set({
        'name': _nameController.text.trim(),
        'dateOfBirth': _dobController.text.trim(),
        'gender': _gender,
        'educationLevel': _educationLevel,
        'email': _emailController.text.trim(),
        'phone': _phoneController.text.trim(),
        'currentCity': _locationController.text.trim(),
        'location': _locationController.text.trim(),
        'experienceYear': int.tryParse(_experienceYearController.text) ?? 0,
        'experienceMonth': int.tryParse(_experienceMonthController.text) ?? 0,
        'salary': _salaryController.text.trim(),
      }, SetOptions(merge: true));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Details saved successfully'), backgroundColor: Colors.green));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _dobController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _locationController.dispose();
    _experienceYearController.dispose();
    _experienceMonthController.dispose();
    _salaryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                // Header
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(Icons.arrow_back, color: Colors.black),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Basic Details',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Full Name
                const Text('Full Name', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                TextField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    hintText: 'Enter full name',
                    filled: true, fillColor: const Color(0xFFEEF2F7),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
                const SizedBox(height: 20),
                // Date of Birth
                const Text('Date of Birth', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                TextField(
                  controller: _dobController,
                  readOnly: true,
                  decoration: InputDecoration(
                    hintText: 'Select date of birth',
                    filled: true, fillColor: const Color(0xFFEEF2F7),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    suffixIcon: const Icon(Icons.calendar_today_outlined, size: 20, color: Color(0xFF6B7280)),
                  ),
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context, initialDate: DateTime(2000),
                      firstDate: DateTime(1950), lastDate: DateTime.now(),
                    );
                    if (picked != null) {
                      setState(() => _dobController.text = '${picked.day.toString().padLeft(2,'0')}/${picked.month.toString().padLeft(2,'0')}/${picked.year}');
                    }
                  },
                ),
                const SizedBox(height: 20),
                // Gender
                const Text('Gender', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                Row(children: ['Male', 'Female', 'Other'].map((g) => Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: GestureDetector(
                    onTap: () => setState(() => _gender = g),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                      decoration: BoxDecoration(
                        border: Border.all(color: _gender == g ? _teal : const Color(0xFFD0D0D0), width: _gender == g ? 1.5 : 1),
                        borderRadius: BorderRadius.circular(24),
                        color: _gender == g ? _tealLight : Colors.white,
                      ),
                      child: Text(g, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: _gender == g ? _teal : Colors.black87)),
                    ),
                  ),
                )).toList()),
                const SizedBox(height: 20),
                // Education Level
                const Text('Highest Education Level', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                Wrap(spacing: 8, runSpacing: 8,
                  children: _eduLevels.map((l) => GestureDetector(
                    onTap: () => setState(() => _educationLevel = l),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                      decoration: BoxDecoration(
                        border: Border.all(color: _educationLevel == l ? _teal : const Color(0xFFD0D0D0), width: _educationLevel == l ? 1.5 : 1),
                        borderRadius: BorderRadius.circular(24),
                        color: _educationLevel == l ? _tealLight : const Color(0xFFF9FAFB),
                      ),
                      child: Text(l, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: _educationLevel == l ? _teal : Colors.black87)),
                    ),
                  )).toList()),
                const SizedBox(height: 20),
                // Email Address
                const Text('Email Address', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                TextField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    hintText: 'Enter email',
                    filled: true,
                    fillColor: const Color(0xFFEEF2F7),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
                const SizedBox(height: 20),
                // Phone Number
                const Text('Phone Number', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      width: 60,
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2F7),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text('+91', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _phoneController,
                        decoration: InputDecoration(
                          hintText: 'Phone number',
                          filled: true,
                          fillColor: const Color(0xFFEEF2F7),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Location
                const Text('Location', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                TextField(
                  controller: _locationController,
                  decoration: InputDecoration(
                    hintText: 'Enter Location',
                    filled: true,
                    fillColor: const Color(0xFFEEF2F7),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    prefixIcon: const Icon(Icons.location_on, color: Color(0xFF6B7280)),
                  ),
                ),
                const SizedBox(height: 20),
                // Experience
                const Text('Experience', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _experienceYearController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          hintText: '8',
                          filled: true,
                          fillColor: const Color(0xFFEEF2F7),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Center(
                        child: Text(
                          'Year',
                          style: TextStyle(
                            fontSize: 14,
                            color: const Color(0xFF6B7280).withOpacity(0.7),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _experienceMonthController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          hintText: '6',
                          filled: true,
                          fillColor: const Color(0xFFEEF2F7),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Center(
                        child: Text(
                          'Month',
                          style: TextStyle(
                            fontSize: 14,
                            color: const Color(0xFF6B7280).withOpacity(0.7),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Annual Salary
                const Text('Annual Salary', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      width: 50,
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2F7),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text('₹', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _salaryController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          hintText: 'Enter salary',
                          filled: true,
                          fillColor: const Color(0xFFEEF2F7),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text('Per Year', style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                  ],
                ),
                const SizedBox(height: 40),
                // Save button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _saveBasicDetails,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Save',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Employment Screen
class EmploymentScreen extends StatefulWidget {
  final VoidCallback? onBackPressed;

  const EmploymentScreen({super.key, this.onBackPressed});

  @override
  State<EmploymentScreen> createState() => _EmploymentScreenState();
}

class _EmploymentScreenState extends State<EmploymentScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  late TextEditingController _companyNameController;
  late TextEditingController _joiningDateController;
  late TextEditingController _salaryController;
  late TextEditingController _experienceYearController;
  late TextEditingController _experienceMonthController;
  
  String _selectedEmploymentType = 'Full-Time';
  String _selectedNoticePeriod = '15 Days';
  bool _isCurrentCompany = false;
  bool _isLoading = false;
  
  List<Map<String, dynamic>> _employmentRecords = [];
  int _currentEditingIndex = -1;

  @override
  void initState() {
    super.initState();
    _companyNameController = TextEditingController();
    _joiningDateController = TextEditingController();
    _salaryController = TextEditingController();
    _experienceYearController = TextEditingController(text: '8');
    _experienceMonthController = TextEditingController(text: '6');
    _loadEmploymentData();
  }

  Future<void> _loadEmploymentData() async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        setState(() {
          // Load employment history if it exists
          if (data['employmentHistory'] != null) {
            _employmentRecords = List<Map<String, dynamic>>.from(
              (data['employmentHistory'] as List).map((e) => Map<String, dynamic>.from(e as Map))
            );
          } else {
            // Fallback for old single employment record format
            if (data['companyName'] != null && data['companyName'].toString().isNotEmpty) {
              _employmentRecords = [{
                'employmentType': data['employmentType'] ?? 'Full-Time',
                'companyName': data['companyName'] ?? '',
                'joiningDate': data['joiningDate'] ?? '',
                'employmentSalary': data['employmentSalary'] ?? '',
                'employmentYear': data['employmentYear'] ?? 0,
                'employmentMonth': data['employmentMonth'] ?? 0,
                'noticePeriod': data['noticePeriod'] ?? '15 Days',
                'isCurrentCompany': data['isCurrentCompany'] ?? false,
              }];
            }
          }
          _selectedNoticePeriod = data['noticePeriod'] ?? '15 Days';
        });
      }
    } catch (e) {
      print('Error loading employment data: $e');
    }
  }

  Future<void> _saveEmploymentData() async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      setState(() => _isLoading = true);
      
      // Add current form data to records if company name is not empty
      final allRecords = List<Map<String, dynamic>>.from(_employmentRecords);
      if (_companyNameController.text.trim().isNotEmpty) {
        allRecords.add({
          'employmentType': _selectedEmploymentType,
          'companyName': _companyNameController.text.trim(),
          'joiningDate': _joiningDateController.text.trim(),
          'employmentSalary': _salaryController.text.trim(),
          'employmentYear': int.tryParse(_experienceYearController.text) ?? 0,
          'employmentMonth': int.tryParse(_experienceMonthController.text) ?? 0,
          'noticePeriod': _selectedNoticePeriod,
          'isCurrentCompany': _isCurrentCompany,
        });
      }

      if (allRecords.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please add at least one employment record'),
            backgroundColor: Colors.orange,
          ),
        );
        setState(() => _isLoading = false);
        return;
      }

      await _firestore.collection('users').doc(user.uid).set({
        'employmentHistory': allRecords,
        'noticePeriod': _selectedNoticePeriod,
      }, SetOptions(merge: true));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Employment details saved successfully'),
            backgroundColor: Colors.green,
          ),
        );
        // Reset form after successful save
        setState(() {
          _employmentRecords.clear();
          _companyNameController.clear();
          _joiningDateController.clear();
          _salaryController.clear();
          _experienceYearController.text = '8';
          _experienceMonthController.text = '6';
          _selectedEmploymentType = 'Full-Time';
          _selectedNoticePeriod = '15 Days';
          _isCurrentCompany = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving details: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _companyNameController.dispose();
    _joiningDateController.dispose();
    _salaryController.dispose();
    _experienceYearController.dispose();
    _experienceMonthController.dispose();
    super.dispose();
  }

  Widget _buildChipButton(String currentValue, String value, Function(String) onTap) {
    return GestureDetector(
      onTap: () => onTap(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          border: Border.all(
            color: currentValue == value ? const Color(0xFF2563EB) : const Color(0xFFD1D5DB),
            width: 2,
          ),
          borderRadius: BorderRadius.circular(20),
          color: currentValue == value ? const Color(0xFFEDEDFF) : Colors.white,
        ),
        child: Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: currentValue == value ? const Color(0xFF2563EB) : const Color(0xFF6B7280),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                // Header
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(Icons.arrow_back, color: Colors.black),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Employment',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Employment Type
                const Text('Employment Type', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 12,
                  children: [
                    _buildChipButton(_selectedEmploymentType, 'Full-Time', (value) {
                      setState(() => _selectedEmploymentType = value);
                    }),
                    _buildChipButton(_selectedEmploymentType, 'Part-Time', (value) {
                      setState(() => _selectedEmploymentType = value);
                    }),
                    _buildChipButton(_selectedEmploymentType, 'Internship', (value) {
                      setState(() => _selectedEmploymentType = value);
                    }),
                  ],
                ),
                const SizedBox(height: 24),
                // Experience
                const Text('Experience', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _experienceYearController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          hintText: '8',
                          filled: true,
                          fillColor: const Color(0xFFEEF2F7),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Center(
                        child: Text(
                          'Year',
                          style: TextStyle(
                            fontSize: 14,
                            color: const Color(0xFF6B7280).withOpacity(0.7),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _experienceMonthController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          hintText: '6',
                          filled: true,
                          fillColor: const Color(0xFFEEF2F7),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Center(
                        child: Text(
                          'Month',
                          style: TextStyle(
                            fontSize: 14,
                            color: const Color(0xFF6B7280).withOpacity(0.7),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Current Company Name
                const Text('Current Company Name', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                TextField(
                  controller: _companyNameController,
                  decoration: InputDecoration(
                    hintText: 'Enter company name',
                    filled: true,
                    fillColor: const Color(0xFFEEF2F7),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    prefixIcon: const Icon(Icons.business, color: Color(0xFF6B7280)),
                  ),
                ),
                const SizedBox(height: 20),
                // Joining Date
                const Text('Joining Date', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                TextField(
                  controller: _joiningDateController,
                  decoration: InputDecoration(
                    hintText: 'Select date',
                    filled: true,
                    fillColor: const Color(0xFFEEF2F7),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
                const SizedBox(height: 20),
                // Is this your current company
                const Text('Is this your current company?', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildChipButton(_isCurrentCompany ? 'Yes' : 'No', 'Yes', (value) {
                      setState(() => _isCurrentCompany = true);
                    }),
                    const SizedBox(width: 12),
                    _buildChipButton(_isCurrentCompany ? 'Yes' : 'No', 'No', (value) {
                      setState(() => _isCurrentCompany = false);
                    }),
                  ],
                ),
                const SizedBox(height: 20),
                // Annual Salary
                const Text('Annual Salary', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      width: 50,
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2F7),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text('₹', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _salaryController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          hintText: 'Enter salary',
                          filled: true,
                          fillColor: const Color(0xFFEEF2F7),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text('Per Year', style: TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                  ],
                ),
                const SizedBox(height: 20),
                // Notice Period
                const Text('Notice Period', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['15 Days', '1 Month', '2 Month', '3 Month', 'Serving Notice Period']
                      .map((period) => _buildChipButton(_selectedNoticePeriod, period, (value) {
                            setState(() => _selectedNoticePeriod = value);
                          }))
                      .toList(),
                ),
                const SizedBox(height: 20),
                // Add More Options
                Center(
                  child: GestureDetector(
                    onTap: () async {
                      // Save current employment record first
                      if (_companyNameController.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Please fill in the company name before adding more'),
                            backgroundColor: Colors.orange,
                          ),
                        );
                        return;
                      }

                      // Save current record to list
                      final newRecord = {
                        'employmentType': _selectedEmploymentType,
                        'companyName': _companyNameController.text.trim(),
                        'joiningDate': _joiningDateController.text.trim(),
                        'employmentSalary': _salaryController.text.trim(),
                        'employmentYear': int.tryParse(_experienceYearController.text) ?? 0,
                        'employmentMonth': int.tryParse(_experienceMonthController.text) ?? 0,
                        'noticePeriod': _selectedNoticePeriod,
                        'isCurrentCompany': _isCurrentCompany,
                      };

                      setState(() {
                        _employmentRecords.add(newRecord);
                        // Reset form for new entry
                        _companyNameController.clear();
                        _joiningDateController.clear();
                        _salaryController.clear();
                        _experienceYearController.text = '8';
                        _experienceMonthController.text = '6';
                        _selectedEmploymentType = 'Full-Time';
                        _selectedNoticePeriod = '15 Days';
                        _isCurrentCompany = false;
                      });

                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Employment record added. Fill in details for next entry.'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.add, color: Color(0xFF2563EB), size: 20),
                        const SizedBox(width: 4),
                        const Text(
                          'Add More',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF2563EB),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                // Display added employment records
                if (_employmentRecords.isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Added Employment Records', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                      const SizedBox(height: 12),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _employmentRecords.length,
                        itemBuilder: (context, index) {
                          final record = _employmentRecords[index];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              border: Border.all(color: const Color(0xFFE5E7EB)),
                              borderRadius: BorderRadius.circular(8),
                              color: const Color(0xFFFAFAFA),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        record['companyName'] ?? 'N/A',
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _employmentRecords.removeAt(index);
                                        });
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(
                                            content: Text('Record deleted'),
                                            backgroundColor: Colors.red,
                                          ),
                                        );
                                      },
                                      child: const Icon(Icons.delete_outline, color: Colors.red, size: 18),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${record['employmentType']} • ${record['employmentYear']}y ${record['employmentMonth']}m',
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                const SizedBox(height: 20),
                // Save button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _saveEmploymentData,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Save',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class BookmarkScreen extends StatefulWidget {
  const BookmarkScreen({super.key});

  @override
  State<BookmarkScreen> createState() => _BookmarkScreenState();
}

class _BookmarkScreenState extends State<BookmarkScreen> {
  List<Map<String, dynamic>> _bookmarks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadBookmarks();
  }

  void _loadBookmarks() {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      setState(() => _loading = false);
      return;
    }
    FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .collection('bookmarks')
        .orderBy('savedAt', descending: true)
        .snapshots()
        .listen((snap) {
      if (mounted) {
        setState(() {
          _bookmarks =
              snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
          _loading = false;
        });
      }
    });
  }

  Future<void> _removeBookmark(String jobId) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    await FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .collection('bookmarks')
        .doc(jobId)
        .delete();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Bookmark removed'),
        duration: Duration(seconds: 1),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
              child: Row(
                children: [
                  const Text(
                    'Saved Jobs',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (!_loading)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2FF),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${_bookmarks.length}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF2563EB),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // List
            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(
                          color: Color(0xFF2563EB)))
                  : _bookmarks.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.bookmark_border,
                                  size: 64, color: Colors.grey.shade300),
                              const SizedBox(height: 16),
                              const Text(
                                'No saved jobs yet',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF374151)),
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'Tap the bookmark icon on any job to save it here',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF94A3B8)),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding:
                              const EdgeInsets.fromLTRB(16, 12, 16, 24),
                          itemCount: _bookmarks.length,
                          itemBuilder: (context, index) {
                            final b = _bookmarks[index];
                            final badges =
                                (b['badges'] as List<dynamic>? ?? [])
                                    .map((e) => e.toString())
                                    .toList();
                            return Dismissible(
                              key: Key(b['jobId']?.toString() ?? index.toString()),
                              direction: DismissDirection.endToStart,
                              background: Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade400,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                alignment: Alignment.centerRight,
                                padding: const EdgeInsets.only(right: 20),
                                child: const Icon(Icons.delete_outline,
                                    color: Colors.white, size: 24),
                              ),
                              onDismissed: (_) =>
                                  _removeBookmark(b['jobId']?.toString() ?? ''),
                              child: GestureDetector(
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => JobDetailsScreen(
                                      jobId: b['jobId']?.toString() ?? '',
                                      companyId:
                                          b['companyId']?.toString() ?? '',
                                      title: b['title']?.toString() ?? '',
                                      company:
                                          b['company']?.toString() ?? '',
                                      location:
                                          b['location']?.toString() ?? '',
                                      rating:
                                          b['rating']?.toString() ?? '4.5',
                                      badges: badges,
                                      posted_days_ago: '',
                                      salary:
                                          b['salary']?.toString() ?? '',
                                      description:
                                          b['description']?.toString() ?? '',
                                      experience:
                                          b['experience']?.toString() ?? '',
                                      category:
                                          b['category']?.toString() ?? '',
                                      currency:
                                          b['currency']?.toString() ?? '₹',
                                    ),
                                  ),
                                ),
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: [
                                      BoxShadow(
                                        color:
                                            Colors.black.withOpacity(0.06),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  padding: const EdgeInsets.all(14),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEEF2FF),
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: const Icon(
                                            Icons.work_outline,
                                            color: Color(0xFF4F46E5),
                                            size: 22),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              b['title']?.toString() ?? '',
                                              style: const TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF1F2937),
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              b['company']?.toString() ?? '',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: Color(0xFF2563EB),
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            const SizedBox(height: 6),
                                            Row(
                                              children: [
                                                const Icon(
                                                    Icons.location_on_outlined,
                                                    size: 13,
                                                    color:
                                                        Color(0xFF9CA3AF)),
                                                const SizedBox(width: 3),
                                                Text(
                                                  b['location']?.toString() ?? '',
                                                  style: const TextStyle(
                                                      fontSize: 12,
                                                      color:
                                                          Color(0xFF6B7280)),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 6),
                                            // Salary
                                            if ((b['salary']?.toString() ?? '').isNotEmpty)
                                              Padding(
                                                padding: const EdgeInsets.only(bottom: 4),
                                                child: Row(
                                                  children: [
                                                    const Icon(Icons.currency_rupee, size: 13, color: Color(0xFF2563EB)),
                                                    const SizedBox(width: 2),
                                                    Text(
                                                      b['salary']?.toString() ?? '',
                                                      style: const TextStyle(
                                                        fontSize: 12,
                                                        fontWeight: FontWeight.w500,
                                                        color: Color(0xFF1F2937),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            // Experience
                                            if ((b['experience']?.toString() ?? '').isNotEmpty)
                                              Padding(
                                                padding: const EdgeInsets.only(bottom: 4),
                                                child: Row(
                                                  children: [
                                                    const Icon(Icons.work_history, size: 14, color: Color(0xFF7C3AED)),
                                                    const SizedBox(width: 4),
                                                    Expanded(
                                                      child: Text(
                                                        b['experience'].toString(),
                                                        maxLines: 1,
                                                        overflow: TextOverflow.ellipsis,
                                                        style: const TextStyle(
                                                          fontSize: 11,
                                                          color: Color(0xFF4B5563),
                                                          fontWeight: FontWeight.w500,
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            // Category / Skills
                                            if ((b['category']?.toString() ?? '').isNotEmpty)
                                              Row(
                                                children: [
                                                  const Icon(Icons.star_outline, size: 14, color: Color(0xFFF59E0B)),
                                                  const SizedBox(width: 4),
                                                  Expanded(
                                                    child: Text(
                                                      b['category'].toString(),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                      style: const TextStyle(
                                                        fontSize: 11,
                                                        color: Color(0xFF6B7280),
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                          ],
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(
                                            Icons.bookmark,
                                            color: Color(0xFF2563EB),
                                            size: 20),
                                        onPressed: () => _removeBookmark(
                                            b['jobId']?.toString() ?? ''),
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Training Screen
// ─────────────────────────────────────────────────────────────────────────────

class TrainingScreen extends StatefulWidget {
  const TrainingScreen({super.key});

  @override
  State<TrainingScreen> createState() => _TrainingScreenState();
}

class _TrainingScreenState extends State<TrainingScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  List<Map<String, dynamic>> _trainings = [];
  bool _loading = true;
  bool _showLanding = true;   // ← show promo first

  // 'Training' or 'Education'
  String _selectedType = 'Training';
  // null = All, 'Online', 'Offline', 'Hybrid'
  String? _selectedMode;
  // Education: preferred course filter
  String _selectedCourse = '';
  List<String> _courseTitles = [];
  String? _eduSortChip; // 'Top Choice' | 'NIRF Ranked' | 'Fee: Low to High'
  // institution name → imageUrl (background image)
  Map<String, String> _institutionImageMap = {};

  @override
  void initState() {
    super.initState();
    _loadTrainings();
    _loadCourses();
    _loadInstitutions();
    _searchController.addListener(() {
      setState(() => _searchQuery = _searchController.text.toLowerCase());
    });
  }

  void _loadCourses() {
    FirebaseFirestore.instance
        .collection('courses')
        .snapshots()
        .listen((snapshot) {
      if (mounted) {
        final titles = snapshot.docs
            .map((d) => (d.data()['courseTitle'] ?? '').toString().trim())
            .where((t) => t.isNotEmpty)
            .toSet()
            .toList()
          ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
        setState(() {
          _courseTitles = titles;
          // Do NOT auto-select — keep default as "All Courses" (empty string)
        });
      }
    });
  }

  void _loadInstitutions() {
    FirebaseFirestore.instance
        .collection('institutions')
        .snapshots()
        .listen((snapshot) {
      if (mounted) {
        final map = <String, String>{};
        for (final doc in snapshot.docs) {
          final data = doc.data();
          final name = (data['name'] ?? '').toString().trim();
          final imageUrl = (data['imageUrl'] ?? '').toString().trim();
          if (name.isNotEmpty && imageUrl.isNotEmpty && imageUrl != 'null') {
            // Store both original and lowercase for flexible lookup
            map[name] = imageUrl;
            map[name.toLowerCase()] = imageUrl;
          }
        }
        setState(() => _institutionImageMap = map);
      }
    });
  }

  void _loadTrainings() {
    FirebaseFirestore.instance
        .collection('trainings')
        .snapshots()
        .listen((snapshot) {
      if (mounted) {
        setState(() {
          _trainings = snapshot.docs
              .map((doc) => {'id': doc.id, ...doc.data()})
              .toList();
          _loading = false;
        });
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showCourseSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => StreamBuilder<List<String>>(
        stream: FirebaseFirestore.instance
            .collection('courses')
            .snapshots()
            .map((snap) {
          final titles = snap.docs
              .map((d) => (d.data()['courseTitle'] ?? '').toString().trim())
              .where((t) => t.isNotEmpty)
              .toSet()
              .toList()
            ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
          return titles;
        }),
        builder: (ctx, snapshot) {
          final courses = ['All Courses', ...(snapshot.data ?? _courseTitles)];
          return DraggableScrollableSheet(
            expand: false,
            initialChildSize: 0.5,
            minChildSize: 0.3,
            maxChildSize: 0.85,
            builder: (_, scrollController) => Column(
              children: [
                // Handle bar
                Container(
                  margin: const EdgeInsets.only(top: 10, bottom: 6),
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.fromLTRB(20, 8, 20, 10),
                  child: Text('Select Preferred Course',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
                const Divider(height: 1),
                if (snapshot.connectionState == ConnectionState.waiting &&
                    _courseTitles.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator(),
                  )
                else if (courses.length == 1) // only "All Courses"
                  const Padding(
                    padding: EdgeInsets.all(24),
                    child: Text('No courses found.\nAdd courses in the admin panel.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey, fontSize: 14)),
                  )
                else
                  Expanded(
                    child: ListView.builder(
                      controller: scrollController,
                      itemCount: courses.length,
                      itemBuilder: (_, i) {
                        final c = courses[i];
                        final isSelected = (c == 'All Courses' && _selectedCourse.isEmpty) ||
                            _selectedCourse == c;
                        return ListTile(
                          leading: Icon(Icons.school_outlined,
                              color: isSelected
                                  ? const Color(0xFF3D1A8C)
                                  : Colors.grey),
                          title: Text(c,
                              style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: isSelected
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                  color: isSelected
                                      ? const Color(0xFF3D1A8C)
                                      : const Color(0xFF1F2937))),
                          trailing: isSelected
                              ? const Icon(Icons.check_circle,
                                  color: Color(0xFF3D1A8C))
                              : null,
                          onTap: () {
                            setState(() =>
                                _selectedCourse = c == 'All Courses' ? '' : c);
                            Navigator.pop(context);
                          },
                        );
                      },
                    ),
                  ),
                const SizedBox(height: 12),
              ],
            ),
          );
        },
      ),
    );
  }

  // ── Promotional landing screen ──────────────────────────────────────────
  Widget _buildLandingScreen() {
    const teal = Color(0xFF2D8C6B);
    final testimonials = [
      {'name': 'Amit Verma', 'role': 'Data Entry Operator', 'from': '₹14,000', 'to': '₹38,000', 'quote': 'Got placed within 2 months of completing my online course'},
      {'name': 'Kavitha Nair', 'role': 'Sales Executive', 'from': '₹16,000', 'to': '₹45,000', 'quote': 'Flexible learning helped me upskill while working full time'},
      {'name': 'Rohit Patil', 'role': 'Logistics Coordinator', 'from': '₹18,000', 'to': '₹52,000', 'quote': 'Best decision I made — my salary tripled in one year'},
    ];
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // ── Background image / gradient ──
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xFF1A0A2E),
                    Color(0xFF0D1B2A),
                    Color(0xFF0A1628),
                  ],
                ),
              ),
            ),
          ),
          // Subtle university building silhouette overlay
          Positioned.fill(
            child: Opacity(
              opacity: 0.18,
              child: Container(
                decoration: const BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment(0, -0.3),
                    radius: 1.2,
                    colors: [Color(0xFF4A3580), Colors.transparent],
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                // ── Top bar: logo + close ──
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      RichText(
                        text: const TextSpan(
                          children: [
                            TextSpan(text: 'KA Jobs', style: TextStyle(color: Color(0xFFF5A623), fontSize: 22, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                            TextSpan(text: 'Trai', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                            TextSpan(text: 'n', style: TextStyle(color: Color(0xFFF5A623), fontSize: 22, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                            TextSpan(text: 'ing', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic)),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => _showLanding = false),
                        child: Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: const Icon(Icons.close, color: Colors.white, size: 20),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 36),
                // ── Hero text ──
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    children: [
                      Text(
                        'BUILD YOUR\nCAREER WITH',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.w900,
                          height: 1.15,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Golden pill label
                      const _OnlineDegreeTag(),
                    ],
                  ),
                ),
                const SizedBox(height: 36),
                // ── Divider with learner count ──
                Row(
                  children: [
                    Expanded(child: Divider(color: Colors.white.withOpacity(0.3), thickness: 1)),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 14),
                      child: Text(
                        'JOIN 50,000+ LEARNERS',
                        style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1.4, fontWeight: FontWeight.w600),
                      ),
                    ),
                    Expanded(child: Divider(color: Colors.white.withOpacity(0.3), thickness: 1)),
                  ],
                ),
                const SizedBox(height: 20),
                // ── Testimonial cards horizontal scroll ──
                SizedBox(
                  height: 180,
                  child: PageView.builder(
                    controller: PageController(viewportFraction: 0.78),
                    itemCount: testimonials.length,
                    itemBuilder: (_, i) {
                      final t = testimonials[i];
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1A1A2E),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withOpacity(0.1)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // University logo placeholder
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text('JGI JAIN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF1A1A2E))),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 16,
                                  backgroundColor: teal,
                                  child: Text(t['name']![0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                ),
                                const SizedBox(width: 8),
                                Text(t['name']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text('"${t['quote']}"',
                              style: const TextStyle(color: Colors.white70, fontSize: 11, fontStyle: FontStyle.italic),
                              maxLines: 2, overflow: TextOverflow.ellipsis),
                            const Spacer(),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(t['role']!, style: const TextStyle(color: Colors.white54, fontSize: 11),
                                  overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        border: Border.all(color: Colors.white38),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(t['from']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                                    ),
                                    const Padding(
                                      padding: EdgeInsets.symmetric(horizontal: 4),
                                      child: Icon(Icons.arrow_forward, color: Colors.white54, size: 13),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: teal,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(t['to']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const Spacer(),

                // ── Get Started button ──
                GestureDetector(
                  onTap: () => setState(() => _showLanding = false),
                  child: Container(
                    width: double.infinity,
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    child: const Text(
                      'Get Started',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF9E9E9E),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Map<String, dynamic>> get _filtered {
    var list = _trainings.where((t) {
      final type = (t['type'] ?? 'Training').toString();
      return type == _selectedType;
    }).toList();

    // Filter by mode (Training only)
    if (_selectedType == 'Training' && _selectedMode != null) {
      list = list.where((t) {
        final facilities = (t['facilities'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
        final modeFacility = facilities.firstWhere(
          (f) => (f['name'] ?? '').toString().toLowerCase().contains('mode'),
          orElse: () => {},
        );
        final modeValue = (modeFacility['value'] ?? '').toString().toLowerCase();
        return modeValue.contains(_selectedMode!.toLowerCase());
      }).toList();
    }

    // Filter by eduMode (Education only)
    if (_selectedType == 'Education' && _selectedMode != null) {
      list = list.where((t) {
        final eduMode = (t['eduMode'] ?? '').toString().toLowerCase();
        return eduMode.contains(_selectedMode!.toLowerCase());
      }).toList();
    }

    if (_searchQuery.isEmpty && _selectedType == 'Education') {
      // Filter by selected course degree type (skip if empty = All Courses)
      if (_selectedCourse.isNotEmpty) {
        list = list.where((t) {
          final deg = (t['degreeType'] ?? t['courseTitle'] ?? '').toString();
          return deg.toLowerCase().contains(_selectedCourse.toLowerCase());
        }).toList();
      }
      // Sort
      if (_eduSortChip == 'NIRF Ranked') {
        list.sort((a, b) {
          final ra = int.tryParse((a['nirfRank'] ?? '9999').toString()) ?? 9999;
          final rb = int.tryParse((b['nirfRank'] ?? '9999').toString()) ?? 9999;
          return ra.compareTo(rb);
        });
      } else if (_eduSortChip == 'Fee: Low to High') {
        list.sort((a, b) {
          int parseFee(dynamic v) {
            if (v == null) return 999999999;
            return int.tryParse(v.toString().replaceAll(RegExp(r'[^\d]'), '')) ?? 999999999;
          }
          return parseFee(a['fees'] ?? a['courseFee']).compareTo(parseFee(b['fees'] ?? b['courseFee']));
        });
      }
      return list;
    }
    if (_searchQuery.isEmpty) return list;
    return list.where((t) {
      if (_selectedType == 'Training') {
        final center = (t['centerName'] ?? '').toString().toLowerCase();
        final course = (t['courseName'] ?? '').toString().toLowerCase();
        final location = (t['location'] ?? '').toString().toLowerCase();
        return center.contains(_searchQuery) ||
            course.contains(_searchQuery) ||
            location.contains(_searchQuery);
      } else {
        final inst = (t['institutionName'] ?? '').toString().toLowerCase();
        final course = (t['courseTitle'] ?? '').toString().toLowerCase();
        final location = (t['location'] ?? '').toString().toLowerCase();
        return inst.contains(_searchQuery) ||
            course.contains(_searchQuery) ||
            location.contains(_searchQuery);
      }
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (_showLanding) return _buildLandingScreen();
    final filtered = _filtered;
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Training & Education',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${filtered.length} ${_selectedType == 'Training' ? 'center' : 'institution'}${filtered.length == 1 ? '' : 's'} available',
                    style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 14),

                  // ── Type toggle: Training / Education ──
                  Row(
                    children: ['Training', 'Education'].map((type) {
                      final selected = _selectedType == type;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() {
                            _selectedType = type;
                            _selectedMode = null;
                          }),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            margin: EdgeInsets.only(right: type == 'Training' ? 6 : 0),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              gradient: selected
                                  ? const LinearGradient(
                                      colors: [Color(0xFF667EEA), Color(0xFF764BA2)],
                                    )
                                  : null,
                              color: selected ? null : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  type == 'Training'
                                      ? Icons.fitness_center_rounded
                                      : Icons.school_rounded,
                                  size: 16,
                                  color: selected ? Colors.white : const Color(0xFF64748B),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  type,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: selected ? Colors.white : const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),

// ── Mode chips (Training only) / Education preferred course header ──
                  if (_selectedType == 'Training') ...[
                    const SizedBox(height: 10),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          null,
                          ...['Online', 'Offline', 'Hybrid'],
                        ].map((mode) {
                          final selected = _selectedMode == mode;
                          return GestureDetector(
                            onTap: () => setState(() => _selectedMode = mode),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                              decoration: BoxDecoration(
                                color: selected ? const Color(0xFF2563EB) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(mode ?? 'All',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                                  color: selected ? Colors.white : const Color(0xFF64748B))),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Search bar
                    Container(
                      height: 44,
                      decoration: BoxDecoration(color: const Color(0xFFEEF2F7), borderRadius: BorderRadius.circular(12)),
                      child: TextField(
                        controller: _searchController,
                        decoration: const InputDecoration(
                          hintText: 'Search center, course or location…',
                          hintStyle: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                          prefixIcon: Icon(Icons.search, color: Color(0xFF94A3B8), size: 20),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(vertical: 12),
                        ),
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                  ],
                  if (_selectedType == 'Education') ...[
                    const SizedBox(height: 12),
                    // ── "Your preferred course" row ──
                    Row(
                      children: [
                        const Text('Your preferred course',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                        const SizedBox(width: 10),
                        GestureDetector(
                          onTap: () => _showCourseSheet(context),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                            decoration: BoxDecoration(
                              color: const Color(0xFF3D1A8C),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.school, color: Colors.white, size: 14),
                                const SizedBox(width: 6),
                                Text(_selectedCourse.isEmpty ? 'All Courses' : _selectedCourse,
                                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
                                const SizedBox(width: 6),
                                const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 16),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    // ── Sort/filter chips ──
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: ['Top Choice', 'NIRF Ranked', 'Fee: Low to High'].map((chip) {
                          final sel = _eduSortChip == chip;
                          return GestureDetector(
                            onTap: () => setState(() => _eduSortChip = sel ? null : chip),
                            child: Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                              decoration: BoxDecoration(
                                color: sel ? const Color(0xFF3D1A8C) : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: sel ? const Color(0xFF3D1A8C) : const Color(0xFFD1D5DB)),
                              ),
                              child: Text(chip,
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                                  color: sel ? Colors.white : const Color(0xFF374151))),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Search bar for Education
                    Container(
                      height: 44,
                      decoration: BoxDecoration(color: const Color(0xFFEEF2F7), borderRadius: BorderRadius.circular(12)),
                      child: TextField(
                        controller: _searchController,
                        decoration: const InputDecoration(
                          hintText: 'Search institution or course…',
                          hintStyle: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                          prefixIcon: Icon(Icons.search, color: Color(0xFF94A3B8), size: 20),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(vertical: 12),
                        ),
                        style: const TextStyle(fontSize: 13),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // ── List ──
            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(
                          color: Color(0xFF2563EB)),
                    )
                  : filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.school_outlined,
                                  size: 56,
                                  color: Colors.grey.shade300),
                              const SizedBox(height: 12),
                              Text(
                                _searchQuery.isEmpty
                                    ? 'No ${_selectedType == 'Training' ? 'training centers' : 'institutions'} available'
                                    : 'No results found',
                                style: const TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 14),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding:
                              const EdgeInsets.fromLTRB(16, 12, 16, 24),
                          itemCount: filtered.length,
                          itemBuilder: (context, index) =>
                              _selectedType == 'Training'
                                  ? _TrainingCard(
                                      training: filtered[index])
                                  : _EducationCard(
                                      entry: filtered[index],
                                      institutionImageMap: _institutionImageMap,
                                    ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

// Online Degree golden tag
class _OnlineDegreeTag extends StatelessWidget {
  const _OnlineDegreeTag();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF5A623),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [BoxShadow(color: const Color(0xFFF5A623).withOpacity(0.5), blurRadius: 14, spreadRadius: 2)],
      ),
      child: const Text(
        'online degree',
        style: TextStyle(
          color: Color(0xFF3A1A6B),
          fontSize: 22,
          fontWeight: FontWeight.w900,
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }
}

class _TrainingCard extends StatefulWidget {
  const _TrainingCard({required this.training});
  final Map<String, dynamic> training;

  @override
  State<_TrainingCard> createState() => _TrainingCardState();
}

class _TrainingCardState extends State<_TrainingCard> {
  bool _hasApplied = false;
  bool _applying = false;

  @override
  void initState() {
    super.initState();
    _checkIfApplied();
  }

  Future<void> _checkIfApplied() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final trainingId = (widget.training['id'] ?? '').toString();
    if (trainingId.isEmpty) return;
    final snap = await FirebaseFirestore.instance
        .collection('trainingApplications')
        .where('userId', isEqualTo: user.uid)
        .where('trainingId', isEqualTo: trainingId)
        .limit(1)
        .get();
    if (mounted) setState(() => _hasApplied = snap.docs.isNotEmpty);
  }

  Future<void> _applyNow() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to apply'), backgroundColor: Colors.red));
      return;
    }
    setState(() => _applying = true);
    try {
      final trainingId = (widget.training['id'] ?? '').toString();
      // Fetch user profile
      final userDoc = await FirebaseFirestore.instance.collection('users').doc(user.uid).get();
      final userData = userDoc.data() ?? {};

      await FirebaseFirestore.instance.collection('trainingApplications').add({
        'trainingId': trainingId,
        'centerName': widget.training['centerName'] ?? '',
        'courseName': widget.training['courseName'] ?? '',
        'location': widget.training['location'] ?? '',
        'duration': widget.training['duration'] ?? '',
        'userId': user.uid,
        'userName': userData['name'] ?? user.displayName ?? '',
        'userEmail': userData['email'] ?? user.email ?? '',
        'userPhone': userData['phone'] ?? user.phoneNumber ?? '',
        'userCity': userData['currentCity'] ?? '',
        'status': 'pending',
        'appliedAt': FieldValue.serverTimestamp(),
      });
      if (mounted) {
        setState(() => _hasApplied = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Applied successfully!'), backgroundColor: Color(0xFF2D8C6B)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error applying: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _applying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final training = widget.training;
    final status = (training['status'] ?? 'active').toString();
    final isActive = status == 'active';
    final facilities =
        (training['facilities'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
    final centerName = (training['centerName'] ?? 'Training Center').toString();
    final courseName = (training['courseName'] ?? '').toString();
    final location = (training['location'] ?? '').toString();
    final duration = (training['duration'] ?? '').toString();
    final pocName = (training['pocName'] ?? '').toString();
    final pocPhone = (training['pocPhone'] ?? '').toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, 3)),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Gradient header banner ──
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF667EEA), Color(0xFF764BA2)],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Center icon
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.fitness_center_rounded, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(centerName,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white),
                              maxLines: 2, overflow: TextOverflow.ellipsis),
                            if (courseName.isNotEmpty) ...[
                              const SizedBox(height: 3),
                              Text(courseName,
                                style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.85), fontWeight: FontWeight.w500),
                                maxLines: 1, overflow: TextOverflow.ellipsis),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Status badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: isActive ? const Color(0xFF22C55E) : Colors.white.withOpacity(0.25),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          isActive ? 'Active' : 'Inactive',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  // ── Location | Duration row ──
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        if (location.isNotEmpty) ...[
                          const Icon(Icons.location_on_outlined, size: 14, color: Colors.white70),
                          const SizedBox(width: 4),
                          Text(location, style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600)),
                        ],
                        if (location.isNotEmpty && duration.isNotEmpty)
                          Container(margin: const EdgeInsets.symmetric(horizontal: 10), width: 1, height: 12, color: Colors.white38),
                        if (duration.isNotEmpty) ...[
                          const Icon(Icons.schedule_outlined, size: 14, color: Colors.white70),
                          const SizedBox(width: 4),
                          Text(duration, style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600)),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── Body ──
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Facilities chips
                  if (facilities.isNotEmpty) ...[
                    const Text('FACILITIES',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8), letterSpacing: 0.8)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6, runSpacing: 6,
                      children: facilities.map((f) {
                        final name = f['name']?.toString() ?? '';
                        final value = f['value']?.toString() ?? '';
                        if (name.isEmpty) return const SizedBox.shrink();
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(colors: [Color(0xFFEEF2FF), Color(0xFFF5F3FF)]),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFF667EEA).withOpacity(0.25)),
                          ),
                          child: Text(
                            value.isNotEmpty ? '$name: $value' : name,
                            style: const TextStyle(fontSize: 11, color: Color(0xFF4338CA), fontWeight: FontWeight.w600),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 14),
                  ],

                  // POC section
                  if (pocName.isNotEmpty || pocPhone.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [Color(0xFF667EEA), Color(0xFF764BA2)]),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.person_outline, color: Colors.white, size: 18),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Point of Contact',
                                  style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
                                if (pocName.isNotEmpty)
                                  Text(pocName,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                                if (pocPhone.isNotEmpty)
                                  Text(pocPhone,
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF2563EB))),
                              ],
                            ),
                          ),
                          if (pocPhone.isNotEmpty)
                            InkWell(
                              onTap: () async {
                                final uri = Uri(scheme: 'tel', path: pocPhone);
                                if (await canLaunchUrl(uri)) await launchUrl(uri);
                              },
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF2563EB),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.call_outlined, size: 16, color: Colors.white),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],

                  // ── Apply / Applied button ──
                  if (_hasApplied)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF2D8C6B).withOpacity(0.4)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle, color: Color(0xFF2D8C6B), size: 20),
                          SizedBox(width: 8),
                          Text('Applied for this Training',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF065F46))),
                        ],
                      ),
                    )
                  else
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _applying ? null : _applyNow,
                        icon: _applying
                            ? const SizedBox(width: 16, height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.send_rounded, size: 16, color: Colors.white),
                        label: Text(
                          _applying ? 'Applying...' : 'Apply Now',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF667EEA),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Education Card ──────────────────────────────────────────────────────────
class _EducationCard extends StatefulWidget {
  const _EducationCard({required this.entry, this.institutionImageMap = const {}});
  final Map<String, dynamic> entry;
  final Map<String, String> institutionImageMap;

  @override
  State<_EducationCard> createState() => _EducationCardState();
}

class _EducationCardState extends State<_EducationCard> {
  static const _purple = Color(0xFF3D1A8C);
  bool _hasApplied = false;
  bool _applying = false;

  // Extra detail fields collected via "Add Details" sheet
  String _extraName = '';
  String _extraPhone = '';
  String _extraMessage = '';
  bool _detailsFilled = false;

  @override
  void initState() {
    super.initState();
    _checkIfApplied();
  }

  Future<void> _checkIfApplied() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final trainingId = (widget.entry['id'] ?? '').toString();
    if (trainingId.isEmpty) return;
    final snap = await FirebaseFirestore.instance
        .collection('educationApplications')
        .where('userId', isEqualTo: user.uid)
        .where('trainingId', isEqualTo: trainingId)
        .limit(1)
        .get();
    if (mounted) setState(() => _hasApplied = snap.docs.isNotEmpty);
  }

  void _showCourseDetailsSheet() {
    final entry = widget.entry;
    final institutionName = (entry['institutionName'] ?? 'Institution').toString();
    final courseTitle = (entry['courseTitle'] ?? '').toString();
    final degreeType = (entry['degreeType'] ?? courseTitle).toString();
    final duration = (entry['courseDuration'] ?? '').toString();
    final fees = (entry['fees'] ?? entry['courseFee'] ?? '').toString();
    final nirf = (entry['nirfRank'] ?? '').toString();
    final seatsLeft = (entry['seatsLeft'] ?? '').toString();
    final eduMode = (entry['eduMode'] ?? '').toString();
    final location = (entry['location'] ?? '').toString();
    final specialization = (entry['specialization'] ?? '').toString();
    final accreditation = (entry['accreditation'] ?? '').toString();
    final description = (entry['description'] ?? '').toString();
    final eligibility = (entry['eligibility'] ?? '').toString();
    final scholarship = (entry['scholarship'] ?? entry['scholarshipAvailable'] ?? '').toString();
    final website = (entry['website'] ?? '').toString();
    final email = (entry['email'] ?? '').toString();
    final phone = (entry['phone'] ?? entry['contactPhone'] ?? '').toString();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        minChildSize: 0.4,
        maxChildSize: 0.95,
        expand: false,
        builder: (_, scrollCtrl) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 4),
                width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
              ),
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                child: Row(
                  children: [
                    const Icon(Icons.school_rounded, color: Color(0xFF3D1A8C), size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(institutionName,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF111827)),
                        maxLines: 2, overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // Scrollable content
              Expanded(
                child: ListView(
                  controller: scrollCtrl,
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                  children: [
                    // Course title
                    _detailSection('Course / Degree', degreeType.isNotEmpty ? degreeType : courseTitle, Icons.menu_book_rounded),
                    if (specialization.isNotEmpty)
                      _detailSection('Specialization', specialization, Icons.auto_awesome_outlined),
                    if (duration.isNotEmpty)
                      _detailSection('Duration', duration, Icons.schedule_outlined),
                    if (fees.isNotEmpty)
                      _detailSection('Fees', fees, Icons.currency_rupee),
                    if (eduMode.isNotEmpty)
                      _detailSection('Mode', eduMode, Icons.laptop_outlined),
                    if (location.isNotEmpty)
                      _detailSection('Location', location, Icons.location_on_outlined),
                    if (nirf.isNotEmpty)
                      _detailSection('NIRF Rank', '#$nirf', Icons.emoji_events_outlined),
                    if (accreditation.isNotEmpty)
                      _detailSection('Accreditation', accreditation, Icons.verified_outlined),
                    if (seatsLeft.isNotEmpty)
                      _detailSection('Seats Available', seatsLeft, Icons.event_seat_outlined),
                    if (eligibility.isNotEmpty)
                      _detailSection('Eligibility', eligibility, Icons.checklist_outlined),
                    if (scholarship.isNotEmpty)
                      _detailSection('Scholarship', scholarship, Icons.card_giftcard_outlined),
                    if (description.isNotEmpty) ...[  
                      const SizedBox(height: 6),
                      const Text('About', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF374151))),
                      const SizedBox(height: 6),
                      Text(description, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280), height: 1.5)),
                    ],
                    if (website.isNotEmpty || email.isNotEmpty || phone.isNotEmpty) ...[  
                      const SizedBox(height: 16),
                      const Text('Contact', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF374151))),
                      const SizedBox(height: 8),
                      if (phone.isNotEmpty) _detailSection('Phone', phone, Icons.phone_outlined),
                      if (email.isNotEmpty) _detailSection('Email', email, Icons.email_outlined),
                      if (website.isNotEmpty) _detailSection('Website', website, Icons.language_outlined),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailSection(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: const Color(0xFF3D1A8C).withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: const Color(0xFF3D1A8C)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 13, color: Color(0xFF1F2937), fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showAddDetailsSheet() async {
    final nameCtrl = TextEditingController(text: _extraName);
    final phoneCtrl = TextEditingController(text: _extraPhone);
    final msgCtrl = TextEditingController(text: _extraMessage);

    // Pre-fill from Firebase Auth / Firestore
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      if (nameCtrl.text.isEmpty) nameCtrl.text = user.displayName ?? '';
      if (phoneCtrl.text.isEmpty) phoneCtrl.text = user.phoneNumber ?? '';
      try {
        final doc = await FirebaseFirestore.instance.collection('users').doc(user.uid).get();
        if (doc.exists) {
          final data = doc.data()!;
          if (nameCtrl.text.isEmpty) nameCtrl.text = data['name'] ?? data['firstName'] ?? '';
          if (phoneCtrl.text.isEmpty) phoneCtrl.text = data['phone'] ?? '';
        }
      } catch (_) {}
    }

    if (!mounted) return;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20, right: 20, top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Add Your Details',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
            const SizedBox(height: 4),
            Text('Fill in your details to apply for ${(widget.entry['institutionName'] ?? '').toString()}',
                style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
            const SizedBox(height: 20),
            TextField(
              controller: nameCtrl,
              decoration: InputDecoration(
                labelText: 'Full Name *',
                prefixIcon: const Icon(Icons.person_outline),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                filled: true, fillColor: const Color(0xFFF9FAFB),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Phone Number *',
                prefixIcon: const Icon(Icons.phone_outlined),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                filled: true, fillColor: const Color(0xFFF9FAFB),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: msgCtrl,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'Message / Why interested? (optional)',
                prefixIcon: const Icon(Icons.message_outlined),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                filled: true, fillColor: const Color(0xFFF9FAFB),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _purple,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      const SnackBar(content: Text('Please fill name and phone number'),
                          backgroundColor: Colors.red));
                    return;
                  }
                  Navigator.pop(ctx);
                  setState(() {
                    _extraName = nameCtrl.text.trim();
                    _extraPhone = phoneCtrl.text.trim();
                    _extraMessage = msgCtrl.text.trim();
                    _detailsFilled = true;
                  });
                },
                child: const Text('Save Details',
                    style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _applyNow() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please sign in to apply'), backgroundColor: Colors.red));
      return;
    }

    if (!_detailsFilled) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please add your details first'), backgroundColor: Colors.orange));
      await _showAddDetailsSheet();
      return;
    }

    setState(() => _applying = true);
    try {
      final trainingId = (widget.entry['id'] ?? '').toString();
      final institutionName = (widget.entry['institutionName'] ?? '').toString();
      final courseTitle = (widget.entry['courseTitle'] ?? widget.entry['degreeType'] ?? '').toString();

      // Fetch latest user profile data
      String userName = _extraName;
      String userEmail = user.email ?? '';
      String userPhone = _extraPhone;
      String userCity = '';
      try {
        final doc = await FirebaseFirestore.instance.collection('users').doc(user.uid).get();
        if (doc.exists) {
          final d = doc.data()!;
          if (userName.isEmpty) userName = d['name'] ?? d['firstName'] ?? '';
          if (userEmail.isEmpty) userEmail = d['email'] ?? '';
          if (userPhone.isEmpty) userPhone = d['phone'] ?? '';
          userCity = d['currentCity'] ?? d['location'] ?? '';
        }
      } catch (_) {}

      await FirebaseFirestore.instance.collection('educationApplications').add({
        'userId': user.uid,
        'userName': userName,
        'userEmail': userEmail,
        'userPhone': userPhone,
        'userCity': userCity,
        'message': _extraMessage,
        'trainingId': trainingId,
        'institutionName': institutionName,
        'courseTitle': courseTitle,
        'degreeType': (widget.entry['degreeType'] ?? '').toString(),
        'fees': (widget.entry['fees'] ?? widget.entry['courseFee'] ?? '').toString(),
        'duration': (widget.entry['courseDuration'] ?? '').toString(),
        'status': 'pending',
        'appliedAt': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        setState(() => _hasApplied = true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 10),
              Expanded(child: Text('Applied to $institutionName successfully!')),
            ]),
            backgroundColor: const Color(0xFF2D8C6B),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error applying: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _applying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final institutionName = (widget.entry['institutionName'] ?? 'Institution').toString();
    final courseTitle = (widget.entry['courseTitle'] ?? '').toString();
    final logoUrl = (widget.entry['logoUrl'] ?? '').toString();
    final String imageUrl = () {
      final entryImg = (widget.entry['imageUrl'] ?? '').toString().trim();
      if (entryImg.isNotEmpty && entryImg != 'null') return entryImg;
      final mapImg = (widget.institutionImageMap[institutionName] ??
          widget.institutionImageMap[institutionName.toLowerCase()] ?? '').trim();
      if (mapImg.isNotEmpty) return mapImg;
      return logoUrl;
    }();
    final duration = (widget.entry['courseDuration'] ?? '').toString();
    final fees = (widget.entry['fees'] ?? widget.entry['courseFee'] ?? '').toString();
    final seatsLeft = (widget.entry['seatsLeft'] ?? '').toString();
    final degreeType = (widget.entry['degreeType'] ?? courseTitle).toString();
    final nirf = (widget.entry['nirfRank'] ?? '').toString();
    final rating = (widget.entry['rating'] ?? widget.entry['studentRating'] ?? '').toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, 3)),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Hero image ──
            SizedBox(
              height: 170,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  imageUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: imageUrl,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: 170,
                          placeholder: (_, __) => Shimmer.fromColors(
                            baseColor: const Color(0xFFE0E0E0),
                            highlightColor: const Color(0xFFF5F5F5),
                            child: Container(width: double.infinity, height: 170, color: Colors.white),
                          ),
                          errorWidget: (_, __, ___) => _imageFallback(institutionName),
                        )
                      : _imageFallback(institutionName),
                  // Dark gradient overlay
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter, end: Alignment.bottomCenter,
                        colors: [Colors.black.withOpacity(0.08), Colors.black.withOpacity(0.45)],
                      ),
                    ),
                  ),
                  // Top-right badge: Applied or Rating
                  Positioned(
                    top: 12, right: 12,
                    child: _hasApplied
                        ? Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2D8C6B),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.check_circle, color: Colors.white, size: 13),
                                SizedBox(width: 4),
                                Text('Applied', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                              ],
                            ),
                          )
                        : Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E3A5F),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.star_rounded, color: Color(0xFFFBBF24), size: 13),
                                const SizedBox(width: 4),
                                Text(
                                  rating.isNotEmpty ? 'Students Rated $rating' : 'Students Rated',
                                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                          ),
                  ),
                  // Seats left badge top-left
                  if (seatsLeft.isNotEmpty)
                    Positioned(
                      top: 12, left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDC2626),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('Last $seatsLeft seats',
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                      ),
                    ),
                  // University logo + name bottom-left
                  Positioned(
                    bottom: 10, left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 6)],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (logoUrl.isNotEmpty)
                            CachedNetworkImage(
                              imageUrl: logoUrl,
                              width: 28, height: 28, fit: BoxFit.contain,
                              placeholder: (_, __) => Shimmer.fromColors(
                                baseColor: const Color(0xFFE0E0E0),
                                highlightColor: const Color(0xFFF5F5F5),
                                child: Container(width: 28, height: 28, color: Colors.white),
                              ),
                              errorWidget: (_, __, ___) => const Icon(Icons.school, size: 22, color: _purple),
                            )
                          else
                            const Icon(Icons.school, size: 22, color: _purple),
                          const SizedBox(width: 6),
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 140),
                            child: Text(institutionName,
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF1F2937)),
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // ── Details ──
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(institutionName,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF111827))),
                  const SizedBox(height: 10),
                  // ── Course | Duration | Fees single row ──
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        if (degreeType.isNotEmpty) ...[  
                          const Icon(Icons.school_rounded, size: 15, color: _purple),
                          const SizedBox(width: 5),
                          Text(degreeType,
                            style: const TextStyle(fontSize: 13, color: Color(0xFF374151), fontWeight: FontWeight.w700)),
                        ],
                        if (duration.isNotEmpty) ...[  
                          _vDivider(),
                          const Icon(Icons.schedule_outlined, size: 14, color: Color(0xFF6B7280)),
                          const SizedBox(width: 4),
                          Text(duration,
                            style: const TextStyle(fontSize: 13, color: Color(0xFF374151), fontWeight: FontWeight.w600)),
                        ],
                        if (fees.isNotEmpty) ...[  
                          _vDivider(),
                          const Icon(Icons.account_balance_wallet_outlined, size: 14, color: Color(0xFF6B7280)),
                          const SizedBox(width: 4),
                          Text(fees,
                            style: const TextStyle(fontSize: 13, color: Color(0xFF374151), fontWeight: FontWeight.w600)),
                        ],
                      ],
                    ),
                  ),
                  if (nirf.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(12)),
                      child: Text('NIRF Rank #$nirf',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFD97706))),
                    ),
                  ],
                  const SizedBox(height: 14),

                  // ── Applied state ──
                  if (_hasApplied)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF2D8C6B).withOpacity(0.4)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle, color: Color(0xFF2D8C6B), size: 20),
                          SizedBox(width: 8),
                          Text('Applied for this Education',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF065F46))),
                        ],
                      ),
                    )
                  else
                    // ── Two action buttons ──
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _showCourseDetailsSheet,
                            icon: const Icon(Icons.download_outlined, size: 16, color: _purple),
                            label: const Text(
                              'Brochure',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: _purple),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: _purple),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _applying ? null : _applyNow,
                            icon: _applying
                                ? const SizedBox(width: 16, height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Icon(Icons.send_rounded, size: 16, color: Colors.white),
                            label: Text(
                              _applying ? 'Applying...' : 'Apply',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _purple,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _vDivider() => Container(
    margin: const EdgeInsets.symmetric(horizontal: 10),
    width: 1, height: 14,
    color: const Color(0xFFD1D5DB),
  );

  Widget _imageFallback(String name) => Container(
    color: const Color(0xFF3D1A8C).withOpacity(0.12),
    child: Center(
      child: Text(name.isNotEmpty ? name[0] : 'U',
        style: const TextStyle(fontSize: 56, fontWeight: FontWeight.bold, color: Color(0xFF3D1A8C))),
    ),
  );
}


// ═════════════════════ deleted old EducationCard body ═══════════════════
// (removed - replaced by class above)

// ═══════════════════════════════════════════════════════════════════════════
// Profile Onboarding Flow
// ═══════════════════════════════════════════════════════════════════════════

class ProfileOnboardingFlow extends StatefulWidget {
  const ProfileOnboardingFlow({super.key});
  @override
  State<ProfileOnboardingFlow> createState() => _ProfileOnboardingFlowState();
}

class _ProfileOnboardingFlowState extends State<ProfileOnboardingFlow> {
  final PageController _pageController = PageController();
  int _step = 0;
  static const int _totalSteps = 10;

  // ── Collected data ──────────────────────────────────────────────────────
  String _name = FirebaseAuth.instance.currentUser?.displayName ?? '';
  String _dob = '';
  String _gender = '';
  String _phone = '';
  String _email = FirebaseAuth.instance.currentUser?.email ?? '';
  String _educationLevel = '';
  String _currentCity = '';
  bool _openToRelocation = false;
  List<String> _preferredCities = [];
  List<String> _skills = [];
  List<String> _jobRoles = [];
  String _englishLevel = '';
  String _workStatus = '';
  String _profileSummary = '';
  String _companyName = '';
  String _jobTitle = '';
  bool _isCurrentJob = false;
  bool _currentlyPursuing = false;
  String _pursuingLevel = '';
  String _collegeName = '';
  String _degree = '';
  String _specialization = '';
  String _completionYear = '';

  final _nameCtrl = TextEditingController(
      text: FirebaseAuth.instance.currentUser?.displayName ?? '');
  final _dobCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _profileSummaryCtrl = TextEditingController();
  final _companyNameCtrl = TextEditingController();
  final _jobTitleCtrl = TextEditingController();
  final _citySearchCtrl = TextEditingController();
  final _skillSearchCtrl = TextEditingController();
  final _jobRoleSearchCtrl = TextEditingController();
  String _citySearchQuery = '';
  String _skillSearchQuery = '';
  String _jobRoleSearchQuery = '';

  // Indian cities list
  final List<String> _commonSkills = [
    'Communication', 'MS Office', 'Data Entry', 'Sales', 'Customer Service',
    'Accounting', 'Tally', 'Python', 'Java', 'React', 'Flutter',
    'Project Management', 'Leadership', 'Marketing', 'Content Writing',
    'Graphic Design', 'AutoCAD', 'Electrical', 'Mechanical', 'Civil',
    'Teaching', 'Nursing', 'HR Management', 'Logistics', 'Supply Chain',
  ];

  final List<String> _commonJobRoles = [
    'Software Developer', 'Web Developer', 'Data Analyst', 'HR Executive',
    'Sales Executive', 'Marketing Manager', 'Accountant', 'Teacher',
    'Nurse', 'Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer',
    'Content Writer', 'Graphic Designer', 'Business Analyst',
    'Operations Manager', 'Customer Support', 'Logistics Executive',
  ];

  static const _teal = Color(0xFF2D8C6B);

  @override
  void dispose() {
    _pageController.dispose();
    _nameCtrl.dispose();
    _dobCtrl.dispose();
    _phoneCtrl.dispose();
    _profileSummaryCtrl.dispose();
    _companyNameCtrl.dispose();
    _jobTitleCtrl.dispose();
    _citySearchCtrl.dispose();
    _skillSearchCtrl.dispose();
    _jobRoleSearchCtrl.dispose();
    super.dispose();
  }

  String? _validateStep(int step) {
    switch (step) {
      case 0:
        if (_name.trim().isEmpty) return 'Please enter your full name';
        if (_educationLevel.isEmpty) return 'Please select your education level';
        return null;
      case 1:
        if (_dob.isEmpty) return 'Please select your date of birth';
        if (_gender.isEmpty) return 'Please select your gender';
        if (_phone.trim().isEmpty) return 'Please enter your phone number';
        return null;
      case 2: // Profile Summary — optional
        return null;
      case 3:
        if (_workStatus.isEmpty) return 'Please select your work status';
        return null;
      case 4: // Work Experience — optional (fresher can skip)
        return null;
      case 5:
        // Education details — college name always required
        if (_collegeName.trim().isEmpty) return 'Please enter your college / school name';
        return null;
      case 6:
        if (_currentCity.isEmpty) return 'Please select your current city';
        return null;
      case 7:
        if (_skills.isEmpty) return 'Please select at least one skill';
        return null;
      case 8:
        if (_jobRoles.isEmpty) return 'Please select at least one preferred job role';
        return null;
      case 9:
        if (_englishLevel.isEmpty) return 'Please select your English proficiency level';
        return null;
      default:
        return null;
    }
  }

  void _showValidationError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(fontSize: 14))),
          ],
        ),
        backgroundColor: const Color(0xFFE53935),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _next() {
    final error = _validateStep(_step);
    if (error != null) {
      _showValidationError(error);
      return;
    }
    if (_step < _totalSteps - 1) {
      setState(() => _step++);
      _pageController.nextPage(
          duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _saveAndFinish();
    }
  }

  void _back() {
    if (_step > 0) {
      setState(() => _step--);
      _pageController.previousPage(
          duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    }
  }

  Future<void> _saveAndFinish() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;
    final data = <String, dynamic>{
      'name': _name,
      'dateOfBirth': _dob,
      'gender': _gender,
      'phone': _phone,
      'email': _email,
      'educationLevel': _educationLevel,
      'currentCity': _currentCity,
      'openToRelocation': _openToRelocation,
      'preferredCities': _preferredCities,
      'keySkills': _skills.join(', '),
      'preferredJobRoles': _jobRoles,
      'englishLevel': _englishLevel,
      'workStatus': _workStatus,
      'profileSummary': _profileSummary,
      'currentlyPursuing': _currentlyPursuing,
      'pursuingLevel': _pursuingLevel,
      'collegeName': _collegeName,
      'degree': _degree,
      'specialization': _specialization,
      'completionYear': _completionYear,
      'profileComplete': true,
    };
    // Save education as structured array for profile completion check
    if (_collegeName.trim().isNotEmpty) {
      data['educationHistory'] = [{
        'collegeName': _collegeName.trim(),
        'degree': _degree,
        'specialization': _specialization,
        'completionYear': _completionYear,
        'currentlyPursuing': _currentlyPursuing,
      }];
    }
    // Save work experience if provided
    if (_companyName.trim().isNotEmpty) {
      data['employmentHistory'] = [{
        'companyName': _companyName.trim(),
        'jobTitle': _jobTitle.trim(),
        'isCurrentCompany': _isCurrentJob,
        'employmentType': 'Full-Time',
      }];
    }
    await FirebaseFirestore.instance.collection('users').doc(uid).set(data, SetOptions(merge: true));
    if (mounted) {
      Navigator.pushReplacement(context,
          MaterialPageRoute(builder: (_) => const JobBoardHome()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) {
        if (didPop) return;
        // Allow previous step navigation but prevent exiting to login
        if (_step > 0) {
          _back();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF0F0F0),
        body: Column(
          children: [
            // Progress bar
            SafeArea(
              bottom: false,
              child: _buildProgressBar(),
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                // Step 0 – Name + Education Level
                _StepBasicName(name: _name, onChanged: (v) => setState(() => _name = v), ctrl: _nameCtrl, educationLevel: _educationLevel, onEduChanged: (v) => setState(() => _educationLevel = v)),
                // Step 1 – DOB, Gender, Phone
                _StepBasicDetails(name: _name, dob: _dob, gender: _gender, email: _email, phone: _phone, phoneCtrl: _phoneCtrl, onNameChanged: (v) => setState(() => _name = v), onDobChanged: (v) => setState(() => _dob = v), onGenderChanged: (v) => setState(() => _gender = v), onPhoneChanged: (v) => setState(() => _phone = v)),
                // Step 2 – Profile Summary (new)
                _StepProfileSummary(ctrl: _profileSummaryCtrl, onChanged: (v) => setState(() => _profileSummary = v)),
                // Step 3 – Work Status
                _StepWorkStatus(workStatus: _workStatus, onChanged: (v) => setState(() => _workStatus = v)),
                // Step 4 – Work Experience (new)
                _StepWorkExperience(companyNameCtrl: _companyNameCtrl, jobTitleCtrl: _jobTitleCtrl, isCurrentJob: _isCurrentJob, onCompanyChanged: (v) => setState(() => _companyName = v), onJobTitleChanged: (v) => setState(() => _jobTitle = v), onCurrentJobChanged: (v) => setState(() => _isCurrentJob = v)),
                // Step 5 – Education Details
                _StepEducationDetails(currentlyPursuing: _currentlyPursuing, pursuingLevel: _pursuingLevel, collegeName: _collegeName, degree: _degree, specialization: _specialization, completionYear: _completionYear, onPursuingChanged: (v) => setState(() => _currentlyPursuing = v), onLevelChanged: (v) => setState(() => _pursuingLevel = v), onCollegeChanged: (v) => setState(() => _collegeName = v), onDegreeChanged: (v) => setState(() => _degree = v), onSpecChanged: (v) => setState(() => _specialization = v), onYearChanged: (v) => setState(() => _completionYear = v)),
                // Step 6 – Location
                _StepLocation(currentCity: _currentCity, openToRelocation: _openToRelocation, preferredCities: _preferredCities, searchCtrl: _citySearchCtrl, searchQuery: _citySearchQuery, onSearchChanged: (v) => setState(() => _citySearchQuery = v), onCitySelected: (v) => setState(() => _currentCity = v), onRelocationChanged: (v) => setState(() => _openToRelocation = v), onPreferredCitiesChanged: (v) => setState(() => _preferredCities = v)),
                // Step 7 – Skills
                _StepSkills(selected: _skills, allSkills: _commonSkills, searchCtrl: _skillSearchCtrl, searchQuery: _skillSearchQuery, onSearchChanged: (v) => setState(() => _skillSearchQuery = v), onChanged: (v) => setState(() => _skills = v)),
                // Step 8 – Job Roles
                _StepJobRoles(selected: _jobRoles, allRoles: _commonJobRoles, searchCtrl: _jobRoleSearchCtrl, searchQuery: _jobRoleSearchQuery, onSearchChanged: (v) => setState(() => _jobRoleSearchQuery = v), onChanged: (v) => setState(() => _jobRoles = v)),
                // Step 9 – Language
                _StepLanguage(englishLevel: _englishLevel, onChanged: (v) => setState(() => _englishLevel = v)),
              ],
            ),
          ),
          // Next button
          _buildNextButton(),
        ],
      ),
      ),
    );
  }

  Widget _buildProgressBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Column(
        children: [
          Row(
            children: [
              if (_step > 0)
                GestureDetector(
                  onTap: _back,
                  child: const Icon(Icons.arrow_back, color: Colors.black87),
                ),
              if (_step > 0) const SizedBox(width: 12),
              Expanded(
                child: Text(
                  _stepTitle(_step),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (_step + 1) / _totalSteps,
              minHeight: 6,
              backgroundColor: const Color(0xFFD0D0D0),
              valueColor: const AlwaysStoppedAnimation<Color>(_teal),
            ),
          ),
        ],
      ),
    );
  }

  String _stepTitle(int step) {
    const titles = [
      'Basic Details', 'Basic Details', 'Profile Summary',
      'Experience Details', 'Work Experience', 'Education Details',
      'Location Details', 'Skills', 'Preferred Job Role', 'Preferred Language',
    ];
    return titles[step];
  }

  Widget _buildNextButton() {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _next,
            style: ElevatedButton.styleFrom(
              backgroundColor: _teal,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            child: Text(
              _step == _totalSteps - 1 ? 'Finish' : 'Next',
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Step helpers ──────────────────────────────────────────────────────────────
const _kTeal = Color(0xFF2D8C6B);
const _kTealLight = Color(0xFFE8F5F0);

/// A label with a red asterisk indicating a required field.
Widget _requiredLabel(String text, {double fontSize = 15}) => RichText(
  text: TextSpan(
    text: text,
    style: TextStyle(fontSize: fontSize, fontWeight: FontWeight.bold, color: Colors.black87),
    children: const [
      TextSpan(text: ' *', style: TextStyle(color: Color(0xFFE53935))),
    ],
  ),
);

Widget _onboardCard({required Widget child}) => Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(20),
      child: child,
    );

Widget _onboardChip(String label, bool selected,
    {required VoidCallback onTap}) {
  return GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      decoration: BoxDecoration(
        border: Border.all(
          color: selected ? _kTeal : const Color(0xFFD0D0D0),
          width: selected ? 1.5 : 1,
        ),
        borderRadius: BorderRadius.circular(24),
        color: selected ? _kTealLight : Colors.white,
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: selected ? _kTeal : Colors.black87,
        ),
      ),
    ),
  );
}

// Step 0 – Name + Education level
class _StepBasicName extends StatelessWidget {
  final String name;
  final ValueChanged<String> onChanged;
  final TextEditingController ctrl;
  final String educationLevel;
  final ValueChanged<String> onEduChanged;
  const _StepBasicName({required this.name, required this.onChanged, required this.ctrl, required this.educationLevel, required this.onEduChanged});

  static const _levels = ['10th or Below 10th', '12th Pass', 'Diploma', 'ITI', 'Graduate', 'Post Graduate'];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _onboardCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _requiredLabel('Tell us your full name', fontSize: 18),
                const SizedBox(height: 12),
                TextField(
                  controller: ctrl,
                  onChanged: onChanged,
                  decoration: InputDecoration(
                    hintText: 'Enter full name',
                    hintStyle: const TextStyle(color: Color(0xFF9E9E9E)),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                  ),
                ),
              ],
            ),
          ),
          _onboardCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _requiredLabel('What is your highest level of education?', fontSize: 16),
                const SizedBox(height: 4),
                const Text('Select highest education level even if not completed',
                    style: TextStyle(fontSize: 13, color: Color(0xFF9E9E9E))),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: _levels.map((l) => _onboardChip(l, educationLevel == l, onTap: () => onEduChanged(l))).toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Step 1 – Name, DOB, Gender, Email
class _StepBasicDetails extends StatelessWidget {
  final String name, dob, gender, email, phone;
  final TextEditingController phoneCtrl;
  final ValueChanged<String> onNameChanged, onDobChanged, onGenderChanged, onPhoneChanged;
  const _StepBasicDetails({required this.name, required this.dob, required this.gender, required this.email, required this.phone, required this.phoneCtrl, required this.onNameChanged, required this.onDobChanged, required this.onGenderChanged, required this.onPhoneChanged});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 24),
      child: _onboardCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _field('Name', child: TextField(
              controller: TextEditingController(text: name)..selection = TextSelection.collapsed(offset: name.length),
              onChanged: onNameChanged,
              decoration: _inputDec(''),
            )),
            const SizedBox(height: 16),
            _fieldWithRequired('Date of Birth (DOB)', child: TextField(
              readOnly: true,
              controller: TextEditingController(text: dob),
              decoration: _inputDec('Choose date').copyWith(
                suffixIcon: const Icon(Icons.calendar_today_outlined, size: 20),
              ),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime(2000),
                  firstDate: DateTime(1950),
                  lastDate: DateTime.now(),
                );
                if (picked != null) {
                  onDobChanged('${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}');
                }
              },
            )),
            const SizedBox(height: 16),
            _fieldWithRequired('Gender', child: Row(
              children: ['Male', 'Female'].map((g) => Padding(
                padding: const EdgeInsets.only(right: 10),
                child: _onboardChip(g, gender == g, onTap: () => onGenderChanged(g)),
              )).toList(),
            )),
            const SizedBox(height: 16),
            _field('Email Address', child: TextField(
              enabled: false,
              controller: TextEditingController(text: email),
              decoration: _inputDec(''),
            )),
            const SizedBox(height: 16),
            _fieldWithRequired('Phone Number', child: TextField(
              controller: phoneCtrl,
              onChanged: onPhoneChanged,
              keyboardType: TextInputType.phone,
              decoration: _inputDec('Enter your mobile number'),
            )),
          ],
        ),
      ),
    );
  }

  Widget _field(String label, {required Widget child}) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
      const SizedBox(height: 8),
      child,
    ],
  );

  Widget _fieldWithRequired(String label, {required Widget child}) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      _requiredLabel(label),
      const SizedBox(height: 8),
      child,
    ],
  );

  InputDecoration _inputDec(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: Color(0xFF9E9E9E)),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
    disabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
  );
}

// Step 2 – Work Status
class _StepWorkStatus extends StatelessWidget {
  final String workStatus;
  final ValueChanged<String> onChanged;
  const _StepWorkStatus({required this.workStatus, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 24),
      child: _onboardCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _requiredLabel('Confirm your work status', fontSize: 18),
            const SizedBox(height: 6),
            const Text('Choose your current work status to personalize your job search',
                style: TextStyle(fontSize: 13, color: Color(0xFF9E9E9E))),
            const SizedBox(height: 16),
            _workOption(context, 'working', Icons.work_outline, "I'm working/ I have work experience", 'excluding internships'),
            const SizedBox(height: 12),
            _workOption(context, 'fresher', Icons.person_outline, 'I am a fresher / student / Intern', "haven't worked after graduation."),
          ],
        ),
      ),
    );
  }

  Widget _workOption(BuildContext context, String value, IconData icon, String title, String sub) {
    final selected = workStatus == value;
    return GestureDetector(
      onTap: () => onChanged(value),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: selected ? _kTeal : const Color(0xFFD0D0D0)),
          borderRadius: BorderRadius.circular(12),
          color: selected ? _kTealLight : Colors.white,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: const Color(0xFFF0F0F0), borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text(sub, style: const TextStyle(fontSize: 12, color: Color(0xFF9E9E9E))),
                ],
              ),
            ),
            Radio<String>(
              value: value,
              groupValue: workStatus,
              onChanged: (v) => onChanged(v!),
              activeColor: _kTeal,
            ),
          ],
        ),
      ),
    );
  }
}

// Step 3 – Education Details
class _StepEducationDetails extends StatelessWidget {
  final bool currentlyPursuing;
  final String pursuingLevel, collegeName, degree, specialization, completionYear;
  final ValueChanged<bool> onPursuingChanged;
  final ValueChanged<String> onLevelChanged, onCollegeChanged, onDegreeChanged, onSpecChanged, onYearChanged;

  const _StepEducationDetails({required this.currentlyPursuing, required this.pursuingLevel, required this.collegeName, required this.degree, required this.specialization, required this.completionYear, required this.onPursuingChanged, required this.onLevelChanged, required this.onCollegeChanged, required this.onDegreeChanged, required this.onSpecChanged, required this.onYearChanged});

  static const _levels = ['10th or Below 10th', '12th Pass', 'Diploma', 'ITI', 'Graduate', 'Post Graduate'];
  static const _degrees = ['B.Tech', 'B.Sc', 'B.Com', 'B.A', 'M.Tech', 'M.Sc', 'M.Com', 'M.A', 'MBA', 'PhD', 'Diploma', 'Other'];
  static const _specs = ['Computer Science', 'Mechanical', 'Electrical', 'Civil', 'Electronics', 'Commerce', 'Arts', 'Science', 'Other'];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        children: [
          _onboardCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Are you currently pursuing your education?',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _onboardChip('Yes', currentlyPursuing, onTap: () => onPursuingChanged(true)),
                    const SizedBox(width: 10),
                    _onboardChip('No', !currentlyPursuing, onTap: () => onPursuingChanged(false)),
                  ],
                ),
              ],
            ),
          ),
          if (currentlyPursuing)
            _onboardCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('What are you currently pursuing?',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Wrap(spacing: 10, runSpacing: 10,
                    children: _levels.map((l) => _onboardChip(l, pursuingLevel == l, onTap: () => onLevelChanged(l))).toList()),
                ],
              ),
            ),
          // Always show education details
          _onboardCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  currentlyPursuing ? 'College / Institution Details' : 'Highest Education Details',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 14),
                _labelField(currentlyPursuing ? 'College / Institution Name *' : 'College / School Name *', TextField(
                  controller: TextEditingController(text: collegeName),
                  onChanged: onCollegeChanged,
                  decoration: _dec('e.g. St. Stephens College'),
                )),
                const SizedBox(height: 14),
                _labelField('Degree / Qualification', _dropdown(_degrees, degree, onDegreeChanged)),
                const SizedBox(height: 14),
                _labelField('Specialization', _dropdown(_specs, specialization, onSpecChanged)),
                const SizedBox(height: 14),
                _labelField(currentlyPursuing ? 'Expected Completion Year' : 'Completion Year', Row(
                  children: [
                    Expanded(child: _dropdown(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], '', (_) {})),
                    const SizedBox(width: 10),
                    Expanded(child: _dropdown(
                      List.generate(30, (i) => (DateTime.now().year - 10 + i).toString()),
                      completionYear, onYearChanged)),
                  ],
                )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _labelField(String label, Widget child) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)), const SizedBox(height: 8), child],
  );

  InputDecoration _dec(String hint) => InputDecoration(
    hintText: hint, hintStyle: const TextStyle(color: Color(0xFF9E9E9E)),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
  );

  Widget _dropdown(List<String> items, String value, ValueChanged<String> onChanged) =>
    DropdownButtonFormField<String>(
      value: value.isEmpty ? null : value,
      hint: const Text('Select an option', style: TextStyle(color: Color(0xFF9E9E9E), fontSize: 13)),
      decoration: InputDecoration(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
      icon: const Icon(Icons.keyboard_arrow_down, color: _kTeal),
      items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 13)))).toList(),
      onChanged: (v) { if (v != null) onChanged(v); },
    );
}

// Step 4 – Location
class _StepLocation extends StatefulWidget {
  final String currentCity;
  final bool openToRelocation;
  final List<String> preferredCities;
  final TextEditingController searchCtrl;
  final String searchQuery;
  final ValueChanged<String> onSearchChanged, onCitySelected;
  final ValueChanged<bool> onRelocationChanged;
  final ValueChanged<List<String>> onPreferredCitiesChanged;

  const _StepLocation({required this.currentCity, required this.openToRelocation, required this.preferredCities, required this.searchCtrl, required this.searchQuery, required this.onSearchChanged, required this.onCitySelected, required this.onRelocationChanged, required this.onPreferredCitiesChanged});

  @override
  State<_StepLocation> createState() => _StepLocationState();
}

class _StepLocationState extends State<_StepLocation> {
  bool _showCityPicker = false;
  List<String> _cities = [];
  bool _citiesLoading = true;
  bool _citiesError = false;

  @override
  void initState() {
    super.initState();
    _fetchCities();
  }

  Future<void> _fetchCities() async {
    setState(() { _citiesLoading = true; _citiesError = false; });
    try {
      final res = await http.post(
        Uri.parse('https://countriesnow.space/api/v0.1/countries/cities'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'country': 'India'}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        if (body['error'] == false) {
          final raw = (body['data'] as List).cast<String>();
          raw.sort();
          if (mounted) setState(() { _cities = raw; _citiesLoading = false; });
          return;
        }
      }
    } catch (_) {}
    if (mounted) setState(() { _citiesLoading = false; _citiesError = true; });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.currentCity.isEmpty) {
      return _buildPickCity();
    }
    if (_showCityPicker) {
      return _buildPreferredCitySheet();
    }
    return _buildLocationConfirmed();
  }

  Widget _buildPickCity() {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 24),
      child: _onboardCard(
        child: Column(
          children: [
            const SizedBox(height: 12),
            const Icon(Icons.location_on, size: 64, color: Color(0xFF5C4A8A)),
            const SizedBox(height: 16),
            const Text('Discover the best jobs near you',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                  color: const Color(0xFFF0F0F0), borderRadius: BorderRadius.circular(8)),
              child: const Text('Please share your current location',
                  style: TextStyle(fontSize: 13, color: Colors.black87)),
            ),
            const SizedBox(height: 8),
            const Text('This will help us find the best jobs for you in your current city or a nearby city',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Color(0xFF9E9E9E))),
            const SizedBox(height: 20),
            OutlinedButton(
              onPressed: () => _openSearchCity(context),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 48),
                side: const BorderSide(color: _kTeal),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Search City', style: TextStyle(color: _kTeal, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 10),
            ElevatedButton.icon(
              onPressed: () => _openSearchCity(context),
              icon: const Icon(Icons.my_location, size: 18, color: Colors.white),
              label: const Text('Pick current location', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              style: ElevatedButton.styleFrom(
                backgroundColor: _kTeal,
                minimumSize: const Size(double.infinity, 48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openSearchCity(BuildContext context) {
    final ctrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final q = ctrl.text.toLowerCase().trim();
          final filtered = q.isEmpty
              ? _cities
              : _cities.where((c) => c.toLowerCase().contains(q)).toList();
          return DraggableScrollableSheet(
            expand: false, initialChildSize: 0.85,
            builder: (_, scrollCtrl) => Column(
              children: [
                Padding(padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Expanded(child: Text('Select Your City', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold))),
                      IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                    ],
                  )),
                Padding(padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: ctrl,
                    autofocus: true,
                    onChanged: (_) => setModalState(() {}),
                    decoration: InputDecoration(
                      hintText: 'Search for a city',
                      prefixIcon: const Icon(Icons.location_on_outlined, color: Color(0xFF9E9E9E)),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                    ),
                  )),
                const SizedBox(height: 8),
                if (_citiesLoading)
                  const Expanded(child: Center(child: CircularProgressIndicator()))
                else if (_citiesError)
                  Expanded(child: Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.wifi_off, size: 40, color: Colors.grey),
                      const SizedBox(height: 12),
                      const Text('Could not load cities', style: TextStyle(color: Colors.grey)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: () { _fetchCities(); setModalState(() {}); }, child: const Text('Retry')),
                    ]),
                  ))
                else
                  Expanded(child: ListView.builder(
                    controller: scrollCtrl,
                    itemCount: filtered.length,
                    itemBuilder: (_, i) => ListTile(
                      leading: Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: const Color(0xFFF0F0F0), borderRadius: BorderRadius.circular(6)), child: const Icon(Icons.location_on_outlined, size: 18)),
                      title: Text(filtered[i]),
                      onTap: () {
                        widget.onCitySelected(filtered[i]);
                        Navigator.pop(ctx);
                      },
                    ),
                  )),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildLocationConfirmed() {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        children: [
          _onboardCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Current location', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('Your current city will help us find you the best jobs',
                    style: TextStyle(fontSize: 13, color: Color(0xFF9E9E9E))),
                const SizedBox(height: 14),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 32, color: Color(0xFF5C4A8A)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(widget.currentCity,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                          GestureDetector(
                            onTap: () => widget.onCitySelected(''),
                            child: const Text('Change', style: TextStyle(color: _kTeal, fontWeight: FontWeight.w600, fontSize: 13)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          _onboardCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Would you also like to explore jobs outside ${widget.currentCity}?',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('This may require you to relocate to other cities',
                    style: TextStyle(fontSize: 13, color: Color(0xFF9E9E9E))),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(child: _onboardChip('Yes', widget.openToRelocation, onTap: () {
                      widget.onRelocationChanged(true);
                      setState(() => _showCityPicker = true);
                    })),
                    const SizedBox(width: 12),
                    Expanded(child: _onboardChip('No', !widget.openToRelocation, onTap: () {
                      widget.onRelocationChanged(false);
                    })),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreferredCitySheet() {
    final q = widget.searchQuery.toLowerCase().trim();
    final filtered = (q.isEmpty ? _cities : _cities.where((c) => c.toLowerCase().contains(q)).toList())
        .where((c) => c != widget.currentCity)
        .toList();
    final suggested = filtered.take(3).toList();
    return Column(
      children: [
        Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Row(
            children: [
              IconButton(icon: const Icon(Icons.close), onPressed: () => setState(() => _showCityPicker = false)),
              const Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Add preferred job cities', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Text('Select upto 3 cities other than your current city', style: TextStyle(fontSize: 12, color: Color(0xFF9E9E9E))),
                ],
              )),
            ],
          )),
        Padding(padding: const EdgeInsets.all(16),
          child: TextField(
            controller: widget.searchCtrl,
            onChanged: widget.onSearchChanged,
            decoration: InputDecoration(
              hintText: 'Search for a city',
              prefixIcon: const Icon(Icons.location_on_outlined, color: Color(0xFF9E9E9E)),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
            ),
          )),
        // Selected chips
        if (widget.preferredCities.isNotEmpty)
          Padding(padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(spacing: 8, children: widget.preferredCities.map((c) =>
              Chip(label: Text(c, style: const TextStyle(color: _kTeal)), deleteIcon: const Icon(Icons.close, size: 14, color: _kTeal),
                backgroundColor: _kTealLight, side: const BorderSide(color: _kTeal),
                onDeleted: () {
                  final updated = List<String>.from(widget.preferredCities)..remove(c);
                  widget.onPreferredCitiesChanged(updated);
                })
            ).toList())),
        Expanded(child: ListView(
          children: [
            if (suggested.isNotEmpty) ...[  
              const Padding(padding: EdgeInsets.fromLTRB(16, 8, 16, 4), child: Text('Suggested cities', style: TextStyle(fontSize: 12, color: Color(0xFF9E9E9E)))),
              ...suggested.map((c) => _cityTile(c)),
              const Padding(padding: EdgeInsets.fromLTRB(16, 8, 16, 4), child: Text('All live cities', style: TextStyle(fontSize: 12, color: Color(0xFF9E9E9E)))),
            ],
            ...filtered.map((c) => _cityTile(c)),
          ],
        )),
        Padding(padding: const EdgeInsets.all(16),
          child: SizedBox(width: double.infinity, height: 50,
            child: ElevatedButton(
              onPressed: () => setState(() => _showCityPicker = false),
              style: ElevatedButton.styleFrom(backgroundColor: _kTeal, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0),
              child: const Text('Done', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
            ))),
      ],
    );
  }

  Widget _cityTile(String city) {
    final selected = widget.preferredCities.contains(city);
    return ListTile(
      leading: Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: const Color(0xFFF0F0F0), borderRadius: BorderRadius.circular(6)), child: const Icon(Icons.location_on_outlined, size: 18)),
      title: Text(city),
      trailing: Checkbox(
        value: selected, activeColor: _kTeal,
        side: const BorderSide(color: _kTeal),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        onChanged: (v) {
          final updated = List<String>.from(widget.preferredCities);
          if (v == true && updated.length < 3) updated.add(city);
          else updated.remove(city);
          widget.onPreferredCitiesChanged(updated);
        },
      ),
      onTap: () {
        final updated = List<String>.from(widget.preferredCities);
        if (selected) updated.remove(city);
        else if (updated.length < 3) updated.add(city);
        widget.onPreferredCitiesChanged(updated);
      },
    );
  }
}

// Step 5 – Skills
class _StepSkills extends StatelessWidget {
  final List<String> selected, allSkills;
  final TextEditingController searchCtrl;
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<List<String>> onChanged;
  const _StepSkills({required this.selected, required this.allSkills, required this.searchCtrl, required this.searchQuery, required this.onSearchChanged, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final q = searchQuery.toLowerCase();
    final filtered = allSkills.where((s) => s.toLowerCase().contains(q)).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _requiredLabel('What skills do you have?', fontSize: 18),
              const SizedBox(height: 4),
              const Text('Get noticed for the right job by adding your skills', style: TextStyle(fontSize: 13, color: Color(0xFF9E9E9E))),
              const SizedBox(height: 12),
              TextField(
                controller: searchCtrl, onChanged: onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'Search Skills',
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF9E9E9E)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                ),
              ),
              const SizedBox(height: 8),
              Wrap(spacing: 8, runSpacing: 8,
                children: selected.map((s) => Chip(
                  label: Text(s, style: const TextStyle(color: _kTeal, fontSize: 13)),
                  deleteIcon: const Icon(Icons.close, size: 14, color: _kTeal),
                  backgroundColor: _kTealLight, side: const BorderSide(color: _kTeal),
                  onDeleted: () {
                    final updated = List<String>.from(selected)..remove(s);
                    onChanged(updated);
                  },
                )).toList()),
            ],
          )),
        Expanded(
          child: Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const Text('✦', style: TextStyle(color: Colors.green, fontSize: 14)),
                  const SizedBox(width: 6),
                  const Text('AI Suggested skills', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 14)),
                ]),
                const SizedBox(height: 12),
                Expanded(child: ListView(
                  children: filtered.map((skill) {
                    final sel = selected.contains(skill);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: GestureDetector(
                        onTap: () {
                          final updated = List<String>.from(selected);
                          sel ? updated.remove(skill) : updated.add(skill);
                          onChanged(updated);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            border: Border.all(color: sel ? _kTeal : const Color(0xFFD0D0D0)),
                            borderRadius: BorderRadius.circular(24),
                            color: sel ? _kTealLight : Colors.white,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(skill, style: TextStyle(color: sel ? _kTeal : Colors.black87, fontWeight: FontWeight.w500)),
                              const SizedBox(width: 8),
                              Icon(sel ? Icons.check : Icons.add, size: 16, color: sel ? _kTeal : Colors.black54),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                )),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// Step 6 – Preferred Job Roles
class _StepJobRoles extends StatelessWidget {
  final List<String> selected, allRoles;
  final TextEditingController searchCtrl;
  final String searchQuery;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<List<String>> onChanged;
  const _StepJobRoles({required this.selected, required this.allRoles, required this.searchCtrl, required this.searchQuery, required this.onSearchChanged, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final q = searchQuery.toLowerCase();
    final filtered = allRoles.where((r) => r.toLowerCase().contains(q)).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _requiredLabel('What kind of job are you looking for?', fontSize: 18),
              const SizedBox(height: 8),
              if (selected.isNotEmpty)
                Wrap(spacing: 8, runSpacing: 8,
                  children: selected.take(2).map((r) => Chip(
                    label: Text(r, style: const TextStyle(color: _kTeal, fontSize: 13)),
                    deleteIcon: const Icon(Icons.close, size: 14, color: _kTeal),
                    backgroundColor: _kTealLight, side: const BorderSide(color: _kTeal),
                    onDeleted: () {
                      final updated = List<String>.from(selected)..remove(r);
                      onChanged(updated);
                    },
                  )).toList()),
              if (selected.length > 2)
                Text('${selected.length - 2} more roles ▾', style: const TextStyle(color: _kTeal, fontWeight: FontWeight.w600)),
              const SizedBox(height: 10),
              TextField(
                controller: searchCtrl, onChanged: onSearchChanged,
                decoration: InputDecoration(
                  hintText: 'Search by job title/role',
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF9E9E9E)),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                ),
              ),
            ],
          )),
        Expanded(
          child: Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const Text('✦', style: TextStyle(color: Colors.green, fontSize: 14)),
                  const SizedBox(width: 6),
                  const Text('AI suggested job roles', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 14)),
                ]),
                const SizedBox(height: 12),
                Expanded(child: ListView(
                  children: [
                    Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(border: Border.all(color: const Color(0xFFE0E0E0)), borderRadius: BorderRadius.circular(12)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [const Icon(Icons.circle, size: 10, color: Color(0xFF5C4A8A)), const SizedBox(width: 8), const Text('Roles matching your skills', style: TextStyle(fontWeight: FontWeight.bold))]),
                          const SizedBox(height: 10),
                          ...filtered.take(filtered.length ~/ 2 + 1).map((r) => _roleTile(r)),
                          const Divider(),
                          Row(children: [const Icon(Icons.circle, size: 10, color: Color(0xFF5C4A8A)), const SizedBox(width: 8), const Text('Roles based on your education', style: TextStyle(fontWeight: FontWeight.bold))]),
                          const SizedBox(height: 10),
                          ...filtered.skip(filtered.length ~/ 2 + 1).map((r) => _roleTile(r)),
                        ],
                      )),
                  ],
                )),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _roleTile(String role) {
    final sel = selected.contains(role);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () {
          final updated = List<String>.from(selected);
          sel ? updated.remove(role) : updated.add(role);
          onChanged(updated);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            border: Border.all(color: sel ? _kTeal : const Color(0xFFD0D0D0)),
            borderRadius: BorderRadius.circular(24),
            color: sel ? _kTealLight : Colors.white,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(role, style: TextStyle(color: sel ? _kTeal : Colors.black87, fontWeight: FontWeight.w500)),
              const SizedBox(width: 8),
              Icon(sel ? Icons.check : Icons.add, size: 16, color: sel ? _kTeal : Colors.black54),
            ],
          ),
        ),
      ),
    );
  }
}

// Step 7 – Language
class _StepLanguage extends StatelessWidget {
  final String englishLevel;
  final ValueChanged<String> onChanged;
  const _StepLanguage({required this.englishLevel, required this.onChanged});

  static const _levels = [
    ('No English', ''),
    ('Basic', 'You can understand/speak basic sentences'),
    ('Intermediate', 'You can have a conversation in English on some topics'),
    ('Advanced', 'You can do your entire job in English and speak fluently'),
  ];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 24),
      child: _onboardCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _requiredLabel('English Proficiency', fontSize: 15),
            const SizedBox(height: 14),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: _kTeal),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: _levels.map((lvl) {
                  final (label, desc) = lvl;
                  final selected = englishLevel == label;
                  return GestureDetector(
                    onTap: () => onChanged(label),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      child: Row(
                        children: [
                          Radio<String>(
                            value: label, groupValue: englishLevel,
                            onChanged: (v) => onChanged(v!),
                            activeColor: _kTeal,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(label, style: TextStyle(fontSize: 15, fontWeight: selected ? FontWeight.bold : FontWeight.normal)),
                                if (desc.isNotEmpty) Text(desc, style: const TextStyle(fontSize: 12, color: Color(0xFF9E9E9E))),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Onboarding Step: Profile Summary ─────────────────────────────────────────
class _StepProfileSummary extends StatelessWidget {
  final TextEditingController ctrl;
  final ValueChanged<String> onChanged;
  const _StepProfileSummary({required this.ctrl, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 24),
      child: _onboardCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('About Yourself', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.black87)),
            const SizedBox(height: 6),
            Text(
              'A short summary helps recruiters understand your background and career goals.',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: ctrl,
              onChanged: onChanged,
              maxLines: 6,
              maxLength: 500,
              decoration: InputDecoration(
                hintText: 'E.g. I am a software developer with 3 years of experience in Flutter and backend development, looking for growth opportunities...',
                hintStyle: const TextStyle(color: Color(0xFF9E9E9E), fontSize: 13),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: _kTeal)),
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 4),
            Text('Optional — you can fill this later from your profile.', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
          ],
        ),
      ),
    );
  }
}

// ── Onboarding Step: Work Experience ─────────────────────────────────────────
class _StepWorkExperience extends StatelessWidget {
  final TextEditingController companyNameCtrl, jobTitleCtrl;
  final bool isCurrentJob;
  final ValueChanged<String> onCompanyChanged, onJobTitleChanged;
  final ValueChanged<bool> onCurrentJobChanged;
  const _StepWorkExperience({required this.companyNameCtrl, required this.jobTitleCtrl, required this.isCurrentJob, required this.onCompanyChanged, required this.onJobTitleChanged, required this.onCurrentJobChanged});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.only(bottom: 24),
      child: _onboardCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Current / Most Recent Job', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text(
              'Add your current or last employer. You can add more from your profile later.',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 16),
            // Company Name
            const Text('Company Name', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(
              controller: companyNameCtrl,
              onChanged: onCompanyChanged,
              decoration: InputDecoration(
                hintText: 'e.g. Tata Consultancy Services',
                hintStyle: const TextStyle(color: Color(0xFF9E9E9E)),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: _kTeal)),
              ),
            ),
            const SizedBox(height: 16),
            // Job Title
            const Text('Job Title / Designation', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(
              controller: jobTitleCtrl,
              onChanged: onJobTitleChanged,
              decoration: InputDecoration(
                hintText: 'e.g. Software Developer',
                hintStyle: const TextStyle(color: Color(0xFF9E9E9E)),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: _kTeal)),
              ),
            ),
            const SizedBox(height: 16),
            // Currently working here toggle
            GestureDetector(
              onTap: () => onCurrentJobChanged(!isCurrentJob),
              child: Row(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: 22, height: 22,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: isCurrentJob ? _kTeal : Colors.grey.shade400, width: 2),
                      color: isCurrentJob ? _kTeal : Colors.transparent,
                    ),
                    child: isCurrentJob ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                  ),
                  const SizedBox(width: 10),
                  const Text('I currently work here', style: TextStyle(fontSize: 14)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: const Color(0xFFF0FDF4), borderRadius: BorderRadius.circular(8)),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, size: 16, color: _kTeal),
                  const SizedBox(width: 8),
                  Expanded(child: Text('Fresher? Leave company name blank and tap Next to skip.', style: TextStyle(fontSize: 12, color: Colors.grey.shade700))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Profile Summary Screen
class ProfileSummaryScreen extends StatefulWidget {
  const ProfileSummaryScreen({super.key});

  @override
  State<ProfileSummaryScreen> createState() => _ProfileSummaryScreenState();
}

class _ProfileSummaryScreenState extends State<ProfileSummaryScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  late TextEditingController _summaryController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _summaryController = TextEditingController();
    _loadSummary();
  }

  Future<void> _loadSummary() async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        setState(() {
          _summaryController.text = data['profileSummary'] ?? '';
        });
      }
    } catch (e) {
      print('Error loading summary: $e');
    }
  }

  Future<void> _saveSummary() async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      setState(() => _isLoading = true);
      
      await _firestore.collection('users').doc(user.uid).set({
        'profileSummary': _summaryController.text.trim(),
      }, SetOptions(merge: true));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile summary saved successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving summary: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _summaryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(Icons.arrow_back, color: Colors.black),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Profile Summary',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                const Text('Summary', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                TextField(
                  controller: _summaryController,
                  maxLines: 5,
                  decoration: InputDecoration(
                    hintText: 'Write your professional summary...',
                    filled: true,
                    fillColor: const Color(0xFFEEF2F7),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _saveSummary,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Save',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Professional Details Screen
class ProfessionalDetailsScreen extends StatefulWidget {
  const ProfessionalDetailsScreen({super.key});

  @override
  State<ProfessionalDetailsScreen> createState() => _ProfessionalDetailsScreenState();
}

class _ProfessionalDetailsScreenState extends State<ProfessionalDetailsScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  late TextEditingController _industryController;
  late TextEditingController _departmentController;
  late TextEditingController _roleController;
  late TextEditingController _jobRoleController;
  
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _industryController = TextEditingController();
    _departmentController = TextEditingController();
    _roleController = TextEditingController();
    _jobRoleController = TextEditingController();
    _loadData();
  }

  Future<void> _loadData() async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        setState(() {
          _industryController.text = data['industry'] ?? '';
          _departmentController.text = data['department'] ?? '';
          _roleController.text = data['currentRole'] ?? '';
          _jobRoleController.text = data['jobRole'] ?? '';
        });
      }
    } catch (e) {
      print('Error loading data: $e');
    }
  }

  Future<void> _saveData() async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      setState(() => _isLoading = true);
      
      await _firestore.collection('users').doc(user.uid).set({
        'industry': _industryController.text.trim(),
        'department': _departmentController.text.trim(),
        'currentRole': _roleController.text.trim(),
        'jobRole': _jobRoleController.text.trim(),
      }, SetOptions(merge: true));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Professional details saved successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving details: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _industryController.dispose();
    _departmentController.dispose();
    _roleController.dispose();
    _jobRoleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(Icons.arrow_back, color: Colors.black),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Professional Details',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _buildField('Current Industry', _industryController, 'Enter industry'),
                const SizedBox(height: 20),
                _buildField('Current Department', _departmentController, 'Enter department'),
                const SizedBox(height: 20),
                _buildField('Current Role Category', _roleController, 'Enter role'),
                const SizedBox(height: 20),
                _buildField('Current Job Role', _jobRoleController, 'Enter job role'),
                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _saveData,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Save',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, String hint) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
        const SizedBox(height: 10),
        TextField(
          controller: controller,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: const Color(0xFFEEF2F7),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }
}

// Education Screen
class EducationScreen extends StatefulWidget {
  const EducationScreen({super.key});

  @override
  State<EducationScreen> createState() => _EducationScreenState();
}

class _EducationScreenState extends State<EducationScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  late TextEditingController _schoolController;
  late TextEditingController _degreeController;
  late TextEditingController _fieldController;
  
  bool _isLoading = false;
  List<Map<String, dynamic>> _educationRecords = [];

  @override
  void initState() {
    super.initState();
    _schoolController = TextEditingController();
    _degreeController = TextEditingController();
    _fieldController = TextEditingController();
    _loadData();
  }

  Future<void> _loadData() async {
    final user = _auth.currentUser;
    if (user == null) return;
    try {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        setState(() {
          if (data['educationHistory'] != null && (data['educationHistory'] as List).isNotEmpty) {
            _educationRecords = List<Map<String, dynamic>>.from(
              (data['educationHistory'] as List).map((e) => Map<String, dynamic>.from(e as Map)));
          } else {
            // Populate from onboarding fields
            final college = data['collegeName'] ?? data['school'] ?? '';
            final degree = data['degree'] ?? data['pursuingLevel'] ?? data['educationLevel'] ?? '';
            final spec = data['specialization'] ?? data['fieldOfStudy'] ?? '';
            final year = data['completionYear'] ?? '';
            if (college.isNotEmpty || degree.isNotEmpty) {
              _educationRecords = [{
                'school': college,
                'degree': degree,
                'fieldOfStudy': spec,
                'completionYear': year,
                'currentlyPursuing': data['currentlyPursuing'] ?? false,
              }];
            }
          }
        });
      }
    } catch (e) {
      print('Error loading data: $e');
    }
  }

  Future<void> _saveData() async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      setState(() => _isLoading = true);
      
      // Add current form data to records if school is not empty
      final allRecords = List<Map<String, dynamic>>.from(_educationRecords);
      if (_schoolController.text.trim().isNotEmpty) {
        allRecords.add({
          'school': _schoolController.text.trim(),
          'degree': _degreeController.text.trim(),
          'fieldOfStudy': _fieldController.text.trim(),
        });
      }

      if (allRecords.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please add at least one education record'),
            backgroundColor: Colors.orange,
          ),
        );
        setState(() => _isLoading = false);
        return;
      }

      await _firestore.collection('users').doc(user.uid).set({
        'educationHistory': allRecords,
      }, SetOptions(merge: true));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Education details saved successfully'),
            backgroundColor: Colors.green,
          ),
        );
        // Reset form after successful save
        setState(() {
          _educationRecords.clear();
          _schoolController.clear();
          _degreeController.clear();
          _fieldController.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving details: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _schoolController.dispose();
    _degreeController.dispose();
    _fieldController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(Icons.arrow_back, color: Colors.black),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Education',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _buildField('School/University', _schoolController, 'Enter school/university'),
                const SizedBox(height: 20),
                _buildField('Degree', _degreeController, 'Enter degree'),
                const SizedBox(height: 20),
                _buildField('Field of Study', _fieldController, 'Enter field of study'),
                const SizedBox(height: 32),
                Center(
                  child: GestureDetector(
                    onTap: () async {
                      if (_schoolController.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Please enter school/university name'),
                            backgroundColor: Colors.orange,
                          ),
                        );
                        return;
                      }
                      
                      final newRecord = {
                        'school': _schoolController.text.trim(),
                        'degree': _degreeController.text.trim(),
                        'fieldOfStudy': _fieldController.text.trim(),
                      };
                      
                      setState(() {
                        _educationRecords.add(newRecord);
                        _schoolController.clear();
                        _degreeController.clear();
                        _fieldController.clear();
                      });
                      
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Education record added'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFF2563EB), width: 2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.add, color: Color(0xFF2563EB), size: 20),
                          const SizedBox(width: 8),
                          const Text(
                            'Add More',
                            style: TextStyle(
                              color: Color(0xFF2563EB),
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (_educationRecords.isNotEmpty) ...[
                  const SizedBox(height: 32),
                  const Text(
                    'Education Records',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _educationRecords.length,
                    itemBuilder: (context, index) {
                      final record = _educationRecords[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    record['school'] ?? '',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF1F2937),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    [record['degree'], record['fieldOfStudy']].where((v) => v != null && v.toString().isNotEmpty).join(', '),
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                                  ),
                                  if ((record['completionYear'] ?? '').isNotEmpty) ...[  
                                    const SizedBox(height: 4),
                                    Text('Expected: ${record['completionYear']}', style: const TextStyle(fontSize: 11, color: Color(0xFF9E9E9E))),
                                  ],
                                  if (record['currentlyPursuing'] == true) ...[  
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(color: const Color(0xFFE8F5F0), borderRadius: BorderRadius.circular(10)),
                                      child: const Text('Currently Pursuing', style: TextStyle(fontSize: 10, color: Color(0xFF2D8C6B), fontWeight: FontWeight.w600)),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                setState(() => _educationRecords.removeAt(index));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Record deleted'),
                                    backgroundColor: Colors.grey,
                                  ),
                                );
                              },
                              child: const Icon(
                                Icons.delete_outline,
                                color: Color(0xFFEF4444),
                                size: 20,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _saveData,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Save',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, String hint) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
        const SizedBox(height: 10),
        TextField(
          controller: controller,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: const Color(0xFFEEF2F7),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }
}

// Projects Screen
class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  late TextEditingController _projectNameController;
  late TextEditingController _descriptionController;
  
  bool _isLoading = false;
  List<Map<String, dynamic>> _projectRecords = [];

  @override
  void initState() {
    super.initState();
    _projectNameController = TextEditingController();
    _descriptionController = TextEditingController();
    _loadData();
  }

  Future<void> _loadData() async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        setState(() {
          if (data['projectHistory'] != null) {
            _projectRecords = List<Map<String, dynamic>>.from(
              (data['projectHistory'] as List).map((e) => Map<String, dynamic>.from(e as Map))
            );
          } else {
            if (data['projectName'] != null && data['projectName'].toString().isNotEmpty) {
              _projectRecords = [{
                'projectName': data['projectName'] ?? '',
                'projectDescription': data['projectDescription'] ?? '',
              }];
            }
          }
        });
      }
    } catch (e) {
      print('Error loading data: $e');
    }
  }

  Future<void> _saveData() async {
    final user = _auth.currentUser;
    if (user == null) return;

    try {
      setState(() => _isLoading = true);
      
      final allRecords = List<Map<String, dynamic>>.from(_projectRecords);
      if (_projectNameController.text.trim().isNotEmpty) {
        allRecords.add({
          'projectName': _projectNameController.text.trim(),
          'projectDescription': _descriptionController.text.trim(),
        });
      }

      if (allRecords.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please add at least one project'),
            backgroundColor: Colors.orange,
          ),
        );
        setState(() => _isLoading = false);
        return;
      }

      await _firestore.collection('users').doc(user.uid).set({
        'projectHistory': allRecords,
      }, SetOptions(merge: true));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Project details saved successfully'),
            backgroundColor: Colors.green,
          ),
        );
        setState(() {
          _projectRecords.clear();
          _projectNameController.clear();
          _descriptionController.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving details: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _projectNameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 16),
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE5E7EB),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(Icons.arrow_back, color: Colors.black),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Projects',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _buildField('Project Name', _projectNameController, 'Enter project name'),
                const SizedBox(height: 20),
                const Text('Description', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                const SizedBox(height: 10),
                TextField(
                  controller: _descriptionController,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: 'Enter project description...',
                    filled: true,
                    fillColor: const Color(0xFFEEF2F7),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
                const SizedBox(height: 32),
                Center(
                  child: GestureDetector(
                    onTap: () async {
                      if (_projectNameController.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Please enter project name'),
                            backgroundColor: Colors.orange,
                          ),
                        );
                        return;
                      }
                      
                      final newRecord = {
                        'projectName': _projectNameController.text.trim(),
                        'projectDescription': _descriptionController.text.trim(),
                      };
                      
                      setState(() {
                        _projectRecords.add(newRecord);
                        _projectNameController.clear();
                        _descriptionController.clear();
                      });
                      
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Project added'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFF2563EB), width: 2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.add, color: Color(0xFF2563EB), size: 20),
                          const SizedBox(width: 8),
                          const Text(
                            'Add More',
                            style: TextStyle(
                              color: Color(0xFF2563EB),
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (_projectRecords.isNotEmpty) ...[
                  const SizedBox(height: 32),
                  const Text(
                    'Projects Added',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _projectRecords.length,
                    itemBuilder: (context, index) {
                      final record = _projectRecords[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    record['projectName'] ?? '',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF1F2937),
                                    ),
                                  ),
                                  if ((record['projectDescription'] ?? '').isNotEmpty) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      record['projectDescription'] ?? '',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF6B7280),
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                setState(() => _projectRecords.removeAt(index));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Project deleted'),
                                    backgroundColor: Colors.grey,
                                  ),
                                );
                              },
                              child: const Icon(
                                Icons.delete_outline,
                                color: Color(0xFFEF4444),
                                size: 20,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _saveData,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text(
                            'Save',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController controller, String hint) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
        const SizedBox(height: 10),
        TextField(
          controller: controller,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: const Color(0xFFEEF2F7),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }
}

// Key Skills Screen
class KeySkillsScreen extends StatefulWidget {
  const KeySkillsScreen({super.key});

  @override
  State<KeySkillsScreen> createState() => _KeySkillsScreenState();
}

class _KeySkillsScreenState extends State<KeySkillsScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  late TextEditingController _addCtrl;
  List<String> _skills = [];
  bool _isLoading = false;
  static const _teal = Color(0xFF2D8C6B);
  static const _tealLight = Color(0xFFE8F5F0);

  @override
  void initState() {
    super.initState();
    _addCtrl = TextEditingController();
    _loadData();
  }

  Future<void> _loadData() async {
    final user = _auth.currentUser;
    if (user == null) return;
    try {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        // Support both List (from onboarding) and comma-separated string
        final raw = data['keySkills'];
        List<String> parsed = [];
        if (raw is List) {
          parsed = List<String>.from(raw.map((e) => e.toString()));
        } else if (raw is String && raw.isNotEmpty) {
          parsed = raw.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
        }
        setState(() => _skills = parsed);
      }
    } catch (e) {
      print('Error loading skills: $e');
    }
  }

  Future<void> _saveData() async {
    final user = _auth.currentUser;
    if (user == null) return;
    try {
      setState(() => _isLoading = true);
      await _firestore.collection('users').doc(user.uid).set({
        'keySkills': _skills.join(', '),
      }, SetOptions(merge: true));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Skills saved'), backgroundColor: Colors.green));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _addSkill(String s) {
    final trimmed = s.trim();
    if (trimmed.isNotEmpty && !_skills.contains(trimmed)) {
      setState(() { _skills.add(trimmed); _addCtrl.clear(); });
    }
  }

  @override
  void dispose() {
    _addCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(width: 40, height: 40,
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                      child: const Icon(Icons.arrow_back, color: Colors.black)),
                  ),
                  const SizedBox(width: 12),
                  const Text('Key Skills', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Add skill row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _addCtrl,
                      onSubmitted: _addSkill,
                      decoration: InputDecoration(
                        hintText: 'Add a skill (e.g. Python)',
                        hintStyle: const TextStyle(color: Color(0xFF9E9E9E)),
                        filled: true, fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD0D0D0))),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: () => _addSkill(_addCtrl.text),
                    child: Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(color: _teal, borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.add, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Skills chips
            Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                child: _skills.isEmpty
                    ? const Center(child: Text('No skills added yet.\nAdd skills above.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF9E9E9E))))
                    : Wrap(
                        spacing: 8, runSpacing: 8,
                        children: _skills.map((s) => Chip(
                          label: Text(s, style: const TextStyle(color: _teal, fontWeight: FontWeight.w500)),
                          deleteIcon: const Icon(Icons.close, size: 15, color: _teal),
                          backgroundColor: _tealLight,
                          side: const BorderSide(color: _teal),
                          onDeleted: () => setState(() => _skills.remove(s)),
                        )).toList(),
                      ),
              ),
            ),
            // Save button
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: SizedBox(
                width: double.infinity, height: 52,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveData,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _teal,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                      : const Text('Save Skills', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProfileScreen extends StatefulWidget {
  final VoidCallback? onBackPressed;
  
  const ProfileScreen({super.key, this.onBackPressed});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  bool _isLoading = false;
  bool _imageUploading = false;
  double _profileCompletion = 0.0;
  // Onboarding data shown in header
  String _firestoreName = '';
  String _firestoreCity = '';
  String _firestoreEducation = '';
  String _firestoreWorkStatus = '';
  String _photoUrl = '';

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _pickAndUploadImage() async {
    final picker = ImagePicker();
    // Show bottom sheet to choose source
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, 12),
              child: Text('Update Profile Photo',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined, color: Color(0xFF2D8C6B)),
              title: const Text('Take Photo'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined, color: Color(0xFF2D8C6B)),
              title: const Text('Choose from Gallery'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            if (_photoUrl.isNotEmpty)
              ListTile(
                leading: const Icon(Icons.delete_outline, color: Colors.red),
                title: const Text('Remove Photo', style: TextStyle(color: Colors.red)),
                onTap: () => Navigator.pop(context, null),
              ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );

    // null means remove photo
    if (source == null && _photoUrl.isNotEmpty) {
      // Remove photo
      try {
        setState(() => _imageUploading = true);
        final user = _auth.currentUser;
        if (user == null) return;
        await _firestore.collection('users').doc(user.uid).update({'photoUrl': ''});
        await user.updatePhotoURL(null);
        setState(() => _photoUrl = '');
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile photo removed'), backgroundColor: Colors.green));
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      } finally {
        if (mounted) setState(() => _imageUploading = false);
      }
      return;
    }

    if (source == null) return;

    final XFile? picked = await picker.pickImage(
        source: source, maxWidth: 600, maxHeight: 600, imageQuality: 85);
    if (picked == null) return;

    try {
      setState(() => _imageUploading = true);
      final user = _auth.currentUser;
      if (user == null) return;
      final ref = FirebaseStorage.instance
          .ref()
          .child('profile_photos')
          .child('${user.uid}.jpg');
      await ref.putFile(File(picked.path));
      final url = await ref.getDownloadURL();
      await _firestore.collection('users').doc(user.uid).update({'photoUrl': url});
      await user.updatePhotoURL(url);
      setState(() => _photoUrl = url);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile photo updated!'), backgroundColor: Colors.green));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Upload failed: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _imageUploading = false);
    }
  }

  Future<void> _loadProfileData() async {
    final user = _auth.currentUser;
    if (user == null) return;
    try {
      final doc = await _firestore.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        int completedFields = 0;
        const int totalFields = 10;
        if ((data['name'] ?? data['firstName'] ?? '').isNotEmpty) completedFields++;
        if ((data['dateOfBirth'] ?? '').isNotEmpty) completedFields++;
        if ((data['gender'] ?? '').isNotEmpty) completedFields++;
        if ((data['phone'] ?? '').isNotEmpty) completedFields++;
        if ((data['currentCity'] ?? data['location'] ?? '').isNotEmpty) completedFields++;
        if ((data['profileSummary'] ?? '').isNotEmpty) completedFields++;
        if ((data['employmentHistory'] ?? []).isNotEmpty || (data['companyName'] ?? '').isNotEmpty) completedFields++;
        if ((data['educationHistory'] ?? []).isNotEmpty || (data['collegeName'] ?? data['school'] ?? '').isNotEmpty) completedFields++;
        if ((data['keySkills'] ?? '').isNotEmpty) completedFields++;
        if ((data['preferredJobRoles'] ?? []).isNotEmpty) completedFields++;
        final completion = (completedFields / totalFields) * 100;
        setState(() {
          _profileCompletion = completion;
          _firestoreName = data['name'] ?? data['firstName'] ?? '';
          _firestoreCity = data['currentCity'] ?? data['location'] ?? '';
          _firestoreEducation = data['educationLevel'] ?? '';
          _firestoreWorkStatus = data['workStatus'] ?? '';
          _photoUrl = (data['photoUrl'] ?? '').toString().isNotEmpty
              ? data['photoUrl']
              : (FirebaseAuth.instance.currentUser?.photoURL ?? '');
        });
        if (completion < 60 && mounted) _showIncompleteProfileDialog(completion.toInt());
      }
    } catch (e) {
      print('Error loading profile: $e');
    }
  }

  void _showIncompleteProfileDialog(int completionPercentage) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: const Text('Complete Your Profile'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Your profile is only $completionPercentage% complete.',
              style: const TextStyle(fontSize: 14, color: Color(0xFF374151)),
            ),
            const SizedBox(height: 12),
            const Text(
              'Complete your profile to get better job recommendations and increase visibility to employers.',
              style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: completionPercentage / 100,
              minHeight: 8,
              backgroundColor: const Color(0xFFE5E7EB),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF2563EB)),
            ),
            const SizedBox(height: 8),
            Text(
              '$completionPercentage% Complete',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF2563EB),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Later'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Stay on profile screen to edit
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
            ),
            child: const Text(
              'Complete Now',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _logout() async {
    try {
      setState(() => _isLoading = true);
      await _auth.signOut();

      if (mounted) {
        // Clear entire navigation stack so back button can't return to the app
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(
            builder: (context) => const WelcomeScreen(),
          ),
          (route) => false,
        );
      }
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Logout failed: ${e.message}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _auth.currentUser;
    final displayName = _firestoreName.isNotEmpty ? _firestoreName : (user?.displayName ?? 'User');
    final userEmail = user?.email ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () {
                        if (widget.onBackPressed != null) {
                          widget.onBackPressed!();
                        } else {
                          Navigator.pop(context);
                        }
                      },
                      child: Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
                        child: const Icon(Icons.arrow_back, color: Colors.black),
                      ),
                    ),
                    const Text('Profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
                    const SizedBox(width: 40),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Profile card header
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                child: Column(
                  children: [
                    Row(
                      children: [
                        GestureDetector(
                          onTap: _pickAndUploadImage,
                          child: Stack(
                            alignment: Alignment.bottomRight,
                            children: [
                              Container(
                                width: 70, height: 70,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE5E7EB),
                                  borderRadius: BorderRadius.circular(35),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(35),
                                  child: _imageUploading
                                      ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                                      : _photoUrl.isNotEmpty
                                          ? Image.network(_photoUrl, fit: BoxFit.cover,
                                              errorBuilder: (_, __, ___) => const Icon(Icons.person, size: 40, color: Color(0xFF6B7280)))
                                          : const Icon(Icons.person, size: 40, color: Color(0xFF6B7280)),
                                ),
                              ),
                              Container(
                                width: 22, height: 22,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF2D8C6B),
                                  borderRadius: BorderRadius.circular(11),
                                  border: Border.all(color: Colors.white, width: 2)),
                                child: const Icon(Icons.edit, size: 12, color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(displayName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
                              if (_firestoreWorkStatus.isNotEmpty) ...[const SizedBox(height: 2),
                                Text(_firestoreWorkStatus == 'fresher' ? 'Fresher / Student' : 'Working Professional',
                                    style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)))],
                              const SizedBox(height: 2),
                              Text(userEmail, style: const TextStyle(fontSize: 12, color: Color(0xFF9E9E9E))),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (_firestoreCity.isNotEmpty || _firestoreEducation.isNotEmpty) ...[  
                      const SizedBox(height: 14),
                      const Divider(height: 1, color: Color(0xFFF0F0F0)),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          if (_firestoreCity.isNotEmpty) Expanded(
                            child: Row(
                              children: [
                                const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF9E9E9E)),
                                const SizedBox(width: 4),
                                Flexible(child: Text(_firestoreCity, style: const TextStyle(fontSize: 13, color: Color(0xFF374151)))),
                              ],
                            ),
                          ),
                          if (_firestoreEducation.isNotEmpty) Expanded(
                            child: Row(
                              children: [
                                const Icon(Icons.school_outlined, size: 14, color: Color(0xFF9E9E9E)),
                                const SizedBox(width: 4),
                                Flexible(child: Text(_firestoreEducation, style: const TextStyle(fontSize: 13, color: Color(0xFF374151)))),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 14),
                    const Divider(height: 1, color: Color(0xFFF0F0F0)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${_profileCompletion.toInt()}% Profile complete', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                              const SizedBox(height: 6),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: _profileCompletion / 100,
                                  minHeight: 6,
                                  backgroundColor: const Color(0xFFE5E7EB),
                                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF2D8C6B)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Section label
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Text('Profile Details', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF6B7280))),
              ),
              const SizedBox(height: 8),
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                child: Column(
                  children: [
                    _buildSectionTile(Icons.person_outline, 'Basic Details', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BasicDetailsScreen())), isFirst: true),
                    _buildSectionTile(Icons.description_outlined, 'Profile Summary', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileSummaryScreen()))),
                    _buildSectionTile(Icons.business_center_outlined, 'Professional Details', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfessionalDetailsScreen()))),
                    _buildSectionTile(Icons.work_outline, 'Employment', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EmploymentScreen()))),
                    _buildSectionTile(Icons.school_outlined, 'Education', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EducationScreen()))),
                    _buildSectionTile(Icons.folder_open_outlined, 'Projects', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProjectsScreen()))),
                    _buildSectionTile(Icons.bolt_outlined, 'Key Skills', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const KeySkillsScreen())), isLast: true),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Logout button
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _logout,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFEF4444),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isLoading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                        : const Text('Logout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTile(IconData icon, String title, VoidCallback onTap, {bool isFirst = false, bool isLast = false}) {
    return Column(
      children: [
        if (!isFirst) const Divider(height: 1, indent: 56, color: Color(0xFFF0F0F0)),
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.vertical(
            top: isFirst ? const Radius.circular(16) : Radius.zero,
            bottom: isLast ? const Radius.circular(16) : Radius.zero,
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(color: const Color(0xFFE8F5F0), borderRadius: BorderRadius.circular(10)),
                  child: Icon(icon, color: const Color(0xFF2D8C6B), size: 18),
                ),
                const SizedBox(width: 14),
                Expanded(child: Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: Color(0xFF1F2937)))),
                const Icon(Icons.chevron_right, color: Color(0xFF9CA3AF), size: 20),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class JobDetailsScreen extends StatefulWidget {
  final String jobId;
  final String companyId;
  final String title;
  final String company;
  final String location;
  final String rating;
  final List<String> badges;
  final String posted_days_ago;
  final String salary;
  final String description;
  final String experience;
  final String category;
  final String currency;

  const JobDetailsScreen({
    super.key,
    this.jobId = '',
    this.companyId = '',
    required this.title,
    required this.company,
    required this.location,
    required this.rating,
    required this.badges,
    required this.posted_days_ago,
    this.salary = '',
    this.description = '',
    this.experience = '',
    this.category = '',
    this.currency = '₹',
  });

  @override
  State<JobDetailsScreen> createState() => _JobDetailsScreenState();
}

class _JobDetailsScreenState extends State<JobDetailsScreen> {
  int _selectedTabIndex = 0;
  bool _isBookmarked = false;
  bool _isApplying = false;
  bool _hasApplied = false;
  String _applicationId = '';

  @override
  void initState() {
    super.initState();
    _checkBookmark();
    _checkIfApplied();
  }

  Future<void> _checkIfApplied() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null || widget.jobId.isEmpty) return;
    try {
      final snap = await FirebaseFirestore.instance
          .collection('applications')
          .where('userId', isEqualTo: user.uid)
          .where('jobId', isEqualTo: widget.jobId)
          .limit(1)
          .get();
      if (snap.docs.isNotEmpty && mounted) {
        setState(() {
          _hasApplied = true;
          _applicationId = snap.docs.first.id;
        });
      }
    } catch (_) {}
  }

  Future<void> _checkBookmark() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null || widget.jobId.isEmpty) return;
    final doc = await FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .collection('bookmarks')
        .doc(widget.jobId)
        .get();
    if (mounted) setState(() => _isBookmarked = doc.exists);
  }

  Future<void> _toggleBookmark() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final ref = FirebaseFirestore.instance
        .collection('users')
        .doc(user.uid)
        .collection('bookmarks')
        .doc(widget.jobId);
    if (_isBookmarked) {
      await ref.delete();
    } else {
      await ref.set({
        'jobId': widget.jobId,
        'companyId': widget.companyId,
        'title': widget.title,
        'company': widget.company,
        'location': widget.location,
        'rating': widget.rating,
        'badges': widget.badges,
        'salary': widget.salary,
        'currency': widget.currency,
        'description': widget.description,
        'experience': widget.experience,
        'category': widget.category,
        'savedAt': FieldValue.serverTimestamp(),
      });
    }
    if (mounted) {
      setState(() => _isBookmarked = !_isBookmarked);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_isBookmarked ? 'Job saved!' : 'Bookmark removed'),
        duration: const Duration(seconds: 1),
      ));
    }
  }

  Future<void> _applyForJob() async {
    setState(() => _isApplying = true);
    try {
      final user = FirebaseAuth.instance.currentUser;
      // 1. Public doc — no sensitive fields (safe to appear in Network tab)
      final appRef = await FirebaseFirestore.instance.collection('applications').add({
        'jobId': widget.jobId,
        'companyId': widget.companyId,
        'jobTitle': widget.title,
        'company': widget.company,
        'location': widget.location,
        'salary': widget.salary,
        'currency': widget.currency,
        'badges': widget.badges,
        'userId': user?.uid ?? 'anonymous',
        'applicantName': user?.displayName ?? user?.email?.split('@').first ?? 'Applicant',
        'status': 'Applied',
        'appliedAt': DateTime.now().toIso8601String(),
      });
      // 2. Sensitive doc — same ID, separate collection (only fetched after payment)
      await FirebaseFirestore.instance.collection('applicationContacts').doc(appRef.id).set({
        'applicationId': appRef.id,
        'jobId': widget.jobId,
        'companyId': widget.companyId,
        'applicantEmail': user?.email ?? '',
        'applicantPhone': '',
        'resume': '',
        'coverLetter': '',
      });
      if (mounted) {
        setState(() {
          _hasApplied = true;
          _applicationId = appRef.id;
        });
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => JobAppliedScreen(
              jobTitle: widget.title,
              company: widget.company,
              location: widget.location,
              badges: widget.badges,
              timeAgo: widget.posted_days_ago,
              salary: widget.salary,
              currency: widget.currency,
              jobId: widget.jobId,
              applicationId: appRef.id,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error applying: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isApplying = false);
    }
  }

  List<String> _parseResponsibilities(String description) {
    if (description.isEmpty) {
      return [
        'Build responsive, user-friendly interfaces using modern frameworks.',
        'Collaborate with design and product teams to deliver high quality features.',
        'Write clean, maintainable, and well-tested code.',
        'Participate in code reviews and contribute to team best practices.',
      ];
    }
    // Split on bullet markers or numbered list patterns
    final lines = description
        .split(RegExp(r'[\n\r•\-–]|\d+[\.\)]'))
        .map((s) => s.trim())
        .where((s) => s.length > 20)
        .toList();
    return lines.isEmpty ? [description] : lines;
  }

  String _getAboutText() {
    if (widget.description.isEmpty) {
      return 'A versatile professional skilled in both front-end and back-end development, '
          'responsible for building, maintaining, and optimizing web applications and software '
          'systems. They work across the entire stack of technologies, including client-side '
          '(front-end), server-side (back-end), and databases.';
    }
    // Return first meaningful paragraph
    final paragraphs = widget.description
        .split(RegExp(r'\n{2,}'))
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
    return paragraphs.isNotEmpty ? paragraphs.first : widget.description;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black, size: 22),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Job Details',
          style: TextStyle(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isBookmarked ? Icons.bookmark : Icons.bookmark_border,
              color: _isBookmarked ? const Color(0xFF2563EB) : Colors.black,
              size: 22,
            ),
            onPressed: _toggleBookmark,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Job Header Card ──────────────────────────────────
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Icon + Title + Company
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: const Color(0xFF2563EB),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: const Icon(
                                Icons.work_outline,
                                color: Colors.white,
                                size: 32,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.title,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF111827),
                                      height: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 5),
                                  Text(
                                    widget.company,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Color(0xFF6B7280),
                                      fontWeight: FontWeight.w400,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Badge chips
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: widget.badges
                              .map((badge) => Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 7,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: const Color(0xFFE2E8F0),
                                        width: 1,
                                      ),
                                    ),
                                    child: Text(
                                      badge,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: Color(0xFF374151),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                        const SizedBox(height: 14),
                        // Salary + time ago
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Row(
                                children: [
                                  Container(
                                    width: 26,
                                    height: 26,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFF59E0B),
                                      shape: BoxShape.circle,
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      widget.currency,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 7),
                                  Expanded(
                                    child: Text(
                                      widget.salary.isNotEmpty ? widget.salary : 'Not specified',
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF1F2937),
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              widget.posted_days_ago,
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // ── Tab Bar ──────────────────────────────────────────
                  Container(
                    color: Colors.white,
                    child: Column(
                      children: [
                        const Divider(height: 1, color: Color(0xFFE5E7EB)),
                        Row(
                          children: [
                            _buildTab(0, 'About'),
                            _buildTab(1, 'Company'),
                            _buildTab(2, 'Review'),
                          ],
                        ),
                        const Divider(height: 1, color: Color(0xFFE5E7EB)),
                      ],
                    ),
                  ),

                  // ── Tab Content ───────────────────────────────────────
                  Container(
                    color: Colors.white,
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                    child: _buildTabContent(),
                  ),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),

          // ── Apply Button (pinned at bottom) ───────────────────────
          SafeArea(
            top: false,
            child: Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: _hasApplied
                  ? ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => JobAppliedScreen(
                              jobTitle: widget.title,
                              company: widget.company,
                              location: widget.location,
                              badges: widget.badges,
                              timeAgo: widget.posted_days_ago,
                              salary: widget.salary,
                              currency: widget.currency,
                              jobId: widget.jobId,
                              applicationId: _applicationId,
                            ),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      icon: const Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
                      label: const Text(
                        'Applied  •  See details',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    )
                  : ElevatedButton(
                      onPressed: _isApplying ? null : _applyForJob,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: _isApplying
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2.5,
                              ),
                            )
                          : const Text(
                              'Apply This Job',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                    ),
            ),
          ),
          ), // SafeArea
        ],
      ),
    );
  }

  Widget _buildTabContent() {
    if (_selectedTabIndex == 0) {
      final responsibilities = _parseResponsibilities(widget.description);
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'About the role',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            _getAboutText(),
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF6B7280),
              height: 1.65,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Key Responsibilities',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          ...responsibilities.map((r) => _buildBulletPoint(r)),
          if (widget.experience.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Text(
              'Experience',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 8),
            _buildInfoRow(Icons.work_history_outlined, widget.experience),
          ],
          if (widget.category.isNotEmpty) ...[
            const SizedBox(height: 16),
            _buildInfoRow(Icons.category_outlined, widget.category),
          ],
          if (widget.location.isNotEmpty) ...[
            const SizedBox(height: 8),
            _buildInfoRow(Icons.location_on_outlined, widget.location),
          ],
        ],
      );
    } else if (_selectedTabIndex == 1) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.business, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.company,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          widget.rating,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'About the Company',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '${widget.company} is a leading organization committed to excellence and innovation. '
            'We foster a collaborative environment where talented professionals thrive and grow. '
            'Join us to be part of a dynamic team working on impactful projects.',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF6B7280),
              height: 1.65,
            ),
          ),
          const SizedBox(height: 20),
          _buildCompanyDetail(Icons.people_outline, 'Team Size', '50 - 200 employees'),
          _buildCompanyDetail(Icons.language_outlined, 'Industry', widget.category.isNotEmpty ? widget.category : 'Technology'),
          _buildCompanyDetail(Icons.location_on_outlined, 'Location', widget.location.isNotEmpty ? widget.location : 'Multiple Locations'),
        ],
      );
    } else {
      // Review tab — dynamic from Firestore + add review
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Company Reviews',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
              ),
              GestureDetector(
                onTap: () => _showAddReviewDialog(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.rate_review, size: 14, color: Colors.white),
                      SizedBox(width: 4),
                      Text('Add Review', style: TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('reviews')
                .where('jobId', isEqualTo: widget.jobId)
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()));
              }

              final reviews = snapshot.data?.docs ?? [];

              // Sort by date descending
              reviews.sort((a, b) {
                final aData = a.data() as Map<String, dynamic>;
                final bData = b.data() as Map<String, dynamic>;
                return (bData['createdAt'] ?? '').compareTo(aData['createdAt'] ?? '');
              });

              if (reviews.isEmpty) {
                return Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: const Center(
                    child: Column(
                      children: [
                        Icon(Icons.rate_review_outlined, size: 40, color: Color(0xFF9CA3AF)),
                        SizedBox(height: 8),
                        Text('No reviews yet', style: TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
                        Text('Be the first to review!', style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                      ],
                    ),
                  ),
                );
              }

              return Column(
                children: reviews.map((doc) {
                  final data = doc.data() as Map<String, dynamic>;
                  String timeAgo = '';
                  if (data['createdAt'] != null) {
                    try {
                      final created = DateTime.parse(data['createdAt']);
                      final diff = DateTime.now().difference(created);
                      if (diff.inDays > 30) timeAgo = '${(diff.inDays / 30).floor()} month${(diff.inDays / 30).floor() > 1 ? 's' : ''} ago';
                      else if (diff.inDays > 0) timeAgo = '${diff.inDays} day${diff.inDays > 1 ? 's' : ''} ago';
                      else if (diff.inHours > 0) timeAgo = '${diff.inHours}h ago';
                      else timeAgo = 'Just now';
                    } catch (_) {}
                  }

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildReviewCard(
                      name: data['userName']?.toString() ?? 'Anonymous',
                      rating: (data['rating'] ?? 4) is int ? data['rating'] : (data['rating'] as num).toInt(),
                      review: data['review']?.toString() ?? '',
                      timeAgo: timeAgo,
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      );
    }
  }

  void _showAddReviewDialog(BuildContext context) {
    int selectedRating = 0;
    final reviewController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Handle bar
                  Center(
                    child: Container(
                      width: 40, height: 4,
                      decoration: BoxDecoration(color: const Color(0xFFD1D5DB), borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('Write a Review', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF111827))),
                  const SizedBox(height: 4),
                  Text('for ${widget.company}', style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
                  const SizedBox(height: 20),
                  // Star rating
                  const Text('Rating', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: List.generate(5, (i) {
                      return GestureDetector(
                        onTap: () => setModalState(() => selectedRating = i + 1),
                        child: Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Icon(
                            i < selectedRating ? Icons.star : Icons.star_border,
                            size: 36,
                            color: Colors.amber,
                          ),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 16),
                  // Review text
                  const Text('Your Review', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                  const SizedBox(height: 8),
                  TextField(
                    controller: reviewController,
                    maxLines: 4,
                    onChanged: (_) => setModalState(() {}),
                    decoration: InputDecoration(
                      hintText: 'Share your experience...',
                      filled: true,
                      fillColor: const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.all(14),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: (selectedRating == 0 || reviewController.text.trim().isEmpty)
                          ? null
                          : () async {
                              final user = FirebaseAuth.instance.currentUser;
                              await FirebaseFirestore.instance.collection('reviews').add({
                                'jobId': widget.jobId,
                                'companyId': widget.companyId,
                                'company': widget.company,
                                'userId': user?.uid ?? 'anonymous',
                                'userName': user?.displayName ?? user?.email?.split('@').first ?? 'Anonymous',
                                'rating': selectedRating,
                                'review': reviewController.text.trim(),
                                'createdAt': DateTime.now().toIso8601String(),
                              });
                              if (ctx.mounted) Navigator.pop(ctx);
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Review submitted!'), backgroundColor: Colors.green),
                                );
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        disabledBackgroundColor: const Color(0xFFBFDBFE),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Submit Review', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildTab(int index, String label) {
    final isSelected = _selectedTabIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTabIndex = index),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w400,
                  color: isSelected
                      ? const Color(0xFF2563EB)
                      : const Color(0xFF9CA3AF),
                ),
              ),
            ),
            Container(
              height: 3,
              color: isSelected
                  ? const Color(0xFF2563EB)
                  : Colors.transparent,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 7, right: 10),
            width: 5,
            height: 5,
            decoration: const BoxDecoration(
              color: Color(0xFF6B7280),
              shape: BoxShape.circle,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF6B7280),
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFF9CA3AF)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF374151),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCompanyDetail(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Icon(icon, size: 20, color: const Color(0xFF6B7280)),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF9CA3AF),
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF1F2937),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReviewCard({
    required String name,
    required int rating,
    required String review,
    required String timeAgo,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: const Color(0xFF2563EB).withOpacity(0.1),
                child: const Icon(Icons.person, size: 20, color: Color(0xFF2563EB)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                    Text(
                      timeAgo,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    i < rating ? Icons.star : Icons.star_border,
                    size: 14,
                    color: Colors.amber,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            review,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF6B7280),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  MY APPLICATIONS SCREEN
// ═══════════════════════════════════════════════════════════════

class _MyApplicationsScreen extends StatelessWidget {
  const _MyApplicationsScreen();

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF1F5F9),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.arrow_back, size: 20, color: Colors.black87),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'My Applications',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
            ),
            // List
            Expanded(
              child: user == null
                  ? const Center(child: Text('Please sign in to view applications'))
                  : StreamBuilder<QuerySnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('applications')
                          .where('userId', isEqualTo: user.uid)
                          .snapshots(),
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)));
                        }
                        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                          return Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.description_outlined, size: 64, color: Colors.grey.shade300),
                                const SizedBox(height: 16),
                                const Text('No applications yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
                                const SizedBox(height: 6),
                                const Text('Jobs you apply for will appear here', style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
                              ],
                            ),
                          );
                        }

                        final apps = snapshot.data!.docs;
                        // Sort by appliedAt descending
                        apps.sort((a, b) {
                          final aData = a.data() as Map<String, dynamic>;
                          final bData = b.data() as Map<String, dynamic>;
                          return (bData['appliedAt'] ?? '').compareTo(aData['appliedAt'] ?? '');
                        });

                        return ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                          itemCount: apps.length,
                          itemBuilder: (context, index) {
                            final data = apps[index].data() as Map<String, dynamic>;
                            final status = data['status'] ?? 'Applied';

                            // Time ago
                            String timeAgo = '';
                            if (data['appliedAt'] != null) {
                              try {
                                final applied = DateTime.parse(data['appliedAt']);
                                final diff = DateTime.now().difference(applied);
                                if (diff.inDays > 0) {
                                  timeAgo = '${diff.inDays}d ago';
                                } else if (diff.inHours > 0) {
                                  timeAgo = '${diff.inHours}h ago';
                                } else {
                                  timeAgo = 'Just now';
                                }
                              } catch (_) {}
                            }

                            Color statusColor;
                            switch (status.toLowerCase()) {
                              case 'accepted':
                                statusColor = Colors.green;
                                break;
                              case 'rejected':
                                statusColor = Colors.red;
                                break;
                              case 'in review':
                                statusColor = Colors.orange;
                                break;
                              default:
                                statusColor = const Color(0xFF2563EB);
                            }

                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => JobDetailsScreen(
                                      jobId: data['jobId']?.toString() ?? '',
                                      companyId: data['companyId']?.toString() ?? '',
                                      title: data['jobTitle']?.toString() ?? '',
                                      company: data['company']?.toString() ?? '',
                                      location: data['location']?.toString() ?? '',
                                      rating: '4.5',
                                      badges: List<String>.from(data['badges'] ?? []),
                                      posted_days_ago: timeAgo,
                                      salary: data['salary']?.toString() ?? '',
                                      description: '',
                                      experience: '',
                                      category: '',
                                      currency: data['currency']?.toString() ?? '₹',
                                    ),
                                  ),
                                );
                              },
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.06),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEEF2FF),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(Icons.work_outline, color: Color(0xFF4F46E5), size: 22),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            data['jobTitle']?.toString() ?? '',
                                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            data['company']?.toString() ?? '',
                                            style: const TextStyle(fontSize: 12, color: Color(0xFF2563EB), fontWeight: FontWeight.w500),
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF9CA3AF)),
                                              const SizedBox(width: 3),
                                              Text(
                                                data['location']?.toString() ?? '',
                                                style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                                              ),
                                              const Spacer(),
                                              if (timeAgo.isNotEmpty)
                                                Text(timeAgo, style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                                            ],
                                          ),
                                          if ((data['salary']?.toString() ?? '').isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Row(
                                              children: [
                                                const Icon(Icons.currency_rupee, size: 13, color: Color(0xFF2563EB)),
                                                const SizedBox(width: 2),
                                                Text(
                                                  data['salary'].toString(),
                                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF1F2937)),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    // Status badge
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: statusColor),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════
//  JOB APPLIED SCREEN
// ═══════════════════════════════════════════════════════════════

class JobAppliedScreen extends StatefulWidget {
  final String jobTitle;
  final String company;
  final String location;
  final List<String> badges;
  final String timeAgo;
  final String salary;
  final String currency;
  final String jobId;
  final String applicationId;

  const JobAppliedScreen({
    super.key,
    required this.jobTitle,
    required this.company,
    required this.location,
    required this.badges,
    required this.timeAgo,
    this.salary = '',
    this.currency = '₹',
    this.jobId = '',
    this.applicationId = '',
  });

  @override
  State<JobAppliedScreen> createState() => _JobAppliedScreenState();
}

class _JobAppliedScreenState extends State<JobAppliedScreen> {
  String _status = 'Applied';

  // Map Firestore status → step index (0-based)
  static const _statusOrder = [
    'Applied',
    'Shortlist',
    'Application Review',
    'Interview',
  ];

  @override
  void initState() {
    super.initState();
    _listenStatus();
  }

  void _listenStatus() {
    if (widget.applicationId.isEmpty) return;
    FirebaseFirestore.instance
        .collection('applications')
        .doc(widget.applicationId)
        .snapshots()
        .listen((snap) {
      if (snap.exists && mounted) {
        final s = (snap.data()?['status'] ?? 'Applied').toString();
        setState(() => _status = s);
      }
    });
  }

  int get _activeStep {
    final statusLower = _status.toLowerCase().trim();
    final idx = _statusOrder.indexWhere(
        (s) => s.toLowerCase() == statusLower ||
               statusLower.contains(s.toLowerCase()) ||
               s.toLowerCase().contains(statusLower));
    return idx < 0 ? 0 : idx;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black, size: 22),
          onPressed: () => Navigator.of(context)
              .popUntil((route) => route.isFirst),
        ),
        title: const Text(
          'Job Applied',
          style: TextStyle(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.home_outlined, color: Colors.black, size: 24),
            onPressed: () => Navigator.of(context)
                .popUntil((route) => route.isFirst),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Application Timeline ──────────────────────────
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 20),
                    child: _buildTimeline(_activeStep),
                  ),

                  const SizedBox(height: 12),

                  // ── Interview Tips Banner ─────────────────────────
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.06),
                          blurRadius: 12,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Boost Your Interview Success with JobBoard Team Tips',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF111827),
                                    height: 1.35,
                                  ),
                                ),
                                const SizedBox(height: 14),
                                SizedBox(
                                  height: 40,
                                  child: ElevatedButton(
                                    onPressed: () {},
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor:
                                          const Color(0xFF2563EB),
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(8),
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 18),
                                    ),
                                    child: const Text(
                                      'Start Preparing',
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Illustration placeholder
                          Container(
                            width: 90,
                            height: 90,
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Positioned(
                                  left: 8,
                                  bottom: 8,
                                  child: _avatarCircle(
                                      const Color(0xFF3B82F6), 34),
                                ),
                                Positioned(
                                  right: 4,
                                  bottom: 10,
                                  child: _avatarCircle(
                                      const Color(0xFF8B5CF6), 30),
                                ),
                                Positioned(
                                  right: 16,
                                  bottom: 30,
                                  child: _avatarCircle(
                                      const Color(0xFF0EA5E9), 28),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ── Similar Jobs ──────────────────────────────────
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'Similar Jobs',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF111827),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Similar jobs from Firestore
                  StreamBuilder<QuerySnapshot>(
                    stream: FirebaseFirestore.instance
                        .collection('jobs')
                        .where('status', isEqualTo: 'active')
                        .limit(5)
                        .snapshots(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState ==
                          ConnectionState.waiting) {
                        return const Center(
                            child: Padding(
                          padding: EdgeInsets.all(20),
                          child: CircularProgressIndicator(),
                        ));
                      }
                      final docs = snapshot.data?.docs ?? [];
                      // Exclude current job
                      final similar = docs
                          .where((d) => d.id != widget.jobId)
                          .take(4)
                          .toList();

                      if (similar.isEmpty) {
                        return const Padding(
                          padding: EdgeInsets.all(20),
                          child: Center(child: Text('No similar jobs found')),
                        );
                      }

                      return Column(
                        children: similar.map((doc) {
                          final d = doc.data() as Map<String, dynamic>;
                          List<String> jt = [];
                          final exp = d['experience'] ?? '';
                          if (exp.toLowerCase().contains('senior') ||
                              exp.toLowerCase().contains('lead')) {
                            jt.add('Executive');
                          } else if (exp.toLowerCase().contains('entry')) {
                            jt.add('Entry Level');
                          }
                          jt.add('Full-Time');
                          jt.add('Remote');

                          String ago = '5 Day ago';
                          if (d['createdAt'] != null) {
                            try {
                              final diff = DateTime.now().difference(
                                  DateTime.parse(d['createdAt']));
                              if (diff.inDays > 0) {
                                ago =
                                    '${diff.inDays} Day${diff.inDays > 1 ? 's' : ''} ago';
                              } else if (diff.inHours > 0) {
                                ago =
                                    '${diff.inHours} Hour${diff.inHours > 1 ? 's' : ''} ago';
                              }
                            } catch (_) {}
                          }

                          return Padding(
                            padding: const EdgeInsets.only(
                                bottom: 12, left: 16, right: 16),
                            child: _SimilarJobCard(
                              jobId: doc.id,
                              title: d['title'] ?? 'Job Title',
                              company: d['company'] ?? 'Company',
                              location: d['location'] ?? 'Location',
                              badges: jt,
                              timeAgo: ago,
                              salary: d['salary'] ?? '',
                              currency: d['currency'] ?? '₹',
                              description: d['description'] ?? '',
                              experience: d['experience'] ?? '',
                              category: d['category'] ?? '',
                            ),
                          );
                        }).toList(),
                      );
                    },
                  ),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),

          // ── Status Bottom Bar ─────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            child: Container(
              width: double.infinity,
              height: 52,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: LinearGradient(
                  colors: _activeStep >= 3
                      ? [const Color(0xFF6366F1), const Color(0xFF4338CA)]
                      : _activeStep >= 2
                          ? [const Color(0xFFF59E0B), const Color(0xFFD97706)]
                          : _activeStep >= 1
                              ? [const Color(0xFF3B82F6), const Color(0xFF2563EB)]
                              : [const Color(0xFF34D399), const Color(0xFF10B981)],
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.check_circle_outline,
                      color: Colors.white, size: 22),
                  const SizedBox(width: 10),
                  Text(
                    _status == 'Applied' ? 'Applied Successfully'
                        : _status == 'Shortlist' || _status == 'Shortlisted' ? 'Shortlisted 🎉'
                        : _status == 'Application Review' ? 'Under Review'
                        : _status == 'Interview' ? 'Interview Scheduled 🎊'
                        : _status,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline(int activeStep) {
    final steps = [
      'Applied Successfully',
      'Shortlist',
      'Application Review',
      'Interview',
    ];
    final stepColors = [
      const Color(0xFF10B981),
      const Color(0xFF2563EB),
      const Color(0xFFD97706),
      const Color(0xFF6366F1),
    ];

    return Column(
      children: List.generate(steps.length, (i) {
        final isDone = i <= activeStep;
        final isCurrent = i == activeStep;
        final isLast = i == steps.length - 1;
        final color = isDone ? stepColors[i] : const Color(0xFFD1D5DB);
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Circle + line
            Column(
              children: [
                Container(
                  width: 18,
                  height: 18,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isDone ? color : Colors.transparent,
                    border: isDone ? null : Border.all(color: color, width: 1.5),
                  ),
                  child: isDone
                      ? const Icon(Icons.circle, color: Colors.white, size: 8)
                      : null,
                ),
                if (!isLast)
                  Container(
                    width: 1.5,
                    height: 28,
                    color: i < activeStep
                        ? stepColors[i]
                        : const Color(0xFFE5E7EB),
                  ),
              ],
            ),
            const SizedBox(width: 14),
            Padding(
              padding: const EdgeInsets.only(top: 1),
              child: Text(
                steps[i],
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isCurrent ? FontWeight.w700 : FontWeight.normal,
                  color: isDone ? stepColors[i] : const Color(0xFF9CA3AF),
                ),
              ),
            ),
          ],
        );
      }),
    );
  }

  Widget _avatarCircle(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.person, color: Colors.white, size: 16),
    );
  }
}

/// Compact card used in the Similar Jobs section of JobAppliedScreen
class _SimilarJobCard extends StatelessWidget {
  final String jobId;
  final String title;
  final String company;
  final String location;
  final List<String> badges;
  final String timeAgo;
  final String salary;
  final String currency;
  final String description;
  final String experience;
  final String category;

  const _SimilarJobCard({
    required this.jobId,
    required this.title,
    required this.company,
    required this.location,
    required this.badges,
    required this.timeAgo,
    this.salary = '',
    this.currency = '₹',
    this.description = '',
    this.experience = '',
    this.category = '',
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => JobDetailsScreen(
            jobId: jobId,
            title: title,
            company: company,
            location: location,
            rating: '4.5',
            badges: badges,
            posted_days_ago: timeAgo,
            salary: salary,
            description: description,
            experience: experience,
            category: category,
            currency: currency,
          ),
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF2FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.work_outline,
                      color: Color(0xFF4F46E5), size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Text(
                            company,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF2563EB),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.star,
                              size: 12, color: Colors.amber),
                          const SizedBox(width: 2),
                          const Text(
                            '4.5 Review',
                            style: TextStyle(
                                fontSize: 11, color: Color(0xFF6B7280)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.bookmark_border,
                      size: 20, color: Color(0xFF6B7280)),
                  onPressed: () {},
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: badges
                  .map((b) => Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(20),
                          border:
                              Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Text(
                          b,
                          style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFF374151),
                              fontWeight: FontWeight.w500),
                        ),
                      ))
                  .toList(),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.location_on_outlined,
                    size: 14, color: Color(0xFF9CA3AF)),
                const SizedBox(width: 4),
                Text(
                  location,
                  style: const TextStyle(
                      fontSize: 12, color: Color(0xFF6B7280)),
                ),
                const Spacer(),
                Text(
                  timeAgo,
                  style: const TextStyle(
                      fontSize: 12, color: Color(0xFF9CA3AF)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────
// Job Categories Screen
// ────────────────────────────────────────────────────────────────
class JobCategoriesScreen extends StatelessWidget {
  const JobCategoriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Job Categories',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('jobCategories')
            .orderBy('name')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('No categories available'));
          }

          final categories = snapshot.data!.docs;

          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 1.1,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final cat = categories[index].data() as Map<String, dynamic>;
              final name = cat['name'] ?? 'Category';
              final icon = cat['icon'] ?? '📋';

              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => _CategoryJobsScreen(categoryName: name),
                    ),
                  );
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(icon, style: const TextStyle(fontSize: 40)),
                      const SizedBox(height: 10),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: Text(
                          name,
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

/// Shows jobs filtered by a specific category
class _CategoryJobsScreen extends StatelessWidget {
  final String categoryName;
  const _CategoryJobsScreen({required this.categoryName});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          categoryName,
          style: const TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('jobs').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)));
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return _emptyState('No jobs found in this category');
          }

          final jobs = snapshot.data!.docs.where((doc) {
            final data = doc.data() as Map<String, dynamic>;
            final status = (data['status'] ?? 'approved').toString();
            if (status != 'approved' && status != 'active') return false;
            final cat = (data['category'] ?? '').toString().toLowerCase();
            return cat.contains(categoryName.toLowerCase());
          }).toList();

          if (jobs.isEmpty) return _emptyState('No jobs found in "$categoryName"');

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: jobs.length,
            itemBuilder: (context, index) {
              final data = jobs[index].data() as Map<String, dynamic>;
              return _buildJobTile(context, jobs[index].id, data);
            },
          );
        },
      ),
    );
  }

  Widget _emptyState(String msg) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.work_off_outlined, size: 56, color: Colors.grey.shade300),
          const SizedBox(height: 12),
          Text(msg, style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
        ],
      ),
    );
  }

  Widget _buildJobTile(BuildContext context, String docId, Map<String, dynamic> data) {
    String timeAgo = '';
    if (data['createdAt'] != null) {
      try {
        final created = DateTime.parse(data['createdAt']);
        final diff = DateTime.now().difference(created);
        if (diff.inDays > 0) timeAgo = '${diff.inDays}d ago';
        else if (diff.inHours > 0) timeAgo = '${diff.inHours}h ago';
        else timeAgo = 'Just now';
      } catch (_) {}
    }

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => JobDetailsScreen(
              jobId: docId,
              companyId: data['companyId']?.toString() ?? '',
              title: data['title']?.toString() ?? '',
              company: data['company']?.toString() ?? '',
              location: data['location']?.toString() ?? '',
              rating: '4.5',
              badges: List<String>.from(data['badges'] ?? ['Full-Time']),
              posted_days_ago: timeAgo,
              salary: data['salary']?.toString() ?? '',
              description: data['description']?.toString() ?? '',
              experience: data['experience']?.toString() ?? '',
              category: data['category']?.toString() ?? '',
              currency: data['currency']?.toString() ?? '₹',
            ),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 2)),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.work_outline, color: Color(0xFF4F46E5), size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(data['title']?.toString() ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
                  const SizedBox(height: 2),
                  Text(data['company']?.toString() ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFF2563EB), fontWeight: FontWeight.w500)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 3),
                      Expanded(child: Text(data['location']?.toString() ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)), overflow: TextOverflow.ellipsis)),
                      if (timeAgo.isNotEmpty) Text(timeAgo, style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                    ],
                  ),
                  if ((data['salary']?.toString() ?? '').isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Row(children: [
                      const Icon(Icons.currency_rupee, size: 13, color: Color(0xFF2563EB)),
                      const SizedBox(width: 2),
                      Text(data['salary'].toString(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF1F2937))),
                    ]),
                  ],
                  if ((data['experience']?.toString() ?? '').isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Row(children: [
                      const Icon(Icons.work_history, size: 13, color: Color(0xFF7C3AED)),
                      const SizedBox(width: 4),
                      Text(data['experience'].toString(), style: const TextStyle(fontSize: 11, color: Color(0xFF4B5563), fontWeight: FontWeight.w500)),
                    ]),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────
// Skills Screen
// ────────────────────────────────────────────────────────────────
class SkillsScreen extends StatefulWidget {
  const SkillsScreen({super.key});

  @override
  State<SkillsScreen> createState() => _SkillsScreenState();
}

class _SkillsScreenState extends State<SkillsScreen> {
  String _categoryFilter = 'All';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Skills',
          style: TextStyle(color: Color(0xFF0F172A), fontSize: 18, fontWeight: FontWeight.w700),
        ),
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Category filter chips
          SizedBox(
            height: 50,
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance.collection('skills').snapshots(),
              builder: (context, snapshot) {
                if (!snapshot.hasData) return const SizedBox.shrink();

                final skills = snapshot.data!.docs;
                final categories = <String>{'All'};
                for (final s in skills) {
                  final data = s.data() as Map<String, dynamic>;
                  final cat = (data['category'] ?? 'Other').toString();
                  if (cat.isNotEmpty) categories.add(cat);
                }

                return ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: categories.length,
                  itemBuilder: (context, index) {
                    final category = categories.elementAt(index);
                    final isSelected = _categoryFilter == category;

                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () => setState(() => _categoryFilter = category),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            category,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isSelected ? Colors.white : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          // Skills grid
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance.collection('skills').orderBy('name').snapshots(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                  return const Center(child: Text('No skills available'));
                }

                var skills = snapshot.data!.docs;
                if (_categoryFilter != 'All') {
                  skills = skills.where((s) {
                    final data = s.data() as Map<String, dynamic>;
                    return (data['category'] ?? 'Other') == _categoryFilter;
                  }).toList();
                }

                if (skills.isEmpty) {
                  return const Center(child: Text('No skills in this category'));
                }

                return GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 2.4,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                  ),
                  itemCount: skills.length,
                  itemBuilder: (context, index) {
                    final data = skills[index].data() as Map<String, dynamic>;
                    final name = data['name'] ?? 'Skill';
                    final level = data['level'] ?? '';

                    return GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => _SkillJobsScreen(skillName: name),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 1)),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 32, height: 32,
                              decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(8)),
                              child: const Icon(Icons.star, size: 16, color: Color(0xFF2563EB)),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)), maxLines: 1, overflow: TextOverflow.ellipsis),
                                  if (level.isNotEmpty) Text(level, style: const TextStyle(fontSize: 10, color: Color(0xFF64748B))),
                                ],
                              ),
                            ),
                            const Icon(Icons.arrow_forward_ios, size: 12, color: Color(0xFF9CA3AF)),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Shows jobs filtered by a specific skill
class _SkillJobsScreen extends StatelessWidget {
  final String skillName;
  const _SkillJobsScreen({required this.skillName});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(skillName, style: const TextStyle(color: Color(0xFF0F172A), fontSize: 18, fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('jobs').snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)));
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return _emptyState();
          }

          final keyword = skillName.toLowerCase();
          final jobs = snapshot.data!.docs.where((doc) {
            final data = doc.data() as Map<String, dynamic>;
            final status = (data['status'] ?? 'approved').toString();
            if (status != 'approved' && status != 'active') return false;
            // Check skills array first (exact match, case-insensitive)
            final skillsList = List<String>.from(data['skills'] ?? []);
            if (skillsList.any((s) => s.toLowerCase().contains(keyword) || keyword.contains(s.toLowerCase()))) return true;
            // Fallback: check text fields
            final text = '${data['title'] ?? ''} ${data['description'] ?? ''} ${data['category'] ?? ''} ${data['experience'] ?? ''}'.toLowerCase();
            return text.contains(keyword);
          }).toList();

          if (jobs.isEmpty) return _emptyState();

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: jobs.length,
            itemBuilder: (context, index) {
              final data = jobs[index].data() as Map<String, dynamic>;
              String timeAgo = '';
              if (data['createdAt'] != null) {
                try {
                  final created = DateTime.parse(data['createdAt']);
                  final diff = DateTime.now().difference(created);
                  if (diff.inDays > 0) timeAgo = '${diff.inDays}d ago';
                  else if (diff.inHours > 0) timeAgo = '${diff.inHours}h ago';
                  else timeAgo = 'Just now';
                } catch (_) {}
              }

              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => JobDetailsScreen(
                        jobId: jobs[index].id,
                        companyId: data['companyId']?.toString() ?? '',
                        title: data['title']?.toString() ?? '',
                        company: data['company']?.toString() ?? '',
                        location: data['location']?.toString() ?? '',
                        rating: '4.5',
                        badges: List<String>.from(data['badges'] ?? ['Full-Time']),
                        posted_days_ago: timeAgo,
                        salary: data['salary']?.toString() ?? '',
                        description: data['description']?.toString() ?? '',
                        experience: data['experience']?.toString() ?? '',
                        category: data['category']?.toString() ?? '',
                        currency: data['currency']?.toString() ?? '₹',
                      ),
                    ),
                  );
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 2))],
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.work_outline, color: Color(0xFF4F46E5), size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(data['title']?.toString() ?? '', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
                            const SizedBox(height: 2),
                            Text(data['company']?.toString() ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFF2563EB), fontWeight: FontWeight.w500)),
                            const SizedBox(height: 6),
                            Row(children: [
                              const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF9CA3AF)),
                              const SizedBox(width: 3),
                              Expanded(child: Text(data['location']?.toString() ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)), overflow: TextOverflow.ellipsis)),
                              if (timeAgo.isNotEmpty) Text(timeAgo, style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                            ]),
                            if ((data['salary']?.toString() ?? '').isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Row(children: [
                                const Icon(Icons.currency_rupee, size: 13, color: Color(0xFF2563EB)),
                                const SizedBox(width: 2),
                                Text(data['salary'].toString(), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF1F2937))),
                              ]),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _emptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.work_off_outlined, size: 56, color: Colors.grey.shade300),
          const SizedBox(height: 12),
          Text('No jobs found for "$skillName"', style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280))),
        ],
      ),
    );
  }
}

