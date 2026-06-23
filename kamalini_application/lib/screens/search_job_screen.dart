import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../main.dart' show JobDetailsScreen, JobListItem;
import '../services/recommendation_service.dart';

class SearchJobScreen extends StatefulWidget {
  final String? initialKeyword;
  const SearchJobScreen({super.key, this.initialKeyword});
  @override
  State<SearchJobScreen> createState() => _SearchJobScreenState();
}

class _SearchJobScreenState extends State<SearchJobScreen> {
  final _keywordController = TextEditingController();
  final _locationController = TextEditingController();
  final _keywordFocus = FocusNode();
  final _locationFocus = FocusNode();
  final _keywordLayerLink = LayerLink();
  final _locationLayerLink = LayerLink();

  // Local cache loaded once from Firestore
  List<Map<String, dynamic>> _allJobs = [];
  bool _cacheLoaded = false;

  List<String> _keywordSuggestions = [];
  List<String> _locationSuggestions = [];

  OverlayEntry? _keywordOverlay;
  OverlayEntry? _locationOverlay;
  Timer? _debounce;

  List<Map<String, dynamic>> _results = [];
  bool _isSearching = false;
  bool _hasSearched = false;

  static const List<String> _mostSearched = [
    'UI/UX Designer',
    'DevOps Engineer',
    'IT Services & Consulting',
    'UX, Design',
    'UI / UX',
    'Web Design',
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _loadCache();
    _loadRecommendedJobs();
    _keywordController.addListener(_onKeywordChanged);
    _locationController.addListener(_onLocationChanged);
    if (widget.initialKeyword != null && widget.initialKeyword!.isNotEmpty) {
      _keywordController.text = widget.initialKeyword!;
      WidgetsBinding.instance.addPostFrameCallback((_) => _search());
    }
    _keywordFocus.addListener(() {
      if (!_keywordFocus.hasFocus) _removeKeywordOverlay();
    });
    _locationFocus.addListener(() {
      if (!_locationFocus.hasFocus) _removeLocationOverlay();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _keywordController.dispose();
    _locationController.dispose();
    _keywordFocus.dispose();
    _locationFocus.dispose();
    _removeKeywordOverlay();
    _removeLocationOverlay();
    super.dispose();
  }

  // ── Cache ──────────────────────────────────────────────────────────────────
  Future<void> _loadCache() async {
    try {
      final snap = await FirebaseFirestore.instance.collection('jobs').get();
      _allJobs = snap.docs.where((d) {
        final status = (d.data()['status'] ?? 'approved').toString();
        return status == 'approved' || status == 'active';
      }).map((d) {
        final data = d.data();

        // Compute time-ago string from createdAt
        String timeAgo = (data['posted'] ?? '').toString();
        final createdAtRaw = data['createdAt'];
        if (createdAtRaw != null) {
          try {
            DateTime dt;
            if (createdAtRaw is Timestamp) {
              dt = createdAtRaw.toDate();
            } else {
              dt = DateTime.parse(createdAtRaw.toString());
            }
            final diff = DateTime.now().difference(dt);
            if (diff.inDays > 0) {
              timeAgo = '${diff.inDays} Day${diff.inDays > 1 ? 's' : ''} ago';
            } else if (diff.inHours > 0) {
              timeAgo = '${diff.inHours} Hour${diff.inHours > 1 ? 's' : ''} ago';
            } else {
              timeAgo = 'Just now';
            }
          } catch (_) {}
        }

        // Derive job-type badges
        final rawBadges = List<String>.from(data['badges'] ?? []);
        List<String> badges;
        if (rawBadges.isNotEmpty && rawBadges.any((b) => b.isNotEmpty)) {
          badges = rawBadges;
        } else {
          final exp = (data['experience'] ?? '').toString().toLowerCase();
          badges = [];
          if (exp.contains('senior') || exp.contains('lead')) {
            badges.add('Executive');
          } else if (exp.contains('entry')) {
            badges.add('Entry Level');
          }
          badges.add('Full-Time');
          badges.add('Remote');
        }

        return {
          'id': d.id,
          'companyId': data['companyId'] ?? '',
          'title': data['title'] ?? '',
          'company': data['company'] ?? '',
          'category': data['category'] ?? '',
          'salary': data['salary'] ?? '',
          'location': data['location'] ?? '',
          'posted': timeAgo,
          'rating': (data['rating'] ?? '4.5').toString(),
          'badges': badges,
          'description': data['description'] ?? '',
          'experience': data['experience'] ?? '',
          'currency': data['currency'] ?? '₹',
        };
      }).toList();
      if (mounted) setState(() => _cacheLoaded = true);
    } catch (_) {}
  }

  // ── Live keyword suggestions ───────────────────────────────────────────────
  void _onKeywordChanged() {
    _debounce?.cancel();
    final query = _keywordController.text.trim().toLowerCase();
    if (query.isEmpty) {
      _removeKeywordOverlay();
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 280), () {
      if (!_cacheLoaded || !mounted) return;
      final seen = <String>{};
      final list = <String>[];
      for (final job in _allJobs) {
        for (final field in ['title', 'company', 'category']) {
          final val = job[field].toString();
          if (val.toLowerCase().contains(query) && seen.add(val)) list.add(val);
        }
        if (list.length >= 8) break;
      }
      setState(() => _keywordSuggestions = list);
      list.isEmpty ? _removeKeywordOverlay() : _showKeywordOverlay();
    });
  }

  // ── Live location suggestions ──────────────────────────────────────────────
  void _onLocationChanged() {
    _debounce?.cancel();
    final query = _locationController.text.trim().toLowerCase();
    if (query.isEmpty) {
      _removeLocationOverlay();
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 280), () {
      if (!_cacheLoaded || !mounted) return;
      final seen = <String>{};
      final list = <String>[];
      for (final job in _allJobs) {
        final loc = job['location'].toString();
        if (loc.toLowerCase().contains(query) && seen.add(loc)) {
          list.add(loc);
          if (list.length >= 8) break;
        }
      }
      setState(() => _locationSuggestions = list);
      list.isEmpty ? _removeLocationOverlay() : _showLocationOverlay();
    });
  }

