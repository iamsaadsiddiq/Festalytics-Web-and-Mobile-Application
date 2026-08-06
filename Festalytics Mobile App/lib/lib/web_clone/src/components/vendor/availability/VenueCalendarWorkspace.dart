import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/app_widgets.dart';
import '../../../../../services/venue_calendar_service.dart';

class VenueCalendarWorkspace extends StatefulWidget {
  final String venueId;
  const VenueCalendarWorkspace({super.key, required this.venueId});

  @override
  State<VenueCalendarWorkspace> createState() => _VenueCalendarWorkspaceState();
}

class _VenueCalendarWorkspaceState extends State<VenueCalendarWorkspace> {
  Map<String, dynamic>? _calendarData;
  bool _loading = true;
  StreamSubscription? _sub;
  late int _year;
  late int _monthIndex;
  String? _selectedDateKey;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _year = now.year;
    _monthIndex = now.month - 1;
    _sub = VenueCalendarService.subscribeVenueCalendar(widget.venueId, (data) {
      if (mounted) setState(() { _calendarData = data; _loading = false; });
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingView();

    final cells = VenueCalendarService.buildMonthGrid(_year, _monthIndex);

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          color: Colors.white,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(VenueCalendarService.getMonthLabel(_year, _monthIndex), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
              Row(children: [
                IconButton(icon: const Icon(Icons.chevron_left), onPressed: () => setState(() {
                  if (_monthIndex == 0) { _monthIndex = 11; _year--; } else { _monthIndex--; }
                })),
                IconButton(icon: const Icon(Icons.chevron_right), onPressed: () => setState(() {
                  if (_monthIndex == 11) { _monthIndex = 0; _year++; } else { _monthIndex++; }
                })),
              ]),
            ],
          ),
        ),
        Container(
          color: Colors.white,
          child: Row(
            children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) =>
              Expanded(child: Center(child: Text(d, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.muted))))
            ).toList(),
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: LayoutBuilder(builder: (_, constraints) {
            final cellH = constraints.maxHeight / (cells.length / 7);
            return SingleChildScrollView(
              child: Column(
                children: List.generate(cells.length ~/ 7, (wIdx) {
                  return SizedBox(
                    height: cellH,
                    child: Row(
                      children: List.generate(7, (dIdx) {
                        final cell = cells[wIdx * 7 + dIdx];
                        final day = cell['day'] as int;
                        final dateKey = cell['dateKey'] as String?;
                        final muted = cell['muted'] as bool? ?? false;
                        final isToday = dateKey == VenueCalendarService.toDateKey(DateTime.now().year, DateTime.now().month - 1, DateTime.now().day);
                        final status = dateKey != null && _calendarData != null
                            ? VenueCalendarService.getDateStatus(dateKey, _calendarData!)
                            : 'available';
                        final isSelected = dateKey == _selectedDateKey;

                        return Expanded(
                          child: GestureDetector(
                            onTap: dateKey != null ? () => setState(() => _selectedDateKey = dateKey) : null,
                            child: Container(
                              margin: const EdgeInsets.all(1),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.primary.withValues(alpha: .08) : null,
                                border: Border.all(color: isSelected ? AppColors.primary : AppColors.border.withValues(alpha: .3)),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.all(4),
                                    child: CircleAvatar(
                                      radius: 12,
                                      backgroundColor: isToday ? AppColors.primary : (muted ? Colors.transparent : (status == 'booked' || status == 'blackout' ? AppColors.danger : (status == 'pending' ? AppColors.warning : Colors.transparent))),
                                      child: Text('$day', style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: isToday ? Colors.white : (muted ? AppColors.muted.withValues(alpha: .4) : AppColors.text),
                                      )),
                                    ),
                                  ),
                                  if (status == 'booked')
                                    Expanded(child: Center(child: Container(width: 20, height: 4, decoration: BoxDecoration(color: AppColors.danger, borderRadius: BorderRadius.circular(99))))),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                  );
                }),
              ),
            );
          }),
        ),
      ],
    );
  }
}
