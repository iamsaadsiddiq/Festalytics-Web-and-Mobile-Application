import 'package:intl/intl.dart';

String formatMoney(num? value) {
  final amount = value ?? 0;
  final f = NumberFormat.decimalPattern('en_PK');
  return 'PKR ${f.format(amount.round())}';
}

String dateKey(DateTime date) => DateFormat('yyyy-MM-dd').format(date);

String prettyDate(dynamic value) {
  if (value == null) return 'Not set';
  final text = value.toString();
  final dt = DateTime.tryParse(text);
  if (dt == null) return text;
  return DateFormat('MMM d, yyyy').format(dt);
}

String cleanTitle(String value) => value
    .replaceAll('-', ' ')
    .split(' ')
    .where((p) => p.isNotEmpty)
    .map((p) => '${p[0].toUpperCase()}${p.substring(1)}')
    .join(' ');

int asInt(dynamic value, [int fallback = 0]) {
  if (value == null) return fallback;
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value.toString()) ?? fallback;
}

double asDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? fallback;
}
