import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'test_taking_screen.dart';
import 'test_result_screen.dart';

class TestsScreen extends StatefulWidget {
  const TestsScreen({super.key});

  @override
  State<TestsScreen> createState() => _TestsScreenState();
}

class _TestsScreenState extends State<TestsScreen> {
  List<Map<String, dynamic>> _tests = [];
  // All results for the current user, grouped by testId, sorted newest first
  Map<String, List<Map<String, dynamic>>> _userResultsMap = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _listenTests();
    _listenUserResults();
    Future.delayed(const Duration(seconds: 15), () {
      if (mounted && _loading) {
        setState(() {
          _loading = false;
          _error = 'Could not load tests. Check your connection and try again.';
        });
      }
    });
  }

  void _listenTests() {
    FirebaseFirestore.instance
        .collection('tests')
        .where('status', isEqualTo: 'published')
        .snapshots()
        .listen(
      (snap) {
        if (!mounted) return;
        final tests = snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
        tests.sort((a, b) {
          final at = a['publishedAt'];
          final bt = b['publishedAt'];
          if (at == null && bt == null) return 0;
          if (at == null) return 1;
          if (bt == null) return -1;
          return (bt as Timestamp).compareTo(at as Timestamp);
        });
        setState(() {
          _tests = tests;
          _loading = false;
          _error = null;
        });
      },
      onError: (_) {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _error = 'Failed to load tests. Please try again.';
        });
      },
    );
  }

  void _listenUserResults() {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    FirebaseFirestore.instance
        .collection('testResults')
        .where('userId', isEqualTo: user.uid)
        .snapshots()
        .listen((snap) {
      if (!mounted) return;
      final map = <String, List<Map<String, dynamic>>>{};
      for (final doc in snap.docs) {
        final data = doc.data();
        final testId = (data['testId'] ?? '') as String;
        if (testId.isEmpty) continue;
        map.putIfAbsent(testId, () => []).add({'id': doc.id, ...data});
      }
      // Sort each list newest first
      for (final list in map.values) {
        list.sort((a, b) {
          final at = a['completedAt'] as Timestamp?;
          final bt = b['completedAt'] as Timestamp?;
          if (at == null && bt == null) return 0;
          if (at == null) return 1;
          if (bt == null) return -1;
          return bt.compareTo(at);
        });
      }
      setState(() => _userResultsMap = map);
    });
  }

  // Returns (canRetake, blockReason, countdown)
  ({bool canRetake, String blockReason, Duration? countdown}) _retakeStatus(
    Map<String, dynamic> test,
    List<Map<String, dynamic>> results,
  ) {
    final maxRetakes = (test['maxRetakes'] ?? 0) as int;
    final cooldownHours = (test['retakeCooldownHours'] ?? 0) as int;
    final attemptCount = results.length;

    if (maxRetakes > 0 && attemptCount >= maxRetakes) {
      return (
        canRetake: false,
        blockReason: 'Max attempts reached ($attemptCount/$maxRetakes)',
        countdown: null,
      );
    }

    if (cooldownHours > 0 && results.isNotEmpty) {
      final completedAt = results.first['completedAt'] as Timestamp?;
      if (completedAt != null) {
        final canRetakeAt =
            completedAt.toDate().add(Duration(hours: cooldownHours));
        final now = DateTime.now();
        if (now.isBefore(canRetakeAt)) {
          return (
            canRetake: false,
            blockReason: '',
            countdown: canRetakeAt.difference(now),
          );
        }
      }
    }

    // Criteria check: who is eligible to retake
    final criteria = (test['retakeCriteria'] ?? 'all') as String;
    if (criteria != 'all' && results.isNotEmpty) {
      final latest = results.first; // sorted newest-first
      if (criteria == 'failed_only') {
        final latestPassed = latest['passed'] as bool? ?? false;
        if (latestPassed) {
          return (
            canRetake: false,
            blockReason: 'Only failed users can retake',
            countdown: null,
          );
        }
      } else if (criteria == 'below_percentage') {
        final threshold = (test['retakeBelowPercentage'] ?? 50) as int;
        final pct = (latest['percentage'] ?? 0) as int;
        if (pct >= threshold) {
          return (
            canRetake: false,
            blockReason: 'Score $pct% meets the $threshold% threshold',
            countdown: null,
          );
        }
      }
    }

    return (canRetake: true, blockReason: '', countdown: null);
  }

  String _formatDuration(Duration d) {
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    if (h > 0) return '${h}h ${m}m';
    return '${m}m';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: const Text(
          'Tests',
          style: TextStyle(
              color: Color(0xFF0F172A),
              fontWeight: FontWeight.bold,
              fontSize: 20),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE2E8F0)),
        ),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF7C3AED)))
          : _error != null
              ? _buildError()
              : _tests.isEmpty
                  ? _buildEmpty()
                  : RefreshIndicator(
                      color: const Color(0xFF7C3AED),
                      onRefresh: () async => setState(() {}),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _tests.length,
                        itemBuilder: (_, i) => _buildCard(_tests[i]),
                      ),
                    ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.wifi_off_rounded,
                  size: 40, color: Color(0xFFDC2626)),
            ),
            const SizedBox(height: 20),
            const Text('Connection Error',
                style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A))),
            const SizedBox(height: 8),
            Text(_error ?? 'Something went wrong.',
                textAlign: TextAlign.center,
                style:
                    const TextStyle(fontSize: 14, color: Color(0xFF64748B))),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _loading = true;
                  _error = null;
                });
                _listenTests();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7C3AED),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFFF5F3FF),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.quiz_outlined,
                  size: 40, color: Color(0xFF7C3AED)),
            ),
            const SizedBox(height: 20),
            const Text('No Tests Available',
                style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0F172A))),
            const SizedBox(height: 8),
            const Text('New tests will appear here when published.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Color(0xFF64748B))),
          ],
        ),
      ),
    );
  }

  Widget _buildCard(Map<String, dynamic> test) {
    final testId = test['id'] as String;
    final title = (test['title'] ?? 'Untitled Test') as String;
    final description = (test['description'] ?? '') as String;
    final timeLimit = (test['timeLimit'] ?? 30) as int;
    final passingScore = (test['passingScore'] ?? 70) as int;
    final questions = (test['questions'] as List?) ?? [];
    final retakeAllowed = test['retakeAllowed'] == true;
    final maxRetakes = (test['maxRetakes'] ?? 0) as int;

    final results = _userResultsMap[testId] ?? [];
    final isDone = results.isNotEmpty;
    final attemptCount = results.length;

    final retakeInfo =
        isDone && retakeAllowed ? _retakeStatus(test, results) : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 12,
              offset: const Offset(0, 4)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Title row ──
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F3FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child:
                      const Icon(Icons.quiz, color: Color(0xFF7C3AED), size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F172A))),
                      if (description.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Text(description,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 12, color: Color(0xFF64748B))),
                      ],
                    ],
                  ),
                ),
                if (isDone) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(99),
                    ),
                    child: const Text('Done',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF16A34A))),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),

            // ── Info chips ──
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                _chip(Icons.timer_outlined, '$timeLimit min'),
                _chip(Icons.check_circle_outline, '$passingScore% to pass'),
                _chip(Icons.help_outline,
                    '${questions.length} question${questions.length == 1 ? '' : 's'}'),
                if (isDone)
                  _chip(Icons.replay,
                      'Attempt $attemptCount${maxRetakes > 0 ? '/$maxRetakes' : ''}',
                      color: const Color(0xFF7C3AED)),
              ],
            ),
            const SizedBox(height: 14),

            // ── View Result / Start Test button ──
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isDone
                    ? () => _openResult(testId, results, test)
                    : () => _startTest(test),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isDone
                      ? const Color(0xFF16A34A)
                      : const Color(0xFF7C3AED),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 13),
                ),
                child: Text(
                  isDone ? 'View Result' : 'Start Test',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),

            // ── Retake button (only when test was taken and retake is enabled) ──
            if (isDone && retakeAllowed && retakeInfo != null) ...[
              const SizedBox(height: 8),
              _buildRetakeRow(test, retakeInfo),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRetakeRow(
    Map<String, dynamic> test,
    ({bool canRetake, String blockReason, Duration? countdown}) info,
  ) {
    if (info.canRetake) {
      return SizedBox(
        width: double.infinity,
        child: OutlinedButton.icon(
          onPressed: () => _startTest(test),
          icon: const Icon(Icons.replay, size: 16),
          label: const Text('Retake Test'),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF7C3AED),
            side: const BorderSide(color: Color(0xFF7C3AED)),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(vertical: 12),
          ),
        ),
      );
    }

    if (info.countdown != null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.timer_outlined,
                size: 15, color: Color(0xFF94A3B8)),
            const SizedBox(width: 6),
            Text(
              'Retake available in ${_formatDuration(info.countdown!)}',
              style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF94A3B8),
                  fontWeight: FontWeight.w500),
            ),
          ],
        ),
      );
    }

    if (info.blockReason.isNotEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFFECACA)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.block_rounded, size: 15, color: Color(0xFFDC2626)),
            const SizedBox(width: 6),
            Text(
              info.blockReason,
              style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFFDC2626),
                  fontWeight: FontWeight.w500),
            ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _chip(IconData icon, String label, {Color? color}) {
    final c = color ?? const Color(0xFF64748B);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color != null
            ? color.withValues(alpha: 0.08)
            : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: c),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                  fontSize: 11, color: c, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  void _startTest(Map<String, dynamic> test) {
    Navigator.push(context,
        MaterialPageRoute(builder: (_) => TestTakingScreen(test: test)));
  }

  void _openResult(
    String testId,
    List<Map<String, dynamic>> results,
    Map<String, dynamic> test,
  ) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => TestResultScreen(
          testId: testId,
          userId: user.uid,
          test: test,
        ),
      ),
    );
  }
}
