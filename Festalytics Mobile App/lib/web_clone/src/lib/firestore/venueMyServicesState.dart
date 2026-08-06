import 'package:cloud_firestore/cloud_firestore.dart';

class VenueServiceCategory {
  final String id;
  final String name;
  final String icon;
  final List<VenueServiceItem> items;
  final bool active;

  VenueServiceCategory({
    required this.id,
    required this.name,
    this.icon = 'dinner_dining',
    this.items = const [],
    this.active = true,
  });

  factory VenueServiceCategory.fromMap(Map<String, dynamic> data) =>
      VenueServiceCategory(
        id: data['id'] ?? '',
        name: data['name'] ?? '',
        icon: data['icon'] ?? 'dinner_dining',
        items: (data['items'] as List<dynamic>?)
                ?.map((i) => VenueServiceItem.fromMap(Map<String, dynamic>.from(i)))
                .toList() ??
            [],
        active: data['active'] ?? true,
      );

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'icon': icon,
    'items': items.map((i) => i.toMap()).toList(),
    'active': active,
  };
}

class VenueServiceItem {
  final String id;
  final String name;
  final String description;
  final double price;
  final bool active;

  VenueServiceItem({
    required this.id,
    required this.name,
    this.description = '',
    this.price = 0,
    this.active = true,
  });

  factory VenueServiceItem.fromMap(Map<String, dynamic> data) =>
      VenueServiceItem(
        id: data['id'] ?? '',
        name: data['name'] ?? '',
        description: data['description'] ?? '',
        price: (data['price'] ?? 0).toDouble(),
        active: data['active'] ?? true,
      );

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'description': description,
    'price': price,
    'active': active,
  };
}

class VenueMyServicesState {
  static const String _collection = 'venues';

  static DocumentReference<Map<String, dynamic>> _ref(String venueId) =>
      FirebaseFirestore.instance.collection(_collection).doc(venueId);

  static Future<void> saveMenuPackage(
    String venueId,
    Map<String, dynamic> menuPackage,
  ) async {
    await _ref(venueId).set({
      'menuPackage': menuPackage,
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }

  static Future<void> saveCategories(
    String venueId,
    List<VenueServiceCategory> categories,
  ) async {
    final pkgName = categories.isNotEmpty ? categories.first.name : 'Menu Package';
    await _ref(venueId).set({
      'menuPackage': {
        'name': pkgName,
        'status': true,
        'categories': categories.map((c) => c.toMap()).toList(),
      },
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }

  static Future<List<VenueServiceCategory>> fetchCategories(
      String venueId) async {
    final snap = await _ref(venueId).get();
    if (!snap.exists) return [];
    final data = snap.data()!;
    final menuPackage = data['menuPackage'] as Map<String, dynamic>?;
    if (menuPackage == null) return [];
    final rawCategories = menuPackage['categories'] as List<dynamic>? ?? [];
    return rawCategories
        .map((c) => VenueServiceCategory.fromMap(Map<String, dynamic>.from(c)))
        .toList();
  }

  static Future<void> toggleItemActive(
    String venueId,
    String categoryId,
    String itemId,
    bool isActive,
  ) async {
    final categories = await fetchCategories(venueId);
    final updated = categories.map((cat) {
      if (cat.id != categoryId) return cat;
      final items = cat.items.map((item) {
        if (item.id != itemId) return item;
        return VenueServiceItem(
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          active: isActive,
        );
      }).toList();
      return VenueServiceCategory(
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        items: items,
        active: cat.active,
      );
    }).toList();
    await saveCategories(venueId, updated);
  }

  static Future<void> toggleCategoryActive(
    String venueId,
    String categoryId,
    bool isActive,
  ) async {
    final categories = await fetchCategories(venueId);
    final updated = categories.map((cat) {
      if (cat.id != categoryId) return cat;
      return VenueServiceCategory(
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        items: cat.items,
        active: isActive,
      );
    }).toList();
    await saveCategories(venueId, updated);
  }

  static Future<Map<String, dynamic>?> fetchPackageState(
      String venueId) async {
    final snap = await _ref(venueId).get();
    if (!snap.exists) return null;
    final data = snap.data()!;
    return data['menuPackage'] as Map<String, dynamic>?;
  }

  static Stream<Map<String, dynamic>?> streamPackageState(String venueId) {
    return _ref(venueId).snapshots().map((snap) {
      if (!snap.exists) return null;
      return snap.data()!['menuPackage'] as Map<String, dynamic>?;
    });
  }

  static String generateCategoryId() =>
      'cat-${DateTime.now().millisecondsSinceEpoch}';

  static String generateItemId() =>
      'item-${DateTime.now().millisecondsSinceEpoch}';
}
