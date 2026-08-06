import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../models/inventory_listing.dart';
import '../../../../models/borrow_request.dart';
import '../../../../services/borrow_hub_service.dart';

class FirestoreBorrowHub {
  static const String _requestsCollection = 'borrow_requests';
  static const String _listingsCollection = 'inventory_listings';

  static CollectionReference<Map<String, dynamic>> get _requestsRef =>
      FirebaseFirestore.instance.collection(_requestsCollection);

  static CollectionReference<Map<String, dynamic>> get _listingsRef =>
      FirebaseFirestore.instance.collection(_listingsCollection);

  static String listingDocId(String lenderVenueId, String itemId) =>
      '${lenderVenueId}_$itemId';

  static String generateItemId() =>
      'inv-${DateTime.now().millisecondsSinceEpoch}-${DateTime.now().microsecondsSinceEpoch.toString().substring(0, 6)}';

  static Future<void> syncInventoryListings(
    String venueId,
    List<Map<String, dynamic>> inventory, {
    Map<String, dynamic>? venueMeta,
  }) async {
    if (venueId.isEmpty) return;
    venueMeta ??= {};
    final enabled =
        (venueMeta['borrowHub'] as Map<String, dynamic>?)?['enabled'] == true;
    final activeItems = inventory.where((i) => i['isActive'] != false).toList();
    final profile = venueMeta['profile'] as Map<String, dynamic>? ?? {};

    for (final item in activeItems) {
      if (!enabled) continue;
      final id = listingDocId(venueId, item['itemId']);
      await _listingsRef.doc(id).set({
        'lenderVenueId': venueId,
        'itemId': item['itemId'],
        'title': item['title'],
        'category': item['category'] ?? 'other',
        'quantityAvailable': (item['quantityAvailable'] ?? 0).toInt(),
        'quantityTotal': (item['quantityTotal'] ?? 0).toInt(),
        'listingType': item['listingType'] ?? 'lend',
        'pricePerUnit': item['pricePerUnit'],
        'unit': item['unit'] ?? 'units',
        'isActive': item['isActive'] ?? true,
        'borrowHubEnabled': enabled,
        'lenderDisplayName':
            venueMeta['name'] ?? profile['hall_name'] ?? venueId.replaceAll('-', ' '),
        'lenderArea': profile['area'] ?? venueMeta['city'] ?? '',
        'lenderPhone': profile['phone_1'] ?? '',
        'updatedAt': DateTime.now().toIso8601String(),
      }, SetOptions(merge: true));
    }

    final snap =
        await _listingsRef.where('lenderVenueId', isEqualTo: venueId).get();
    final activeIds = <String>{};
    if (enabled) {
      for (final item in activeItems) {
        activeIds.add(listingDocId(venueId, item['itemId']));
      }
    }
    for (final d in snap.docs) {
      if (!activeIds.contains(d.id)) {
        await d.reference.delete();
      }
    }
  }

