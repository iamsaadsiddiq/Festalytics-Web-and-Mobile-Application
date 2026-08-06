class BookingCustomer {
  final String name;
  final String email;
  final String? contact;

  BookingCustomer({required this.name, required this.email, this.contact});

  factory BookingCustomer.fromMap(Map<String, dynamic> data) => BookingCustomer(
        name: data['name'] ?? 'Client',
        email: data['contact'] ?? data['email'] ?? 'No Email',
        contact: data['contact'],
      );

  Map<String, dynamic> toMap() => {'name': name, 'contact': contact ?? email};
}

class EventDetails {
  final String? venueId;
  final String? date;
  final String? timing;
  final String? category;
  final int? guests;
  final String? source;

  EventDetails({this.venueId, this.date, this.timing, this.category, this.guests, this.source});

  factory EventDetails.fromMap(Map<String, dynamic>? data) => EventDetails(
        venueId: data?['venueId'] as String?,
        date: data?['date'] as String?,
        timing: data?['timing'] as String?,
        category: data?['category'] as String?,
        guests: data?['guests'] as int?,
        source: data?['source'] as String?,
      );

  Map<String, dynamic> toMap() => {
        if (venueId != null) 'venueId': venueId,
        if (date != null) 'date': date,
        if (timing != null) 'timing': timing,
        if (category != null) 'category': category,
        if (guests != null) 'guests': guests,
        if (source != null) 'source': source,
      };
}

class Financials {
  final double grandTotal;
  final double advancePaid;

  Financials({this.grandTotal = 0, this.advancePaid = 0});

  factory Financials.fromMap(Map<String, dynamic>? data) => Financials(
        grandTotal: (data?['grandTotal'] ?? 0).toDouble(),
        advancePaid: (data?['advancePaid'] ?? 0).toDouble(),
      );

  Map<String, dynamic> toMap() => {'grandTotal': grandTotal, 'advancePaid': advancePaid};
}

class Booking {
  final String docId;
  final String id;
  final String? targetVenueId;
  final BookingCustomer customer;
  final String service;
  final String bookedDate;
  final String eventDate;
  final String timing;
  final String status;
  final String source;
  final double amount;
  final bool isWalkIn;
  final bool isQuotation;
  final EventDetails? eventDetails;
  final Financials? financials;
  final Map<String, dynamic> raw;

  Booking({
    required this.docId,
    required this.id,
    this.targetVenueId,
    required this.customer,
    required this.service,
    this.bookedDate = 'Today',
    this.eventDate = '',
    this.timing = '',
    this.status = 'Confirmed',
    this.source = 'Online Portal',
    this.amount = 0,
    this.isWalkIn = false,
    this.isQuotation = false,
    this.eventDetails,
    this.financials,
    required this.raw,
  });

  factory Booking.fromFirestore(String docId, Map<String, dynamic> data) {
    final isWalkIn = data['bookingSource'] == 'walk-in' ||
        (data['eventDetails'] is Map && data['eventDetails']['source'] == 'Walk-in ERP');
    final source = isWalkIn
        ? 'Walk-in ERP'
        : data['bookingSource'] == 'online' ||
                (data['eventDetails'] is Map && data['eventDetails']['source'] == 'Online Portal')
            ? 'Online Portal'
            : data['bookingSource'] ?? (data['eventDetails'] is Map ? data['eventDetails']['source'] : null) ?? 'Online Portal';

    return Booking(
      docId: docId,
      id: data['id'] ?? docId,
      targetVenueId: data['targetVenueId'] as String?,
      customer: BookingCustomer.fromMap(Map<String, dynamic>.from(data['customer'] ?? {})),
      service: (data['eventDetails'] is Map ? data['eventDetails']['category'] : null) ?? 'Wedding Event',
      bookedDate: data['bookedDate'] ?? 'Today',
      eventDate: (data['eventDetails'] is Map ? data['eventDetails']['date'] : null) ?? '',
      timing: (data['eventDetails'] is Map ? data['eventDetails']['timing'] : null) ?? '',
      status: data['status'] ?? 'Confirmed',
      source: source,
      amount: (data['financials'] is Map ? (data['financials']['grandTotal'] ?? 0) : 0).toDouble(),
      isWalkIn: isWalkIn,
      eventDetails: EventDetails.fromMap(data['eventDetails'] as Map<String, dynamic>?),
      financials: Financials.fromMap(data['financials'] as Map<String, dynamic>?),
      raw: Map<String, dynamic>.from(data),
    );
  }

  Map<String, dynamic> toFirestore() => {
        ...raw,
        'targetVenueId': targetVenueId,
        if (eventDetails != null) 'eventDetails': eventDetails!.toMap(),
        if (financials != null) 'financials': financials!.toMap(),
        if (customer.name.isNotEmpty)
          'customer': customer.toMap(),
      };
}
