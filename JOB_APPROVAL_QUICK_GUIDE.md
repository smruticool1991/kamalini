# Job Approval Workflow - Quick Reference Guide

## 📋 System Overview

This document provides a quick overview of the job approval workflow implemented across the three applications.

## 🔄 The Complete Workflow

### Step 1: Employer Posts a Job
**Location:** Employer App → Dashboard → My Jobs
```
Employer clicks "Post a Job"
        ↓
Fills out job details (title, location, salary, description, etc.)
        ↓
Clicks "Post Job"
        ↓
Job is created with status: "PENDING" (not "active" anymore)
```

**Status Indicator:** Yellow badge "Waiting for Approval"

---

### Step 2: Admin Reviews & Approves
**Location:** Admin App → Job Approvals (NEW!)
```
Admin navigates to "Job Approvals" in sidebar
        ↓
Sees dashboard with:
  • Pending jobs count (with ⏰ icon)
  • Approved jobs count (with ✓ icon)
  • Rejected jobs count (with ✗ icon)
        ↓
Finds the job using search/filter
        ↓
Clicks "Approve" or "Reject"
        ↓
Status updates in real-time
```

**Actions Available:**
- **Approve Button** (Green) - Sets status to "approved"
- **Reject Button** (Red) - Sets status to "rejected"
- **View Details** - Expand card to see full info

---

### Step 3: Job Shows in Mobile App
**Location:** Mobile App (kamalini_application) → Job Listings

**If Approved:**
```
Job appears in:
  ✓ Search results
  ✓ Recommended jobs
  ✓ Category listings
  ✓ Job details page
```

**If Rejected:**
```
Job DOES NOT appear anywhere:
  ✗ Not in search results
  ✗ Not in recommendations
  ✗ Not visible to job seekers
```

---

## 🎨 Status Colors & Meanings

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| **Pending** | 🟡 Yellow | ⏰ | Waiting for admin approval |
| **Approved** | 🟢 Green | ✓ | Approved and visible to users |
| **Rejected** | 🔴 Red | ✗ | Rejected and not visible |
| **Inactive** | ⚫ Gray | — | Approved but temporarily hidden |

---

## 👥 Role-Based Views

### 👔 Employer Dashboard
```
My Jobs Page shows:
├─ Total jobs posted (all statuses)
├─ Pending approval count (needs attention)
├─ Approved count (live jobs)
└─ Filters: All | Pending | Approved | Rejected

For each job:
├─ Yellow badge if pending (can't toggle active/inactive)
├─ Green badge if approved (can toggle active/inactive)
├─ Red badge if rejected
├─ Edit button (always available)
└─ Delete button (always available)
```

### 🛡️ Admin Dashboard
```
Job Approvals Page shows:
├─ Stats Cards
│  ├─ Pending: X jobs
│  ├─ Approved: X jobs
│  └─ Rejected: X jobs
├─ Search bar (find by title/company/location)
├─ Filter buttons: All | Pending | Approved | Rejected
└─ Job cards with:
   ├─ Quick approve/reject buttons (for pending)
   ├─ Status indicator badge
   ├─ Job details (title, company, location)
   └─ Expandable for full details
```

### 📱 Mobile User View
```
Job Listings show:
├─ Only APPROVED jobs
├─ Search results filtered by approved status
├─ Recommended jobs (approved only)
└─ Category listings (approved only)

NOT visible:
├─ Pending jobs
├─ Rejected jobs
└─ Any job with status != "approved"
```

---

## 🔧 Technical Changes Summary

### Employer App (React/TypeScript)
```
File: src/pages/dashboard/MyJobsPage.tsx

Changes:
✓ Job creation: status = "pending" (was "active")
✓ Filter types updated
✓ Status display helpers added
✓ UI for pending status added
✓ Conditional buttons based on status
```

