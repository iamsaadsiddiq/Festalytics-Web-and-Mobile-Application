import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../services/venue_calendar_service.dart';

class SmallCalendar extends StatefulWidget {
  final String venueId;
  final Map<String, dynamic>? calendarData;
  final ValueChanged<String>? onDateSelected;
  const SmallCalendar({super.key, required this.venueId, this.calendarData, this.onDateSelected});

  @override
  State<SmallCalendar> createState() => _SmallCalendarState();
}

class _SmallCalendarState extends State<SmallCalendar> {
  late int _year;
  late int _monthIndex;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _year = now.year;
    _monthIndex = now.month - 1;
  }

  @override
  Widget build(BuildContext context) {
    final cells = VenueCalendarService.buildMonthGrid(_year, _monthIndex);
    final title = VenueCalendarService.getMonthLabel(_year, _monthIndex);

    return Column(children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        IconButton(icon: const Icon(Icons.chevron_left), onPressed: () => setState(() {
          if (_monthIndex == 0) { _monthIndex = 11; _year--; } else { _monthIndex--; }
        })),
        Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
        IconButton(icon: const Icon(Icons.chevron_right), onPressed: () => setState(() {
          if (_monthIndex == 11) { _monthIndex = 0; _year++; } else { _monthIndex++; }
        })),
      ]),
      const SizedBox(height: 4),
      Row(children: ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => Expanded(child: Center(child: Text(d, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.muted))))).toList()),
      ...List.generate(cells.length ~/ 7, (wIdx) {
        return Row(
          children: List.generate(7, (dIdx) {
            final cell = cells[wIdx * 7 + dIdx];
            final day = cell['day'] as int;
            final dateKey = cell['dateKey'] as String?;
            final muted = cell['muted'] as bool? ?? false;
            final status = dateKey != null && widget.calendarData != null
                ? VenueCalendarService.getDateStatus(dateKey, widget.calendarData!)
                : 'available';
            final isBlocked = status == 'booked' || status == 'blackout';
            return Expanded(
              child: GestureDetector(
                onTap: dateKey != null ? () => widget.onDateSelected?.call(dateKey) : null,
                child: Container(
                  margin: const EdgeInsets.all(1.5),
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  decoration: BoxDecoration(
                    color: muted ? null : (isBlocked ? AppColors.danger.withValues(alpha: .12) : (status == 'pending' ? AppColors.warning.withValues(alpha: .12) : null)),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Center(
                    child: Text('$day', style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: muted ? AppColors.muted.withValues(alpha: .4) : (isBlocked ? AppColors.danger : AppColors.text),
                    )),
                  ),
                ),
              ),
            );
          }),
        );
      }),
    ]);
  }
}
