import 'package:cloud_firestore/cloud_firestore.dart';

class BorrowItem {
  final String itemId;
  final String title;
  final String category;
  final int quantityRequested;
  final String listingType;
  final double? pricePerUnit;
  final String unit;

  BorrowItem({
    required this.itemId,
    required this.title,
    this.category = 'other',
    this.quantityRequested = 1,
    this.listingType = 'lend',
    this.pricePerUnit,
    this.unit = 'units',
  });

  factory BorrowItem.fromMap(Map<String, dynamic> data) => BorrowItem(
        itemId: data['itemId'] ?? '',
        title: data['title'] ?? '',
        category: data['category'] ?? 'other',
        quantityRequested: (data['quantityRequested'] ?? 1).toInt(),
        listingType: data['listingType'] ?? 'lend',
        pricePerUnit: (data['pricePerUnit'] as num?)?.toDouble(),
        unit: data['unit'] ?? 'units',
      );

  Map<String, dynamic> toMap() => {
        'itemId': itemId,
        'title': title,
        'category': category,
        'quantityRequested': quantityRequested,
        'listingType': listingType,
        'pricePerUnit': pricePerUnit,
        'unit': unit,
      };
}

class EventContext {
  final String eventDate;
  final String? eventTiming;
  final String? linkedBookingId;
  final String urgency;
  final String notes;

  EventContext({
    this.eventDate = '',
    this.eventTiming,
    this.linkedBookingId,
    this.urgency = 'planned',
    this.notes = '',
  });

  factory EventContext.fromMap(Map<String, dynamic>? data) => EventContext(
        eventDate: data?['eventDate'] ?? '',
        eventTiming: data?['eventTiming'] as String?,
        linkedBookingId: data?['linkedBookingId'] as String?,
        urgency: data?['urgency'] ?? 'planned',
        notes: data?['notes'] ?? '',
      );

  Map<String, dynamic> toMap() => {
        'eventDate': eventDate,
        if (eventTiming != null) 'eventTiming': eventTiming,
        if (linkedBookingId != null) 'linkedBookingId': linkedBookingId,
        'urgency': urgency,
        'notes': notes,
      };
}

class BorrowTerms {
  final String mode;
  final double? agreedTotal;
  final String currency;
  final String? returnBy;
  final String? pickupBy;
  final String transportResponsibility;

  BorrowTerms({
    this.mode = 'lend',
    this.agreedTotal,
    this.currency = 'PKR',
    this.returnBy,
    this.pickupBy,
    this.transportResponsibility = 'borrower',
  });

  factory BorrowTerms.fromMap(Map<String, dynamic>? data) => BorrowTerms(
        mode: data?['mode'] ?? 'lend',
        agreedTotal: (data?['agreedTotal'] as num?)?.toDouble(),
        currency: data?['currency'] ?? 'PKR',
        returnBy: data?['returnBy'] as String?,
        pickupBy: data?['pickupBy'] as String?,
        transportResponsibility: data?['transportResponsibility'] ?? 'borrower',
      );

  Map<String, dynamic> toMap() => {
        'mode': mode,
        if (agreedTotal != null) 'agreedTotal': agreedTotal,
        'currency': currency,
        if (returnBy != null) 'returnBy': returnBy,
        if (pickupBy != null) 'pickupBy': pickupBy,
        'transportResponsibility': transportResponsibility,
      };
}

class ActivityLogEntry {
  final String at;
  final String actorVenueId;
  final String action;
  final String message;

  ActivityLogEntry({
    required this.at,
    required this.actorVenueId,
    required this.action,
    required this.message,
  });

  factory ActivityLogEntry.fromMap(Map<String, dynamic> data) => ActivityLogEntry(
        at: data['at'] ?? '',
        actorVenueId: data['actorVenueId'] ?? '',
        action: data['action'] ?? '',
        message: data['message'] ?? '',
      );

