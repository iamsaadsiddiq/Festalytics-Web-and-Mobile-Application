import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';

class VenueCalendarService {
  static const String _collection = 'venues';

  static DocumentReference _ref(String venueId) =>
      FirebaseFirestore.instance.collection(_collection).doc(venueId);

  static String toDateKey(int year, int monthIndex, int day) {
    final m = (monthIndex + 1).toString().padLeft(2, '0');
    final d = day.toString().padLeft(2, '0');
    return '$year-$m-$d';
  }

  static ({int year, int monthIndex, int day}) parseDateKey(String dateKey) {
    final parts = dateKey.split('-');
    return (
      year: int.parse(parts[0]),
      monthIndex: int.parse(parts[1]) - 1,
      day: int.parse(parts[2]),
    );
  }

  static String formatDisplayDate(String dateKey) {
    if (dateKey.isEmpty) return 'Select a date';
    final parsed = parseDateKey(dateKey);
    final date = DateTime(parsed.year, parsed.monthIndex + 1, parsed.day);
    final months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    final days = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    return '${days[date.weekday % 7]}, ${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  static String getMonthLabel(int year, int monthIndex) {
    final months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return '${months[monthIndex]} $year';
  }

  static List<Map<String, dynamic>> buildMonthGrid(int year, int monthIndex) {
    final firstDay = DateTime(year, monthIndex + 1, 1).weekday; // 1=Mon...7=Sun
    final daysInMonth = DateTime(year, monthIndex + 2, 0).day;
    final daysInPrevMonth = DateTime(year, monthIndex, 0).day;
    final cells = <Map<String, dynamic>>[];

    // Convert weekday (1=Mon) to Sunday-based (0=Sun)
    final startOffset = firstDay == 7 ? 0 : firstDay;

    for (int i = startOffset - 1; i >= 0; i--) {
      cells.add({
        'day': daysInPrevMonth - i,
        'dateKey': null,
        'muted': true,
      });
    }

    for (int day = 1; day <= daysInMonth; day++) {
      cells.add({
        'day': day,
        'dateKey': toDateKey(year, monthIndex, day),
        'muted': false,
      });
    }

    while (cells.length % 7 != 0) {
      cells.add({'day': cells.length, 'dateKey': null, 'muted': true});
    }

    return cells;
  }

  static Future<void> saveVenueCalendar(
      String venueId, Map<String, dynamic> calendarState) async {
    final blockedDates =
        List<String>.from(calendarState['blockedDates'] ?? []);
    final blackoutDates =
        List<String>.from(calendarState['blackoutDates'] ?? []);
    final operatingHours =
        calendarState['operatingHours'] as Map<String, dynamic>? ??
            {'defaultFrom': '9:00 AM', 'defaultTo': '6:00 PM'};

    await _ref(venueId).set(
      {
        'blockedDates': blockedDates,
        'blackoutDates': blackoutDates,
        'bookedDates': blockedDates,
        'operatingHours': operatingHours,
        'dayOverrides': calendarState['dayOverrides'] ?? {},
        'calendarUpdatedAt': DateTime.now().toIso8601String(),
      },
      SetOptions(merge: true),
    );
  }

  static StreamSubscription<DocumentSnapshot<Map<String, dynamic>>> subscribeVenueCalendar(
    String venueId,
    Function(Map<String, dynamic>? data) callback,
  ) {
    final stream = _ref(venueId).snapshots()
        .cast<DocumentSnapshot<Map<String, dynamic>>>();
    return stream.listen(
      (snap) {
        if (!snap.exists) {
          callback(null);
          return;
        }
        callback(snap.data());
      },
      onError: (error) {
        callback(null);
      },
    );
  }

  static Future<Map<String, dynamic>?> fetchVenueCalendar(
      String venueId) async {
    final snap = await _ref(venueId).get();
    if (!snap.exists) return null;
    return snap.data() as Map<String, dynamic>?;
  }

  static String getDateStatus(
      String dateKey, Map<String, dynamic> calendar) {
    if (dateKey.isEmpty) return 'available';
    final blockedDates = List<String>.from(calendar['blockedDates'] ?? []);
    final blackoutDates = List<String>.from(calendar['blackoutDates'] ?? []);
    final pendingDates = List<String>.from(calendar['pendingDates'] ?? []);

    if (blackoutDates.contains(dateKey)) return 'blackout';
    if (blockedDates.contains(dateKey)) return 'booked';
    if (pendingDates.contains(dateKey)) return 'pending';
    return 'available';
  }
}
