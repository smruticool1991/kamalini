import 'dart:math';
import 'package:flutter/material.dart';

class SplashScreen extends StatefulWidget {
  final Widget nextScreen;
  const SplashScreen({super.key, required this.nextScreen});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _textController;
  late AnimationController _sparkleController;

  late Animation<double> _logoScale;
  late Animation<double> _logoFade;
  late Animation<double> _textFade;
  late Animation<Offset> _textSlide;
  late Animation<double> _taglineFade;
  late Animation<double> _sparklePulse;

  @override
  void initState() {
    super.initState();

    // Logo animation
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _logoScale = CurvedAnimation(
      parent: _logoController,
      curve: Curves.elasticOut,
    ).drive(Tween(begin: 0.0, end: 1.0));
    _logoFade = CurvedAnimation(
      parent: _logoController,
      curve: const Interval(0.0, 0.6, curve: Curves.easeIn),
    ).drive(Tween(begin: 0.0, end: 1.0));

    // Text animation
    _textController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _textFade = CurvedAnimation(
      parent: _textController,
      curve: Curves.easeIn,
    ).drive(Tween(begin: 0.0, end: 1.0));
    _textSlide = CurvedAnimation(
      parent: _textController,
      curve: Curves.easeOut,
    ).drive(Tween(begin: const Offset(0, 0.4), end: Offset.zero));
    _taglineFade = CurvedAnimation(
      parent: _textController,
      curve: const Interval(0.4, 1.0, curve: Curves.easeIn),
    ).drive(Tween(begin: 0.0, end: 1.0));

    // Sparkle pulse animation (loops)
    _sparkleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
    _sparkleController.repeat(reverse: true);
    _sparklePulse = CurvedAnimation(
      parent: _sparkleController,
      curve: Curves.easeInOut,
    ).drive(Tween(begin: 0.3, end: 1.0));

    // Start sequence
    _logoController.forward().then((_) {
      _textController.forward();
    });

    // Navigate after 3 seconds
    Future.delayed(const Duration(milliseconds: 3000), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (_, __, ___) => widget.nextScreen,
            transitionsBuilder: (_, anim, __, child) =>
                FadeTransition(opacity: anim, child: child),
            transitionDuration: const Duration(milliseconds: 500),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _logoController.dispose();
    _textController.dispose();
    _sparkleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Stack(
        children: [
          // ── Gradient Background ──────────────────────────────────
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF0A2A6E), // deep navy top
                  Color(0xFF1565C0), // mid blue
                  Color(0xFF1E88E5), // lighter blue centre
                  Color(0xFF1565C0), // mid blue
                  Color(0xFF0D2B6B), // deep navy bottom
                ],
                stops: [0.0, 0.25, 0.5, 0.75, 1.0],
              ),
            ),
          ),

          // ── Sparkle Particles ────────────────────────────────────
          AnimatedBuilder(
            animation: _sparklePulse,
            builder: (_, __) => CustomPaint(
              size: size,
              painter: _SparklePainter(progress: _sparklePulse.value),
            ),
          ),

          // ── Radial Glow behind logo ──────────────────────────────
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.white.withOpacity(0.10),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // ── Main Content ─────────────────────────────────────────
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Logo
                ScaleTransition(
                  scale: _logoScale,
                  child: FadeTransition(
                    opacity: _logoFade,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.35),
                            blurRadius: 30,
                            offset: const Offset(0, 12),
                          ),
                          BoxShadow(
                            color: const Color(0xFF42A5F5).withOpacity(0.5),
                            blurRadius: 40,
                            spreadRadius: 5,
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(30),
                        child: Image.asset(
                          'assets/icon/app_icon.png',
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const _FallbackIcon(),
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // "KAJobs" title
                SlideTransition(
                  position: _textSlide,
                  child: FadeTransition(
                    opacity: _textFade,
                    child: RichText(
                      text: const TextSpan(
                        children: [
                          TextSpan(
                            text: 'KA',
                            style: TextStyle(
                              fontSize: 42,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 1.5,
                              shadows: [
                                Shadow(
                                  color: Color(0xFF90CAF9),
                                  blurRadius: 20,
                                ),
                              ],
                            ),
                          ),
                          TextSpan(
                            text: 'Jobs',
                            style: TextStyle(
                              fontSize: 42,
                              fontWeight: FontWeight.w300,
                              color: Colors.white,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                // Tagline
                FadeTransition(
                  opacity: _taglineFade,
                  child: const Text(
                    'Connect. Apply. Grow.',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w400,
                      color: Colors.white70,
                      letterSpacing: 2.0,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Bottom subtle wave ───────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: CustomPaint(
              size: Size(size.width, 120),
              painter: _WavePainter(),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Fallback icon when image not found ──────────────────────────────────────
class _FallbackIcon extends StatelessWidget {
  const _FallbackIcon();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1565C0), Color(0xFF0D47A1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Text(
          'KA',
          style: TextStyle(
            fontSize: 52,
            fontWeight: FontWeight.w900,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

// ── Sparkle particle painter ────────────────────────────────────────────────
class _SparklePainter extends CustomPainter {
  final double progress;

  _SparklePainter({required this.progress});

  static const List<_Sparkle> _sparkles = [
    _Sparkle(0.08, 0.12, 6, 0.9),
    _Sparkle(0.85, 0.08, 4, 0.7),
    _Sparkle(0.15, 0.35, 3, 0.5),
    _Sparkle(0.92, 0.30, 5, 0.8),
    _Sparkle(0.05, 0.55, 4, 0.6),
    _Sparkle(0.95, 0.52, 3, 0.9),
    _Sparkle(0.20, 0.70, 5, 0.7),
    _Sparkle(0.78, 0.68, 4, 0.5),
    _Sparkle(0.12, 0.85, 3, 0.8),
    _Sparkle(0.88, 0.82, 6, 0.6),
    _Sparkle(0.45, 0.07, 4, 0.7),
    _Sparkle(0.60, 0.92, 3, 0.9),
    _Sparkle(0.35, 0.90, 5, 0.5),
    _Sparkle(0.72, 0.15, 3, 0.8),
    _Sparkle(0.50, 0.45, 8, 1.0), // bright centre glow
  ];

  @override
  void paint(Canvas canvas, Size size) {
    for (int i = 0; i < _sparkles.length; i++) {
      final s = _sparkles[i];
      final phase = (progress + i * 0.13) % 1.0;
      final opacity = (s.baseOpacity * phase).clamp(0.0, 1.0);
      final radius = s.radius * phase;

      final paint = Paint()
        ..color = Colors.white.withOpacity(opacity)
        ..style = PaintingStyle.fill;

      final cx = size.width * s.xFrac;
      final cy = size.height * s.yFrac;

      // Draw 4-point star
      _drawStar(canvas, paint, cx, cy, radius);
    }
  }

  void _drawStar(Canvas canvas, Paint paint, double cx, double cy, double r) {
    final path = Path();
    for (int i = 0; i < 4; i++) {
      final angle = i * pi / 2;
      final x = cx + cos(angle) * r;
      final y = cy + sin(angle) * r;
      final innerX = cx + cos(angle + pi / 4) * r * 0.3;
      final innerY = cy + sin(angle + pi / 4) * r * 0.3;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(innerX, innerY);
        path.lineTo(x, y);
      }
      path.lineTo(
        cx + cos(angle + pi / 4) * r * 0.3,
        cy + sin(angle + pi / 4) * r * 0.3,
      );
    }
    path.close();
    canvas.drawPath(path, paint);
    // Centre dot
    canvas.drawCircle(Offset(cx, cy), r * 0.25, paint);
  }

  @override
  bool shouldRepaint(_SparklePainter old) => old.progress != progress;
}

class _Sparkle {
  final double xFrac;
  final double yFrac;
  final double radius;
  final double baseOpacity;

  const _Sparkle(this.xFrac, this.yFrac, this.radius, this.baseOpacity);
}

// ── Subtle bottom wave ───────────────────────────────────────────────────────
class _WavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.04)
      ..style = PaintingStyle.fill;

    final path = Path()
      ..moveTo(0, size.height * 0.5)
      ..cubicTo(
        size.width * 0.25, size.height * 0.1,
        size.width * 0.75, size.height * 0.9,
        size.width, size.height * 0.4,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_WavePainter old) => false;
}
