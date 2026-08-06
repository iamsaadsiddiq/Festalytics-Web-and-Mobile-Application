import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/formatters.dart';

class CounterOfferCard extends StatelessWidget {
  final Map<String, dynamic> offer;
  final VoidCallback? onAccept;
  final VoidCallback? onDecline;
  final VoidCallback? onCounter;

  const CounterOfferCard({
    super.key,
    required this.offer,
    this.onAccept,
    this.onDecline,
    this.onCounter,
  });

  @override
  Widget build(BuildContext context) {
    final status = (offer['status'] ?? 'pending').toString();
    final isPending = status == 'pending';
    final perPlate = offer['perPlatePrice'];
    final guests = offer['guestCount'];
    final total = (perPlate is num ? perPlate : 0) * (guests is num ? guests : 1);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.request_quote, color: AppColors.primary),
              const SizedBox(width: 8),
              const Text(
                'Counter Offer',
                style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
              ),
              const Spacer(),
              _statusBadge(status),
            ],
          ),
          const SizedBox(height: 12),
          _row('Package', offer['packageName'] ?? 'Standard'),
          _row('Guests', guests.toString()),
          _row('Per Plate', formatMoney(perPlate)),
          _row('Estimated Total', formatMoney(total)),
          if (offer['notes'] != null && (offer['notes'] as String).isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              offer['notes'],
              style: const TextStyle(color: AppColors.muted, fontSize: 13),
            ),
          ],
          if (isPending && (onAccept != null || onDecline != null || onCounter != null)) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                if (onAccept != null)
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onAccept,
                      icon: const Icon(Icons.check, size: 18),
                      label: const Text('Accept'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                if (onDecline != null) ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onDecline,
                      icon: const Icon(Icons.close, size: 18),
                      label: const Text('Decline'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.danger,
                        side: const BorderSide(color: AppColors.danger),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ],
                if (onCounter != null) ...[
                  const SizedBox(width: 8),
                  IconButton.filledTonal(
                    onPressed: onCounter,
                    icon: const Icon(Icons.edit, size: 20),
                  ),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text('$label: ',
              style: const TextStyle(
                  color: AppColors.muted, fontWeight: FontWeight.w600)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _statusBadge(String status) {
    final color = status == 'accepted'
        ? AppColors.success
        : status == 'declined'
            ? AppColors.danger
            : AppColors.warning;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .12),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
            color: color, fontSize: 11, fontWeight: FontWeight.w800),
      ),
    );
  }
}
