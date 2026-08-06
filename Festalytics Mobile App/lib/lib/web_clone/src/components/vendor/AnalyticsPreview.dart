import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../services/analytics_service.dart';

class AnalyticsPreview extends StatelessWidget {
  final VendorAnalyticsSnapshot data;
  const AnalyticsPreview({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Revenue', style: TextStyle(color: AppColors.muted, fontSize: 12)),
          Text(formatMoney(data.revenue), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
        ])),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Confirmed', style: TextStyle(color: AppColors.muted, fontSize: 12)),
          Text('${data.confirmedBookings}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
        ])),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Pending', style: TextStyle(color: AppColors.muted, fontSize: 12)),
          Text('${data.pendingRequests}', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: data.pendingRequests > 0 ? AppColors.warning : AppColors.text)),
        ])),
      ]),
      const SizedBox(height: 16),
      const Divider(),
      const SizedBox(height: 8),
      ...data.recentRows.take(3).map((r) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(children: [
          Expanded(child: Text(r['id']?.toString() ?? r['docId']?.toString() ?? 'Item', style: const TextStyle(fontWeight: FontWeight.w600))),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: (r['status']?.toString() ?? '').toLowerCase().contains('confirm') ? AppColors.success.withValues(alpha: .12) : AppColors.warning.withValues(alpha: .12),
              borderRadius: BorderRadius.circular(99),
            ),
            child: Text(r['status']?.toString() ?? 'New', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: (r['status']?.toString() ?? '').toLowerCase().contains('confirm') ? AppColors.success : AppColors.warning)),
          ),
        ]),
      )),
    ]);
  }
}
