import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/app_widgets.dart';
import '../../../../../services/venue_calendar_service.dart';

class AvailabilitySettings extends StatefulWidget {
  final String venueId;
  final Map<String, dynamic>? calendarData;
  final VoidCallback? onSaved;
  const AvailabilitySettings({super.key, required this.venueId, this.calendarData, this.onSaved});

  @override
  State<AvailabilitySettings> createState() => _AvailabilitySettingsState();
}

class _AvailabilitySettingsState extends State<AvailabilitySettings> {
  late TextEditingController _fromCtrl;
  late TextEditingController _toCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final oh = widget.calendarData?['operatingHours'] as Map<String, dynamic>? ?? {};
    _fromCtrl = TextEditingController(text: oh['defaultFrom'] ?? '9:00 AM');
    _toCtrl = TextEditingController(text: oh['defaultTo'] ?? '6:00 PM');
  }

  @override
  void dispose() {
    _fromCtrl.dispose();
    _toCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await VenueCalendarService.saveVenueCalendar(widget.venueId, {
        'operatingHours': {'defaultFrom': _fromCtrl.text.trim(), 'defaultTo': _toCtrl.text.trim()},
        'blockedDates': List<String>.from(widget.calendarData?['blockedDates'] ?? []),
        'blackoutDates': List<String>.from(widget.calendarData?['blackoutDates'] ?? []),
        'dayOverrides': widget.calendarData?['dayOverrides'] ?? {},
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Availability settings saved.'), backgroundColor: AppColors.success));
        widget.onSaved?.call();
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return CandyCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Operating Hours', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: TextField(controller: _fromCtrl, decoration: const InputDecoration(labelText: 'Open from', hintText: '9:00 AM'))),
              const SizedBox(width: 12),
              Expanded(child: TextField(controller: _toCtrl, decoration: const InputDecoration(labelText: 'Close at', hintText: '6:00 PM'))),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'Saving...' : 'Save Settings'))),
        ],
      ),
    );
  }
}
