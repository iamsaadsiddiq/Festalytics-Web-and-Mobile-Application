import 'dart:convert';
import 'package:http/http.dart' as http;

class ZaydanCallingSheetEntry {
  final String? timestamp;
  final String? customerName;
  final String? phoneNumber;
  final String? eventDate;
  final String? guestCount;
  final String? venue;
  final String? package;
  final String? status;
  final String? notes;

  ZaydanCallingSheetEntry({
    this.timestamp,
    this.customerName,
    this.phoneNumber,
    this.eventDate,
    this.guestCount,
    this.venue,
    this.package,
    this.status,
    this.notes,
  });

  factory ZaydanCallingSheetEntry.fromRow(List<dynamic> row) =>
      ZaydanCallingSheetEntry(
        timestamp: row.isNotEmpty ? row[0]?.toString() : null,
        customerName: row.length > 1 ? row[1]?.toString() : null,
        phoneNumber: row.length > 2 ? row[2]?.toString() : null,
        eventDate: row.length > 3 ? row[3]?.toString() : null,
        guestCount: row.length > 4 ? row[4]?.toString() : null,
        venue: row.length > 5 ? row[5]?.toString() : null,
        package: row.length > 6 ? row[6]?.toString() : null,
        status: row.length > 7 ? row[7]?.toString() : null,
        notes: row.length > 8 ? row[8]?.toString() : null,
      );

  List<String> toRow() => [
    timestamp ?? DateTime.now().toIso8601String(),
    customerName ?? '',
    phoneNumber ?? '',
    eventDate ?? '',
    guestCount ?? '',
    venue ?? '',
    package ?? '',
    status ?? 'New',
    notes ?? '',
  ];
}

class ZaydanCallingSheet {
  static const String _spreadsheetId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgE2upms';
  static const String _range = 'Sheet1!A:I';
  static const String _baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

  static String? _accessToken;

  static void setToken(String token) {
    _accessToken = token;
  }

  static Map<String, String> get _headers {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (_accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    return headers;
  }

  static Future<List<ZaydanCallingSheetEntry>> fetchEntries() async {
    if (_accessToken == null) return [];
    try {
      final url = '$_baseUrl/$_spreadsheetId/values/$_range';
      final response = await http.get(
        Uri.parse(url),
        headers: _headers,
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final rows = data['values'] as List<dynamic>? ?? [];
        if (rows.isEmpty) return [];
        final entries = rows.skip(1).map((row) {
          final rowList = (row as List<dynamic>).map((e) => e?.toString() ?? '').toList();
          return ZaydanCallingSheetEntry.fromRow(rowList);
        }).toList();
        entries.sort((a, b) {
          final ta = a.timestamp ?? '';
          final tb = b.timestamp ?? '';
          return tb.compareTo(ta);
        });
        return entries;
      }
    } catch (_) {}
    return [];
  }

  static Future<bool> appendEntry(ZaydanCallingSheetEntry entry) async {
    if (_accessToken == null) return false;
    try {
      final url = '$_baseUrl/$_spreadsheetId/values/$_range:append?valueInputOption=USER_ENTERED';
      final response = await http.post(
        Uri.parse(url),
        headers: _headers,
        body: jsonEncode({
          'values': [entry.toRow()],
        }),
      ).timeout(const Duration(seconds: 30));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> updateEntryStatus(
      int rowIndex, String newStatus) async {
    if (_accessToken == null) return false;
    final cellRange = 'Sheet1!H${rowIndex + 1}';
    try {
      final url = '$_baseUrl/$_spreadsheetId/values/$cellRange?valueInputOption=USER_ENTERED';
      final response = await http.put(
        Uri.parse(url),
        headers: _headers,
        body: jsonEncode({
          'values': [[newStatus]],
        }),
      ).timeout(const Duration(seconds: 30));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<int> getPendingCount() async {
    final entries = await fetchEntries();
    return entries.where((e) =>
        e.status == null ||
        e.status!.toLowerCase() == 'new' ||
        e.status!.toLowerCase() == 'pending').length;
  }

  static Future<Map<String, int>> getStatusCounts() async {
    final entries = await fetchEntries();
    final counts = <String, int>{};
    for (final entry in entries) {
      final status = entry.status ?? 'New';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }

  static List<ZaydanCallingSheetEntry> filterByPhone(
      List<ZaydanCallingSheetEntry> entries, String phoneQuery) {
    if (phoneQuery.isEmpty) return entries;
    final lower = phoneQuery.toLowerCase();
    return entries.where((e) =>
        (e.phoneNumber ?? '').toLowerCase().contains(lower)).toList();
  }

  static List<ZaydanCallingSheetEntry> filterByStatus(
      List<ZaydanCallingSheetEntry> entries, String status) {
    if (status.isEmpty || status == 'all') return entries;
    final lower = status.toLowerCase();
    return entries.where((e) =>
        (e.status ?? 'New').toLowerCase() == lower).toList();
  }
}
