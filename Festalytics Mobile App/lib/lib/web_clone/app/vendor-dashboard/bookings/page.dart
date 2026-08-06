import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../../../providers/app_auth_provider.dart' as app;
import '../../../src/components/vendor/bookings/BookingFilters.dart';
import '../../../src/components/vendor/bookings/BookingStats.dart';

class WebCloneAppVendorDashboardBookingsPage extends StatelessWidget {
  const WebCloneAppVendorDashboardBookingsPage({super.key});
  @override
  Widget build(BuildContext context) {
    final venueId = context.watch<app.AppAuthProvider>().currentUser?.venueId ?? '';
    return Scaffold(
      appBar: AppBar(title: const Text('Bookings & Requests')),
      body: venueId.isEmpty
          ? const EmptyState(icon: Icons.fact_check_outlined, title: 'No venue linked', subtitle: 'Bookings require a vendor venue.')
          : _BookingsBody(venueId: venueId),
    );
  }
}

class _BookingsBody extends StatefulWidget {
  final String venueId;
  const _BookingsBody({required this.venueId});
  @override
  State<_BookingsBody> createState() => _BookingsBodyState();
}

class _BookingsBodyState extends State<_BookingsBody> {
  String? _statusFilter;
  String? _searchQuery;
  final _stats = <Map<String, dynamic>>[];

  void _onFiltersChanged(Map<String, String?> filters) {
    setState(() {
      _statusFilter = filters['status'];
      _searchQuery = filters['search'];
    });
  }

  List<Map<String, dynamic>> _filter(List<Map<String, dynamic>> rows) {
    var filtered = rows;
    if (_statusFilter != null) {
      filtered = filtered.where((r) => (r['status'] ?? '').toString().toLowerCase().contains(_statusFilter!.toLowerCase())).toList();
    }
    if (_searchQuery != null && _searchQuery!.isNotEmpty) {
      final q = _searchQuery!.toLowerCase();
      filtered = filtered.where((r) {
        final name = (r['customerName'] ?? r['customer'] is Map ? r['customer']['name'] ?? '' : '').toString().toLowerCase();
        return name.contains(q);
      }).toList();
    }
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      BookingFilters(onChanged: _onFiltersChanged),
      if (_stats.isNotEmpty) BookingStats(bookings: _stats),
      const SizedBox(height: 4),
      Expanded(child: _rows('quotations')),
    ]);
  }

  Widget _rows(String collection) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream: FirebaseFirestore.instance.collection(collection).where('targetVenueId', isEqualTo: widget.venueId).snapshots(),
      builder: (context, snap) {
        if (!snap.hasData) return const LoadingView();
        final rows = snap.data!.docs.map((d) => {'docId': d.id, ...d.data()}).toList();
        if (rows.isNotEmpty && _stats.isEmpty) _stats.addAll(rows);
        final filtered = _filter(rows);
        if (filtered.isEmpty) return const EmptyState(icon: Icons.inbox_outlined, title: 'No bookings', subtitle: 'New customer requests will appear here.');
        return ListView.builder(
          padding: const EdgeInsets.all(18),
          itemCount: filtered.length,
          itemBuilder: (_, i) => _BookingCard(row: filtered[i]),
        );
      },
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Map<String, dynamic> row;
  const _BookingCard({required this.row});

  @override
  Widget build(BuildContext context) {
    final customer = row['customer'] is Map ? Map<String, dynamic>.from(row['customer']) : <String, dynamic>{'name': row['customerName']};
    final details = row['eventDetails'] is Map ? Map<String, dynamic>.from(row['eventDetails']) : <String, dynamic>{'date': row['eventDate'], 'guests': row['guestCount']};
    return CandyCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [Expanded(child: Text(customer['name']?.toString() ?? 'Customer', style: const TextStyle(fontWeight: FontWeight.w900))), StatusChip(row['status']?.toString() ?? 'pending')]),
      const SizedBox(height: 6),
      Text('${prettyDate(details['date'])} • ${details['guests'] ?? '-'} guests', style: const TextStyle(color: AppColors.muted)),
    ]));
  }
}
