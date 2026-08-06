import 'dart:async';
import '../../../models/inventory_listing.dart';
import '../../../models/borrow_request.dart';
import '../../../services/borrow_hub_service.dart';

class BorrowHubState {
  final List<InventoryListing> listings;
  final List<BorrowRequest> incomingRequests;
  final List<BorrowRequest> outgoingRequests;
  final bool isLoading;
  final String? error;

  const BorrowHubState({
    this.listings = const [],
    this.incomingRequests = const [],
    this.outgoingRequests = const [],
    this.isLoading = false,
    this.error,
  });

  BorrowHubState copyWith({
    List<InventoryListing>? listings,
    List<BorrowRequest>? incomingRequests,
    List<BorrowRequest>? outgoingRequests,
    bool? isLoading,
    String? error,
  }) {
    return BorrowHubState(
      listings: listings ?? this.listings,
      incomingRequests: incomingRequests ?? this.incomingRequests,
      outgoingRequests: outgoingRequests ?? this.outgoingRequests,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class BorrowHub {
  static StreamSubscription? _listingsSub;
  static StreamSubscription? _incomingSub;
  static StreamSubscription? _outgoingSub;

  static BorrowHubState _state = const BorrowHubState();
  static void Function(BorrowHubState)? _onChange;

  static BorrowHubState get state => _state;

  static void initialize(
    String? venueId,
    void Function(BorrowHubState) onChange,
  ) {
    _onChange = onChange;
    _emitLoading();
    _listingsSub = BorrowHubService.listenHubListings(
      venueId,
      (listings) {
        _state = _state.copyWith(listings: listings, isLoading: false);
        _emit();
      },
      onError: (Object e, [StackTrace? s]) {
        _state = _state.copyWith(error: e.toString(), isLoading: false);
        _emit();
      },
    );
    if (venueId != null && venueId.isNotEmpty) {
      _incomingSub = BorrowHubService.listenIncomingBorrowRequests(
        venueId,
        (requests) {
          _state = _state.copyWith(incomingRequests: requests, isLoading: false);
          _emit();
        },
        onError: (Object e, [StackTrace? s]) {
          _state = _state.copyWith(error: e.toString(), isLoading: false);
          _emit();
        },
      );
      _outgoingSub = BorrowHubService.listenOutgoingBorrowRequests(
        venueId,
        (requests) {
          _state = _state.copyWith(outgoingRequests: requests, isLoading: false);
          _emit();
        },
        onError: (Object e, [StackTrace? s]) {
          _state = _state.copyWith(error: e.toString(), isLoading: false);
          _emit();
        },
      );
    }
  }

  static void dispose() {
    _listingsSub?.cancel();
    _incomingSub?.cancel();
    _outgoingSub?.cancel();
    _listingsSub = null;
    _incomingSub = null;
    _outgoingSub = null;
  }

  static void _emitLoading() {
    _state = _state.copyWith(isLoading: true);
    _emit();
  }

  static void _emit() {
    _onChange?.call(_state);
  }

  static Future<String> createRequest({
    required String borrowerVenueId,
    required String lenderVenueId,
    required Map<String, dynamic> item,
    Map<String, dynamic>? eventContext,
    Map<String, dynamic>? terms,
    String? borrowerUserId,
    String? borrowerDisplayName,
  }) async {
    return BorrowHubService.createBorrowRequest(
      borrowerVenueId: borrowerVenueId,
      lenderVenueId: lenderVenueId,
      item: item,
      eventContext: eventContext,
      terms: terms,
      borrowerUserId: borrowerUserId,
      borrowerDisplayName: borrowerDisplayName,
    );
  }

  static Future<void> acceptRequest(
      String requestId, String lenderVenueId, String userId) async {
    await BorrowHubService.acceptBorrowRequest(requestId, lenderVenueId, userId);
  }

  static Future<void> declineRequest(
    String requestId,
    String lenderVenueId,
    String userId, {
    String reason = '',
  }) async {
    await BorrowHubService.declineBorrowRequest(
      requestId,
      lenderVenueId,
      userId,
      declineReason: reason,
    );
  }

  static Future<void> cancelRequest(
      String requestId, String borrowerVenueId) async {
    await BorrowHubService.cancelBorrowRequest(requestId, borrowerVenueId);
  }

  static Future<void> markInUse(
      String requestId, String actorVenueId) async {
    await BorrowHubService.markBorrowRequestInUse(requestId, actorVenueId);
  }

  static Future<void> markReturned(
      String requestId, String actorVenueId) async {
    await BorrowHubService.markBorrowRequestReturned(requestId, actorVenueId);
  }

  static String statusLabel(String status) =>
      BorrowHubService.borrowStatusLabel(status);

  static List<Map<String, String>> get inventoryCategories =>
      BorrowHubService.inventoryCategories;

  static List<Map<String, String>> get listingTypes =>
      BorrowHubService.listingTypes;

  static String generateItemId() =>
      BorrowHubService.generateInventoryItemId();
}
