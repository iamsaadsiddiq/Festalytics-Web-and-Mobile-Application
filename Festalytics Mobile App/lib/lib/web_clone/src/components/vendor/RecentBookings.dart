import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_widgets.dart';

class RecentBookings extends StatelessWidget {
  final String venueId;
  final int limit;
  const RecentBookings({super.key, required this.venueId, this.limit = 5});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance.collection('bookings').where('targetVenueId', isEqualTo: venueId).orderBy('bookedDate', descending: true).limit(limit).snapshots(),
      builder: (_, snap) {
        if (!snap.hasData) return const LoadingView();
        final rows = snap.data!.docs;
        if (rows.isEmpty) {
          return const EmptyState(icon: Icons.event_busy, title: 'No recent bookings', subtitle: 'Bookings will appear here once customers start booking.');
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: rows.map((d) {
            final r = d.data() as Map<String, dynamic>;
            final customer = r['customer'] is Map ? Map<String, dynamic>.from(r['customer']) : null;
            final name = customer?['name'] ?? r['customerName'] ?? 'Guest';
            final fin = r['financials'] is Map ? Map<String, dynamic>.from(r['financials']) : null;
            final status = r['status']?.toString() ?? 'new';
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.primary.withValues(alpha: .1),
                    child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                        if (fin != null)
                          Text(formatMoney(fin['grandTotal']), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 13)),
                      ],
                    ),
                  ),
                  StatusChip(status),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }
}
