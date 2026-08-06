import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/inventory_listing.dart';
import '../models/borrow_request.dart';

class BorrowHubService {
  static const String _requestsCollection = 'borrow_requests';
  static const String _listingsCollection = 'inventory_listings';

  static CollectionReference get _requestsRef =>
      FirebaseFirestore.instance.collection(_requestsCollection);

  static CollectionReference get _listingsRef =>
      FirebaseFirestore.instance.collection(_listingsCollection);

  // Status constants
  static const String statusPending = 'pending_lender_approval';
  static const String statusDeclined = 'declined';
  static const String statusCancelled = 'cancelled';
  static const String statusAccepted = 'accepted';
  static const String statusInUse = 'in_use';
  static const String statusReturned = 'returned';

  // Inventory categories
  static const List<Map<String, String>> inventoryCategories = [
    {'id': 'seating', 'label': 'Seating'},
    {'id': 'power', 'label': 'Power / Generators'},
    {'id': 'av', 'label': 'Sound & AV'},
    {'id': 'decor', 'label': 'Decor'},
    {'id': 'other', 'label': 'Other'},
  ];

  // Listing types
  static const List<Map<String, String>> listingTypes = [
    {'id': 'lend', 'label': 'Lend (free)'},
    {'id': 'rent', 'label': 'Rent'},
    {'id': 'both', 'label': 'Lend or rent'},
  ];

  static String listingDocId(String lenderVenueId, String itemId) =>
      '${lenderVenueId}_$itemId';

  static String generateInventoryItemId() =>
      'inv-${DateTime.now().millisecondsSinceEpoch}-${DateTime.now().microsecondsSinceEpoch.toString().substring(0, 6)}';

  // --- Inventory Listings ---