  static Future<Map<String, dynamic>> publishCatalog(
    String venueId, {
    required List<Map<String, dynamic>> inventory,
    Map<String, dynamic>? borrowHub,
    Map<String, dynamic>? venueMeta,
    bool forceEnable = false,
  }) async {
    if (venueId.isEmpty) throw ArgumentError('Venue ID is required.');
    final nextHub = {
      ...?borrowHub,
      if (forceEnable) 'enabled': true,
      'updatedAt': DateTime.now().toIso8601String(),
    };
    await FirebaseFirestore.instance.collection('venues').doc(venueId).set({
      'borrowableInventory': inventory,
      'borrowHub': nextHub,
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
    await syncInventoryListings(venueId, inventory, venueMeta: {
      ...?venueMeta,
      'borrowHub': nextHub,
    });
    return {'borrowHub': nextHub};
  }

  static Future<void> saveSettings(
      String venueId, Map<String, dynamic> settings) async {
    await FirebaseFirestore.instance.collection('venues').doc(venueId).set({
      'borrowHub': {
        ...settings,
        'updatedAt': DateTime.now().toIso8601String(),
      },
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }

  static Future<void> saveInventory(
    String venueId,
    List<Map<String, dynamic>> inventory, {
    Map<String, dynamic>? venueMeta,
    bool forceEnable = false,
  }) async {
    final borrowHub = {
      ...(venueMeta?['borrowHub'] as Map<String, dynamic>? ?? {}),
      if (forceEnable) 'enabled': true,
    };
    await publishCatalog(venueId,
        inventory: inventory,
        borrowHub: borrowHub,
        venueMeta: venueMeta ?? {},
        forceEnable: forceEnable);
  }

  static StreamSubscription<QuerySnapshot<Map<String, dynamic>>> listenListings(
    String? excludeVenueId,
    Function(List<InventoryListing>) callback, {
    Function(Object, [StackTrace?])? onError,
  }) {
    final query = _listingsRef.where('isActive', isEqualTo: true);
    return query.snapshots().listen(
      (snap) {
        final rows = snap.docs
            .map((d) => InventoryListing.fromFirestore(d.id, d.data()))
            .where((r) => r.borrowHubEnabled)
            .where(
                (r) => r.lenderVenueId.isNotEmpty && r.lenderVenueId != excludeVenueId)
            .where((r) => r.quantityAvailable > 0)
            .toList();
        callback(rows);
      },
      onError: onError,
    );
  }

  static StreamSubscription<QuerySnapshot<Map<String, dynamic>>>
      listenIncomingRequests(
    String lenderVenueId,
    Function(List<BorrowRequest>) callback, {
    Function(Object, [StackTrace?])? onError,
  }) {
    final query =
        _requestsRef.where('lenderVenueId', isEqualTo: lenderVenueId);
    return query.snapshots().listen(
      (snap) {
        final rows = snap.docs
            .map((d) => BorrowRequest.fromFirestore(d.id, d.data()))
            .toList();
        rows.sort((a, b) {
          final ta = a.createdAt?.millisecondsSinceEpoch ?? 0;
          final tb = b.createdAt?.millisecondsSinceEpoch ?? 0;
          return tb.compareTo(ta);
        });
        callback(rows);
      },
      onError: onError,
    );
  }

  static StreamSubscription<QuerySnapshot<Map<String, dynamic>>>
      listenOutgoingRequests(
    String borrowerVenueId,
    Function(List<BorrowRequest>) callback, {
    Function(Object, [StackTrace?])? onError,
  }) {
    final query =
        _requestsRef.where('borrowerVenueId', isEqualTo: borrowerVenueId);
    return query.snapshots().listen(
      (snap) {
        final rows = snap.docs
            .map((d) => BorrowRequest.fromFirestore(d.id, d.data()))
            .toList();
        rows.sort((a, b) {
          final ta = a.createdAt?.millisecondsSinceEpoch ?? 0;
          final tb = b.createdAt?.millisecondsSinceEpoch ?? 0;
          return tb.compareTo(ta);
        });
        callback(rows);
      },
      onError: onError,
    );
  }

  static Future<String> createRequest({
    required String borrowerVenueId,
    String? borrowerUserId,
    required String lenderVenueId,
    String? lenderOwnerId,
    required Map<String, dynamic> item,
    Map<String, dynamic>? eventContext,
    Map<String, dynamic>? terms,
    String? borrowerDisplayName,
  }) async {
    return BorrowHubService.createBorrowRequest(
      borrowerVenueId: borrowerVenueId,
      borrowerUserId: borrowerUserId,
      lenderVenueId: lenderVenueId,
      lenderOwnerId: lenderOwnerId,
      item: item,
      eventContext: eventContext,
      terms: terms,
      borrowerDisplayName: borrowerDisplayName,
    );
  }

  static Future<void> acceptRequest(
      String requestId, String lenderVenueId, String userId) async {
    return BorrowHubService.acceptBorrowRequest(requestId, lenderVenueId, userId);
  }

  static Future<void> declineRequest(
    String requestId,
    String lenderVenueId,
    String userId, {
    String reason = '',
  }) async {
    return BorrowHubService.declineBorrowRequest(
      requestId, lenderVenueId, userId,
      declineReason: reason,
    );
  }

  static Future<void> cancelRequest(
      String requestId, String borrowerVenueId) async {
    return BorrowHubService.cancelBorrowRequest(requestId, borrowerVenueId);
  }

  static Future<void> markInUse(
      String requestId, String actorVenueId) async {
    return BorrowHubService.markBorrowRequestInUse(requestId, actorVenueId);
  }

  static Future<void> markReturned(
      String requestId, String actorVenueId) async {
    return BorrowHubService.markBorrowRequestReturned(requestId, actorVenueId);
  }

  static List<Map<String, String>> get inventoryCategories =>
      BorrowHubService.inventoryCategories;

  static List<Map<String, String>> get listingTypes =>
      BorrowHubService.listingTypes;
}
