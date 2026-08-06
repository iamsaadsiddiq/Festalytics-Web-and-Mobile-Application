import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/utils/formatters.dart';
import '../../../../../core/widgets/app_widgets.dart';

class DayBookings extends StatelessWidget {
  final String venueId;
  final String dateKey;
  const DayBookings({super.key, required this.venueId, required this.dateKey});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('bookings')
          .where('targetVenueId', isEqualTo: venueId)
          .where('eventDetails.date', isEqualTo: dateKey)
          .snapshots(),
      builder: (_, snap) {
        if (!snap.hasData) return const LoadingView();
        final rows = snap.data!.docs.map((d) {
          final data = d.data() as Map<String, dynamic>;
          return {'docId': d.id, ...data};
        }).toList();

        if (rows.isEmpty) {
          return const Padding(
            padding: EdgeInsets.all(24),
            child: Column(children: [
              Icon(Icons.event_busy, size: 40, color: AppColors.muted),
              SizedBox(height: 8),
              Text('No bookings on this day.', style: TextStyle(color: AppColors.muted)),
            ]),
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: rows.map((r) {
            final customer = r['customer'] is Map ? Map<String, dynamic>.from(r['customer']) : null;
            final name = customer?['name'] ?? r['customerName'] ?? 'Guest';
            final fin = r['financials'] is Map ? Map<String, dynamic>.from(r['financials']) : null;
            final status = r['status']?.toString() ?? 'new';
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.primary.withValues(alpha: .1),
                  child: Text(name[0].toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary)),
                ),
                const SizedBox(width: 10),
                Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w800))),
                if (fin != null) Text(formatMoney(fin['grandTotal']), style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary)),
                const SizedBox(width: 8),
                StatusChip(status),
              ]),
            );
          }).toList(),
        );
      },
    );
  }
}