  // ── Overlay helpers ────────────────────────────────────────────────────────
  void _showKeywordOverlay() {
    _removeKeywordOverlay();
    if (_keywordSuggestions.isEmpty) return;
    final width = MediaQuery.of(context).size.width - 32;
    _keywordOverlay = OverlayEntry(
      builder: (_) => _SuggestionDropdown(
        layerLink: _keywordLayerLink,
        suggestions: _keywordSuggestions,
        icon: Icons.work_outline,
        fieldWidth: width,
        onSelect: (val) {
          _keywordController.text = val;
          _debounce?.cancel();
          _keywordController.selection =
              TextSelection.collapsed(offset: val.length);
          _removeKeywordOverlay();
          _keywordFocus.unfocus();
        },
      ),
    );
    Overlay.of(context).insert(_keywordOverlay!);
  }

  void _removeKeywordOverlay() {
    _keywordOverlay?.remove();
    _keywordOverlay = null;
  }

  void _showLocationOverlay() {
    _removeLocationOverlay();
    if (_locationSuggestions.isEmpty) return;
    final width = MediaQuery.of(context).size.width - 32;
    _locationOverlay = OverlayEntry(
      builder: (_) => _SuggestionDropdown(
        layerLink: _locationLayerLink,
        suggestions: _locationSuggestions,
        icon: Icons.location_on_outlined,
        fieldWidth: width,
        onSelect: (val) {
          _locationController.text = val;
          _debounce?.cancel();
          _locationController.selection =
              TextSelection.collapsed(offset: val.length);
          _removeLocationOverlay();
          _locationFocus.unfocus();
        },
      ),
    );
    Overlay.of(context).insert(_locationOverlay!);
  }

