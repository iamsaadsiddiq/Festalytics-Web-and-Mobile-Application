import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../models/venue.dart';

class PublicVenueDisplay {
  final String id;
  final String name;
  final String description;
  final String area;
  final int capacity;
  final String imageUrl;
  final String priceLabel;
  final String venueType;
  final List<String> categories;
  final double minPrice;
  final bool serviceActive;
  final String phone;
  final String? website;

  PublicVenueDisplay({
    required this.id,
    required this.name,
    required this.description,
    required this.area,
    required this.capacity,
    required this.imageUrl,
    required this.priceLabel,
    required this.venueType,
    required this.categories,
    required this.minPrice,
    required this.serviceActive,
    this.phone = '',
    this.website,
  });

  factory PublicVenueDisplay.fromVenue(Venue venue) {
    final pricing = venue.pricing;
    final minPrice = [
      pricing.chickenPrice,
      pricing.beefPrice,
      pricing.muttonPrice,
      pricing.mehndiPrice,
    ].where((p) => p > 0).fold(0.0, (double min, p) => min == 0 ? p : (p < min ? p : min));
    final primaryImage = venue.images.isNotEmpty
        ? (venue.images.first is Map
            ? (venue.images.first as Map)['url']?.toString() ?? ''
            : venue.images.first.toString())
        : 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80';
    final priceLabel = minPrice > 0
        ? 'From PKR ${minPrice.toStringAsFixed(0)}/person'
        : 'Contact for pricing';
    return PublicVenueDisplay(
      id: venue.id,
      name: venue.hallName.isNotEmpty ? venue.hallName : venue.name,
      description: venue.description,
      area: venue.city,
      capacity: venue.capacity,
      imageUrl: primaryImage,
      priceLabel: priceLabel,
      venueType: venue.venueType,
      categories: venue.categories,
      minPrice: minPrice,
      serviceActive: venue.serviceActive,
      phone: venue.profile.phone1,
      website: venue.website,
    );
  }
}

class PublicVenues {
  static const String _collection = 'venues';

  static CollectionReference<Map<String, dynamic>> get _ref =>
      FirebaseFirestore.instance.collection(_collection);

  static Future<List<PublicVenueDisplay>> fetchAllActive() async {
    final snap = await _ref.where('serviceActive', isEqualTo: true).get();
    return snap.docs
        .map((d) => PublicVenueDisplay.fromVenue(
            Venue.fromFirestore(d.id, d.data())))
        .toList();
  }

  static Future<PublicVenueDisplay?> fetchBySlug(String slug) async {
    if (slug.isEmpty) return null;
    try {
      final snap = await _ref.doc(slug).get();
      if (!snap.exists) return null;
      return PublicVenueDisplay.fromVenue(
          Venue.fromFirestore(slug, snap.data()!));
    } catch (_) {
      return null;
    }
  }

  static Stream<List<PublicVenueDisplay>> streamAllActive() {
    return _ref.where('serviceActive', isEqualTo: true).snapshots().map((snap) {
      return snap.docs
          .map((d) => PublicVenueDisplay.fromVenue(
              Venue.fromFirestore(d.id, d.data())))
          .toList();
    });
  }

  static Future<List<PublicVenueDisplay>> searchByArea(String area) async {
    final all = await fetchAllActive();
    if (area.isEmpty) return all;
    final lower = area.toLowerCase();
    return all.where((v) => v.area.toLowerCase().contains(lower)).toList();
  }

  static Future<List<PublicVenueDisplay>> filterByBudget(
      double maxPerPerson) async {
    final all = await fetchAllActive();
    return all.where((v) => v.minPrice <= maxPerPerson).toList();
  }

  static Future<List<PublicVenueDisplay>> filterByCapacity(
      int minGuests) async {
    final all = await fetchAllActive();
    return all.where((v) => v.capacity >= minGuests).toList();
  }

  static List<PublicVenueDisplay> sortByPrice(
      List<PublicVenueDisplay> venues, {bool ascending = true}) {
    final sorted = List<PublicVenueDisplay>.from(venues);
    sorted.sort((a, b) => ascending
        ? a.minPrice.compareTo(b.minPrice)
        : b.minPrice.compareTo(a.minPrice));
    return sorted;
  }
}
