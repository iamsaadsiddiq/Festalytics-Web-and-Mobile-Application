import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';

class AnalyticsCharts extends StatelessWidget {
  final List<Map<String, dynamic>> data;
  const AnalyticsCharts({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return const Center(child: Text('No data available for charts.', style: TextStyle(color: AppColors.muted)));
    }

    final counts = <String, int>{};
    for (final r in data) {
      final status = (r['status']?.toString() ?? 'unknown').toLowerCase();
      counts[status] = (counts[status] ?? 0) + 1;
    }

    final chartData = counts.entries.toList();
    final total = chartData.fold<int>(0, (s, e) => s + e.value);
    if (total == 0) {
      return const Center(child: Text('No data to chart.', style: TextStyle(color: AppColors.muted)));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Status Distribution', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        const SizedBox(height: 16),
        ...chartData.map((entry) {
          final pct = (entry.value / total * 100).toStringAsFixed(1);
          final color = entry.key.contains('confirm')
              ? AppColors.success
              : entry.key.contains('pending')
                  ? AppColors.warning
                  : entry.key.contains('decline') || entry.key.contains('cancel')
                      ? AppColors.danger
                      : AppColors.primary;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('${entry.key[0].toUpperCase()}${entry.key.substring(1)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text('${entry.value} ($pct%)', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                ]),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: LinearProgressIndicator(
                    value: entry.value / total,
                    backgroundColor: color.withValues(alpha: .12),
                    valueColor: AlwaysStoppedAnimation(color),
                    minHeight: 8,
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
