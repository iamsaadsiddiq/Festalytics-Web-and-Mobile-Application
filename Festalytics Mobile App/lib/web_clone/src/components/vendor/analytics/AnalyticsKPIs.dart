import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/utils/formatters.dart';
import '../../../../../services/analytics_service.dart';

class AnalyticsKPIs extends StatelessWidget {
  final VendorAnalyticsSnapshot data;
  const AnalyticsKPIs({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _kpi('Total Bookings', '${data.totalBookings}', Icons.event_available, AppColors.primary),
        _kpi('Confirmed', '${data.confirmedBookings}', Icons.verified, AppColors.success),
        _kpi('Pending', '${data.pendingRequests}', Icons.pending_actions, AppColors.warning),
        _kpi('Revenue', formatMoney(data.revenue), Icons.payments, AppColors.primary),
        _kpi('Quotations', '${data.quotations}', Icons.request_quote, AppColors.accent),
      ],
    );
  }

  Widget _kpi(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withValues(alpha: .1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: color)),
                Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
