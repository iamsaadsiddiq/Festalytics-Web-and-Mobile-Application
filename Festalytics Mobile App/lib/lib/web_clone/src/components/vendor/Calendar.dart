import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class Calendar extends StatelessWidget {
  final DateTime? selectedDate;
  final ValueChanged<DateTime>? onDateSelected;
  final Set<String>? blockedDates;
  final Set<String>? bookedDates;
  const Calendar({super.key, this.selectedDate, this.onDateSelected, this.blockedDates, this.bookedDates});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final year = now.year;
    final month = now.month;
    final firstDay = DateTime(year, month, 1).weekday;
    final daysInMonth = DateTime(year, month + 1, 0).day;
    final startOffset = firstDay == 7 ? 0 : firstDay;

    return Column(children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('${_months[month - 1]} $year', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
      ]),
      const SizedBox(height: 8),
      Row(children: _dayHeaders().toList()),
      ...List.generate((startOffset + daysInMonth + 6) ~/ 7, (weekIdx) {
        return Row(
          children: List.generate(7, (dayIdx) {
            final cellIdx = weekIdx * 7 + dayIdx;
            final day = cellIdx - startOffset + 1;
            if (day < 1 || day > daysInMonth) return Expanded(child: Container());
            final date = DateTime(year, month, day);
            final key = '$year-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';
            final blocked = blockedDates?.contains(key) ?? false;
            final booked = bookedDates?.contains(key) ?? false;
            final isToday = date.day == now.day && date.month == now.month && date.year == now.year;
            final isSelected = selectedDate != null && date.day == selectedDate!.day && date.month == selectedDate!.month && date.year == selectedDate!.year;
            return Expanded(
              child: GestureDetector(
                onTap: onDateSelected != null ? () => onDateSelected!(date) : null,
                child: Container(
                  margin: const EdgeInsets.all(2),
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : (blocked ? AppColors.danger.withValues(alpha: .12) : (booked ? AppColors.warning.withValues(alpha: .12) : null)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text('$day', style: TextStyle(
                      fontWeight: isToday || isSelected ? FontWeight.w900 : FontWeight.w500,
                      color: isSelected ? Colors.white : (blocked ? AppColors.danger : (booked ? AppColors.warning : AppColors.text)),
                      fontSize: isToday ? 15 : 13,
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

  Iterable<Widget> _dayHeaders() sync* {
    for (final d in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      yield Expanded(child: Center(child: Text(d, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.muted))));
    }
  }

  static const _months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
}
