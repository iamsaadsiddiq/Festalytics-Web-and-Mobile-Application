import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/venue.dart';
import '../services/venues_service.dart';

class VenueProvider extends ChangeNotifier {
  Venue? _venue;
  bool _isLoading = false;
  String? _error;
  StreamSubscription<DocumentSnapshot<Map<String, dynamic>>>? _subscription;

  Venue? get venue => _venue;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get venueId => _venue?.id;

  Future<void> loadVenue(String venueId) async {
    if (venueId.isEmpty) return;

    _isLoading = true;
    notifyListeners();

    try {
      _venue = await VenuesService.getVenue(venueId);
      _error = null;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  void subscribeToVenue(String venueId) {
    _subscription?.cancel();
    if (venueId.isEmpty) return;

    _subscription = VenuesService.streamVenue(venueId).listen(
      (snap) {
        if (!snap.exists) {
          _venue = null;
        } else {
          _venue = Venue.fromFirestore(snap.id, snap.data()!);
        }
        notifyListeners();
      },
      onError: (e) {
        _error = e.toString();
        notifyListeners();
      },
    );
  }

  Future<void> saveVenueData(Map<String, dynamic> data) async {
    if (_venue?.id == null) return;
    _isLoading = true;
    notifyListeners();

    try {
      await VenuesService.saveVenue(_venue!.id, data);
      _error = null;
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
