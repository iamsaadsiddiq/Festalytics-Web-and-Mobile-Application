import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/utils/formatters.dart';
import '../../../../../core/widgets/app_widgets.dart';

class AnalyticsTables extends StatelessWidget {
  final List<Map<String, dynamic>> rows;
  final String type;
  const AnalyticsTables({super.key, required this.rows, this.type = 'bookings'});

  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) {
      return const EmptyState(icon: Icons.table_chart_outlined, title: 'No records', subtitle: 'No data available for this period.');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('${type[0].toUpperCase()}${type.substring(1)} Overview', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Table(
              columnWidths: const {0: FlexColumnWidth(2.5), 1: FlexColumnWidth(1.5), 2: FlexColumnWidth(1.2)},
              border: TableBorder(
                top: BorderSide(color: AppColors.border),
                bottom: BorderSide(color: AppColors.border),
                left: BorderSide(color: AppColors.border),
                right: BorderSide(color: AppColors.border),
                horizontalInside: BorderSide(color: AppColors.border.withValues(alpha: .5)),
              ),
              children: [
                TableRow(
                  decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: .05)),
                  children: ['ID / Name', 'Status', 'Amount'].map((h) => Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(h, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                  )).toList(),
                ),
                ...rows.map((r) {
                  final customer = r['customer'] is Map ? Map<String, dynamic>.from(r['customer']) : null;
                  final name = customer?['name'] ?? r['customerName'] ?? r['id'] ?? r['docId'] ?? '-';
                  final status = r['status']?.toString() ?? 'new';
                  final fin = r['financials'] is Map ? Map<String, dynamic>.from(r['financials']) : null;
                  final amount = fin != null ? formatMoney(fin['grandTotal']) : (r['selectedMenu'] is Map ? formatMoney(r['estimatedAmount']) : '-');
                  final statusColor = status.toLowerCase().contains('confirm')
                      ? AppColors.success
                      : status.toLowerCase().contains('pending')
                          ? AppColors.warning
                          : status.toLowerCase().contains('decline')
                              ? AppColors.danger
                              : AppColors.muted;
                  return TableRow(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(10),
                        child: Text(name.length > 20 ? '${name.substring(0, 20)}...' : name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(10),
                        child: Text(status, style: TextStyle(color: statusColor, fontWeight: FontWeight.w700, fontSize: 12)),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(10),
                        child: Text(amount, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                      ),
                    ],
                  );
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
