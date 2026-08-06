import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/inventory_listing.dart';
import '../models/borrow_request.dart';
import '../services/borrow_hub_service.dart';

class BorrowHubProvider extends ChangeNotifier {
  List<InventoryListing> _hubListings = [];
  List<BorrowRequest> _incomingRequests = [];
  List<BorrowRequest> _outgoingRequests = [];
  bool _isLoading = false; // ignore: prefer_final_fields
  String? _error;

  StreamSubscription? _listingsSub;
  StreamSubscription? _incomingSub;
  StreamSubscription? _outgoingSub;

  List<InventoryListing> get hubListings => _hubListings;
  List<BorrowRequest> get incomingRequests => _incomingRequests;
  List<BorrowRequest> get outgoingRequests => _outgoingRequests;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get pendingIncomingCount =>
      _incomingRequests.where((r) => r.status == BorrowHubService.statusPending).length;

  void subscribeToAll({
    required String? excludeVenueId,
    required String? venueId,
  }) {
    _listingsSub?.cancel();
    _incomingSub?.cancel();
    _outgoingSub?.cancel();

    if (excludeVenueId != null) {
      _listingsSub = BorrowHubService.listenHubListings(
        excludeVenueId,
        (listings) {
          _hubListings = listings;
          notifyListeners();
        },
        onError: _handleError,
      );
    }

    if (venueId != null) {
      _incomingSub = BorrowHubService.listenIncomingBorrowRequests(
        venueId,
        (requests) {
          _incomingRequests = requests;
          notifyListeners();
        },
        onError: _handleError,
      );

      _outgoingSub = BorrowHubService.listenOutgoingBorrowRequests(
        venueId,
        (requests) {
          _outgoingRequests = requests;
          notifyListeners();
        },
        onError: _handleError,
      );
    }
  }

  void _handleError(Object error, [StackTrace? stackTrace]) {
    _error = error.toString();
    notifyListeners();
  }

  Future<String?> createRequest({
    required String borrowerVenueId,
    String? borrowerUserId,
    required String lenderVenueId,
    String? lenderOwnerId,
    required Map<String, dynamic> item,
    Map<String, dynamic>? eventContext,
    Map<String, dynamic>? terms,
    String? borrowerDisplayName,
  }) async {
    try {
      final id = await BorrowHubService.createBorrowRequest(
        borrowerVenueId: borrowerVenueId,
        borrowerUserId: borrowerUserId,
        lenderVenueId: lenderVenueId,
        lenderOwnerId: lenderOwnerId,
        item: item,
        eventContext: eventContext,
        terms: terms,
        borrowerDisplayName: borrowerDisplayName,
      );
      return id;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  Future<bool> acceptRequest(
      String requestId, String lenderVenueId, String userId) async {
    try {
      await BorrowHubService.acceptBorrowRequest(requestId, lenderVenueId, userId);
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> declineRequest(
      String requestId, String lenderVenueId, String userId,
      {String reason = ''}) async {
    try {
      await BorrowHubService.declineBorrowRequest(
        requestId,
        lenderVenueId,
        userId,
        declineReason: reason,
      );
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  @override
  void dispose() {
    _listingsSub?.cancel();
    _incomingSub?.cancel();
    _outgoingSub?.cancel();
    super.dispose();
  }
}
