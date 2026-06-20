import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'test_result_screen.dart';

class TestTakingScreen extends StatefulWidget {
  final Map<String, dynamic> test;
  const TestTakingScreen({super.key, required this.test});

  @override
  State<TestTakingScreen> createState() => _TestTakingScreenState();
}

class _TestTakingScreenState extends State<TestTakingScreen> {
  late final List<Map<String, dynamic>> _questions;
  late final List<int?> _answers;
  int _current = 0;
  late int _secondsLeft;
  Timer? _timer;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final raw = (widget.test['questions'] as List?) ?? [];
    _questions = raw.map((q) => Map<String, dynamic>.from(q as Map)).toList();
    _answers = List.filled(_questions.length, null);
    _secondsLeft = ((widget.test['timeLimit'] ?? 30) as int) * 60;
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 0) {
        t.cancel();
        _submit(auto: true);
      } else {
        if (mounted) setState(() => _secondsLeft--);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get _timerLabel {
    final m = _secondsLeft ~/ 60;
    final s = _secondsLeft % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  bool get _isWarning => _secondsLeft <= 60;

  Future<void> _submit({bool auto = false}) async {
    if (_submitting) return;

    if (!auto) {
      final unanswered = _answers.where((a) => a == null).length;
      if (unanswered > 0) {
        final ok = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Submit Test?', style: TextStyle(fontWeight: FontWeight.bold)),
            content: Text(
              'You have $unanswered unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?',
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Continue')),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Submit', style: TextStyle(color: Color(0xFF7C3AED))),
              ),
            ],
          ),
        );
        if (ok != true) return;
      }
    }

    setState(() => _submitting = true);
    _timer?.cancel();

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    int score = 0;
    for (int i = 0; i < _questions.length; i++) {
      final correct = (_questions[i]['correctIndex'] ?? 0) as int;
      if (_answers[i] == correct) score++;
    }
    final total = _questions.length;
    final pct = total > 0 ? ((score / total) * 100).round() : 0;
    final pass = pct >= ((widget.test['passingScore'] ?? 70) as int);

    String userName = user.displayName ?? '';
    final userEmail = user.email ?? '';
    try {
      final doc = await FirebaseFirestore.instance.collection('users').doc(user.uid).get();
      if (doc.exists) {
        final data = doc.data()!;
        final n = (data['name'] ?? data['firstName'] ?? '').toString().trim();
        if (n.isNotEmpty) userName = n;
      }
    } catch (_) {}

    await FirebaseFirestore.instance.collection('testResults').add({
      'testId': widget.test['id'] as String,
      'userId': user.uid,
      'userName': userName,
      'userEmail': userEmail,
      'score': score,
      'total': total,
      'percentage': pct,
      'passed': pass,
      'answers': _answers.map((a) => a ?? -1).toList(),
      'completedAt': FieldValue.serverTimestamp(),
    });

    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => TestResultScreen(
          testId: widget.test['id'] as String,
          userId: user.uid,
          score: score,
          total: total,
          percentage: pct,
          passed: pass,
          questions: _questions,
          userAnswers: _answers,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.test['title'] ?? 'Test')),
        body: const Center(child: Text('No questions available for this test.')),
      );
    }

    final q = _questions[_current];
    final opts = ((q['options'] as List?) ?? []).map((o) => o.toString()).toList();
    final answered = _answers.where((a) => a != null).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Color(0xFF0F172A)),
          onPressed: () async {
            final quit = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                title: const Text('Quit Test?', style: TextStyle(fontWeight: FontWeight.bold)),
                content: const Text('Your progress will not be saved.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Continue')),
                  TextButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: const Text('Quit', style: TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            );
            if (quit == true && mounted) Navigator.pop(context);
          },
        ),
        title: Text(
          (widget.test['title'] ?? 'Test') as String,
          style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 16),
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              color: _isWarning ? const Color(0xFFFEF2F2) : const Color(0xFFF5F3FF),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.timer, size: 14,
                    color: _isWarning ? const Color(0xFFDC2626) : const Color(0xFF7C3AED)),
                const SizedBox(width: 4),
                Text(
                  _timerLabel,
                  style: TextStyle(
                    fontSize: 14, fontWeight: FontWeight.bold,
                    color: _isWarning ? const Color(0xFFDC2626) : const Color(0xFF7C3AED),
                  ),
                ),
              ],
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE2E8F0)),
        ),
      ),
      body: Column(
        children: [
          // Progress header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Question ${_current + 1} of ${_questions.length}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
                    Text('$answered answered',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (_current + 1) / _questions.length,
                    backgroundColor: const Color(0xFFE2E8F0),
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF7C3AED)),
                    minHeight: 6,
                  ),
                ),
              ],
            ),
          ),

          // Question dot navigator
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(_questions.length, (i) {
                  final isCurrent = i == _current;
                  final isAnswered = _answers[i] != null;
                  return GestureDetector(
                    onTap: () => setState(() => _current = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      width: 30, height: 30,
                      decoration: BoxDecoration(
                        color: isCurrent
                            ? const Color(0xFF7C3AED)
                            : isAnswered
                                ? const Color(0xFFDCFCE7)
                                : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(7),
                        border: isCurrent
                            ? null
                            : Border.all(color: isAnswered ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0)),
                      ),
                      child: Center(
                        child: Text('${i + 1}',
                            style: TextStyle(
                              fontSize: 11, fontWeight: FontWeight.bold,
                              color: isCurrent
                                  ? Colors.white
                                  : isAnswered
                                      ? const Color(0xFF16A34A)
                                      : const Color(0xFF64748B),
                            )),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Question + options
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3))],
                    ),
                    child: Text(
                      (q['text'] ?? '') as String,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF0F172A), height: 1.5),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ...List.generate(opts.length, (oi) {
                    final selected = _answers[_current] == oi;
                    return GestureDetector(
                      onTap: () => setState(() => _answers[_current] = oi),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: selected ? const Color(0xFFF5F3FF) : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: selected ? const Color(0xFF7C3AED) : const Color(0xFFE2E8F0),
                            width: selected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 30, height: 30,
                              decoration: BoxDecoration(
                                color: selected ? const Color(0xFF7C3AED) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Center(
                                child: Text(
                                  String.fromCharCode(65 + oi),
                                  style: TextStyle(
                                    fontSize: 12, fontWeight: FontWeight.bold,
                                    color: selected ? Colors.white : const Color(0xFF64748B),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                opts[oi],
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                                  color: selected ? const Color(0xFF7C3AED) : const Color(0xFF0F172A),
                                ),
                              ),
                            ),
                            if (selected)
                              const Icon(Icons.check_circle, color: Color(0xFF7C3AED), size: 18),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),

          // Navigation bar
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Row(
              children: [
                if (_current > 0) ...[
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _current--),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF7C3AED),
                        side: const BorderSide(color: Color(0xFF7C3AED)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 13),
                      ),
                      child: const Text('Previous', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: ElevatedButton(
                    onPressed: _submitting
                        ? null
                        : () {
                            if (_current < _questions.length - 1) {
                              setState(() => _current++);
                            } else {
                              _submit();
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _current == _questions.length - 1
                          ? const Color(0xFF16A34A)
                          : const Color(0xFF7C3AED),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                    ),
                    child: _submitting
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Text(
                            _current == _questions.length - 1 ? 'Submit Test' : 'Next',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
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
}