  Map<String, dynamic> toMap() => {
        'at': at,
        'actorVenueId': actorVenueId,
        'action': action,
        'message': message,
      };
}

class BorrowRequest {
  final String id;
  final String? requestId;
  final String status;
  final String borrowerVenueId;
  final String lenderVenueId;
  final String? borrowerUserId;
  final String? lenderOwnerId;
  final String borrowerDisplayName;
  final String lenderDisplayName;
  final BorrowItem item;
  final EventContext eventContext;
  final BorrowTerms terms;
  final List<ActivityLogEntry> activityLog;
  final DateTime? createdAt;
  final DateTime? respondedAt;
  final DateTime? handedOverAt;
  final DateTime? returnedAt;
  final DateTime? cancelledAt;
  final String? respondedByUserId;
  final String? cancelledBy;
  final String? declineReason;

  BorrowRequest({
    required this.id,
    this.requestId,
    required this.status,
    required this.borrowerVenueId,
    required this.lenderVenueId,
    this.borrowerUserId,
    this.lenderOwnerId,
    this.borrowerDisplayName = '',
    this.lenderDisplayName = '',
    required this.item,
    required this.eventContext,
    required this.terms,
    this.activityLog = const [],
    this.createdAt,
    this.respondedAt,
    this.handedOverAt,
    this.returnedAt,
    this.cancelledAt,
    this.respondedByUserId,
    this.cancelledBy,
    this.declineReason,
  });

  factory BorrowRequest.fromFirestore(String docId, Map<String, dynamic> data) {
    DateTime? toDateTime(dynamic ts) {
      if (ts == null) return null;
      if (ts is Timestamp) return ts.toDate();
      if (ts is String) return DateTime.tryParse(ts);
      return null;
    }
    return BorrowRequest(
      id: docId,
      requestId: data['requestId'] as String?,
      status: data['status'] ?? 'pending_lender_approval',
      borrowerVenueId: data['borrowerVenueId'] ?? '',
      lenderVenueId: data['lenderVenueId'] ?? '',
      borrowerUserId: data['borrowerUserId'] as String?,
      lenderOwnerId: data['lenderOwnerId'] as String?,
      borrowerDisplayName: data['borrowerDisplayName'] ?? '',
      lenderDisplayName: data['lenderDisplayName'] ?? '',
      item: BorrowItem.fromMap(Map<String, dynamic>.from(data['item'] ?? {})),
      eventContext: EventContext.fromMap(data['eventContext'] as Map<String, dynamic>?),
      terms: BorrowTerms.fromMap(data['terms'] as Map<String, dynamic>?),
      activityLog: (data['activityLog'] as List<dynamic>?)
              ?.map((e) => ActivityLogEntry.fromMap(Map<String, dynamic>.from(e)))
              .toList() ??
          [],
      createdAt: toDateTime(data['createdAt']),
      respondedAt: toDateTime(data['respondedAt']),
      handedOverAt: toDateTime(data['handedOverAt']),
      returnedAt: toDateTime(data['returnedAt']),
      cancelledAt: toDateTime(data['cancelledAt']),
      respondedByUserId: data['respondedByUserId'] as String?,
      cancelledBy: data['cancelledBy'] as String?,
      declineReason: data['declineReason'] as String?,
    );
  }

  Map<String, dynamic> toFirestore() => {
        'requestId': requestId ?? id,
        'status': status,
        'borrowerVenueId': borrowerVenueId,
        'lenderVenueId': lenderVenueId,
        'borrowerUserId': borrowerUserId,
        'lenderOwnerId': lenderOwnerId,
        'borrowerDisplayName': borrowerDisplayName,
        'lenderDisplayName': lenderDisplayName,
        'item': item.toMap(),
        'eventContext': eventContext.toMap(),
        'terms': terms.toMap(),
        'activityLog': activityLog.map((e) => e.toMap()).toList(),
      };
}
