import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class RecommendationService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Save a search term to the user's search history in Firestore
  static Future<void> saveSearchTerm(String term) async {
    final user = _auth.currentUser;
    if (user == null || term.trim().isEmpty) return;

    try {
      final ref = _firestore.collection('users').doc(user.uid);
      final doc = await ref.get();
      List<String> history = [];

      if (doc.exists) {
        final data = doc.data() as Map<String, dynamic>;
        history = List<String>.from(data['searchHistory'] ?? []);
      }

      // Remove duplicate & add to front, keep max 20
      history.remove(term.trim());
      history.insert(0, term.trim());
      if (history.length > 20) history = history.sublist(0, 20);

      await ref.set({'searchHistory': history}, SetOptions(merge: true));
    } catch (e) {
      print('Error saving search term: $e');
    }
  }

  /// Get recommended jobs based on user profile + search history
  static Future<List<Map<String, dynamic>>> getRecommendedJobs() async {
    final user = _auth.currentUser;

    // Fetch user profile data
    List<String> keywords = [];
    String userCity = '';
    String userWorkStatus = '';

    if (user != null) {
      try {
        final doc =
            await _firestore.collection('users').doc(user.uid).get();
        if (doc.exists) {
          final data = doc.data() as Map<String, dynamic>;

          // ── Skills (comma-separated string saved by onboarding) ──
          final keySkills = (data['keySkills'] ?? '').toString();
          if (keySkills.isNotEmpty) {
            keywords.addAll(
              keySkills
                  .split(',')
                  .map((s) => s.trim().toLowerCase())
                  .where((s) => s.isNotEmpty),
            );
          }

          // ── Preferred Job Roles (list saved by onboarding) ──
          final preferredRoles =
              List<String>.from(data['preferredJobRoles'] ?? []);
          for (final role in preferredRoles) {
            if (role.trim().isNotEmpty) {
              keywords.add(role.trim().toLowerCase());
            }
          }

          // ── Education level ──
          final edu = (data['educationLevel'] ?? '').toString();
          if (edu.isNotEmpty) keywords.add(edu.trim().toLowerCase());

          // ── Work status (Fresher / Experienced etc.) ──
          userWorkStatus = (data['workStatus'] ?? '').toString().toLowerCase();
          if (userWorkStatus.isNotEmpty) keywords.add(userWorkStatus);

          // ── City for location matching ──
          userCity = (data['currentCity'] ?? data['location'] ?? '')
              .toString()
              .toLowerCase();

          // ── Search history ──
          final searchHistory =
              List<String>.from(data['searchHistory'] ?? []);
          for (final term in searchHistory.take(10)) {
            keywords.add(term.trim().toLowerCase());
          }

          // ── Legacy fields (in case some users have them) ──
          for (final field in ['currentRole', 'jobRole', 'industry', 'department']) {
            final v = (data[field] ?? '').toString().trim().toLowerCase();
            if (v.isNotEmpty) keywords.add(v);
          }
        }
      } catch (e) {
        print('Error loading user profile: $e');
      }
    }

    // De-duplicate keywords
    keywords = keywords.toSet().toList();

    // Fetch all active/approved jobs
    try {
      final snap = await _firestore.collection('jobs').get();
      final allJobs = snap.docs
          .map((d) {
            final data = d.data();
            final status = (data['status'] ?? 'approved').toString();
            if (status != 'approved' && status != 'active') return null;
            return {
              'id': d.id,
              'title': data['title'] ?? '',
              'company': data['company'] ?? '',
              'category': data['category'] ?? '',
              'salary': data['salary'] ?? '',
              'location': data['location'] ?? '',
              'posted': data['posted'] ?? '',
              'rating': (data['rating'] ?? '4.5').toString(),
              'badges': _buildBadges(data),
              'description': data['description'] ?? '',
              'experience': data['experience'] ?? '',
              'companyId': data['companyId'] ?? '',
              'currency': data['currency'] ?? '₹',
              'createdAt': data['createdAt'] ?? '',
              'skills': List<String>.from(data['skills'] ?? []),
            };
          })
          .where((j) => j != null)
          .cast<Map<String, dynamic>>()
          .toList();

      if (keywords.isEmpty) {
        // No profile data at all — return newest jobs
        allJobs.sort((a, b) =>
            (b['createdAt'] ?? '').compareTo(a['createdAt'] ?? ''));
        return allJobs.take(10).toList();
      }

      // ── Score each job ──────────────────────────────────────────────────
      final scored = <Map<String, dynamic>>[];
      for (final job in allJobs) {
        // Build searchable text from job fields
        final jobText =
            '${job['title']} ${job['company']} ${job['category']} '
            '${job['description']} ${job['experience']} '
            '${(job['skills'] as List).join(' ')}'
                .toLowerCase();

        int score = 0;

        // Keyword match (skills + roles + search history)
        for (final kw in keywords) {
          if (kw.length >= 2 && jobText.contains(kw)) {
            score += 2; // base score per keyword
          }
        }

        // Bonus: city/location match
        if (userCity.isNotEmpty) {
          final jobLocation = (job['location'] ?? '').toString().toLowerCase();
          if (jobLocation.contains(userCity) || userCity.contains(jobLocation.split(',').first.trim())) {
            score += 3;
          }
        }

        // Bonus: work-status match (Fresher → Entry Level jobs)
        if (userWorkStatus == 'fresher' || userWorkStatus == 'student') {
          final exp = (job['experience'] ?? '').toString().toLowerCase();
          if (exp.contains('fresher') || exp.contains('entry') || exp.contains('0')) {
            score += 2;
          }
        } else if (userWorkStatus == 'experienced') {
          final exp = (job['experience'] ?? '').toString().toLowerCase();
          if (exp.contains('senior') || exp.contains('lead') || exp.contains('mid')) {
            score += 2;
          }
        }

        if (score > 0) {
          scored.add({...job, '_score': score});
        }
      }

      // Sort: score desc, then newest first
      scored.sort((a, b) {
        final cmp = (b['_score'] as int).compareTo(a['_score'] as int);
        if (cmp != 0) return cmp;
        return (b['createdAt'] ?? '').compareTo(a['createdAt'] ?? '');
      });

      final result = scored.take(10).toList();

      // If no profile-matched jobs found at all, fall back to newest
      if (result.isEmpty) {
        allJobs.sort((a, b) =>
            (b['createdAt'] ?? '').compareTo(a['createdAt'] ?? ''));
        return allJobs.take(10).toList();
      }

      // Remove internal score field before returning
      for (final r in result) {
        r.remove('_score');
        r.remove('skills');
      }

      return result;
    } catch (e) {
      print('Error fetching recommended jobs: $e');
      return [];
    }
  }

  /// Build meaningful badges from job data fields
  static List<String> _buildBadges(Map<String, dynamic> data) {
    // Use existing badges if available and non-empty
    if (data['badges'] != null) {
      final existing = List<String>.from(data['badges'])
          .where((b) => b.trim().isNotEmpty)
          .toList();
      if (existing.isNotEmpty) return existing;
    }

    final badges = <String>[];
    final exp = (data['experience'] ?? '').toString().toLowerCase();
    final type = (data['type'] ?? '').toString();
    final category = (data['category'] ?? '').toString();

    // Experience level
    if (exp.contains('fresher') || exp.contains('0')) {
      badges.add('Entry Level');
    } else if (exp.contains('senior') || exp.contains('lead')) {
      badges.add('Senior');
    } else if (exp.isNotEmpty) {
      badges.add(data['experience'].toString());
    }

    // Job type
    if (type.isNotEmpty) {
      badges.add(type);
    } else {
      badges.add('Full-Time');
    }

    // Category as skill
    if (category.isNotEmpty && badges.length < 3) {
      badges.add(category);
    }

    return badges.isEmpty ? ['Full-Time'] : badges;
  }
}
