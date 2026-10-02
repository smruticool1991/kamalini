// Feature flag keys/labels mirror admin-app/src/pages/dashboard/EmployeePlansPage.tsx (FEATURE_DEFS).
// Keep both lists in sync manually — there is no shared package between the two apps.
const List<Map<String, String>> candidatePlanFeatureDefs = [
  {'key': 'priorityProfile', 'label': 'Priority profile in recruiter search'},
  {'key': 'featuredBadge', 'label': '"Featured Candidate" badge'},
  {'key': 'highlightedProfile', 'label': 'Profile highlighted for recruiters'},
  {'key': 'earlyJobAccess', 'label': 'Early access to new job postings'},
  {'key': 'exclusivePremiumJobs', 'label': 'Exclusive premium jobs'},
  {'key': 'unlimitedApplications', 'label': 'Unlimited job applications'},
  {'key': 'oneClickApply', 'label': 'One-click apply'},
  {'key': 'profileViewers', 'label': 'Know who viewed your profile'},
  {'key': 'applicationTracking', 'label': 'Track application status'},
  {'key': 'analyticsDashboard', 'label': 'Application analytics dashboard'},
  {'key': 'trainingAccess', 'label': 'Access to Training & Education'},
  {'key': 'testsAccess', 'label': 'Access to Skill Tests'},
];

class CandidatePlan {
  final String id;
  final String name;
  final num price;
  final String currency;
  final int durationDays;
  final int? jobApplicationsPerMonth;
  final int? profileBoosts;
  final List<String> features;
  final Map<String, bool> featureFlags;
  final bool isActive;

  CandidatePlan({
    required this.id,
    required this.name,
    required this.price,
    required this.currency,
    required this.durationDays,
    required this.jobApplicationsPerMonth,
    required this.profileBoosts,
    required this.features,
    required this.featureFlags,
    required this.isActive,
  });

  factory CandidatePlan.fromFirestore(Map<String, dynamic> data, String id) {
    final rawFlags = data['featureFlags'];
    return CandidatePlan(
      id: id,
      name: data['name']?.toString() ?? '',
      price: (data['price'] as num?) ?? 0,
      currency: data['currency']?.toString() ?? 'INR',
      // Plans created before validity was configurable default to 30 days.
      durationDays: (data['durationDays'] as num?)?.toInt() ?? 30,
      jobApplicationsPerMonth: data['jobApplicationsPerMonth'] as int?,
      profileBoosts: data['profileBoosts'] as int?,
      features: (data['features'] as List?)?.map((f) => f.toString()).toList() ?? [],
      featureFlags: rawFlags is Map
          ? rawFlags.map((k, v) => MapEntry(k.toString(), v == true))
          : {},
      isActive: data['isActive'] == true,
    );
  }

  String get durationLabel {
    switch (durationDays) {
      case 7: return '7 days';
      case 15: return '15 days';
      case 30: return '1 month';
      case 60: return '2 months';
      case 90: return '3 months';
      case 180: return '6 months';
      case 365: return '1 year';
      default: return '$durationDays days';
    }
  }
}
