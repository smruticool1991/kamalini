// Feature flag keys/labels mirror admin-app/src/pages/dashboard/EmployeePlansPage.tsx (FEATURE_DEFS)
// and kamalini_application/lib/models/candidate_plan.dart (candidatePlanFeatureDefs).
// Keep all three in sync manually — there is no shared package between the apps.
export const candidatePlanFeatureDefs: { key: string; label: string }[] = [
  { key: 'priorityProfile', label: 'Priority profile in recruiter search' },
  { key: 'featuredBadge', label: '"Featured Candidate" badge' },
  { key: 'highlightedProfile', label: 'Profile highlighted for recruiters' },
  { key: 'earlyJobAccess', label: 'Early access to new job postings' },
  { key: 'exclusivePremiumJobs', label: 'Exclusive premium jobs' },
  { key: 'unlimitedApplications', label: 'Unlimited job applications' },
  { key: 'oneClickApply', label: 'One-click apply' },
  { key: 'profileViewers', label: 'Know who viewed your profile' },
  { key: 'applicationTracking', label: 'Track application status' },
  { key: 'analyticsDashboard', label: 'Application analytics dashboard' },
  { key: 'trainingAccess', label: 'Access to Training & Education' },
];
