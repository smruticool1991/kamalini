class Job {
  final String id;
  final String title;
  final String company;
  final String description;
  final String location;
  final String salary;
  final String experience;
  final String category;
  final String status;
  final DateTime createdAt;
  final List<String> jobType;
  final double rating;

  Job({
    required this.id,
    required this.title,
    required this.company,
    required this.description,
    required this.location,
    required this.salary,
    required this.experience,
    required this.category,
    required this.status,
    required this.createdAt,
    this.jobType = const [],
    this.rating = 4.5,
  });

  factory Job.fromFirestore(Map<String, dynamic> data, String id) {
    try {
      print('Processing job document: $id');
      print('Job data: $data');
      
      return Job(
        id: id,
        title: data['title']?.toString() ?? 'Unknown Job',
        company: data['company']?.toString() ?? 'Unknown Company',
        description: data['description']?.toString() ?? '',
        location: data['location']?.toString() ?? 'Unknown Location',
        salary: data['salary']?.toString() ?? '',
        experience: data['experience']?.toString() ?? '',
        category: data['category']?.toString() ?? '',
        status: data['status']?.toString() ?? 'active',
        createdAt: _parseDateTime(data['createdAt']),
        jobType: Job._parseJobType(data['experience'], data['salary']),
        rating: 4.5,
      );
    } catch (e) {
      print('Error creating Job from Firestore data: $e');
      print('Problematic data: $data');
      rethrow;
    }
  }

  static DateTime _parseDateTime(dynamic timestamp) {
    try {
      if (timestamp == null) return DateTime.now();
      
      // Handle Firestore Timestamp
      if (timestamp.runtimeType.toString().contains('Timestamp')) {
        return timestamp.toDate();
      }
      
      // Handle string dates
      if (timestamp is String) {
        return DateTime.parse(timestamp);
      }
      
      // Handle milliseconds
      if (timestamp is int) {
        return DateTime.fromMillisecondsSinceEpoch(timestamp);
      }
      
      return DateTime.now();
    } catch (e) {
      print('Error parsing datetime: $e, timestamp: $timestamp');
      return DateTime.now();
    }
  }

  static List<String> _parseJobType(String? experience, String? salary) {
    List<String> types = [];
    
    // Add job type based on experience
    if (experience != null) {
      if (experience.toLowerCase().contains('senior') || 
          experience.toLowerCase().contains('lead')) {
        types.add('Executive');
      } else if (experience.toLowerCase().contains('entry')) {
        types.add('Entry Level');
      }
    }
    
    // Add employment type (you can modify based on your data)
    types.add('Full-Time');
    
    // Add remote option (you can add a field for this in Firestore)
    if (types.length < 3) {
      types.add('Remote');
    }
    
    return types;
  }

  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);
    
    if (difference.inDays > 0) {
      return '${difference.inDays} Day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} Hour${difference.inHours > 1 ? 's' : ''} ago';
    } else {
      return '${difference.inMinutes} Minute${difference.inMinutes > 1 ? 's' : ''} ago';
    }
  }
}