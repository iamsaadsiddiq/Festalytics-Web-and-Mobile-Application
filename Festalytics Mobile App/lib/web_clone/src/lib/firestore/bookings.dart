import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../models/booking.dart';

class FirestoreBookings {
  static const String _collection = 'bookings';

  static CollectionReference<Map<String, dynamic>> get _ref =>
      FirebaseFirestore.instance.collection(_collection);

  static Map<String, dynamic> _buildWalkInRecord(
      String venueSlug, Map<String, dynamic> payload) {
    return {
      ...payload,
      'targetVenueId': venueSlug,
      'eventDetails': {
        ...(payload['eventDetails'] as Map<String, dynamic>? ?? {}),
        'venueId': venueSlug,
      },
      'timestamp': FieldValue.serverTimestamp(),
    };
  }

  static Future<String> submitWalkInBooking(
      String venueSlug, Map<String, dynamic> payload) async {
    if (venueSlug.trim().isEmpty) {
      throw ArgumentError('venueSlug is required.');
    }
    if (payload.isEmpty) {
      throw ArgumentError('bookingPayload is required.');
    }
    final record = _buildWalkInRecord(venueSlug.trim(), payload);
    final docRef = await _ref.add(record);
    return docRef.id;
  }

  static StreamSubscription<QuerySnapshot<Map<String, dynamic>>>
      listenToVenueBookings(
    String venueSlug,
    Function(List<Booking> rows) callback, {
    Function(dynamic error)? onError,
  }) {
    if (venueSlug.trim().isEmpty) {
      throw ArgumentError('venueSlug is required.');
    }
    final query = _ref.where('targetVenueId', isEqualTo: venueSlug.trim());
    return query.snapshots().listen(
      (snapshot) {
        final rows = snapshot.docs
            .map((d) => Booking.fromFirestore(
                d.id, d.data()))
            .toList();
        callback(rows);
      },
      onError: onError,
    );
  }

  static Future<List<Booking>> fetchLegacyVenueBookings(
      String venueSlug) async {
    final slug = venueSlug.trim();
    if (slug.isEmpty) return [];
    final snap = await _ref.get();
    final rows = <Booking>[];
    for (final d in snap.docs) {
      final data = d.data();
      final matchesVenue = data['targetVenueId'] == slug ||
          (data['eventDetails'] is Map &&
              (data['eventDetails'] as Map)['venueId'] == slug);
      if (matchesVenue && data['targetVenueId'] == null) {
        rows.add(Booking.fromFirestore(d.id, data));
      }
    }
    return rows;
  }

  static Future<List<Booking>> fetchAll() async {
    final snap = await _ref.get();
    return snap.docs
        .map((d) => Booking.fromFirestore(
            d.id, d.data()))
        .toList();
  }

  static Future<List<Booking>> fetchByVenue(String venueSlug) async {
    final slug = venueSlug.trim();
    if (slug.isEmpty) return [];
    final snap =
        await _ref.where('targetVenueId', isEqualTo: slug).get();
    return snap.docs
.map((d) => Booking.fromFirestore(
            d.id, d.data()))
        .toList();
}

  static Stream<QuerySnapshot<Map<String, dynamic>>> streamAll() => _ref.snapshots();

  static Future<void> updateBooking(
      String bookingId, Map<String, dynamic> data) async {
    await _ref.doc(bookingId).set(
      {...data, 'updatedAt': DateTime.now().toIso8601String()},
      SetOptions(merge: true),
    );
  }
}
