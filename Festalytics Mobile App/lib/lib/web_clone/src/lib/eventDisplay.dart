import '../../../core/utils/formatters.dart';

class EventDisplayInfo {
  final String id;
  final String title;
  final String category;
  final String date;
  final String? timing;
  final int? guestCount;
  final String status;
  final String source;
  final double amount;
  final String? venueId;
  final String? venueName;
  final bool isQuotation;
  final Map<String, dynamic> raw;

  EventDisplayInfo({
    required this.id,
    required this.title,
    required this.category,
    required this.date,
    this.timing,
    this.guestCount,
    required this.status,
    required this.source,
    this.amount = 0,
    this.venueId,
    this.venueName,
    this.isQuotation = false,
    required this.raw,
  });
}

class EventDisplay {
  static EventDisplayInfo fromBookingRow(Map<String, dynamic> row) {
    final eventDetails = row['eventDetails'] as Map<String, dynamic>?;
    final customer = row['customer'] as Map<String, dynamic>?;
    final financials = row['financials'] as Map<String, dynamic>?;
    return EventDisplayInfo(
      id: row['docId'] ?? row['id'] ?? '',
      title: customer?['name'] ?? 'Client',
      category: eventDetails?['category'] ?? row['service'] ?? 'Wedding Event',
      date: eventDetails?['date'] ?? row['eventDate'] ?? '',
      timing: eventDetails?['timing'] as String?,
      guestCount: eventDetails?['guests'] as int?,
      status: row['status'] ?? 'Confirmed',
      source: row['source'] ?? 'Online Portal',
      amount: (financials?['grandTotal'] ?? row['amount'] ?? 0).toDouble(),
      venueId: eventDetails?['venueId'] as String?,
      venueName: row['venueName'] as String?,
      isQuotation: row['isQuotation'] ?? false,
      raw: row,
    );
  }

  static EventDisplayInfo fromQuotation(Map<String, dynamic> quote) {
    final selectedMenu = quote['selectedMenu'] as Map<String, dynamic>?;
    final packageName = selectedMenu?['packageName'] ?? 'Quotation Request';
    final guestCount = (quote['guestCount'] ?? 0).toInt();
    final perPlatePrice = (selectedMenu?['perPlatePrice'] ?? 0).toDouble();
    return EventDisplayInfo(
      id: quote['docId'] ?? quote['quotationId'] ?? '',
      title: quote['customerName'] ?? 'Client',
      category: packageName,
      date: quote['eventDate'] ?? '',
      guestCount: guestCount,
      status: 'Quote Request',
      source: 'Online Portal',
      amount: perPlatePrice * guestCount,
      venueId: quote['targetVenueId'] as String?,
      isQuotation: true,
      raw: quote,
    );
  }

  static String statusBadgeColor(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
      case 'accepted':
        return 'success';
      case 'pending':
      case 'pending_vendor_approval':
      case 'quote request':
        return 'warning';
      case 'cancelled':
      case 'declined':
        return 'error';
      case 'in_use':
        return 'info';
      case 'returned':
        return 'default';
      default:
        return 'default';
    }
  }

  static String statusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'check_circle';
      case 'pending':
      case 'pending_vendor_approval':
        return 'hourglass_empty';
      case 'quote request':
        return 'description';
      case 'cancelled':
        return 'cancel';
      case 'declined':
        return 'block';
      default:
        return 'info';
    }
  }

  static String formatAmount(double amount) => formatMoney(amount);

  static String formatGuestCount(int? count) {
    if (count == null || count == 0) return 'N/A';
    return '$count guests';
  }

  static String eventSummary(EventDisplayInfo event) {
    final buf = StringBuffer();
    buf.write(event.title);
    if (event.date.isNotEmpty) buf.write(' - ${event.date}');
    if (event.guestCount != null && event.guestCount! > 0) {
      buf.write(' (${event.guestCount} guests)');
    }
    if (event.amount > 0) buf.write(' - ${formatAmount(event.amount)}');
    return buf.toString();
  }

  static List<EventDisplayInfo> mergeAndSort(
      List<Map<String, dynamic>> bookingRows,
      List<Map<String, dynamic>> quotations) {
    final events = <EventDisplayInfo>[];
    for (final row in bookingRows) {
      events.add(fromBookingRow(row));
    }
    for (final quote in quotations) {
      events.add(fromQuotation(quote));
    }
    events.sort((a, b) {
      final aDate = a.date.isNotEmpty ? DateTime.tryParse(a.date) : null;
      final bDate = b.date.isNotEmpty ? DateTime.tryParse(b.date) : null;
      if (aDate != null && bDate != null) return bDate.compareTo(aDate);
      if (aDate != null) return -1;
      if (bDate != null) return 1;
      return 0;
    });
    return events;
  }
}
