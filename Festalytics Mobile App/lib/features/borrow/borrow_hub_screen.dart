import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';
import '../../models/borrow_request.dart';
import '../../models/inventory_listing.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../services/borrow_hub_service.dart';

class BorrowHubScreen extends StatefulWidget {
  const BorrowHubScreen({super.key});
  @override
  State<BorrowHubScreen> createState() => _BorrowHubScreenState();
}

class _BorrowHubScreenState extends State<BorrowHubScreen> {
  String _tab = 'network';

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<app.AppAuthProvider>();
    final venueId = auth.currentUser?.venueId ?? '';
    return Scaffold(
      appBar: AppBar(title: const Text('Borrow Hub')),
      body: venueId.isEmpty ? const EmptyState(icon: Icons.inventory_2_outlined, title: 'No venue linked', subtitle: 'Borrow Hub is vendor-to-vendor and needs a venue.') : Column(children: [
        Padding(padding: const EdgeInsets.all(12), child: SegmentedButton<String>(segments: const [ButtonSegment(value: 'network', label: Text('Network')), ButtonSegment(value: 'incoming', label: Text('Incoming')), ButtonSegment(value: 'outgoing', label: Text('Outgoing'))], selected: {_tab}, onSelectionChanged: (s) => setState(() => _tab = s.first))),
        Expanded(child: _tab == 'network' ? _NetworkListings(venueId: venueId) : _RequestsList(venueId: venueId, incoming: _tab == 'incoming')),
      ]),
    );
  }
}

class _NetworkListings extends StatelessWidget {
  final String venueId;
  const _NetworkListings({required this.venueId});
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<InventoryListing>>(
      stream: Stream<List<InventoryListing>>.multi((controller) {
        final sub = BorrowHubService.listenHubListings(venueId, controller.add, onError: (Object error, [StackTrace? stackTrace]) => controller.addError(error, stackTrace));
        controller.onCancel = sub.cancel;
      }),
      builder: (_, snap) {
        if (!snap.hasData) return const LoadingView();
        final rows = snap.data!;
        if (rows.isEmpty) return const EmptyState(icon: Icons.hub_outlined, title: 'No network listings', subtitle: 'Other vendors active in Borrow Hub will appear here.');
        return ListView.builder(padding: const EdgeInsets.all(18), itemCount: rows.length, itemBuilder: (_, i) {
          final r = rows[i];
          return Padding(padding: const EdgeInsets.only(bottom: 12), child: CandyCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Expanded(child: Text(r.title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17))), StatusChip(r.category)]),
            const SizedBox(height: 6),
            Text('${r.lenderDisplayName} • ${r.quantityAvailable} available • ${r.unit}', style: const TextStyle(color: AppColors.muted)),
            const SizedBox(height: 10),
            ElevatedButton(onPressed: () => _request(context, r), child: const Text('Request asset')),
          ])));
        });
      },
    );
  }
  Future<void> _request(BuildContext context, InventoryListing item) async {
    await BorrowHubService.createBorrowRequest(borrowerVenueId: venueId, lenderVenueId: item.lenderVenueId, lenderOwnerId: null, item: {'itemId': item.itemId, 'title': item.title, 'category': item.category, 'quantityRequested': 1, 'listingType': item.listingType, 'pricePerUnit': item.pricePerUnit, 'unit': item.unit}, eventContext: {'eventDate': '', 'urgency': 'planned', 'notes': 'Requested from mobile Borrow Hub'}, terms: {'mode': item.listingType, 'currency': 'PKR'}, borrowerDisplayName: venueId);
    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Borrow request sent.'), backgroundColor: AppColors.success));
  }
}

class _RequestsList extends StatelessWidget {
  final String venueId;
  final bool incoming;
  const _RequestsList({required this.venueId, required this.incoming});
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<BorrowRequest>>(
      stream: Stream<List<BorrowRequest>>.multi((controller) {
        final sub = incoming ? BorrowHubService.listenIncomingBorrowRequests(venueId, controller.add, onError: (Object error, [StackTrace? stackTrace]) => controller.addError(error, stackTrace)) : BorrowHubService.listenOutgoingBorrowRequests(venueId, controller.add, onError: (Object error, [StackTrace? stackTrace]) => controller.addError(error, stackTrace));
        controller.onCancel = sub.cancel;
      }),
      builder: (_, snap) {
        if (!snap.hasData) return const LoadingView();
        final rows = snap.data!;
        if (rows.isEmpty) return EmptyState(icon: Icons.request_page_outlined, title: incoming ? 'No incoming requests' : 'No outgoing requests', subtitle: 'Borrow activity appears here.');
        return ListView.builder(padding: const EdgeInsets.all(18), itemCount: rows.length, itemBuilder: (_, i) {
          final r = rows[i];
          return Padding(padding: const EdgeInsets.only(bottom: 12), child: CandyCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Expanded(child: Text(r.item.title, style: const TextStyle(fontWeight: FontWeight.w900))), StatusChip(BorrowHubService.borrowStatusLabel(r.status))]),
            Text('${r.borrowerDisplayName} → ${r.lenderDisplayName}', style: const TextStyle(color: AppColors.muted)),
            if (incoming && r.status == BorrowHubService.statusPending) Wrap(spacing: 8, children: [ElevatedButton(onPressed: () => BorrowHubService.acceptBorrowRequest(r.id, venueId, 'mobile'), child: const Text('Accept')), OutlinedButton(onPressed: () => BorrowHubService.declineBorrowRequest(r.id, venueId, 'mobile'), child: const Text('Decline'))]),
          ])));
        });
      },
    );
  }
}
