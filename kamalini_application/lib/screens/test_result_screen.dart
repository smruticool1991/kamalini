import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class TestResultScreen extends StatefulWidget {
  final String testId;
  final String userId;
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
  bool _loading = true;

  bool get _hasDirectData => widget.score != null;

  @override
  void initState() {
    super.initState();
    if (_hasDirectData) {
      _loading = false;
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
        // take latest by completedAt if multiple
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
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
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
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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

  Widget _statItem(String value, String label) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.75))),
      ],
    );
  }

  Widget _divider() {
    return Container(width: 1, height: 36, color: Colors.white.withOpacity(0.25));
  }
}
