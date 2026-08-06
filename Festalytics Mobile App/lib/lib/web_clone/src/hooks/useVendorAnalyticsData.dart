import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../core/utils/formatters.dart';

class AnalyticsMetric {
  final String label;
  final dynamic value;
  final String? change;
  final bool isPositive;
  final String icon;

  const AnalyticsMetric({
    required this.label,
    required this.value,
    this.change,
    this.isPositive = true,
    this.icon = 'analytics',
  });
}

class VendorAnalyticsSnapshot {
  final int totalBookings;
  final int pendingRequests;
  final int confirmedBookings;
  final int quotations;
  final double revenue;
  final int totalGuests;
  final double avgBookingValue;
  final List<Map<String, dynamic>> recentRows;
  final List<AnalyticsMetric> metrics;
  final bool isLoading;

  const VendorAnalyticsSnapshot({
    this.totalBookings = 0,
    this.pendingRequests = 0,
    this.confirmedBookings = 0,
    this.quotations = 0,
    this.revenue = 0,
    this.totalGuests = 0,
    this.avgBookingValue = 0,
    this.recentRows = const [],
    this.metrics = const [],
    this.isLoading = true,
  });

  factory VendorAnalyticsSnapshot.fromData({
    required List<Map<String, dynamic>> bookings,
    required List<Map<String, dynamic>> quotations,
  }) {
    int pending = 0;
    int confirmed = 0;
    double revenue = 0;
    int totalGuests = 0;
    for (final row in bookings) {
      final status = (row['status'] ?? '').toString().toLowerCase();
      if (status.contains('pending')) pending++;
      if (status.contains('confirm') || status.contains('complete')) confirmed++;
      final fin = row['financials'];
      if (fin is Map) {
        revenue += asDouble(fin['grandTotal']);
      }
      final ed = row['eventDetails'];
      if (ed is Map) {
        totalGuests += asInt(ed['guests']);
      }
    }
    final recent = [...bookings, ...quotations];
    recent.sort((a, b) => (b['createdAt'] ?? b['bookedDate'] ?? '')
        .toString()
        .compareTo((a['createdAt'] ?? a['bookedDate'] ?? '').toString()));
    final avgValue = bookings.isNotEmpty ? revenue / bookings.length : 0.0;
    return VendorAnalyticsSnapshot(
      totalBookings: bookings.length,
      pendingRequests: pending,
      confirmedBookings: confirmed,
      quotations: quotations.length,
      revenue: revenue,
      totalGuests: totalGuests,
      avgBookingValue: avgValue,
      recentRows: recent.take(10).toList(),
      metrics: _buildMetrics(bookings.length, pending, confirmed, revenue),
      isLoading: false,
    );
  }

  static List<AnalyticsMetric> _buildMetrics(
    int total,
    int pending,
    int confirmed,
    double revenue,
  ) {
    return [
      AnalyticsMetric(
        label: 'Total Bookings',
        value: total.toString(),
        icon: 'calendar_today',
      ),
      AnalyticsMetric(
        label: 'Pending Requests',
        value: pending.toString(),
        icon: 'hourglass_empty',
        isPositive: false,
      ),
      AnalyticsMetric(
        label: 'Confirmed',
        value: confirmed.toString(),
        icon: 'check_circle',
      ),
      AnalyticsMetric(
        label: 'Revenue',
        value: 'PKR ${revenue.toStringAsFixed(0)}',
        icon: 'payments',
      ),
    ];
  }
}

class VendorAnalyticsData {
  static const String _bookingsCollection = 'bookings';
  static const String _quotationsCollection = 'quotations';

  static Stream<VendorAnalyticsSnapshot> streamAnalytics(String venueId) {
    final db = FirebaseFirestore.instance;
    return db
        .collection(_bookingsCollection)
        .where('targetVenueId', isEqualTo: venueId)
        .snapshots()
        .asyncMap((bookingSnap) async {
      final quoteSnap = await db
          .collection(_quotationsCollection)
          .where('targetVenueId', isEqualTo: venueId)
          .get();
      final bookings = bookingSnap.docs
          .map((d) => <String, dynamic>{'docId': d.id, ...d.data()})
          .toList();
      final quotes = quoteSnap.docs
          .map((d) => <String, dynamic>{'docId': d.id, ...d.data()})
          .toList();
      return VendorAnalyticsSnapshot.fromData(
        bookings: bookings,
        quotations: quotes,
      );
    });
  }

  static Future<VendorAnalyticsSnapshot> fetchSnapshot(String venueId) async {
    final db = FirebaseFirestore.instance;
    final bookingSnap = await db
        .collection(_bookingsCollection)
        .where('targetVenueId', isEqualTo: venueId)
        .get();
    final quoteSnap = await db
        .collection(_quotationsCollection)
        .where('targetVenueId', isEqualTo: venueId)
        .get();
    final bookings = bookingSnap.docs
        .map((d) => <String, dynamic>{'docId': d.id, ...d.data()})
        .toList();
    final quotes = quoteSnap.docs
        .map((d) => <String, dynamic>{'docId': d.id, ...d.data()})
        .toList();
    return VendorAnalyticsSnapshot.fromData(
      bookings: bookings,
      quotations: quotes,
    );
  }

  static List<Map<String, dynamic>> aggregateByMonth(
      List<Map<String, dynamic>> rows) {
    final monthly = <String, Map<String, dynamic>>{};
    for (final row in rows) {
      final dateStr = row['createdAt'] as String? ??
          row['bookedDate'] as String? ??
          '';
      if (dateStr.isEmpty) continue;
      final dt = DateTime.tryParse(dateStr);
      if (dt == null) continue;
      final key = '${dt.year}-${dt.month.toString().padLeft(2, '0')}';
      monthly.putIfAbsent(key, () => {'month': key, 'count': 0, 'revenue': 0.0});
      monthly[key]!['count'] = (monthly[key]!['count'] as int) + 1;
      final fin = row['financials'];
      if (fin is Map) {
        monthly[key]!['revenue'] =
            (monthly[key]!['revenue'] as double) + asDouble(fin['grandTotal']);
      }
    }
    final result = monthly.entries.toList();
    result.sort((a, b) => a.key.compareTo(b.key));
    return result.map((e) => e.value).toList();
  }
}
