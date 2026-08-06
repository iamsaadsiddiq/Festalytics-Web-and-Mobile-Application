import 'package:intl/intl.dart';
import 'venue_pricing.dart' show formatMoney;

String formatEventDate(String? dateStr) {
  if (dateStr == null || dateStr.isEmpty) return 'Date not set';
  final d = DateTime.tryParse(dateStr);
  if (d == null) return dateStr;
  return DateFormat('MMM d, yyyy').format(d);
}

String formatEventTime(String? time) {
  if (time == null || time.isEmpty) return '';
  final map = {'morning': 'Morning', 'evening': 'Evening'};
  return map[time.toLowerCase()] ?? time;
}

int? getDaysUntil(String? dateStr) {
  if (dateStr == null || dateStr.isEmpty) return null;
  final target = DateTime.tryParse(dateStr);
  if (target == null) return null;
  final today = DateTime.now();
  return target.difference(DateTime(today.year, today.month, today.day)).inDays;
}

String getEventLocation(Map<String, dynamic> event) {
  return (event['selectedVenueLocation'] ?? event['selectedVenueName'] ?? event['location'] ?? 'Location not set') as String;
}

Map<String, dynamic> getStatusConfig(String? status) {
  final s = (status ?? 'Active').toLowerCase();
  if (s == 'pending' || s == 'quote request') {
    return {'label': 'Pending', 'className': 'pending'};
  }
  if (s == 'draft') {
    return {'label': 'Draft', 'className': 'draft'};
  }
  if (s == 'confirmed') {
    return {'label': 'Confirmed', 'className': 'confirmed'};
  }
  if (s == 'declined') {
    return {'label': 'Declined', 'className': 'declined'};
  }
  return {'label': status ?? 'Active', 'className': 'active'};
}

List<String> getSelectedAddonLabels(Map<String, dynamic>? event) {
  final addons = event?['selectedAddons'] as Map<String, dynamic>? ?? {};
  final labels = {
    'ac': 'Air Conditioning',
    'generator': 'Generator',
    'decor': 'Decor Package',
    'sound': 'Sound System',
    'security': 'Security',
  };
  return addons.entries.where((e) => e.value == true).map((e) => labels[e.key] ?? e.key).toList();
}

String formatRs(double amount) => formatMoney(amount);
