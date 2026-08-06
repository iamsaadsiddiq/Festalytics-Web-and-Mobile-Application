import 'package:cloud_firestore/cloud_firestore.dart';

class Quotation {
  final String quotationId;
  final String userId;
  final String customerName;
  final String targetVenueId;
  final String eventDate;
  final int guestCount;
  final Map<String, dynamic>? selectedMenu;
  final String status;
  final DateTime? timestamp;

  Quotation({
    required this.quotationId,
    required this.userId,
    required this.customerName,
    required this.targetVenueId,
    required this.eventDate,
    required this.guestCount,
    this.selectedMenu,
    this.status = 'pending_vendor_approval',
    this.timestamp,
  });

  factory Quotation.fromFirestore(String docId, Map<String, dynamic> data) {
    DateTime? ts;
    if (data['timestamp'] != null) {
      if (data['timestamp'] is Timestamp) {
        ts = (data['timestamp'] as Timestamp).toDate();
      } else {
        ts = DateTime.tryParse(data['timestamp'].toString());
      }
    }

    return Quotation(
      quotationId: data['quotationId'] ?? docId,
      userId: data['userId'] ?? '',
      customerName: data['customerName'] ?? '',
      targetVenueId: data['targetVenueId'] ?? '',
      eventDate: data['eventDate'] ?? '',
      guestCount: (data['guestCount'] ?? 0).toInt(),
      selectedMenu: data['selectedMenu'] is Map ? Map<String, dynamic>.from(data['selectedMenu']) : null,
      status: data['status'] ?? 'pending_vendor_approval',
      timestamp: ts,
    );
  }

  Map<String, dynamic> toFirestore() => {
        'quotationId': quotationId,
        'userId': userId,
        'customerName': customerName,
        'targetVenueId': targetVenueId,
        'eventDate': eventDate,
        'guestCount': guestCount,
        'selectedMenu': selectedMenu,
        'status': status,
      };

  String get packageName {
    if (selectedMenu == null) return 'Quotation Request';
    return selectedMenu!['packageName'] ?? selectedMenu!['name'] ?? 'Quotation Request';
  }

  double get perPlatePrice {
    if (selectedMenu == null) return 0;
    return (selectedMenu!['perPlatePrice'] ?? 0).toDouble();
  }

  double get estimatedAmount => perPlatePrice > 0 ? perPlatePrice * guestCount : 0;
}
