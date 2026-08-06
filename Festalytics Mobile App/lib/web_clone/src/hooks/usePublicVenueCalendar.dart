import 'package:cloud_firestore/cloud_firestore.dart';
import 'useVenueCalendar.dart' as calendar;

class PublicVenueCalendar {
  static const String _collection = 'venues';

  static DocumentReference _ref(String venueId) =>
      FirebaseFirestore.instance.collection(_collection).doc(venueId);

  static Future<Map<String, dynamic>?> getAvailability(String venueId) async {
    if (venueId.isEmpty) return null;
    try {
      final snap = await _ref(venueId).get();
      if (!snap.exists) return null;
      final data = snap.data() as Map<String, dynamic>;
      return {
        'blockedDates': List<String>.from(data['blockedDates'] ?? []),
        'blackoutDates': List<String>.from(data['blackoutDates'] ?? []),
        'bookedDates': List<String>.from(data['bookedDates'] ?? []),
        'operatingHours': data['operatingHours'] ?? {
          'defaultFrom': '9:00 AM',
          'defaultTo': '6:00 PM',
        },
      };
    } catch (_) {
      return null;
    }
  }

  static Future<bool> isDateAvailable(String venueId, String dateKey) async {
    final data = await getAvailability(venueId);
    if (data == null) return false;
    final blocked = List<String>.from(data['blockedDates'] ?? []);
    final blackout = List<String>.from(data['blackoutDates'] ?? []);
    return !blocked.contains(dateKey) && !blackout.contains(dateKey);
  }

  static List<String> getAvailableDates(
      String venueId, List<String> dateKeys, Map<String, dynamic>? calendar) {
    if (calendar == null) return dateKeys;
    final blocked = List<String>.from(calendar['blockedDates'] ?? []);
    final blackout = List<String>.from(calendar['blackoutDates'] ?? []);
    return dateKeys
        .where((d) => !blocked.contains(d) && !blackout.contains(d))
        .toList();
  }

  static List<Map<String, dynamic>> buildPublicMonthGrid(
      int year, int monthIndex) {
    return calendar.VenueCalendar.buildMonthGrid(year, monthIndex);
  }

  static List<Map<String, dynamic>> markAvailableDates(
    List<Map<String, dynamic>> grid,
    Map<String, dynamic>? availability,
  ) {
    if (availability == null) return grid;
    final blocked = List<String>.from(availability['blockedDates'] ?? []);
    final blackout = List<String>.from(availability['blackoutDates'] ?? []);
    final allUnavailable = {...blocked, ...blackout};
    return grid.map((cell) {
      final key = cell['dateKey'] as String?;
      if (key == null) return cell;
      return {
        ...cell,
        'available': !allUnavailable.contains(key),
        'status': allUnavailable.contains(key) ? 'unavailable' : 'available',
      };
    }).toList();
  }

  static String generateDateKey(int year, int month, int day) =>
      calendar.VenueCalendar.toDateKey(year, month - 1, day);

  static String formatPublicDate(String dateKey) =>
      calendar.VenueCalendar.formatDisplayDate(dateKey);

  static String getPublicMonthLabel(int year, int monthIndex) =>
      calendar.VenueCalendar.getMonthLabel(year, monthIndex);
}