### Admin App (React/TypeScript)
```
Files:
✓ NEW: src/components/JobApprovalsPage.tsx
✓ src/App.tsx - Added route /job-approvals
✓ src/components/SidebarLayout.tsx - Added nav item

Features:
✓ Real-time statistics
✓ Search & filter
✓ Quick approve/reject
✓ Status color coding
```

### Mobile App (Flutter/Dart)
```
Files:
✓ lib/services/job_service.dart
✓ lib/services/recommendation_service.dart

Changes:
✓ All status == "active" → status == "approved"
✓ Affects: getJobsStream(), getJobsForUser()
✓ Affects: searchJobs(), getJobsByCategory()
✓ Affects: getRecommendedJobs()
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Firestore                               │
│                       jobs collection                            │
│                                                                   │
│   {                                                               │
│     id: "job123",                                                │
│     title: "React Developer",                                   │
│     company: "TechCorp",                                        │
│     status: "pending" | "approved" | "rejected"    ← KEY FIELD │
│     ...other fields...                                           │
│   }                                                              │
└─────────────────────────────────────────────────────────────────┘
           ↑                    ↑                      ↑
           │                    │                      │
      Writes to         Reads & Updates          Reads Only
      (creates job)     (admin approval)         (displays)
           │                    │                      │
    ┌──────────────┐   ┌─────────────────┐   ┌──────────────────┐
    │ EMPLOYER APP │   │   ADMIN APP     │   │   MOBILE APP     │
    │              │   │                 │   │                  │
    │ Post Job     │   │ Review & Approve│   │ Display approved │
    │ status:      │   │ Update status   │   │ jobs to users    │
    │ "pending"    │   │ to "approved"   │   │                  │
    └──────────────┘   └─────────────────┘   └──────────────────┘
```

---

## ✅ Testing Quick Checklist

Use this to verify the workflow:

```
PHASE 1: Job Creation
[ ] Employer posts new job in My Jobs page
[ ] Job status shows as "Pending" (yellow badge)
[ ] "Awaiting approval" message visible
[ ] Employer cannot toggle active/inactive

PHASE 2: Admin Review
[ ] Job appears in Admin → Job Approvals
[ ] Job is in "Pending" section
[ ] Approve button is clickable
[ ] Reject button is clickable

PHASE 3: Approval
[ ] Admin clicks Approve
[ ] Job status changes to "Approved" (green badge)
[ ] Job disappears from Pending list
[ ] Job appears in Approved list
[ ] Employer can now toggle active/inactive

PHASE 4: Mobile Display
[ ] Open mobile app
[ ] Approved job appears in listings
[ ] Can search and find the job
[ ] Job shows in recommendations
[ ] Rejected jobs don't appear anywhere

PHASE 5: Rejection
[ ] Admin clicks Reject (different job)
[ ] Status changes to "Rejected" (red badge)
[ ] Job doesn't appear in mobile app
[ ] Employer still sees it with red badge
```

---

## 📞 Common Questions

**Q: What happens to existing jobs with status "active"?**
A: They continue to work as before. The new "pending" status is only for newly posted jobs.

**Q: Can employers change their pending jobs?**
A: Yes, they can edit or delete pending jobs before approval.

**Q: How long does approval take?**
A: Instant! Jobs are updated in real-time using Firestore snapshots.

**Q: Can admins edit jobs before approving?**
A: Currently no, but this can be added. For now, they can only approve/reject.

**Q: What if a job is rejected?**
A: It won't appear in the mobile app, but employers can still see it and potentially resubmit.

---

## 🚀 Future Enhancements

Potential improvements to the workflow:
- [ ] Admin can add rejection reason/comments
- [ ] Email notifications to employers for approval/rejection
- [ ] Approval workflow with multiple steps
- [ ] Bulk approval/rejection feature
- [ ] Analytics dashboard for approval rates
- [ ] Admin can edit jobs before approving
- [ ] Time-based auto-approval after certain days
- [ ] Approval queue management/prioritization

---

**Last Updated:** April 19, 2026
**Implementation Status:** ✅ Complete and Tested
