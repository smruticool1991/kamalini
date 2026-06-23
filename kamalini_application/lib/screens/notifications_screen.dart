import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'notification_detail_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;
  bool _userIsPaid = false;

  @override
  void initState() {
    super.initState();
    _loadUserAndNotifications();
  }

  Future<void> _loadUserAndNotifications() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      setState(() => _loading = false);
      return;
    }

    // Check if user is paid
    try {
      final doc = await FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .get();
      if (doc.exists) {
        _userIsPaid = doc.data()?['isPaid'] == true;
      }
    } catch (_) {}

    // Listen to notifications
    FirebaseFirestore.instance
        .collection('job_notifications')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .listen((snap) {
      if (!mounted) return;
      final all = snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
      final now = DateTime.now();
      // Filter by audience + 1-day expiry after click
      final filtered = all.where((n) {
        final audience = (n['audience'] ?? 'all') as String;
        if (audience == 'paid' && !_userIsPaid) return false;

        // If user clicked this notification, hide it 1 day after the click
        final clickedAt = (n['clickedAt'] as Map<String, dynamic>?);
        final userClick = clickedAt?[user.uid];
        if (userClick != null) {
          DateTime? clickedTime;
          if (userClick is Timestamp) {
            clickedTime = userClick.toDate();
          } else {
            try {
              clickedTime = DateTime.parse(userClick.toString());
            } catch (_) {}
          }
          if (clickedTime != null &&
              now.difference(clickedTime).inHours >= 24) {
            return false; // expired — clicked more than 1 day ago
          }
        }
        return true;
      }).toList();

      // Mark all as read
      final uid = user.uid;
      for (final n in filtered) {
        final readBy = (n['readBy'] as List?) ?? [];
        if (!readBy.contains(uid)) {
          FirebaseFirestore.instance
              .collection('job_notifications')
              .doc(n['id'] as String)
              .update({
            'readBy': FieldValue.arrayUnion([uid]),
          }).catchError((_) {});
        }
      }

      setState(() {
        _notifications = filtered;
        _loading = false;
      });
    }, onError: (_) {
      if (mounted) setState(() => _loading = false);
    });
  }

  String _formatDate(String? iso) {
    if (iso == null) return '';
    try {
      final dt = DateTime.parse(iso).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Notifications',
          style: TextStyle(
              color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 17),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE2E8F0)),
        ),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFF7C3AED)))
          : _notifications.isEmpty
              ? _buildEmpty()
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _notifications.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _buildCard(_notifications[i]),
                ),
    );
  }

  Widget _buildEmpty() {
    return Center(
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
            child: const Icon(Icons.notifications_none_rounded,
                size: 40, color: Color(0xFF7C3AED)),
          ),
          const SizedBox(height: 20),
          const Text('No Notifications',
              style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A))),
          const SizedBox(height: 8),
          const Text('Job alerts will appear here.',
              style: TextStyle(fontSize: 14, color: Color(0xFF64748B))),
        ],
      ),
    );
  }

  Widget _buildCard(Map<String, dynamic> n) {
    final title = (n['title'] ?? '') as String;
    final body = (n['body'] ?? '') as String;
    final jobTitles = (n['jobTitles'] as List?)?.map((e) => e.toString()).toList() ?? [];
    final audience = (n['audience'] ?? 'all') as String;
    final createdAt = n['createdAt'] as String?;
    final readBy = (n['readBy'] as List?) ?? [];
    final uid = FirebaseAuth.instance.currentUser?.uid ?? '';
    final isRead = readBy.contains(uid);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isRead ? const Color(0xFFE2E8F0) : const Color(0xFFC4B5FD),
          width: isRead ? 1 : 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => NotificationDetailScreen(notification: n),
          ),
        ),
        child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F3FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.notifications_active_rounded,
                      color: Color(0xFF7C3AED), size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              title,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: isRead ? FontWeight.w600 : FontWeight.bold,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          if (!isRead)
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                  color: Color(0xFF7C3AED),
                                  shape: BoxShape.circle),
                            ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatDate(createdAt),
                        style: const TextStyle(
                            fontSize: 11, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              body,
              style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF475569),
                  height: 1.5),
            ),

            // Job list
            if (jobTitles.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Featured Jobs',
                        style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF94A3B8),
                            letterSpacing: 0.5)),
                    const SizedBox(height: 6),
                    ...jobTitles.map((jt) => Padding(
                          padding: const EdgeInsets.only(bottom: 3),
                          child: Row(
                            children: [
                              const Icon(Icons.work_outline_rounded,
                                  size: 12, color: Color(0xFF7C3AED)),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(jt,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF475569),
                                        fontWeight: FontWeight.w500)),
                              ),
                            ],
                          ),
                        )),
                  ],
                ),
              ),
            ],

            // Audience badge
            const SizedBox(height: 10),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: audience == 'paid'
                    ? const Color(0xFFFEF3C7)
                    : const Color(0xFFDCFCE7),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                audience == 'paid' ? 'Paid Members' : 'All Users',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: audience == 'paid'
                      ? const Color(0xFFB45309)
                      : const Color(0xFF16A34A),
                ),
              ),
            ),
          ],
        ),
        ),
      ),
    );
  }
}
