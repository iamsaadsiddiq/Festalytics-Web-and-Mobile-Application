import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/utils/formatters.dart';
import '../../../../../core/widgets/app_widgets.dart';

class BookingTable extends StatelessWidget {
  final List<Map<String, dynamic>> rows;
  final String? statusFilter;
  final String? searchQuery;
  final int currentPage;
  final int rowsPerPage;
  final ValueChanged<int> onPageChanged;

  const BookingTable({
    super.key,
    required this.rows,
    this.statusFilter,
    this.searchQuery,
    this.currentPage = 0,
    this.rowsPerPage = 10,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context) {
    var filtered = rows.toList();

    if (statusFilter != null && statusFilter != 'all' && statusFilter!.isNotEmpty) {
      filtered = filtered.where((r) => (r['status'] ?? '').toString().toLowerCase().contains(statusFilter!)).toList();
    }
    if (searchQuery != null && searchQuery!.isNotEmpty) {
      final q = searchQuery!.toLowerCase();
      filtered = filtered.where((r) {
        final customer = r['customer'] is Map ? r['customer'] : null;
        final name = (customer?['name'] ?? r['customerName'] ?? '').toString().toLowerCase();
        final id = (r['id'] ?? r['docId'] ?? '').toString().toLowerCase();
        return name.contains(q) || id.contains(q);
      }).toList();
    }

    final totalPages = (filtered.length / rowsPerPage).ceil().clamp(1, 999);
    final displayRows = filtered.skip(currentPage * rowsPerPage).take(rowsPerPage).toList();

    if (filtered.isEmpty) {
      return const EmptyState(icon: Icons.search_off, title: 'No matching bookings', subtitle: 'Try adjusting your filters or search query.');
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${filtered.length} booking(s)', style: const TextStyle(color: AppColors.muted, fontSize: 13)),
              Text('Page ${currentPage + 1} of $totalPages', style: const TextStyle(color: AppColors.muted, fontSize: 13)),
            ],
          ),
        ),
        ...displayRows.map((r) {
          final customer = r['customer'] is Map ? Map<String, dynamic>.from(r['customer']) : null;
          final name = customer?['name'] ?? r['customerName'] ?? 'Guest';
          final fin = r['financials'] is Map ? Map<String, dynamic>.from(r['financials']) : null;
          final status = r['status']?.toString() ?? 'new';
          final eventDate = r['eventDate'] ?? (r['eventDetails'] is Map ? r['eventDetails']['date'] : null) ?? '';
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.primary.withValues(alpha: .1),
                  child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                      if (eventDate.isNotEmpty) Text(prettyDate(eventDate), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                    ],
                  ),
                ),
                if (fin != null)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Text(formatMoney(fin['grandTotal']), style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary)),
                  ),
                StatusChip(status),
              ],
            ),
          );
        }),
        const SizedBox(height: 12),
        if (totalPages > 1)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: currentPage > 0 ? () => onPageChanged(currentPage - 1) : null,
              ),
              Text('${currentPage + 1} / $totalPages', style: const TextStyle(fontWeight: FontWeight.w800)),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: currentPage < totalPages - 1 ? () => onPageChanged(currentPage + 1) : null,
              ),
            ],
          ),
        const SizedBox(height: 18),
      ],
    );
  }
}
