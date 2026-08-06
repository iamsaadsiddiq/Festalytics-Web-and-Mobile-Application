import 'package:cloud_firestore/cloud_firestore.dart';
import '../core/utils/formatters.dart';

class VendorAnalyticsSnapshot {
  final int totalBookings;
  final int pendingRequests;
  final int confirmedBookings;
  final int quotations;
  final double revenue;
  final List<Map<String, dynamic>> recentRows;

  const VendorAnalyticsSnapshot({
    required this.totalBookings,
    required this.pendingRequests,
    required this.confirmedBookings,
    required this.quotations,
    required this.revenue,
    required this.recentRows,
  });
}

class AnalyticsService {
  static Stream<VendorAnalyticsSnapshot> streamVendorAnalytics(String venueId) {
    final db = FirebaseFirestore.instance;
    return db.collection('bookings').where('targetVenueId', isEqualTo: venueId).snapshots().asyncMap((bookingSnap) async {
      final quoteSnap = await db.collection('quotations').where('targetVenueId', isEqualTo: venueId).get();
      final bookings = bookingSnap.docs.map((d) => {'docId': d.id, ...d.data()}).toList();
      final quotes = quoteSnap.docs.map((d) => {'docId': d.id, ...d.data()}).toList();
      int pending = 0;
      int confirmed = 0;
      double revenue = 0;
      for (final row in bookings) {
        final status = (row['status'] ?? '').toString().toLowerCase();
        if (status.contains('pending')) pending++;
        if (status.contains('confirm') || status.contains('complete')) confirmed++;
        final fin = row['financials'];
        if (fin is Map) revenue += asDouble(fin['grandTotal']);
      }
      final recent = [...bookings, ...quotes]
        ..sort((a, b) => (b['createdAt'] ?? b['bookedDate'] ?? '').toString().compareTo((a['createdAt'] ?? a['bookedDate'] ?? '').toString()));
      return VendorAnalyticsSnapshot(
        totalBookings: bookings.length,
        pendingRequests: pending,
        confirmedBookings: confirmed,
        quotations: quotes.length,
        revenue: revenue,
        recentRows: recent.take(10).toList(),
      );
    });
  }
}
