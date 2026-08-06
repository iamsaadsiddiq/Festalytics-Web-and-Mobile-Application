class InventoryListing {
  final String id;
  final String lenderVenueId;
  final String itemId;
  final String title;
  final String category;
  final int quantityAvailable;
  final int quantityTotal;
  final String listingType;
  final double? pricePerUnit;
  final String unit;
  final bool isActive;
  final bool borrowHubEnabled;
  final String lenderDisplayName;
  final String lenderArea;
  final String lenderPhone;
  final String updatedAt;

  InventoryListing({
    required this.id,
    required this.lenderVenueId,
    required this.itemId,
    required this.title,
    this.category = 'other',
    this.quantityAvailable = 0,
    this.quantityTotal = 0,
    this.listingType = 'lend',
    this.pricePerUnit,
    this.unit = 'units',
    this.isActive = true,
    this.borrowHubEnabled = false,
    this.lenderDisplayName = '',
    this.lenderArea = '',
    this.lenderPhone = '',
    this.updatedAt = '',
  });

  factory InventoryListing.fromFirestore(String docId, Map<String, dynamic> data) => InventoryListing(
        id: docId,
        lenderVenueId: data['lenderVenueId'] ?? '',
        itemId: data['itemId'] ?? '',
        title: data['title'] ?? '',
        category: data['category'] ?? 'other',
        quantityAvailable: (data['quantityAvailable'] ?? 0).toInt(),
        quantityTotal: (data['quantityTotal'] ?? 0).toInt(),
        listingType: data['listingType'] ?? 'lend',
        pricePerUnit: (data['pricePerUnit'] as num?)?.toDouble(),
        unit: data['unit'] ?? 'units',
        isActive: data['isActive'] ?? true,
        borrowHubEnabled: data['borrowHubEnabled'] ?? false,
        lenderDisplayName: data['lenderDisplayName'] ?? '',
        lenderArea: data['lenderArea'] ?? '',
        lenderPhone: data['lenderPhone'] ?? '',
        updatedAt: data['updatedAt'] ?? '',
      );

  Map<String, dynamic> toFirestore() => {
        'lenderVenueId': lenderVenueId,
        'itemId': itemId,
        'title': title,
        'category': category,
        'quantityAvailable': quantityAvailable,
        'quantityTotal': quantityTotal,
        'listingType': listingType,
        'pricePerUnit': pricePerUnit,
        'unit': unit,
        'isActive': isActive,
        'borrowHubEnabled': borrowHubEnabled,
        'lenderDisplayName': lenderDisplayName,
        'lenderArea': lenderArea,
        'lenderPhone': lenderPhone,
        'updatedAt': DateTime.now().toIso8601String(),
      };

  String get priceLabel {
    if (listingType == 'lend') return 'Free to borrow';
    if ((pricePerUnit ?? 0) > 0) {
      return 'Rs. ${pricePerUnit!.toStringAsFixed(0)} / $unit';
    }
    return 'Contact for pricing';
  }

  String get categoryImageUrl {
    switch (category) {
      case 'power':
        return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80';
      case 'seating':
        return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80';
      case 'decor':
        return 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80';
      case 'av':
        return 'https://images.unsplash.com/photo-1571266028245-e68f8574c9b8?w=600&q=80';
      default:
        return 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80';
    }
  }

  static String listingDocId(String lenderVenueId, String itemId) => '${lenderVenueId}_$itemId';
}
