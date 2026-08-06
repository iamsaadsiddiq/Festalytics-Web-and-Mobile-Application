import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/app_widgets.dart';
import '../../../../../models/borrow_request.dart';
import '../../../../../services/borrow_hub_service.dart';

class BorrowRequestCard extends StatelessWidget {
  final BorrowRequest request;
  final String currentVenueId;
  final VoidCallback? onRefresh;
  const BorrowRequestCard({super.key, required this.request, required this.currentVenueId, this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final incoming = request.lenderVenueId == currentVenueId;
    final pending = request.status == BorrowHubService.statusPending;
    final inUse = request.status == BorrowHubService.statusInUse;
    final statusLabel = BorrowHubService.borrowStatusLabel(request.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .04), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: AppColors.secondary, borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.inventory_2, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(request.item.title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                    Text('Qty: ${request.item.quantityRequested} ${request.item.unit}', style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                  ],
                ),
              ),
              StatusChip(statusLabel),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Text(
                  incoming ? 'From: ${request.borrowerDisplayName}' : 'To: ${request.lenderDisplayName}',
                  style: const TextStyle(fontSize: 13, color: AppColors.muted),
                ),
              ),
              if (request.eventContext.eventDate.isNotEmpty)
                Text(request.eventContext.eventDate, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
            ],
          ),
          if (request.declineReason != null && request.declineReason!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: .06), borderRadius: BorderRadius.circular(12)),
              child: Row(children: [const Icon(Icons.info_outline, color: AppColors.danger, size: 16), const SizedBox(width: 8), Expanded(child: Text(request.declineReason!, style: const TextStyle(color: AppColors.danger, fontSize: 12)))]),
            ),
          ],
          if (incoming && pending) ...[
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: SizedBox(height: 40, child: ElevatedButton(onPressed: () => _accept(context), child: const Text('Accept')))),
              const SizedBox(width: 8),
              Expanded(child: SizedBox(height: 40, child: OutlinedButton(onPressed: () => _decline(context), child: const Text('Decline')))),
            ]),
          ],
          if (inUse || (request.status == BorrowHubService.statusAccepted && !pending)) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => _markReturned(context),
                child: const Text('Mark as Returned'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _accept(BuildContext context) async {
    try {
      await BorrowHubService.acceptBorrowRequest(request.id, currentVenueId, 'vendor');
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request accepted.'), backgroundColor: AppColors.success));
      onRefresh?.call();
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger));
    }
  }

  Future<void> _decline(BuildContext context) async {
    final reason = await showDialog<String>(context: context, builder: (ctx) => _DeclineDialog());
    if (reason == null) return;
    try {
      await BorrowHubService.declineBorrowRequest(request.id, currentVenueId, 'vendor', declineReason: reason);
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request declined.')));
      onRefresh?.call();
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger));
    }
  }

  Future<void> _markReturned(BuildContext context) async {
    try {
      await BorrowHubService.markBorrowRequestReturned(request.id, currentVenueId);
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Item marked as returned.'), backgroundColor: AppColors.success));
    } catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger));
    }
  }
}

class _DeclineDialog extends StatefulWidget {
  @override
  State<_DeclineDialog> createState() => _DeclineDialogState();
}

class _DeclineDialogState extends State<_DeclineDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Decline Request'),
      content: TextField(
        controller: _controller,
        maxLines: 3,
        decoration: const InputDecoration(labelText: 'Reason (optional)'),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(onPressed: () => Navigator.pop(context, _controller.text.trim()), child: const Text('Decline')),
      ],
    );
  }
}
