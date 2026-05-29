import 'package:flutter/material.dart';
import '../models/job.dart';
import '../services/job_service.dart';
import '../widgets/job_card.dart';

class JobsForYouSection extends StatelessWidget {
  final String? userLocation;
  final String? preferredCategory;

  const JobsForYouSection({
    Key? key,
    this.userLocation,
    this.preferredCategory,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Jobs for you',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              TextButton(
                onPressed: () {
                  // Navigate to full jobs list
                  _navigateToAllJobs(context);
                },
                child: const Text(
                  'See All',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.blue,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // Jobs stream
        StreamBuilder<List<Job>>(
          stream: JobService.getJobsForUser(
            location: userLocation,
            category: preferredCategory,
          ),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(),
                ),
              );
            }

            if (snapshot.hasError) {
              return Padding(
                padding: const EdgeInsets.all(16),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 48,
                          color: Colors.red,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Error loading jobs',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Please check your internet connection',
                          style: TextStyle(
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () {
                            // Trigger rebuild to retry
                            (context as Element).markNeedsBuild();
                          },
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }

            final jobs = snapshot.data ?? [];

            if (jobs.isEmpty) {
              return Padding(
                padding: const EdgeInsets.all(16),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        Icon(
                          Icons.work_off_outlined,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'No jobs available',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Check back later for new opportunities',
                          style: TextStyle(
                            color: Colors.grey[600],
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }

            return Column(
              children: jobs.map((job) {
                return JobCard(
                  job: job,
                  onTap: () => _navigateToJobDetail(context, job),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }

  void _navigateToJobDetail(BuildContext context, Job job) {
    // Navigate to job detail page
    Navigator.pushNamed(
      context,
      '/job-detail',
      arguments: job,
    );
  }

  void _navigateToAllJobs(BuildContext context) {
    // Navigate to all jobs page
    Navigator.pushNamed(context, '/all-jobs');
  }
}

class AllJobsPage extends StatefulWidget {
  const AllJobsPage({Key? key}) : super(key: key);

  @override
  State<AllJobsPage> createState() => _AllJobsPageState();
}

class _AllJobsPageState extends State<AllJobsPage> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('All Jobs'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search jobs, companies, locations...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: Colors.grey[50],
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
            ),
          ),
          
          // Jobs list
          Expanded(
            child: StreamBuilder<List<Job>>(
              stream: _searchQuery.isEmpty
                  ? JobService.getJobsStream()
                  : JobService.searchJobs(_searchQuery),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return const Center(
                    child: Text('Error loading jobs'),
                  );
                }

                final jobs = snapshot.data ?? [];

                if (jobs.isEmpty) {
                  return const Center(
                    child: Text('No jobs found'),
                  );
                }

                return ListView.builder(
                  itemCount: jobs.length,
                  itemBuilder: (context, index) {
                    final job = jobs[index];
                    return JobCard(
                      job: job,
                      onTap: () => _navigateToJobDetail(job),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _navigateToJobDetail(Job job) {
    Navigator.pushNamed(
      context,
      '/job-detail',
      arguments: job,
    );
  }
}