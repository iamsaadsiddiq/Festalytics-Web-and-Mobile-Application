import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../models/quotation.dart';

class FirestoreQuotations {
  static const String _collection = 'quotations';
  static const String _initialStatus = 'pending_vendor_approval';
  static final RegExp _datePattern = RegExp(r'^\d{4}-\d{2}-\d{2}$');

  static CollectionReference<Map<String, dynamic>> get _ref =>
      FirebaseFirestore.instance.collection(_collection);

  static void _assertPayload(Map<String, dynamic> payload) {
    const requiredFields = ['userId', 'customerName', 'targetVenueId', 'eventDate'];
    for (final field in requiredFields) {
      final value = payload[field];
      if (value is! String || value.trim().isEmpty) {
        throw ArgumentError('"$field" is required and must be a non-empty string.');
      }
    }
    if (!_datePattern.hasMatch((payload['eventDate'] as String).trim())) {
      throw ArgumentError('eventDate must be formatted as YYYY-MM-DD.');
    }
    final guestCount = (payload['guestCount'] ?? 0).toInt();
    if (guestCount < 1) {
      throw ArgumentError('guestCount must be a positive number.');
    }
    if (payload['selectedMenu'] == null) {
      throw ArgumentError('selectedMenu is required.');
    }
  }

  static Future<String> submitCustomerQuotation(
      Map<String, dynamic> payload) async {
    _assertPayload(payload);
    final docRef = _ref.doc();
    final record = {
      'quotationId': docRef.id,
      'userId': (payload['userId'] as String).trim(),
      'customerName': (payload['customerName'] as String).trim(),
      'targetVenueId': (payload['targetVenueId'] as String).trim(),
      'eventDate': (payload['eventDate'] as String).trim(),
      'guestCount': (payload['guestCount']).toInt(),
      'selectedMenu': payload['selectedMenu'],
      'status': _initialStatus,
      'timestamp': FieldValue.serverTimestamp(),
    };
    await docRef.set(record);
    return docRef.id;
  }

  static StreamSubscription<QuerySnapshot<Map<String, dynamic>>>
      listenToIncomingQuotations(
    String vendorSlug,
    Function(List<Quotation> quotations) callback, {
    Function(dynamic error)? onError,
  }) {
    if (vendorSlug.trim().isEmpty) {
      throw ArgumentError('vendorSlug is required.');
    }
    final query = _ref
        .where('targetVenueId', isEqualTo: vendorSlug.trim())
        .where('status', isEqualTo: _initialStatus);
    return query.snapshots().listen(
      (snap) {
        final quotations = snap.docs
            .map((d) =>
                Quotation.fromFirestore(d.id, d.data()))
            .toList();
        callback(quotations);
      },
      onError: onError,
    );
  }

  static Future<List<Quotation>> fetchByVenue(String venueSlug) async {
    if (venueSlug.trim().isEmpty) return [];
    final snap = await _ref.where('targetVenueId', isEqualTo: venueSlug.trim()).get();
    return snap.docs
        .map((d) =>
            Quotation.fromFirestore(d.id, d.data()))
        .toList();
  }

  static Future<List<Quotation>> fetchByUser(String userId) async {
    if (userId.trim().isEmpty) return [];
    final snap = await _ref.where('userId', isEqualTo: userId.trim()).get();
    return snap.docs
        .map((d) =>
            Quotation.fromFirestore(d.id, d.data()))
        .toList();
  }

  static Future<void> updateStatus(
      String quotationId, String newStatus) async {
    await _ref.doc(quotationId).update({
      'status': newStatus,
      'updatedAt': DateTime.now().toIso8601String(),
    });
  }

  static Map<String, dynamic> mapQuotationToBookingRow(Quotation quotation) {
    final packageName = quotation.packageName;
    final perPlatePrice = quotation.perPlatePrice;
    final estimatedAmount = quotation.estimatedAmount;
    return {
      'docId': quotation.quotationId,
      'id': quotation.quotationId,
      'customer': {'name': quotation.customerName, 'email': 'Storefront Quotation'},
      'service': packageName,
      'bookedDate': 'Today',
      'eventDate': quotation.eventDate,
      'timing': '',
      'status': 'Quote Request',
      'source': 'Online Portal',
      'amount': estimatedAmount,
      'isQuotation': true,
      'raw': {
        'quotationId': quotation.quotationId,
        'userId': quotation.userId,
        'targetVenueId': quotation.targetVenueId,
        'firestoreStatus': quotation.status,
        'eventDetails': {'guests': quotation.guestCount, 'date': quotation.eventDate},
        'catering': {
          'packageName': packageName,
          'perPlatePrice': perPlatePrice,
          'dishes': quotation.selectedMenu?['dishes'] ?? [],
        },
        'selectedMenu': quotation.selectedMenu,
      },
    };
  }
}
