import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/utils/formatters.dart';

class BookingStats extends StatelessWidget {
  final List<Map<String, dynamic>> bookings;
  const BookingStats({super.key, required this.bookings});

  @override
  Widget build(BuildContext context) {
    int confirmed = 0, pending = 0, declined = 0, cancelled = 0;
    double revenue = 0;

    for (final r in bookings) {
      final status = (r['status'] ?? '').toString().toLowerCase();
      if (status.contains('confirm') || status.contains('complete')) { confirmed++; }
      else if (status.contains('pending')) { pending++; }
      else if (status.contains('decline')) { declined++; }
      else if (status.contains('cancel')) { cancelled++; }

      final fin = r['financials'];
      if (fin is Map) revenue += (fin['grandTotal'] ?? 0).toDouble();
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 18),
      child: Row(
        children: [
          _stat('Total', '${bookings.length}', Icons.list, AppColors.primary),
          _stat('Confirmed', '$confirmed', Icons.verified, AppColors.success),
          _stat('Pending', '$pending', Icons.pending, AppColors.warning),
          _stat('Declined', '$declined', Icons.cancel, AppColors.danger),
          _stat('Cancelled', '$cancelled', Icons.cancel_outlined, AppColors.muted),
          _stat('Revenue', formatMoney(revenue), Icons.payments, AppColors.accent),
        ],
      ),
    );
  }

  Widget _stat(String label, String value, IconData icon, Color color) {
    return Container(
      margin: const EdgeInsets.only(right: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: color.withValues(alpha: .1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: color)),
              Text(label, style: const TextStyle(fontSize: 10, color: AppColors.muted)),
            ],
          ),
        ],
      ),
    );
  }
}
