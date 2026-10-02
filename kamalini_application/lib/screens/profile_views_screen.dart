import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'plans_screen.dart';

class ProfileViewsScreen extends StatelessWidget {
  const ProfileViewsScreen({super.key});

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        title: const Text('Profile Views',
            style: TextStyle(color: Color(0xFF1F2937), fontSize: 17, fontWeight: FontWeight.w600)),
      ),
      body: user == null
          ? const SizedBox.shrink()
          : FutureBuilder<DocumentSnapshot<Map<String, dynamic>>>(
              future: FirebaseFirestore.instance.collection('users').doc(user.uid).get(),
              builder: (context, userSnap) {
                if (!userSnap.hasData) return const Center(child: CircularProgressIndicator());
                final data = userSnap.data!.data() ?? {};
                final expiresAt = data['planExpiresAt']?.toString();
                final expiry = expiresAt != null ? DateTime.tryParse(expiresAt) : null;
                final flags = data['planFeatureFlags'];
                final hasFeature = expiry != null &&
                    expiry.isAfter(DateTime.now()) &&
                    flags is Map &&
                    flags['profileViewers'] == true;

                return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                  stream: FirebaseFirestore.instance
                      .collection('users')
                      .doc(user.uid)
                      .collection('profileViews')
                      .orderBy('viewedAt', descending: true)
                      .snapshots(),
                  builder: (context, snap) {
                    final count = snap.data?.docs.length ?? 0;

                    if (!hasFeature) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.visibility_outlined, size: 48, color: Color(0xFF9CA3AF)),
                              const SizedBox(height: 16),
                              Text(
                                count > 0
                                    ? '$count ${count == 1 ? 'company has' : 'companies have'} viewed your profile'
                                    : 'No one has viewed your profile yet',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                    fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF1F2937)),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'Upgrade to a premium plan to see exactly who viewed your profile.',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                              ),
                              const SizedBox(height: 20),
                              ElevatedButton(
                                onPressed: () =>
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const PlansScreen())),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF2D8C6B),
                                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                child: const Text('View Plans',
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                              ),
                            ],
                          ),
                        ),
                      );
                    }

                    if (!snap.hasData) return const Center(child: CircularProgressIndicator());
                    final docs = snap.data!.docs;
                    if (docs.isEmpty) {
                      return const Center(
                          child: Text('No one has viewed your profile yet',
                              style: TextStyle(color: Color(0xFF6B7280))));
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: docs.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, i) {
                        final view = docs[i].data();
                        final companyId = view['companyId']?.toString();
                        final jobTitle = view['jobTitle']?.toString() ?? '';
                        final viewedAt = view['viewedAt'];
                        final viewedAtDate = viewedAt is Timestamp ? viewedAt.toDate() : null;

                        return FutureBuilder<DocumentSnapshot<Map<String, dynamic>>>(
                          future: companyId != null
                              ? FirebaseFirestore.instance.collection('companies').doc(companyId).get()
                              : null,
                          builder: (context, companySnap) {
                            final companyName = companySnap.data?.data()?['name']?.toString() ?? 'A company';
                            return Container(
                              padding: const EdgeInsets.all(14),
                              decoration:
                                  BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                              child: Row(
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                        color: const Color(0xFFE8F5F0), borderRadius: BorderRadius.circular(20)),
                                    child: const Icon(Icons.business_outlined, color: Color(0xFF2D8C6B), size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(companyName,
                                            style: const TextStyle(
                                                fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1F2937))),
                                        if (jobTitle.isNotEmpty)
                                          Text('Viewed via $jobTitle',
                                              style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                                      ],
                                    ),
                                  ),
                                  if (viewedAtDate != null)
                                    Text(_timeAgo(viewedAtDate),
                                        style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
                                ],
                              ),
                            );
                          },
                        );
                      },
                    );
                  },
                );
              },
            ),
    );
  }
}
