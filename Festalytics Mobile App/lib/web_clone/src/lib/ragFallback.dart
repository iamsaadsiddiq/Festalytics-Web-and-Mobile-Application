import 'dart:convert';
import 'package:flutter/services.dart';

class HallInfo {
  final String hallId;
  final String hallName;
  final String category;
  final String description;
  final String area;
  final String phone1;
  final double chickenPrice;
  final double beefPrice;
  final double muttonPrice;
  final int capacity;
  final bool isAc;
  final int parking;
  final bool hasGenerator;
  final bool hasBridalRoom;
  final bool hasDecoration;

  HallInfo({
    required this.hallId,
    required this.hallName,
    required this.category,
    required this.description,
    required this.area,
    required this.phone1,
    required this.chickenPrice,
    required this.beefPrice,
    required this.muttonPrice,
    required this.capacity,
    required this.isAc,
    required this.parking,
    required this.hasGenerator,
    required this.hasBridalRoom,
    required this.hasDecoration,
  });

  factory HallInfo.fromJson(Map<String, dynamic> json) => HallInfo(
    hallId: json['hall_id']?.toString() ?? '',
    hallName: json['hall_name'] ?? '',
    category: json['category'] ?? '',
    description: json['description'] ?? '',
    area: json['area'] ?? '',
    phone1: json['phone_1'] ?? '',
    chickenPrice: double.tryParse(json['one_dish_chicken']?.toString() ?? '0') ?? 0,
    beefPrice: double.tryParse(json['one_dish_beef']?.toString() ?? '0') ?? 0,
    muttonPrice: double.tryParse(json['one_dish_mutton']?.toString() ?? '0') ?? 0,
    capacity: int.tryParse(json['capacity_sitting']?.toString() ?? '0') ?? 0,
    isAc: (json['is_air_conditioned']?.toString().toLowerCase() ?? '') == 'yes',
    parking: int.tryParse(json['parking_capacity']?.toString() ?? '0') ?? 0,
    hasGenerator: (json['generator_backup']?.toString().toLowerCase() ?? '') == 'yes',
    hasBridalRoom: (json['bridal_room']?.toString().toLowerCase() ?? '') == 'yes',
    hasDecoration: (json['decoration_in_house']?.toString().toLowerCase() ?? '') == 'yes',
  );

  String get priceRange => 'PKR ${chickenPrice.toStringAsFixed(0)}-${muttonPrice.toStringAsFixed(0)} per person';
}

class RagFallback {
  static List<HallInfo>? _cachedHalls;

  static Future<List<HallInfo>> loadHalls() async {
    if (_cachedHalls != null) return _cachedHalls!;
    try {
      final jsonStr = await rootBundle.loadString('assets/data/halls.json');
      final List<dynamic> data = jsonDecode(jsonStr) as List<dynamic>;
      _cachedHalls = data
          .map((e) => HallInfo.fromJson(e as Map<String, dynamic>))
          .toList();
      return _cachedHalls!;
    } catch (e) {
      return [];
    }
  }

  static void clearCache() {
    _cachedHalls = null;
  }

  static List<HallInfo> searchByName(String query) {
    if (_cachedHalls == null) return [];
    if (query.isEmpty) return _cachedHalls!;
    final lower = query.toLowerCase();
    return _cachedHalls!
        .where((h) => h.hallName.toLowerCase().contains(lower))
        .toList();
  }

  static List<HallInfo> filterByArea(String area) {
    if (_cachedHalls == null) return [];
    if (area.isEmpty) return _cachedHalls!;
    final lower = area.toLowerCase();
    return _cachedHalls!
        .where((h) => h.area.toLowerCase().contains(lower))
        .toList();
  }

  static List<HallInfo> filterByCapacity(int minGuests) {
    if (_cachedHalls == null) return [];
    return _cachedHalls!.where((h) => h.capacity >= minGuests).toList();
  }

  static List<HallInfo> filterByBudget(double maxPerPerson) {
    if (_cachedHalls == null) return [];
    return _cachedHalls!
        .where((h) => h.chickenPrice <= maxPerPerson)
        .toList();
  }

  static String answerQuery(String query) {
    if (_cachedHalls == null) return 'Hall data not loaded yet.';
    final lower = query.toLowerCase();
    if (lower.contains('total halls') || lower.contains('how many')) {
      return 'We have ${_cachedHalls!.length} wedding venues in our database.';
    }
    if (lower.contains('cheapest') || lower.contains('lowest price')) {
      final sorted = List<HallInfo>.from(_cachedHalls!)
        ..sort((a, b) => a.chickenPrice.compareTo(b.chickenPrice));
      final cheapest = sorted.first;
      return 'The most affordable venue is ${cheapest.hallName} in ${cheapest.area} starting at PKR ${cheapest.chickenPrice.toStringAsFixed(0)}/person.';
    }
    if (lower.contains('most expensive') || lower.contains('highest price') || lower.contains('luxury')) {
      final sorted = List<HallInfo>.from(_cachedHalls!)
        ..sort((a, b) => b.chickenPrice.compareTo(a.chickenPrice));
      final priciest = sorted.first;
      return 'The premium venue is ${priciest.hallName} in ${priciest.area} at PKR ${priciest.chickenPrice.toStringAsFixed(0)}/person.';
    }
    final areaMatch = filterByArea(query);
    if (areaMatch.isNotEmpty) {
      final names = areaMatch.map((h) => h.hallName).take(5).join(', ');
      return 'Venues in this area: $names${areaMatch.length > 5 ? ' and ${areaMatch.length - 5} more.' : '.'}';
    }
    final nameMatch = searchByName(query);
    if (nameMatch.isNotEmpty) {
      final h = nameMatch.first;
      return '${h.hallName}: ${h.description} Capacity: ${h.capacity} guests. Price range: ${h.priceRange}. Contact: ${h.phone1}.';
    }
    if (lower.contains('ac') || lower.contains('air conditioned')) {
      final count = _cachedHalls!.where((h) => h.isAc).length;
      return '$count out of ${_cachedHalls!.length} venues have air conditioning.';
    }
    if (lower.contains('generator') || lower.contains('backup')) {
      final count = _cachedHalls!.where((h) => h.hasGenerator).length;
      return '$count venues have generator backup.';
    }
    if (lower.contains('parking')) {
      final maxParking = _cachedHalls!
          .reduce((a, b) => a.parking > b.parking ? a : b);
      return 'Parking capacities range from ${_cachedHalls!.reduce((a, b) => a.parking < b.parking ? a : b).parking} to $maxParking vehicles.';
    }
    return 'I found ${_cachedHalls!.length} venues. Try asking about a specific area, budget, or venue name.';
  }
}
