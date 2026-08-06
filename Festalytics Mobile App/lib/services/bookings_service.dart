import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/booking.dart';

class BookingsService {
  static const String _collection = 'bookings';

  static CollectionReference get _ref =>
      FirebaseFirestore.instance.collection(_collection);

  static StreamSubscription? _listener;

  static Booking _mapDoc(String docId, Map<String, dynamic>? data) {
    return Booking.fromFirestore(docId, data ?? {});
  }

  static Map<String, dynamic> _buildWalkInRecord(
      String venueSlug, Map<String, dynamic> bookingPayload) {
    return {
      ...bookingPayload,
      'targetVenueId': venueSlug,
      'eventDetails': {
        ...(bookingPayload['eventDetails'] as Map<String, dynamic>? ?? {}),
        'venueId': venueSlug,
      },
      'timestamp': FieldValue.serverTimestamp(),
    };
  }

  static Future<String> submitWalkInBooking(
      String venueSlug, Map<String, dynamic> bookingPayload) async {
    if (venueSlug.trim().isEmpty) {
      throw ArgumentError('venueSlug is required.');
    }
    if (bookingPayload.isEmpty) {
      throw ArgumentError('bookingPayload is required.');
    }

    final record = _buildWalkInRecord(venueSlug.trim(), bookingPayload);
    final docRef = await _ref.add(record);
    return docRef.id;
  }

  static StreamSubscription listenToVenueBookings(
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
            .map((d) => _mapDoc(d.id, d.data() as Map<String, dynamic>?))
            .toList();
        callback(rows);
      },
      onError: (error) {
        if (onError != null) onError(error);
      },
    );
  }

  static Future<List<Booking>> fetchLegacyVenueBookings(
      String venueSlug) async {
    final slug = venueSlug.trim();
    if (slug.isEmpty) return [];

    final snap = await _ref.get();
    final rows = <Booking>[];
    for (final d in snap.docs) {
      final data = d.data() as Map<String, dynamic>;
      final matchesVenue = data['targetVenueId'] == slug ||
          (data['eventDetails'] is Map &&
              data['eventDetails']['venueId'] == slug);
      if (matchesVenue && data['targetVenueId'] == null) {
        rows.add(_mapDoc(d.id, data));
      }
    }
    return rows;
  }

  static void dispose() {
    _listener?.cancel();
    _listener = null;
  }
}
