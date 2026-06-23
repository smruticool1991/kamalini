import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'test_taking_screen.dart';

class TestResultScreen extends StatefulWidget {
  final String testId;
  final String userId;
  // Test doc (for retake settings)
  final Map<String, dynamic>? test;
  // Supplied directly after test submission
  final int? score;
  final int? total;
  final int? percentage;
  final bool? passed;
  final List<Map<String, dynamic>>? questions;
  final List<int?>? userAnswers;

  const TestResultScreen({
    super.key,
    required this.testId,
    required this.userId,
    this.test,
    this.score,
    this.total,
    this.percentage,
    this.passed,
    this.questions,
    this.userAnswers,
  });

  @override
  State<TestResultScreen> createState() => _TestResultScreenState();
}

class _TestResultScreenState extends State<TestResultScreen> {
  Map<String, dynamic>? _savedResult;
  List<Map<String, dynamic>> _allResults = [];
  bool _loading = true;

  bool get _hasDirectData => widget.score != null;

  @override
  void initState() {
    super.initState();
    if (_hasDirectData) {
      _loading = false;
      _fetchAllResults(); // still fetch to compute retake eligibility
    } else {
      _fetchResult();
    }
  }

  Future<void> _fetchResult() async {
    try {
      final snap = await FirebaseFirestore.instance
          .collection('testResults')
          .where('testId', isEqualTo: widget.testId)
          .where('userId', isEqualTo: widget.userId)
          .get();
      if (snap.docs.isNotEmpty && mounted) {
        final docs = snap.docs.toList();
        docs.sort((a, b) {
          final at = a.data()['completedAt'] as Timestamp?;
          final bt = b.data()['completedAt'] as Timestamp?;
          if (at == null && bt == null) return 0;
          if (at == null) return 1;
          if (bt == null) return -1;
          return bt.compareTo(at);
        });
        setState(() {
          _savedResult = docs.first.data();
          _allResults = docs.map((d) => d.data()).toList();
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _fetchAllResults() async {
    try {
      final snap = await FirebaseFirestore.instance
          .collection('testResults')
          .where('testId', isEqualTo: widget.testId)
          .where('userId', isEqualTo: widget.userId)
          .get();
      if (!mounted) return;
      final docs = snap.docs.toList();
      docs.sort((a, b) {
        final at = a.data()['completedAt'] as Timestamp?;
        final bt = b.data()['completedAt'] as Timestamp?;
        if (at == null && bt == null) return 0;
        if (at == null) return 1;
        if (bt == null) return -1;
        return bt.compareTo(at);
      });
      setState(() => _allResults = docs.map((d) => d.data()).toList());
    } catch (_) {}
  }

  // Returns (canRetake, blockReason, countdown)
  ({bool canRetake, String blockReason, Duration? countdown}) get _retakeStatus {
    final test = widget.test;
    if (test == null || test['retakeAllowed'] != true) {
      return (canRetake: false, blockReason: '', countdown: null);
    }

    final maxRetakes = (test['maxRetakes'] ?? 0) as int;
    final cooldownHours = (test['retakeCooldownHours'] ?? 0) as int;
    final attemptCount = _allResults.length;

    if (maxRetakes > 0 && attemptCount >= maxRetakes) {
      return (
        canRetake: false,
        blockReason: 'Max attempts reached ($attemptCount/$maxRetakes)',
        countdown: null,
      );
    }

    if (cooldownHours > 0 && _allResults.isNotEmpty) {
      final completedAt = _allResults.first['completedAt'] as Timestamp?;
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
    if (criteria != 'all' && _allResults.isNotEmpty) {
      final latest = _allResults.first; // sorted newest-first
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
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: Color(0xFF7C3AED))));
    }

    final score = widget.score ?? (_savedResult?['score'] as int? ?? 0);
    final total = widget.total ?? (_savedResult?['total'] as int? ?? 0);
    final pct = widget.percentage ?? (_savedResult?['percentage'] as int? ?? 0);
    final passed = widget.passed ?? (_savedResult?['passed'] as bool? ?? false);

    final questions = widget.questions ?? [];
    final rawSavedAnswers = (_savedResult?['answers'] as List?)?.map((e) => e as int).toList() ?? [];
    final answers = widget.userAnswers ?? rawSavedAnswers.map<int?>((e) => e).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Test Result',
            style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE2E8F0)),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero result card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: passed
                      ? [const Color(0xFF16A34A), const Color(0xFF15803D)]
                      : [const Color(0xFFDC2626), const Color(0xFFB91C1C)],
                ),
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: (passed ? const Color(0xFF16A34A) : const Color(0xFFDC2626))
                        .withOpacity(0.28),
                    blurRadius: 28, offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Icon(
                    passed ? Icons.emoji_events_rounded : Icons.sentiment_dissatisfied_outlined,
                    size: 56, color: Colors.white,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    passed ? 'Congratulations!' : 'Better Luck Next Time',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    passed ? 'You passed the test!' : 'You did not pass this time.',
                    style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.85)),
                  ),
                  const SizedBox(height: 28),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _statItem('$score/$total', 'Correct'),
                        _divider(),
                        _statItem('$pct%', 'Score'),
                        _divider(),
                        _statItem(passed ? 'PASS' : 'FAIL', 'Result'),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // Answer review
            if (questions.isNotEmpty) ...[
              const Text('Answer Review',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
              const SizedBox(height: 12),
              ...List.generate(questions.length, (i) {
                final q = questions[i];
                final userAns = i < answers.length ? answers[i] : null;
                final correctAns = (q['correctIndex'] ?? 0) as int;
                final opts = ((q['options'] as List?) ?? []).map((o) => o.toString()).toList();
                final isCorrect = userAns == correctAns;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isCorrect ? const Color(0xFFBBF7D0) : const Color(0xFFFECACA),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF5F3FF),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text('Q${i + 1}',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF7C3AED))),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              (q['text'] ?? '') as String,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0F172A), height: 1.4),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Icon(
                            isCorrect ? Icons.check_circle_rounded : Icons.cancel_rounded,
                            size: 20,
                            color: isCorrect ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ...List.generate(opts.length, (oi) {
                        final isUser = userAns == oi;
                        final isCorrectOpt = correctAns == oi;

                        Color bg = const Color(0xFFF8FAFC);
                        Color border = const Color(0xFFE2E8F0);
                        Color text = const Color(0xFF64748B);

                        if (isCorrectOpt) {
                          bg = const Color(0xFFDCFCE7);
                          border = const Color(0xFF16A34A);
                          text = const Color(0xFF16A34A);
                        } else if (isUser && !isCorrect) {
                          bg = const Color(0xFFFEF2F2);
                          border = const Color(0xFFDC2626);
                          text = const Color(0xFFDC2626);
                        }

                        return Container(
                          margin: const EdgeInsets.only(bottom: 5),
                          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
                          decoration: BoxDecoration(
                            color: bg,
                            borderRadius: BorderRadius.circular(9),
                            border: Border.all(color: border),
                          ),
                          child: Row(
                            children: [
                              Text(
                                String.fromCharCode(65 + oi),
                                style: TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.bold, color: text,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  opts[oi],
                                  style: TextStyle(
                                    fontSize: 12, color: text,
                                    fontWeight: isCorrectOpt || (isUser && !isCorrect)
                                        ? FontWeight.w600
                                        : FontWeight.normal,
                                  ),
                                ),
                              ),
                              if (isCorrectOpt)
                                const Icon(Icons.check, size: 14, color: Color(0xFF16A34A)),
                              if (isUser && !isCorrect)
                                const Icon(Icons.close, size: 14, color: Color(0xFFDC2626)),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                );
              }),
            ],

            const SizedBox(height: 20),

            // ── Retake button ──
            if (widget.test != null && widget.test!['retakeAllowed'] == true)
              _buildRetakeSection(),

            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF7C3AED),
                  side: const BorderSide(color: Color(0xFF7C3AED)),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Back to Tests',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Widget _buildRetakeSection() {
    final info = _retakeStatus;

    if (info.canRetake) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => TestTakingScreen(test: widget.test!),
                ),
              );
            },
            icon: const Icon(Icons.replay, size: 18),
            label: const Text('Retake Test',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
      );
    }

    if (info.countdown != null) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.timer_outlined,
                  size: 16, color: Color(0xFF94A3B8)),
              const SizedBox(width: 8),
              Text(
                'Retake available in ${_formatDuration(info.countdown!)}',
                style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF94A3B8),
                    fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      );
    }

    if (info.blockReason.isNotEmpty) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFFEF2F2),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFFECACA)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.block_rounded,
                  size: 16, color: Color(0xFFDC2626)),
              const SizedBox(width: 8),
              Text(
                info.blockReason,
                style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFFDC2626),
                    fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _statItem(String value, String label) {
    return Column(
      children: [
        Text(value,
            style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white)),
        const SizedBox(height: 2),
        Text(label,
            style: TextStyle(
                fontSize: 12,
                color: Colors.white.withValues(alpha: 0.75))),
      ],
    );
  }

  Widget _divider() {
    return Container(
        width: 1,
        height: 36,
        color: Colors.white.withValues(alpha: 0.25));
  }
}
