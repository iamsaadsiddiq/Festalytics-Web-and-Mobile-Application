import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/booking.dart';
import '../services/bookings_service.dart';

class BookingProvider extends ChangeNotifier {
  List<Booking> _bookings = [];
  bool _isLoading = false;
  String? _error;
  StreamSubscription? _subscription;

  List<Booking> get bookings => _bookings;
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<Booking> get pendingBookings =>
      _bookings.where((b) => b.status.toLowerCase() == 'pending').toList();
  List<Booking> get activeBookings =>
      _bookings.where((b) => !['cancelled', 'completed'].contains(b.status.toLowerCase())).toList();

  void subscribeToVenueBookings(String venueSlug) {
    _subscription?.cancel();
    if (venueSlug.isEmpty) return;

    _isLoading = true;
    notifyListeners();

    _subscription = BookingsService.listenToVenueBookings(
      venueSlug,
      (rows) {
        _bookings = rows;
        _isLoading = false;
        _error = null;
        notifyListeners();
      },
      onError: (e) {
        _error = e.toString();
        _isLoading = false;
        notifyListeners();
      },
    );
  }

  Future<String?> submitWalkInBooking(
      String venueSlug, Map<String, dynamic> payload) async {
    try {
      final id = await BookingsService.submitWalkInBooking(venueSlug, payload);
      return id;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
