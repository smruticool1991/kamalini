import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/candidate_plan.dart';
import '../models/coupon.dart';
import '../services/plan_service.dart';

class PlansScreen extends StatefulWidget {
  const PlansScreen({super.key});

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  String? _activePlanId;
  DateTime? _planExpiresAt;
  String? _purchasingPlanId;

  final _couponController = TextEditingController();
  Coupon? _appliedCoupon;
  bool _applyingCoupon = false;
  String? _couponError;

  @override
  void initState() {
    super.initState();
    _loadCurrentPlan();
  }

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _loadCurrentPlan() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final doc = await FirebaseFirestore.instance.collection('users').doc(user.uid).get();
    final data = doc.data();
    if (data == null || !mounted) return;
    final expiresAt = data['planExpiresAt']?.toString();
    setState(() {
      _activePlanId = data['activePlanId']?.toString();
      _planExpiresAt = expiresAt != null ? DateTime.tryParse(expiresAt) : null;
    });
  }

  bool get _hasActivePlan => _planExpiresAt != null && _planExpiresAt!.isAfter(DateTime.now());

  Future<void> _applyCoupon() async {
    setState(() { _applyingCoupon = true; _couponError = null; });
    try {
      final coupon = await PlanService.validateCoupon(_couponController.text);
      setState(() => _appliedCoupon = coupon);
    } catch (e) {
      setState(() { _appliedCoupon = null; _couponError = e.toString().replaceFirst('Exception: ', ''); });
    } finally {
      if (mounted) setState(() => _applyingCoupon = false);
    }
  }

  void _removeCoupon() {
    setState(() { _appliedCoupon = null; _couponError = null; _couponController.clear(); });
  }

  num _finalPrice(CandidatePlan plan) => _appliedCoupon != null ? _appliedCoupon!.apply(plan.price) : plan.price;

  Future<void> _purchase(CandidatePlan plan) async {
    setState(() => _purchasingPlanId = plan.id);
    try {
      await PlanService.purchasePlan(plan, coupon: _appliedCoupon);
      await _loadCurrentPlan();
      if (mounted) {
        setState(() { _appliedCoupon = null; _couponController.clear(); });
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${plan.name} activated!'), backgroundColor: Colors.green));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not activate plan: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _purchasingPlanId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        title: const Text('Upgrade to Premium',
            style: TextStyle(color: Color(0xFF1F2937), fontSize: 17, fontWeight: FontWeight.w600)),
      ),
      body: Column(
        children: [
          _buildCouponCard(),
          Expanded(
            child: StreamBuilder<List<CandidatePlan>>(
              stream: PlanService.activePlans(),
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return const Center(child: CircularProgressIndicator());
                }
                final plans = snapshot.data!;
                if (plans.isEmpty) {
                  return const Center(
                      child: Text('No plans available right now.', style: TextStyle(color: Color(0xFF6B7280))));
                }
                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  itemCount: plans.length,
                  itemBuilder: (context, index) {
                    final plan = plans[index];
                    final isCurrent = _hasActivePlan && _activePlanId == plan.id;
                    final purchasing = _purchasingPlanId == plan.id;
                    final finalPrice = _finalPrice(plan);
                    final hasDiscount = _appliedCoupon != null && finalPrice != plan.price;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isCurrent ? const Color(0xFF2D8C6B) : const Color(0xFFF0F0F0),
                          width: isCurrent ? 1.5 : 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(plan.name,
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1F2937))),
                              if (isCurrent)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                      color: const Color(0xFFE8F5F0), borderRadius: BorderRadius.circular(20)),
                                  child: const Text('Active',
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF2D8C6B))),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              if (hasDiscount) ...[
                                Text(
                                  '${plan.currency == 'INR' ? '₹' : plan.currency}${plan.price}',
                                  style: const TextStyle(
                                    fontSize: 15, color: Color(0xFF9CA3AF),
                                    decoration: TextDecoration.lineThrough,
                                  ),
                                ),
                                const SizedBox(width: 8),
                              ],
                              Text(
                                finalPrice == 0 ? 'Free' : '${plan.currency == 'INR' ? '₹' : plan.currency}${finalPrice}',
                                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF2D8C6B)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text('Valid for ${plan.durationLabel}',
                              style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
                          const SizedBox(height: 12),
                          ...candidatePlanFeatureDefs.where((f) => plan.featureFlags[f['key']] == true).map(
                                (f) => Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.check_circle, size: 15, color: Color(0xFF2D8C6B)),
                                      const SizedBox(width: 8),
                                      Expanded(
                                          child: Text(f['label']!,
                                              style: const TextStyle(fontSize: 13, color: Color(0xFF374151)))),
                                    ],
                                  ),
                                ),
                              ),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: (isCurrent || purchasing) ? null : () => _purchase(plan),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF2D8C6B),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: purchasing
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                          strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)))
                                  : Text(isCurrent ? 'Current Plan' : (finalPrice == 0 ? 'Activate' : 'Upgrade'),
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                            ),
                          ),
                        ],
                      ),
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

  Widget _buildCouponCard() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
      child: _appliedCoupon != null
          ? Row(
              children: [
                const Icon(Icons.local_offer, color: Color(0xFF2D8C6B), size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '${_appliedCoupon!.code} applied — ${_appliedCoupon!.discountLabel}',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1F2937)),
                  ),
                ),
                GestureDetector(
                  onTap: _removeCoupon,
                  child: const Icon(Icons.close, size: 18, color: Color(0xFF9CA3AF)),
                ),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _couponController,
                        textCapitalization: TextCapitalization.characters,
                        decoration: const InputDecoration(
                          hintText: 'Have a coupon code?',
                          hintStyle: TextStyle(fontSize: 13, color: Color(0xFF9CA3AF)),
                          isDense: true,
                          border: InputBorder.none,
                        ),
                        style: const TextStyle(fontSize: 14),
                      ),
                    ),
                    TextButton(
                      onPressed: _applyingCoupon ? null : _applyCoupon,
                      child: _applyingCoupon
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text('Apply', style: TextStyle(color: Color(0xFF2D8C6B), fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                if (_couponError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2, left: 2),
                    child: Text(_couponError!, style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
                  ),
              ],
            ),
    );
  }
}
