import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../models/inventory_listing.dart';
import '../../services/borrow_hub_service.dart';

class VendorInventoryScreen extends StatelessWidget {
  const VendorInventoryScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final venueId = context.watch<app.AppAuthProvider>().currentUser?.venueId ?? '';
    return Scaffold(
      appBar: AppBar(title: const Text('My Inventory')),
      floatingActionButton: FloatingActionButton.extended(onPressed: () => Navigator.pushNamed(context, AppRoutes.vendorAddInventory), icon: const Icon(Icons.add), label: const Text('Add')),
      body: venueId.isEmpty ? const EmptyState(icon: Icons.inventory_2_outlined, title: 'No venue', subtitle: 'Link a venue first.') : StreamBuilder<List<InventoryListing>>(
        stream: _listingsStream(venueId),
        builder: (_, snap) {
          if (!snap.hasData) return const LoadingView();
          final rows = snap.data!;
          if (rows.isEmpty) return const EmptyState(icon: Icons.warehouse_outlined, title: 'No inventory published', subtitle: 'Add inventory assets for the borrow hub.');
          return ListView.builder(padding: const EdgeInsets.all(18), itemCount: rows.length, itemBuilder: (_, i) => Padding(padding: const EdgeInsets.only(bottom: 12), child: CandyCard(child: Row(children: [Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(rows[i].title, style: const TextStyle(fontWeight: FontWeight.w900)), Text('${rows[i].category} • ${rows[i].quantityAvailable}/${rows[i].quantityTotal} available', style: const TextStyle(color: AppColors.muted))])), StatusChip(rows[i].listingType)]))));
        },
      ),
    );
  }

  Stream<List<InventoryListing>> _listingsStream(String venueId) {
    return Stream<List<InventoryListing>>.multi((controller) {
      final sub = BorrowHubService.listenHubListings('', (rows) => controller.add(rows.where((e) => e.lenderVenueId == venueId).toList()), onError: (Object error, [StackTrace? stackTrace]) => controller.addError(error, stackTrace));
      controller.onCancel = sub.cancel;
    });
  }
}
