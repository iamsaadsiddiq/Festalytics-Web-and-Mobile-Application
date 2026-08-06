import '../../../models/inventory_listing.dart';
import '../../../models/borrow_request.dart';

class BorrowHubCategory {
  final String id;
  final String label;
  final String icon;

  const BorrowHubCategory({
    required this.id,
    required this.label,
    this.icon = 'inventory_2',
  });
}

class BorrowHubUtils {
  static const List<BorrowHubCategory> categories = [
    BorrowHubCategory(id: 'seating', label: 'Seating', icon: 'chair'),
    BorrowHubCategory(id: 'power', label: 'Power / Generators', icon: 'bolt'),
    BorrowHubCategory(id: 'av', label: 'Sound & AV', icon: 'speaker'),
    BorrowHubCategory(id: 'decor', label: 'Decor', icon: 'palette'),
    BorrowHubCategory(id: 'tent', label: 'Tents & Canopies', icon: 'umbrella'),
    BorrowHubCategory(id: 'catering', label: 'Catering Equipment', icon: 'restaurant'),
    BorrowHubCategory(id: 'lighting', label: 'Lighting', icon: 'light'),
    BorrowHubCategory(id: 'furniture', label: 'Furniture', icon: 'weekend'),
    BorrowHubCategory(id: 'transport', label: 'Transport', icon: 'local_shipping'),
    BorrowHubCategory(id: 'other', label: 'Other', icon: 'inventory_2'),
  ];

  static List<Map<String, String>> get categoryOptions =>
      categories.map((c) => {'id': c.id, 'label': c.label}).toList();

  static List<Map<String, String>> get listingTypeOptions => [
    {'id': 'lend', 'label': 'Lend (free)'},
    {'id': 'rent', 'label': 'Rent'},
    {'id': 'both', 'label': 'Lend or rent'},
  ];

  static BorrowHubCategory? getCategory(String id) {
    try {
      return categories.firstWhere((c) => c.id == id);
    } catch (_) {
      return null;
    }
  }

  static String categoryLabel(String id) {
    final cat = getCategory(id);
    return cat?.label ?? id;
  }

  static List<InventoryListing> filterByCategory(
      List<InventoryListing> listings, String categoryId) {
    if (categoryId.isEmpty) return listings;
    return listings.where((l) => l.category == categoryId).toList();
  }

  static List<InventoryListing> filterBySearch(
      List<InventoryListing> listings, String query) {
    if (query.isEmpty) return listings;
    final lower = query.toLowerCase();
    return listings.where((l) {
      return l.title.toLowerCase().contains(lower) ||
          l.lenderDisplayName.toLowerCase().contains(lower) ||
          l.category.toLowerCase().contains(lower);
    }).toList();
  }

  static List<InventoryListing> filterByListingType(
      List<InventoryListing> listings, String type) {
    if (type.isEmpty) return listings;
    return listings.where((l) => l.listingType == type || l.listingType == 'both').toList();
  }

  static List<InventoryListing> filterByArea(
      List<InventoryListing> listings, String area) {
    if (area.isEmpty) return listings;
    final lower = area.toLowerCase();
    return listings.where((l) => l.lenderArea.toLowerCase().contains(lower)).toList();
  }

  static bool canCancel(BorrowRequest request) {
    return request.status == 'pending_lender_approval';
  }

  static bool canRespond(BorrowRequest request) {
    return request.status == 'pending_lender_approval';
  }

  static bool canMarkInUse(BorrowRequest request) {
    return request.status == 'accepted';
  }

  static bool canMarkReturned(BorrowRequest request) {
    return request.status == 'in_use' || request.status == 'accepted';
  }

  static String statusColor(String status) {
    switch (status) {
      case 'pending_lender_approval':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'in_use':
        return 'info';
      case 'returned':
        return 'default';
      case 'declined':
        return 'error';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  }

  static String itemConditionLabel(String listingType) {
    switch (listingType) {
      case 'lend':
        return 'Free to borrow';
      case 'rent':
        return 'Available for rent';
      case 'both':
        return 'Free to borrow or rent';
      default:
        return listingType;
    }
  }

  static int totalAvailable(List<InventoryListing> listings) =>
      listings.fold(0, (sum, l) => sum + l.quantityAvailable);

  static int totalListingsByCategory(
      List<InventoryListing> listings, String categoryId) {
    return listings.where((l) => l.category == categoryId).length;
  }
}
