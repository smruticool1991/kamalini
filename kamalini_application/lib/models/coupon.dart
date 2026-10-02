class Coupon {
  final String id;
  final String code;
  final String discountType; // 'percentage' | 'flat'
  final num discountValue;
  final int? maxUses;
  final int usedCount;
  final DateTime? expiresAt;
  final bool isActive;

  Coupon({
    required this.id,
    required this.code,
    required this.discountType,
    required this.discountValue,
    required this.maxUses,
    required this.usedCount,
    required this.expiresAt,
    required this.isActive,
  });

  factory Coupon.fromFirestore(Map<String, dynamic> data, String id) {
    final expiresAtRaw = data['expiresAt']?.toString();
    return Coupon(
      id: id,
      code: (data['code'] ?? '').toString().toUpperCase(),
      discountType: data['discountType']?.toString() ?? 'percentage',
      discountValue: (data['discountValue'] as num?) ?? 0,
      maxUses: data['maxUses'] as int?,
      usedCount: (data['usedCount'] as num?)?.toInt() ?? 0,
      expiresAt: expiresAtRaw != null ? DateTime.tryParse(expiresAtRaw) : null,
      isActive: data['isActive'] == true,
    );
  }

  bool get isValid {
    if (!isActive) return false;
    if (expiresAt != null && expiresAt!.isBefore(DateTime.now())) return false;
    if (maxUses != null && usedCount >= maxUses!) return false;
    return true;
  }

  num apply(num amount) {
    final discounted = discountType == 'flat' ? amount - discountValue : amount - (amount * discountValue / 100);
    return discounted < 0 ? 0 : discounted;
  }

  String get discountLabel => discountType == 'flat' ? '₹$discountValue off' : '$discountValue% off';
}
