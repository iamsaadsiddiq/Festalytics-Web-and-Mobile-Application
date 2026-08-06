import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';

class CalendarState {
  final List<String> blockedDates;
  final List<String> blackoutDates;
  final List<String> pendingDates;
  final Map<String, dynamic> operatingHours;
  final Map<String, dynamic> dayOverrides;
  final int currentYear;
  final int currentMonthIndex;

  const CalendarState({
    this.blockedDates = const [],
    this.blackoutDates = const [],
    this.pendingDates = const [],
    this.operatingHours = const {'defaultFrom': '9:00 AM', 'defaultTo': '6:00 PM'},
    this.dayOverrides = const {},
    this.currentYear = 0,
    this.currentMonthIndex = 0,
  });

  Map<String, dynamic> toMap() => {
    'blockedDates': blockedDates,
    'blackoutDates': blackoutDates,
    'pendingDates': pendingDates,
    'operatingHours': operatingHours,
    'dayOverrides': dayOverrides,
    'currentYear': currentYear,
    'currentMonthIndex': currentMonthIndex,
  };

  factory CalendarState.fromMap(Map<String, dynamic> map) => CalendarState(
    blockedDates: List<String>.from(map['blockedDates'] ?? []),
    blackoutDates: List<String>.from(map['blackoutDates'] ?? []),
    pendingDates: List<String>.from(map['pendingDates'] ?? []),
    operatingHours: Map<String, dynamic>.from(map['operatingHours'] ?? {'defaultFrom': '9:00 AM', 'defaultTo': '6:00 PM'}),
    dayOverrides: Map<String, dynamic>.from(map['dayOverrides'] ?? {}),
    currentYear: map['currentYear'] ?? 0,
    currentMonthIndex: map['currentMonthIndex'] ?? 0,
  );
}

class VenueCalendar {
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
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const days = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    return '${days[date.weekday % 7]}, ${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  static String getMonthLabel(int year, int monthIndex) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return '${months[monthIndex]} $year';
  }

  static List<Map<String, dynamic>> buildMonthGrid(int year, int monthIndex) {
    final firstDay = DateTime(year, monthIndex + 1, 1).weekday;
    final daysInMonth = DateTime(year, monthIndex + 2, 0).day;
    final daysInPrevMonth = DateTime(year, monthIndex, 0).day;
    final cells = <Map<String, dynamic>>[];
    final startOffset = firstDay == 7 ? 0 : firstDay;
    for (int i = startOffset - 1; i >= 0; i--) {
      cells.add({'day': daysInPrevMonth - i, 'dateKey': null, 'muted': true});
    }
    for (int day = 1; day <= daysInMonth; day++) {
      cells.add({'day': day, 'dateKey': toDateKey(year, monthIndex, day), 'muted': false});
    }
    while (cells.length % 7 != 0) {
      cells.add({'day': cells.length, 'dateKey': null, 'muted': true});
    }
    return cells;
  }

  static Future<void> saveCalendar(
    String venueId,
    CalendarState state,
  ) async {
    await _ref(venueId).set(
      {
        'blockedDates': state.blockedDates,
        'blackoutDates': state.blackoutDates,
        'pendingDates': state.pendingDates,
        'operatingHours': state.operatingHours,
        'dayOverrides': state.dayOverrides,
        'calendarUpdatedAt': DateTime.now().toIso8601String(),
      },
      SetOptions(merge: true),
    );
  }

  static StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>
      subscribeCalendar(
    String venueId,
    Function(Map<String, dynamic>? data) callback,
  ) {
    final stream =
        _ref(venueId).snapshots().cast<DocumentSnapshot<Map<String, dynamic>>>();
    return stream.listen(
      (snap) => callback(snap.exists ? snap.data()! : null),
      onError: (_) => callback(null),
    );
  }

  static Future<Map<String, dynamic>?> fetchCalendar(String venueId) async {
    final snap = await _ref(venueId).get();
    if (!snap.exists) return null;
    return snap.data() as Map<String, dynamic>?;
  }

  static String getDateStatus(String dateKey, Map<String, dynamic> calendar) {
    if (dateKey.isEmpty) return 'available';
    final blocked = List<String>.from(calendar['blockedDates'] ?? []);
    final blackout = List<String>.from(calendar['blackoutDates'] ?? []);
    final pending = List<String>.from(calendar['pendingDates'] ?? []);
    if (blackout.contains(dateKey)) return 'blackout';
    if (blocked.contains(dateKey)) return 'booked';
    if (pending.contains(dateKey)) return 'pending';
    return 'available';
  }

  static CalendarState toCalendarState(Map<String, dynamic>? data) {
    if (data == null) return const CalendarState();
    return CalendarState.fromMap(data);
  }
}
