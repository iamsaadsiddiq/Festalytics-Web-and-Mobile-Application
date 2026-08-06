import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../../core/widgets/app_widgets.dart';
import '../../../../../models/inventory_listing.dart';
import '../../../../../services/borrow_hub_service.dart';

class NetworkGuard extends StatefulWidget {
  final String venueId;
  final Widget Function(BuildContext context, List<InventoryListing> listings) builder;
  const NetworkGuard({super.key, required this.venueId, required this.builder});

  @override
  State<NetworkGuard> createState() => _NetworkGuardState();
}

class _NetworkGuardState extends State<NetworkGuard> {
  List<InventoryListing> _listings = [];
  bool _loading = true;
  StreamSubscription? _sub;

  @override
  void initState() {
    super.initState();
    _sub = BorrowHubService.listenHubListings(widget.venueId, (rows) {
      if (mounted) setState(() { _listings = rows; _loading = false; });
    });
  }

  @override
  void didUpdateWidget(NetworkGuard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.venueId != widget.venueId) {
      _sub?.cancel();
      _sub = BorrowHubService.listenHubListings(widget.venueId, (rows) {
        if (mounted) setState(() { _listings = rows; _loading = false; });
      });
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingView(label: 'Loading network...');
    if (_listings.isEmpty) {
      return const EmptyState(
        icon: Icons.hub_outlined,
        title: 'No network listings',
        subtitle: 'Other vendors with active Borrow Hub listings will appear here.',
      );
    }
    return widget.builder(context, _listings);
  }
}