  void _removeLocationOverlay() {
    _locationOverlay?.remove();
    _locationOverlay = null;
  }

  // ── Navigate to detail ─────────────────────────────────────────────────────
  void _openDetail(Map<String, dynamic> job) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => JobDetailsScreen(
          jobId: job['id']?.toString() ?? '',
          companyId: job['companyId']?.toString() ?? '',
          title: job['title']?.toString() ?? '',
          company: job['company']?.toString() ?? '',
          location: job['location']?.toString() ?? '',
          rating: job['rating']?.toString() ?? '4.5',
          badges: List<String>.from(job['badges'] ?? []),
          posted_days_ago: job['posted']?.toString() ?? '',
          salary: job['salary']?.toString() ?? '',
          description: job['description']?.toString() ?? '',
          experience: job['experience']?.toString() ?? '',
          category: job['category']?.toString() ?? '',
          currency: job['currency']?.toString() ?? '₹',
        ),
      ),
    );
  }

  // ── Search ─────────────────────────────────────────────────────────────────
  Future<void> _search() async {
    _removeKeywordOverlay();
    _removeLocationOverlay();
    FocusScope.of(context).unfocus();

    final keyword = _keywordController.text.trim().toLowerCase();
    final location = _locationController.text.trim().toLowerCase();

    setState(() {
      _isSearching = true;
      _hasSearched = true;
      _results = [];
    });

    if (!_cacheLoaded) await _loadCache();

    final filtered = _allJobs.where((job) {
      final matchesKeyword = keyword.isEmpty ||
          job['title'].toString().toLowerCase().contains(keyword) ||
          job['company'].toString().toLowerCase().contains(keyword) ||
          job['category'].toString().toLowerCase().contains(keyword);
      final matchesLocation = location.isEmpty ||
          job['location'].toString().toLowerCase().contains(location);
      return matchesKeyword && matchesLocation;
    }).toList();

    // Save search term to history for recommendations
    if (keyword.isNotEmpty) {
      RecommendationService.saveSearchTerm(keyword);
    }

    setState(() {
      _results = filtered;
      _isSearching = false;
    });
  }

  void _searchByTag(String tag) {
    _keywordController.text = tag;
    _search();
  }

  // ── Build ──────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        _removeKeywordOverlay();
        _removeLocationOverlay();
        FocusScope.of(context).unfocus();
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // AppBar
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 38,
                        height: 38,
                        decoration: const BoxDecoration(
                          color: Color(0xFFF1F5F9),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.arrow_back,
                            size: 20, color: Colors.black87),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Search Job',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1F2937),
                      ),
                    ),
                  ],
                ),
              ),

              // Search fields
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    CompositedTransformTarget(
                      link: _keywordLayerLink,
                      child: _SuggestionField(
                        controller: _keywordController,
                        focusNode: _keywordFocus,
                        hint: 'Job Title, keywords, or company',
                        icon: Icons.work_outline,
                        onSubmitted: (_) => _search(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    CompositedTransformTarget(
                      link: _locationLayerLink,
                      child: _SuggestionField(
                        controller: _locationController,
                        focusNode: _locationFocus,
                        hint: 'Job Location',
                        icon: Icons.my_location_outlined,
                        onSubmitted: (_) => _search(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSearching ? null : _search,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          elevation: 0,
                        ),
                        child: _isSearching
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : const Text(
                                'Search Jobs',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              Expanded(
                child:
                    _hasSearched ? _buildResults() : _buildDefaultContent(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Default content (before any search) ──────────────────────────────────
  Widget _buildDefaultContent() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Most Searched
          const Text(
            'Most Search',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _mostSearched
                .map((tag) => _SearchChip(
                      label: tag,
                      onTap: () => _searchByTag(tag),
                    ))
                .toList(),
          ),
          const SizedBox(height: 24),

          // Interview banner
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFBFDBFE)),
            ),
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Boost Your Interview Success with JobBoard Team Tips',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                          elevation: 0,
                        ),
                        child: const Text(
                          'Start Preparing',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                _buildTeamIllustration(),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Recommend Job
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recommend Job',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1F2937)),
              ),
              GestureDetector(
                onTap: () {},
                child: const Text(
                  'See All',
                  style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFF2563EB),
                      fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildRecommendedJobs(),
        ],
      ),
    );
  }

  // ── Search results list ───────────────────────────────────────────────────
  Widget _buildResults() {
    if (_isSearching) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_results.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 12),
            const Text(
              'No jobs found',
              style: TextStyle(fontSize: 16, color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 4),
            const Text(
              'Try different keywords or location',
              style: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      itemCount: _results.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final job = _results[i];
        return JobListItem(
          jobId: job['id'] ?? '',
          companyId: job['companyId'] ?? '',
          title: job['title'] ?? '',
          company: job['company'] ?? '',
          location: job['location'] ?? '',
          rating: job['rating']?.toString() ?? '4.5',
          badges: List<String>.from(job['badges'] ?? []),
          posted_days_ago: job['posted'] ?? '',
          salary_range: job['salary'] ?? '',
          description: job['description'] ?? '',
          experience: job['experience'] ?? '',
          category: job['category'] ?? '',
          currency: job['currency'] ?? '₹',
        );
      },
    );
  }

  // ── Recommended jobs ─────────────────────────────────────────────────────
  List<Map<String, dynamic>> _recommendedJobs = [];
  bool _isLoadingRecommendations = true;

  Future<void> _loadRecommendedJobs() async {
    try {
      final jobs = await RecommendationService.getRecommendedJobs();
      if (mounted) {
        setState(() {
          _recommendedJobs = jobs;
          _isLoadingRecommendations = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingRecommendations = false);
    }
  }

  Widget _buildRecommendedJobs() {
    if (_isLoadingRecommendations) {
      return const SizedBox(
        height: 195,
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (_recommendedJobs.isEmpty) {
      return const SizedBox(
        height: 80,
        child: Center(
          child: Text('No recommendations yet', style: TextStyle(color: Colors.grey)),
        ),
      );
    }
    return SizedBox(
      height: 195,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _recommendedJobs.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) => _HorizontalJobCard(
          job: _recommendedJobs[i],
          onTap: () => _openDetail(_recommendedJobs[i]),
        ),
      ),
    );
  }

  Widget _buildTeamIllustration() {
    return SizedBox(
      width: 100,
      height: 80,
      child: Stack(
        children: [
          Positioned(
            left: 0,
            bottom: 0,
            child: _avatar(const Color(0xFF93C5FD), 52),
          ),
          Positioned(
            left: 22,
            bottom: 0,
            child: _avatar(const Color(0xFFC084FC), 58),
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: _avatar(const Color(0xFFFBBF24), 54),
          ),
        ],
      ),
    );
  }

  Widget _avatar(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      child: const Icon(Icons.person, color: Colors.white, size: 28),
    );
  }
}

