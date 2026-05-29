import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/job.dart';

class JobService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  static const String _collectionName = 'jobs';

  /// Fetch all approved jobs from Firestore
  static Stream<List<Job>> getJobsStream() {
    print('Fetching all approved jobs stream...');
    return _firestore
        .collection(_collectionName)
        .snapshots()
        .map((snapshot) {
      print('Received ${snapshot.docs.length} documents from Firestore');
      return snapshot.docs
          .map((doc) => Job.fromFirestore(doc.data(), doc.id))
          .where((job) => job.status == 'approved' || job.status == 'active') // Filter in code to avoid index requirement
          .toList();
    });
  }

  /// Fetch jobs for a specific user (you can add user-specific logic here)
  static Stream<List<Job>> getJobsForUser({String? location, String? category}) {
    try {
      print('Fetching jobs for user with location: $location, category: $category');
      
      // Simple query without compound indexes to avoid Firestore index requirements
      return _firestore
          .collection(_collectionName)
          .limit(20)
          .snapshots()
          .handleError((error) {
        print('Firestore stream error: $error');
        throw error;
      })
          .map((snapshot) {
        try {
          print('Received ${snapshot.docs.length} job documents');
          
          final jobs = snapshot.docs
              .map((doc) {
                try {
                  final data = doc.data() as Map<String, dynamic>;
                  print('Processing document ${doc.id}: $data');
                  return Job.fromFirestore(data, doc.id);
                } catch (e) {
                  print('Error processing document ${doc.id}: $e');
                  return null;
                }
              })
              .where((job) => job != null)
              .cast<Job>()
              .where((job) {
                // Show approved or active jobs
                if (job.status != 'approved' && job.status != 'active') return false;
                
                // Filter by location if provided (case insensitive contains)
                if (location != null && location.isNotEmpty) {
                  if (!job.location.toLowerCase().contains(location.toLowerCase())) {
                    return false;
                  }
                }
                
                // Filter by category if provided (case insensitive contains)
                if (category != null && category.isNotEmpty) {
                  if (!job.category.toLowerCase().contains(category.toLowerCase())) {
                    return false;
                  }
                }
                
                return true;
              })
              .take(10) // Limit to 10 jobs for "Jobs for you" section
              .toList();
              
          print('Filtered to ${jobs.length} approved jobs');
          return jobs;
        } catch (e) {
          print('Error mapping snapshot to jobs: $e');
          rethrow;
        }
      });
    } catch (e) {
      print('Error in getJobsForUser: $e');
      rethrow;
    }
  }

  /// Fetch a single job by ID
  static Future<Job?> getJobById(String jobId) async {
    try {
      DocumentSnapshot doc = await _firestore
          .collection(_collectionName)
          .doc(jobId)
          .get();

      if (doc.exists) {
        return Job.fromFirestore(doc.data() as Map<String, dynamic>, doc.id);
      }
      return null;
    } catch (e) {
      print('Error fetching job: $e');
      return null;
    }
  }

  /// Search jobs by title, company, or location
  static Stream<List<Job>> searchJobs(String searchTerm) {
    // Simple query without compound indexes
    return _firestore
        .collection(_collectionName)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Job.fromFirestore(doc.data(), doc.id))
          .where((job) {
        // Filter approved/active jobs first
        if (job.status != 'approved' && job.status != 'active') return false;
        
        // Then filter by search term
        final searchLower = searchTerm.toLowerCase();
        return job.title.toLowerCase().contains(searchLower) ||
               job.company.toLowerCase().contains(searchLower) ||
               job.location.toLowerCase().contains(searchLower) ||
               job.category.toLowerCase().contains(searchLower);
      }).toList();
    });
  }

  /// Get jobs by category
  static Stream<List<Job>> getJobsByCategory(String category) {
    return _firestore
        .collection(_collectionName)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Job.fromFirestore(doc.data(), doc.id))
          .where((job) => 
              (job.status == 'approved' || job.status == 'active') && 
              job.category.toLowerCase() == category.toLowerCase())
          .toList();
    });
  }
}