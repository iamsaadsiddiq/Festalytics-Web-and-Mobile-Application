import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class PublicVenueCalendar extends StatefulWidget {
  final List<String> blockedDates;
  final List<String> blackoutDates;
  final List<String> bookedDates;

  const PublicVenueCalendar({
    super.key,
    this.blockedDates = const [],
    this.blackoutDates = const [],
    this.bookedDates = const [],
  });

  @override
  State<PublicVenueCalendar> createState() => _PublicVenueCalendarState();
}

class _PublicVenueCalendarState extends State<PublicVenueCalendar> {
  late DateTime _currentMonth;
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    _currentMonth = DateTime(DateTime.now().year, DateTime.now().month);
    _selectedDate = DateTime.now();
  }

  void _prev() => setState(() {
        _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1);
      });

  void _next() => setState(() {
        _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1);
      });

  bool _isBlocked(DateTime date) {
    final ds = _dateStr(date);
    return widget.blockedDates.contains(ds) ||
        widget.blackoutDates.contains(ds) ||
        widget.bookedDates.contains(ds);
  }

  String _dateStr(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final daysInMonth = DateTime(_currentMonth.year, _currentMonth.month + 1, 0).day;
    final firstWeekday = DateTime(_currentMonth.year, _currentMonth.month, 1).weekday % 7;
    final today = DateTime.now();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(onPressed: _prev, icon: const Icon(Icons.chevron_left)),
            Text(
              '${_monthName(_currentMonth.month)} ${_currentMonth.year}',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            IconButton(onPressed: _next, icon: const Icon(Icons.chevron_right)),
          ],
        ),
        const SizedBox(height: 4),
        Row(
          children: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              .map((d) => Expanded(
                    child: Center(
                      child: Text(d,
                          style: const TextStyle(
                              color: AppColors.muted,
                              fontSize: 12,
                              fontWeight: FontWeight.w600)),
                    ),
                  ))
              .toList(),
        ),
        const SizedBox(height: 4),
        ...List.generate(
          ((firstWeekday + daysInMonth) / 7).ceil(),
          (week) {
            final children = <Widget>[];
            for (var dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
              final day = week * 7 + dayOfWeek - firstWeekday + 1;
              if (day < 1 || day > daysInMonth) {
                children.add(const Expanded(child: SizedBox()));
              } else {
                final date = DateTime(_currentMonth.year, _currentMonth.month, day);
                final isBlocked = _isBlocked(date);
                final isPast = date.isBefore(DateTime(today.year, today.month, today.day));
                final isSelected = _selectedDate == date;
                children.add(
                  Expanded(
                    child: GestureDetector(
                      onTap: isPast || isBlocked
                          ? null
                          : () => setState(() => _selectedDate = date),
                      child: Container(
                        margin: const EdgeInsets.all(2),
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary
                              : isBlocked
                                  ? AppColors.danger.withValues(alpha: .08)
                                  : null,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            '$day',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                              color: isPast
                                  ? AppColors.muted.withValues(alpha: .4)
                                  : isBlocked
                                      ? AppColors.danger
                                      : isSelected
                                          ? Colors.white
                                          : AppColors.text,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }
            }
            return Row(children: children);
          },
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _legend(AppColors.danger, 'Unavailable'),
            const SizedBox(width: 16),
            _legend(AppColors.primary, 'Selected'),
          ],
        ),
      ],
    );
  }

  Widget _legend(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color.withValues(alpha: .3),
            borderRadius: BorderRadius.circular(3),
            border: Border.all(color: color),
          ),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
      ],
    );
  }

  String _monthName(int m) {
    const names = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return names[m - 1];
  }
}