  static Map<String, dynamic> _buildListingPayload(
      String venueId, Map<String, dynamic> item, Map<String, dynamic> venueMeta) {
    final profile = venueMeta['profile'] as Map<String, dynamic>? ?? {};
    return {
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
      'borrowHubEnabled':
          (venueMeta['borrowHub'] as Map<String, dynamic>?)?['enabled'] == true,
      'lenderDisplayName':
          (venueMeta['borrowHub'] as Map<String, dynamic>?)?['displayName'] ??
              venueMeta['name'] ??
              profile['hall_name'] ??
              venueId.replaceAll('-', ' '),
      'lenderArea': profile['area'] ?? venueMeta['city'] ?? '',
      'lenderPhone':
          (venueMeta['borrowHub'] as Map<String, dynamic>?)?['contactPhone'] ??
              profile['phone_1'] ??
              '',
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }

  static Future<void> syncInventoryListings(
    String venueId,
    List<Map<String, dynamic>> inventory, {
    Map<String, dynamic>? venueMeta,
  }) async {
    if (venueId.isEmpty) return;
    venueMeta ??= {};

    final enabled =
        (venueMeta['borrowHub'] as Map<String, dynamic>?)?['enabled'] == true;
    final activeItems =
        inventory.where((i) => i['isActive'] != false).toList();

    for (final item in activeItems) {
      if (!enabled) continue;
      final id = listingDocId(venueId, item['itemId']);
      await _listingsRef.doc(id).set(
            _buildListingPayload(venueId, item, venueMeta),
            SetOptions(merge: true),
          );
    }

    final snap = await _listingsRef
        .where('lenderVenueId', isEqualTo: venueId)
        .get();
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

  static Future<Map<String, dynamic>> publishBorrowHubCatalog(
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

    await FirebaseFirestore.instance.collection('venues').doc(venueId).set(
          {
            'borrowableInventory': inventory,
            'borrowHub': nextHub,
            'updatedAt': DateTime.now().toIso8601String(),
          },
          SetOptions(merge: true),
        );

    await syncInventoryListings(venueId, inventory, venueMeta: {
      ...?venueMeta,
      'borrowHub': nextHub,
    });

    return {'borrowHub': nextHub};
  }

  static Future<void> saveBorrowHubSettings(
      String venueId, Map<String, dynamic> borrowHubSettings) async {
    await FirebaseFirestore.instance.collection('venues').doc(venueId).set(
          {
            'borrowHub': {
              ...borrowHubSettings,
              'updatedAt': DateTime.now().toIso8601String(),
            },
            'updatedAt': DateTime.now().toIso8601String(),
          },
          SetOptions(merge: true),
        );
  }

  static Future<void> saveBorrowableInventory(
    String venueId,
    List<Map<String, dynamic>> inventory, {
    Map<String, dynamic>? venueMeta,
    bool forceEnable = false,
  }) async {
    final borrowHub = {
      ...(venueMeta?['borrowHub'] as Map<String, dynamic>? ?? {}),
      if (forceEnable) 'enabled': true,
    };

    await publishBorrowHubCatalog(
      venueId,
      inventory: inventory,
      borrowHub: borrowHub,
      venueMeta: venueMeta ?? {},
      forceEnable: forceEnable,
    );
  }

  static StreamSubscription listenHubListings(
    String? excludeVenueId,
    Function(List<InventoryListing> listings) callback, {
    Function(Object error, [StackTrace? stackTrace])? onError,
  }) {
    final query = _listingsRef.where('isActive', isEqualTo: true);

    return query.snapshots().listen(
      (snap) {
        final rows = snap.docs
            .map((d) =>
                InventoryListing.fromFirestore(d.id, d.data() as Map<String, dynamic>))
            .where((row) => row.borrowHubEnabled == true)
            .where((row) =>
                row.lenderVenueId.isNotEmpty &&
                row.lenderVenueId != excludeVenueId)
            .where((row) => row.quantityAvailable > 0)
            .toList();
        callback(rows);
      },
      onError: onError,
    );
  }

  // --- Borrow Requests ---

  static StreamSubscription listenIncomingBorrowRequests(
    String lenderVenueId,
    Function(List<BorrowRequest> requests) callback, {
    Function(Object error, [StackTrace? stackTrace])? onError,
  }) {
    if (lenderVenueId.isEmpty) {
      callback([]);
      return const _EmptyStreamSubscription();
    }

    final query = _requestsRef.where('lenderVenueId', isEqualTo: lenderVenueId);

    return query.snapshots().listen(
      (snap) {
        final rows = snap.docs
            .map((d) =>
                BorrowRequest.fromFirestore(d.id, d.data() as Map<String, dynamic>))
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

  static StreamSubscription listenOutgoingBorrowRequests(
    String borrowerVenueId,
    Function(List<BorrowRequest> requests) callback, {
    Function(Object error, [StackTrace? stackTrace])? onError,
  }) {
    if (borrowerVenueId.isEmpty) {
      callback([]);
      return const _EmptyStreamSubscription();
    }

    final query = _requestsRef.where('borrowerVenueId', isEqualTo: borrowerVenueId);

    return query.snapshots().listen(
      (snap) {
        final rows = snap.docs
            .map((d) =>
                BorrowRequest.fromFirestore(d.id, d.data() as Map<String, dynamic>))
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

  static Future<String> createBorrowRequest({
    required String borrowerVenueId,
    String? borrowerUserId,
    required String lenderVenueId,
    String? lenderOwnerId,
    required Map<String, dynamic> item,
    Map<String, dynamic>? eventContext,
    Map<String, dynamic>? terms,
    String? borrowerDisplayName,
  }) async {
    if (borrowerVenueId.isEmpty || lenderVenueId.isEmpty ||
        (item['itemId'] as String?)?.isEmpty == true) {
      throw ArgumentError('Missing required borrow request fields.');
    }
    if (borrowerVenueId == lenderVenueId) {
      throw ArgumentError('You cannot borrow from your own venue.');
    }

    final qty = (item['quantityRequested'] ?? 0).toInt();
    if (qty < 1) throw ArgumentError('Quantity must be at least 1.');

    final listingRef = _listingsRef.doc(listingDocId(lenderVenueId, item['itemId']));
    final listingSnap = await listingRef.get();
    if (!listingSnap.exists) {
      throw Exception('This item is no longer listed on the Borrow Hub.');
    }
    final listing = listingSnap.data() as Map<String, dynamic>;
    final available = (listing['quantityAvailable'] ?? 0).toInt();
    if (available < qty) {
      throw Exception('Only $available available right now.');
    }

    final payload = {
      'requestId': null,
      'status': statusPending,
      'borrowerVenueId': borrowerVenueId,
      'lenderVenueId': lenderVenueId,
      'borrowerUserId': borrowerUserId,
      'lenderOwnerId': lenderOwnerId,
      'borrowerDisplayName': borrowerDisplayName ?? borrowerVenueId,
      'lenderDisplayName': listing['lenderDisplayName'] ?? lenderVenueId,
      'item': {
        'itemId': item['itemId'],
        'title': item['title'] ?? listing['title'],
        'category': item['category'] ?? listing['category'],
        'quantityRequested': qty,
        'listingType': item['listingType'] ?? listing['listingType'],
        'pricePerUnit': item['pricePerUnit'] ?? listing['pricePerUnit'],
        'unit': item['unit'] ?? listing['unit'] ?? 'units',
      },
      'eventContext': {
        'eventDate': eventContext?['eventDate'] ?? '',
        'eventTiming': eventContext?['eventTiming'],
        'linkedBookingId': eventContext?['linkedBookingId'],
        'urgency': eventContext?['urgency'] ?? 'planned',
        'notes': eventContext?['notes'] ?? '',
      },
      'terms': {
        'mode': terms?['mode'] ??
            (listing['listingType'] == 'rent' ? 'rent' : 'lend'),
        'agreedTotal': terms?['agreedTotal'],
        'currency': 'PKR',
        'returnBy': terms?['returnBy'],
        'pickupBy': terms?['pickupBy'],
        'transportResponsibility':
            terms?['transportResponsibility'] ?? 'borrower',
      },
      'activityLog': [
        {
          'at': DateTime.now().toIso8601String(),
          'actorVenueId': borrowerVenueId,
          'action': 'created',
          'message': 'Borrow request submitted.',
        },
      ],
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'respondedAt': null,
      'handedOverAt': null,
      'returnedAt': null,
      'cancelledAt': null,
      'respondedByUserId': null,
      'cancelledBy': null,
      'declineReason': null,
    };

    final ref = await _requestsRef.add(payload);
    await ref.update({'requestId': ref.id});
    return ref.id;
  }

  static Future<void> acceptBorrowRequest(
      String requestId, String lenderVenueId, String userId) async {
    final requestRef = _requestsRef.doc(requestId);

    await FirebaseFirestore.instance.runTransaction((tx) async {
      final reqSnap = await tx.get(requestRef);
      if (!reqSnap.exists) throw Exception('Request not found.');
      final req = reqSnap.data() as Map<String, dynamic>;
      if (req['lenderVenueId'] != lenderVenueId) {
        throw Exception('Not authorized to accept this request.');
      }
      if (req['status'] != statusPending) {
        throw Exception('Request is no longer pending.');
      }

      final qty = ((req['item'] as Map<String, dynamic>?)?['quantityRequested'] ?? 0).toInt();
      final itemId = (req['item'] as Map<String, dynamic>?)?['itemId'] as String?;

      if (itemId == null || itemId.isEmpty) {
        throw Exception('Invalid item in request.');
      }

      final listingRef = _listingsRef.doc(listingDocId(lenderVenueId, itemId));
      final venueRef = FirebaseFirestore.instance.collection('venues').doc(lenderVenueId);

      final listingSnap = await tx.get(listingRef);
      final venueSnap = await tx.get(venueRef);

      if (!listingSnap.exists) throw Exception('Listing not found.');
      final listing = listingSnap.data() as Map<String, dynamic>;
      final available = (listing['quantityAvailable'] ?? 0).toInt();
      if (available < qty) {
        throw Exception('Insufficient stock. Only $available available.');
      }

      tx.update(listingRef, {
        'quantityAvailable': available - qty,
        'updatedAt': DateTime.now().toIso8601String(),
      });

      if (venueSnap.exists) {
        final venue = venueSnap.data() as Map<String, dynamic>;
        final inventory =
            (venue['borrowableInventory'] as List<dynamic>?)?.map((inv) {
          final invMap = Map<String, dynamic>.from(inv);
          if (invMap['itemId'] == itemId) {
            final next = ((invMap['quantityAvailable'] ?? 0).toInt()) - qty;
            invMap['quantityAvailable'] = next < 0 ? 0 : next;
            invMap['updatedAt'] = DateTime.now().toIso8601String();
          }
          return invMap;
        }).toList() ?? [];

        tx.update(venueRef, {
          'borrowableInventory': inventory,
          'updatedAt': DateTime.now().toIso8601String(),
        });
      }

      final activityLog = List<Map<String, dynamic>>.from(req['activityLog'] ?? []);
      activityLog.add({
        'at': DateTime.now().toIso8601String(),
        'actorVenueId': lenderVenueId,
        'action': 'accepted',
        'message': 'Lender accepted the request.',
      });

      tx.update(requestRef, {
        'status': statusAccepted,
        'respondedAt': FieldValue.serverTimestamp(),
        'respondedByUserId': userId,
        'updatedAt': FieldValue.serverTimestamp(),
        'activityLog': activityLog,
      });
    });
  }

  static Future<void> declineBorrowRequest(
    String requestId,
    String lenderVenueId,
    String userId, {
    String declineReason = '',
  }) async {
    final ref = _requestsRef.doc(requestId);
    final snap = await ref.get();
    if (!snap.exists) throw Exception('Request not found.');
    final req = snap.data() as Map<String, dynamic>;
    if (req['lenderVenueId'] != lenderVenueId) {
      throw Exception('Not authorized.');
    }
    if (req['status'] != statusPending) {
      throw Exception('Only pending requests can be declined.');
    }

    final activityLog = List<Map<String, dynamic>>.from(req['activityLog'] ?? []);
    activityLog.add({
      'at': DateTime.now().toIso8601String(),
      'actorVenueId': lenderVenueId,
      'action': 'declined',
      'message': declineReason.isNotEmpty ? declineReason : 'Request declined.',
    });

    await ref.update({
      'status': statusDeclined,
      'declineReason': declineReason,
      'respondedAt': FieldValue.serverTimestamp(),
      'respondedByUserId': userId,
      'updatedAt': FieldValue.serverTimestamp(),
      'activityLog': activityLog,
    });
  }

  static Future<void> cancelBorrowRequest(
      String requestId, String borrowerVenueId) async {
    final ref = _requestsRef.doc(requestId);
    final snap = await ref.get();
    if (!snap.exists) throw Exception('Request not found.');
    final req = snap.data() as Map<String, dynamic>;
    if (req['borrowerVenueId'] != borrowerVenueId) {
      throw Exception('Not authorized.');
    }
    if (req['status'] != statusPending) {
      throw Exception('Only pending requests can be cancelled.');
    }

    final activityLog = List<Map<String, dynamic>>.from(req['activityLog'] ?? []);
    activityLog.add({
      'at': DateTime.now().toIso8601String(),
      'actorVenueId': borrowerVenueId,
      'action': 'cancelled',
      'message': 'Borrower cancelled the request.',
    });

    await ref.update({
      'status': statusCancelled,
      'cancelledAt': FieldValue.serverTimestamp(),
      'cancelledBy': 'borrower',
      'updatedAt': FieldValue.serverTimestamp(),
      'activityLog': activityLog,
    });
  }

  static Future<void> markBorrowRequestInUse(
      String requestId, String actorVenueId) async {
    final ref = _requestsRef.doc(requestId);
    final snap = await ref.get();
    if (!snap.exists) throw Exception('Request not found.');
    final req = snap.data() as Map<String, dynamic>;

    final isOwner = req['borrowerVenueId'] == actorVenueId ||
        req['lenderVenueId'] == actorVenueId;
    if (!isOwner) throw Exception('Not authorized.');
    if (req['status'] != statusAccepted) {
      throw Exception('Request must be accepted first.');
    }

    final activityLog = List<Map<String, dynamic>>.from(req['activityLog'] ?? []);
    activityLog.add({
      'at': DateTime.now().toIso8601String(),
      'actorVenueId': actorVenueId,
      'action': 'in_use',
      'message': 'Item marked as handed over / in use.',
    });

    await ref.update({
      'status': statusInUse,
      'handedOverAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'activityLog': activityLog,
    });
  }

  static Future<void> markBorrowRequestReturned(
      String requestId, String actorVenueId) async {
    final requestRef = _requestsRef.doc(requestId);

    await FirebaseFirestore.instance.runTransaction((tx) async {
      final reqSnap = await tx.get(requestRef);
      if (!reqSnap.exists) throw Exception('Request not found.');
      final req = reqSnap.data() as Map<String, dynamic>;

      final isOwner = req['borrowerVenueId'] == actorVenueId ||
          req['lenderVenueId'] == actorVenueId;
      if (!isOwner) throw Exception('Not authorized.');
      if (req['status'] != statusInUse && req['status'] != statusAccepted) {
        throw Exception('Request must be in use or accepted to mark returned.');
      }

      final qty = ((req['item'] as Map<String, dynamic>?)?['quantityRequested'] ?? 0).toInt();
      final itemId = (req['item'] as Map<String, dynamic>?)?['itemId'] as String?;
      final lenderVenueId = req['lenderVenueId'] as String?;

      if (itemId != null && lenderVenueId != null) {
        await _restoreInventory(tx, lenderVenueId, itemId, qty);
      }

      final activityLog = List<Map<String, dynamic>>.from(req['activityLog'] ?? []);
      activityLog.add({
        'at': DateTime.now().toIso8601String(),
        'actorVenueId': actorVenueId,
        'action': 'returned',
        'message': 'Item marked as safely returned.',
      });

      tx.update(requestRef, {
        'status': statusReturned,
        'returnedAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
        'activityLog': activityLog,
      });
    });
  }

  static Future<void> _restoreInventory(
    Transaction tx,
    String lenderVenueId,
    String itemId,
    int qty,
  ) async {
    final listingRef = _listingsRef.doc(listingDocId(lenderVenueId, itemId));
    final venueRef =
        FirebaseFirestore.instance.collection('venues').doc(lenderVenueId);

    final listingSnap = await tx.get(listingRef);
    if (listingSnap.exists) {
      final listing = listingSnap.data() as Map<String, dynamic>;
      tx.update(listingRef, {
        'quantityAvailable': ((listing['quantityAvailable'] ?? 0).toInt()) + qty,
        'updatedAt': DateTime.now().toIso8601String(),
      });
    }

    final venueSnap = await tx.get(venueRef);
    if (venueSnap.exists) {
      final venue = venueSnap.data() as Map<String, dynamic>;
      final inventory =
          (venue['borrowableInventory'] as List<dynamic>?)?.map((inv) {
        final invMap = Map<String, dynamic>.from(inv);
        if (invMap['itemId'] == itemId) {
          final total = (invMap['quantityTotal'] ?? 0).toInt();
          final current = (invMap['quantityAvailable'] ?? 0).toInt();
          final next = total > 0
              ? (current + qty > total ? total : current + qty)
              : current + qty;
          invMap['quantityAvailable'] = next;
          invMap['updatedAt'] = DateTime.now().toIso8601String();
        }
        return invMap;
      }).toList() ?? [];

      tx.update(venueRef, {
        'borrowableInventory': inventory,
        'updatedAt': DateTime.now().toIso8601String(),
      });
    }
  }

  static String borrowStatusLabel(String status) {
    switch (status) {
      case 'pending_lender_approval':
        return 'Pending approval';
      case 'declined':
        return 'Declined';
      case 'cancelled':
        return 'Cancelled';
      case 'accepted':
        return 'Accepted';
      case 'in_use':
        return 'In use';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  }
}

class _EmptyStreamSubscription implements StreamSubscription<QuerySnapshot<Object?>> {
  const _EmptyStreamSubscription();

  @override
  void onData(void Function(QuerySnapshot<Object?>)? handleData) {}
  @override
  void onError(Function? handleError) {}
  @override
  void onDone(void Function()? handleDone) {}
  @override
  Future<void> cancel() async {}
  @override
  Future<E> asFuture<E>([E? futureValue]) async => futureValue as E;
  @override
  bool get isPaused => false;
  @override
  void pause([Future<void>? resumeSignal]) {}
  @override
  void resume() {}
}
