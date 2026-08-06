import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/app_widgets.dart';
import '../../../../../services/venue_calendar_service.dart';

class VenueCalendarDayPanel extends StatelessWidget {
  final String dateKey;
  final Map<String, dynamic>? calendarData;
  final VoidCallback? onBlock;
  final VoidCallback? onBlackout;
  final VoidCallback? onClear;
  const VenueCalendarDayPanel({
    super.key,
    required this.dateKey,
    this.calendarData,
    this.onBlock,
    this.onBlackout,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    if (dateKey.isEmpty) {
      return const EmptyState(icon: Icons.calendar_today, title: 'Select a date', subtitle: 'Tap a date on the calendar to view details.');
    }

    final status = calendarData != null ? VenueCalendarService.getDateStatus(dateKey, calendarData!) : 'available';
    final displayDate = VenueCalendarService.formatDisplayDate(dateKey);
    final statusColor = status == 'booked' || status == 'blackout'
        ? AppColors.danger
        : status == 'pending'
            ? AppColors.warning
            : AppColors.success;
    final statusLabel = status == 'booked'
        ? 'Blocked'
        : status == 'blackout'
            ? 'Blackout'
            : status == 'pending'
                ? 'Pending'
                : 'Available';

    return CandyCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(child: Text(displayDate, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(color: statusColor.withValues(alpha: .12), borderRadius: BorderRadius.circular(99)),
                child: Text(statusLabel, style: TextStyle(color: statusColor, fontWeight: FontWeight.w800, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (status == 'booked' && calendarData != null) ...[
            Text('Blocked in calendar', style: TextStyle(color: AppColors.muted, fontSize: 13)),
          ],
          const SizedBox(height: 14),
          Row(children: [
            Expanded(child: SizedBox(height: 38, child: OutlinedButton(onPressed: onBlock, child: const Text('Block', style: TextStyle(fontSize: 12))))),
            const SizedBox(width: 8),
            Expanded(child: SizedBox(height: 38, child: OutlinedButton(onPressed: onBlackout, child: const Text('Blackout', style: TextStyle(fontSize: 12))))),
            if (status != 'available') ...[
              const SizedBox(width: 8),
              Expanded(child: SizedBox(height: 38, child: OutlinedButton(onPressed: onClear, style: OutlinedButton.styleFrom(foregroundColor: AppColors.danger), child: const Text('Clear', style: TextStyle(fontSize: 12))))),
            ],
          ]),
        ],
      ),
    );
  }
}