// ── Reusable widgets ─────────────────────────────────────────────────────────

// Text field with FocusNode for overlay suggestion support
class _SuggestionField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String hint;
  final IconData icon;
  final ValueChanged<String>? onSubmitted;

  const _SuggestionField({
    required this.controller,
    required this.focusNode,
    required this.hint,
    required this.icon,
    this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE5E7EB)),
        borderRadius: BorderRadius.circular(10),
        color: Colors.white,
      ),
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        onSubmitted: onSubmitted,
        textInputAction: TextInputAction.search,
        style: const TextStyle(fontSize: 14, color: Color(0xFF1F2937)),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle:
              const TextStyle(fontSize: 14, color: Color(0xFF9CA3AF)),
          prefixIcon:
              Icon(icon, size: 20, color: const Color(0xFF2563EB)),
          border: InputBorder.none,
          contentPadding:
              const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        ),
      ),
    );
  }
}

// Overlay dropdown for live suggestions
class _SuggestionDropdown extends StatelessWidget {
  final LayerLink layerLink;
  final List<String> suggestions;
  final IconData icon;
  final double fieldWidth;
  final ValueChanged<String> onSelect;

  const _SuggestionDropdown({
    required this.layerLink,
    required this.suggestions,
    required this.icon,
    required this.fieldWidth,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      width: fieldWidth,
      child: CompositedTransformFollower(
        link: layerLink,
        showWhenUnlinked: false,
        offset: const Offset(0, 52),
        child: Material(
          elevation: 8,
          shadowColor: Colors.black26,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            constraints: BoxConstraints(
                maxHeight:
                    suggestions.length > 8 ? 384 : suggestions.length * 48.0),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: ListView.builder(
              padding: EdgeInsets.zero,
              shrinkWrap: true,
              itemCount: suggestions.length,
              itemBuilder: (_, i) {
                final item = suggestions[i];
                final isFirst = i == 0;
                final isLast = i == suggestions.length - 1;
                return InkWell(
                  onTap: () => onSelect(item),
                  borderRadius: BorderRadius.vertical(
                    top: isFirst ? const Radius.circular(12) : Radius.zero,
                    bottom: isLast ? const Radius.circular(12) : Radius.zero,
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      border: isLast
                          ? null
                          : const Border(
                              bottom:
                                  BorderSide(color: Color(0xFFF3F4F6))),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    child: Row(
                      children: [
                        Icon(icon, size: 16, color: const Color(0xFF2563EB)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(item,
                              style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF1F2937),
                                  fontWeight: FontWeight.w500),
                              overflow: TextOverflow.ellipsis),
                        ),
                        const Icon(Icons.north_west,
                            size: 13, color: Color(0xFF9CA3AF)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _SearchChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _SearchChip({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: const Color(0xFFE5E7EB)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.search, size: 14, color: Color(0xFF6B7280)),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF374151),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HorizontalJobCard extends StatelessWidget {
  final Map<String, dynamic> job;
  final VoidCallback? onTap;
  const _HorizontalJobCard({required this.job, this.onTap});

  String _timeAgo(String? createdAt) {
    if (createdAt == null || createdAt.isEmpty) return job['posted']?.toString() ?? '';
    try {
      final created = DateTime.parse(createdAt);
      final diff = DateTime.now().difference(created);
      if (diff.inDays > 0) return '${diff.inDays} Day${diff.inDays > 1 ? 's' : ''} ago';
      if (diff.inHours > 0) return '${diff.inHours} Hour${diff.inHours > 1 ? 's' : ''} ago';
      return 'Just now';
    } catch (_) {
      return job['posted']?.toString() ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final experience = (job['experience'] ?? '').toString();
    final category = (job['category'] ?? '').toString();
    final salary = (job['salary'] ?? '').toString();
    final posted = _timeAgo(job['createdAt']?.toString());

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 260,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Title + icon
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        job['title'] ?? '',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        job['company'] ?? '',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF2563EB),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.work, color: Colors.white, size: 18),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Salary
            if (salary.isNotEmpty)
              Row(
                children: [
                  const Icon(Icons.currency_rupee, size: 14, color: Color(0xFF2563EB)),
                  const SizedBox(width: 2),
                  Expanded(
                    child: Text(
                      salary,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF1F2937),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            // Experience
            if (experience.isNotEmpty) ...[
              const SizedBox(height: 5),
              Row(
                children: [
                  const Icon(Icons.work_history, size: 14, color: Color(0xFF7C3AED)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      experience,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF4B5563),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ],
            // Skills / Category
            if (category.isNotEmpty) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.star_outline, size: 14, color: Color(0xFFF59E0B)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      category,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 10),
            // Location + time
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.location_on, size: 13, color: Color(0xFF6B7280)),
                    const SizedBox(width: 2),
                    Text(
                      job['location'] ?? '',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
                if (posted.isNotEmpty)
                  Text(
                    posted,
                    style: const TextStyle(fontSize: 10, color: Color(0xFF9CA3AF)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

