import '../../../models/venue.dart';

class VenueFilterCriteria {
  final String? area;
  final int? minCapacity;
  final int? maxCapacity;
  final double? maxBudget;
  final String? category;
  final bool? requiresAC;
  final bool? requiresGenerator;
  final bool? requiresParking;
  final bool? requiresBridalRoom;
  final bool? hasDecoration;
  final String searchQuery;

  const VenueFilterCriteria({
    this.area,
    this.minCapacity,
    this.maxCapacity,
    this.maxBudget,
    this.category,
    this.requiresAC,
    this.requiresGenerator,
    this.requiresParking,
    this.requiresBridalRoom,
    this.hasDecoration,
    this.searchQuery = '',
  });

  bool get hasActiveFilters =>
      area != null ||
      minCapacity != null ||
      maxCapacity != null ||
      maxBudget != null ||
      category != null ||
      requiresAC != null ||
      requiresGenerator != null ||
      requiresParking != null ||
      requiresBridalRoom != null ||
      hasDecoration != null ||
      searchQuery.isNotEmpty;
}

class VenueFilters {
  static List<Venue> applyFilters(
      List<Venue> venues, VenueFilterCriteria criteria) {
    var filtered = venues;

    if (criteria.searchQuery.isNotEmpty) {
      final query = criteria.searchQuery.toLowerCase();
      filtered = filtered.where((v) {
        final name = v.hallName.toLowerCase();
        final city = v.city.toLowerCase();
        final desc = v.description.toLowerCase();
        final categories = v.categories.map((c) => c.toLowerCase());
        return name.contains(query) ||
            city.contains(query) ||
            desc.contains(query) ||
            categories.any((c) => c.contains(query));
      }).toList();
    }

    if (criteria.area != null) {
      final areaLower = criteria.area!.toLowerCase();
      filtered = filtered
          .where((v) => v.city.toLowerCase().contains(areaLower))
          .toList();
    }

    if (criteria.minCapacity != null) {
      filtered = filtered
          .where((v) => v.capacity >= criteria.minCapacity!)
          .toList();
    }

    if (criteria.maxCapacity != null) {
      filtered = filtered
          .where((v) => v.capacity <= criteria.maxCapacity!)
          .toList();
    }

    if (criteria.maxBudget != null) {
      filtered = filtered
          .where((v) =>
              v.pricing.chickenPrice <= criteria.maxBudget! &&
              v.pricing.beefPrice <= criteria.maxBudget! &&
              v.pricing.muttonPrice <= criteria.maxBudget!)
          .toList();
    }

    if (criteria.category != null) {
      final catLower = criteria.category!.toLowerCase();
      filtered = filtered
          .where((v) =>
              v.categories.any((c) => c.toLowerCase().contains(catLower)))
          .toList();
    }

    if (criteria.requiresAC == true) {
      filtered = filtered.where((v) => v.pricing.acCost > 0).toList();
    }

    if (criteria.requiresGenerator == true) {
      filtered = filtered.where((v) => v.pricing.generatorCost > 0).toList();
    }

    if (criteria.hasDecoration == true) {
      filtered = filtered.where((v) => v.pricing.decorAvailable).toList();
    }

    if (criteria.requiresParking == true) {
      filtered = filtered.where((v) {
        final profile = v.profile;
        return profile.description.toLowerCase().contains('parking');
      }).toList();
    }

    return filtered;
  }

  static List<Venue> sortByPrice(List<Venue> venues, {bool ascending = true}) {
    final sorted = List<Venue>.from(venues);
    sorted.sort((a, b) => ascending
        ? a.pricing.chickenPrice.compareTo(b.pricing.chickenPrice)
        : b.pricing.chickenPrice.compareTo(a.pricing.chickenPrice));
    return sorted;
  }

  static List<Venue> sortByCapacity(List<Venue> venues,
      {bool ascending = true}) {
    final sorted = List<Venue>.from(venues);
    sorted.sort(
        (a, b) => ascending ? a.capacity.compareTo(b.capacity) : b.capacity.compareTo(a.capacity));
    return sorted;
  }

  static List<Venue> sortByRating(List<Venue> venues,
      {bool ascending = false}) {
    final sorted = List<Venue>.from(venues);
    sorted.sort((a, b) {
      final aRatings = a.reviews.length;
      final bRatings = b.reviews.length;
      return ascending ? aRatings.compareTo(bRatings) : bRatings.compareTo(aRatings);
    });
    return sorted;
  }

  static List<String> extractAllAreas(List<Venue> venues) {
    final areas = venues.map((v) => v.city).where((c) => c.isNotEmpty).toSet();
    final sorted = areas.toList();
    sorted.sort();
    return sorted;
  }

  static Map<String, int> categoryCounts(List<Venue> venues) {
    final counts = <String, int>{};
    for (final v in venues) {
      for (final cat in v.categories) {
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    }
    return counts;
  }
}
