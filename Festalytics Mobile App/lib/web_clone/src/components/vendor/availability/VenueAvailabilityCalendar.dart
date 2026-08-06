import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/app_widgets.dart';
import '../../../../../services/venue_calendar_service.dart';
import 'SmallCalendar.dart';
import 'DayBookings.dart';
import 'AvailabilitySettings.dart';

class VenueAvailabilityCalendar extends StatefulWidget {
  final String venueId;
  const VenueAvailabilityCalendar({super.key, required this.venueId});

  @override
  State<VenueAvailabilityCalendar> createState() => _VenueAvailabilityCalendarState();
}

class _VenueAvailabilityCalendarState extends State<VenueAvailabilityCalendar> {
  Map<String, dynamic>? _calendarData;
  String? _selectedDateKey;
  bool _loading = true;
  StreamSubscription? _sub;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _sub = VenueCalendarService.subscribeVenueCalendar(widget.venueId, (data) {
      if (mounted) setState(() { _calendarData = data; _loading = false; });
    });
  }

  @override
  void didUpdateWidget(VenueAvailabilityCalendar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.venueId != widget.venueId) {
      _sub?.cancel();
      _loading = true;
      _load();
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingView();

    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        const SectionTitle('Availability Calendar', subtitle: 'Manage blocked dates, operating hours, and view day bookings.'),
        CandyCard(
          child: SmallCalendar(
            venueId: widget.venueId,
            calendarData: _calendarData,
            onDateSelected: (key) => setState(() => _selectedDateKey = key),
          ),
        ),
        if (_selectedDateKey != null) ...[
          const SizedBox(height: 16),
          CandyCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(VenueCalendarService.formatDisplayDate(_selectedDateKey!), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15)),
                    Row(children: [
                      if (_calendarData != null) ...[
                        _actionChip('Block', Icons.lock_outline, () => _toggleDate(_selectedDateKey!, 'block')),
                        const SizedBox(width: 6),
                        _actionChip('Blackout', Icons.block, () => _toggleDate(_selectedDateKey!, 'blackout')),
                      ],
                    ]),
                  ],
                ),
                const SizedBox(height: 12),
                DayBookings(venueId: widget.venueId, dateKey: _selectedDateKey!),
              ],
            ),
          ),
        ],
        const SizedBox(height: 16),
        AvailabilitySettings(
          venueId: widget.venueId,
          calendarData: _calendarData,
          onSaved: () => _sub?.cancel(),
        ),
      ],
    );
  }

  Widget _actionChip(String label, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: .1),
          borderRadius: BorderRadius.circular(99),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 14, color: AppColors.primary),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.primary)),
        ]),
      ),
    );
  }

  Future<void> _toggleDate(String dateKey, String type) async {
    final blocked = List<String>.from(_calendarData?['blockedDates'] ?? []);
    final blackout = List<String>.from(_calendarData?['blackoutDates'] ?? []);

    if (type == 'block') {
      if (blocked.contains(dateKey)) { blocked.remove(dateKey); } else { blocked.add(dateKey); }
    } else {
      if (blackout.contains(dateKey)) { blackout.remove(dateKey); } else { blackout.add(dateKey); }
    }

    await VenueCalendarService.saveVenueCalendar(widget.venueId, {
      'blockedDates': blocked,
      'blackoutDates': blackout,
      'operatingHours': _calendarData?['operatingHours'] ?? {'defaultFrom': '9:00 AM', 'defaultTo': '6:00 PM'},
      'dayOverrides': _calendarData?['dayOverrides'] ?? {},
    });
  }
}
