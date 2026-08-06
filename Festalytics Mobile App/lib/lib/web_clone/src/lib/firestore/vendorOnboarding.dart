import 'package:cloud_firestore/cloud_firestore.dart';

class VendorOnboardingStep {
  final String id;
  final String label;
  final bool completed;
  final bool required;

  const VendorOnboardingStep({
    required this.id,
    required this.label,
    this.completed = false,
    this.required = true,
  });

  VendorOnboardingStep copyWith({bool? completed}) =>
      VendorOnboardingStep(
        id: id,
        label: label,
        completed: completed ?? this.completed,
        required: required,
      );
}

class VendorOnboarding {
  static const String _collection = 'venues';
  static const String _usersCollection = 'users';

  static List<VendorOnboardingStep> defaultSteps = [
    const VendorOnboardingStep(id: 'business_info', label: 'Business Information'),
    const VendorOnboardingStep(id: 'venue_details', label: 'Venue Details'),
    const VendorOnboardingStep(id: 'pricing', label: 'Pricing & Packages'),
    const VendorOnboardingStep(id: 'images', label: 'Photos & Media'),
    const VendorOnboardingStep(id: 'features', label: 'Features & FAQs'),
    const VendorOnboardingStep(id: 'publish', label: 'Publish'),
  ];

  static DocumentReference<Map<String, dynamic>> _venueRef(String venueId) =>
      FirebaseFirestore.instance.collection(_collection).doc(venueId);

  static DocumentReference<Map<String, dynamic>> _userRef(String uid) =>
      FirebaseFirestore.instance.collection(_usersCollection).doc(uid);

  static Future<String> provisionVendor({
    required String userId,
    required String hallName,
    required String area,
    required String address,
    required int capacity,
    String phone = '',
    String description = '',
  }) async {
    if (userId.isEmpty) throw ArgumentError('userId is required.');
    if (hallName.trim().isEmpty) throw ArgumentError('Hall name is required.');
    if (area.trim().isEmpty) throw ArgumentError('Area is required.');
    if (address.trim().isEmpty) throw ArgumentError('Address is required.');
    if (capacity < 1) throw ArgumentError('Capacity must be at least 1.');

    final baseSlug = hallName
        .toLowerCase()
        .trim()
        .replaceAll(RegExp(r'[^a-z0-9\s-]'), '')
        .replaceAll(RegExp(r'\s+'), '-')
        .replaceAll(RegExp(r'-+'), '-')
        .replaceAll(RegExp(r'^-|-$'), '');
    var venueSlug = baseSlug;
    var suffix = 2;
    while (true) {
      final existing = await _venueRef(venueSlug).get();
      if (!existing.exists) break;
      venueSlug = '$baseSlug-$suffix';
      suffix++;
    }

    final desc = description.trim().isNotEmpty
        ? description.trim()
        : '$hallName is a premium wedding and event venue in $area.';
    const placeholderImage =
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80';

    await _venueRef(venueSlug).set({
      'name': hallName,
      'hallName': hallName,
      'description': desc,
      'streetAddress': address,
      'city': area,
      'postalCode': '54000',
      'capacity': capacity,
      'venueType': 'Banquet Hall',
      'categories': ['BANQUET HALL', 'CATERING', 'DECOR'],
      'website': 'https://festalytics.com/venue/$venueSlug',
      'profile': {
        'hall_name': hallName,
        'address': address,
        'area': area,
        'phone_1': phone,
        'capacity': capacity,
        'description': desc,
      },
      'pricing': {
        'hallRent': 250000, 'acCost': 25000, 'generatorCost': 15000,
        'decorAvailable': true, 'decorPrice': 120000,
        'soundAvailable': true, 'soundPrice': 25000,
        'securityAvailable': true, 'securityPrice': 20000,
        'chickenPrice': 1400, 'beefPrice': 2000, 'muttonPrice': 3000, 'mehndiPrice': 1200,
      },
      'cateringPackages': [
        {'id': 'pkg-chicken', 'name': 'Chicken Menu Package', 'type': 'Chicken', 'perPlatePrice': 1400,
         'dishes': ['Chicken Karahi', 'Chicken Biryani', 'Fresh Salad', 'Mint Raita', 'Shahi Kheer']},
        {'id': 'pkg-beef', 'name': 'Beef Signature Menu', 'type': 'Beef', 'perPlatePrice': 2000,
         'dishes': ['Beef Biryani', 'Beef Kabab Platters', 'Special Salad', 'Roghni Naan']},
        {'id': 'pkg-mutton', 'name': 'Royal Mutton Walima Menu', 'type': 'Mutton', 'perPlatePrice': 3000,
         'dishes': ['Mutton Mandi', 'Mutton Karahi', 'Hummus & Pita', 'Shahi Tukray']},
      ],
      'menuPackage': {'name': 'Chicken Menu Package', 'status': true, 'categories': []},
      'features': ['Premium Sound System', 'Custom Mood Lighting', 'Valet Parking Access', 'Integrated Stage', 'Full Bar Setup'],
      'faqs': [
        {'id': 'faq-1', 'question': 'Is catering included in the base venue hire price?',
         'answer': 'Catering is not included in the base venue rate. You can choose to add our custom catering packages.', 'active': true},
        {'id': 'faq-2', 'question': 'What is the maximum capacity of the venue?',
         'answer': 'Capacity depends on your hall setup. Contact us for exact seated and standing numbers.', 'active': true},
      ],
      'images': [{'id': 'img-1', 'url': placeholderImage, 'label': '$hallName — Main Hall', 'isPrimary': true}],
      'blockedDates': [], 'blackoutDates': [], 'bookedDates': [],
      'operatingHours': {'defaultFrom': '9:00 AM', 'defaultTo': '6:00 PM'},
      'dayOverrides': {}, 'serviceActive': true,
      'ownerId': userId,
      'createdAt': DateTime.now().toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
    });

    await _userRef(userId).set({
      'venueId': venueSlug,
      'hallName': hallName,
      'onboardingComplete': true,
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));

    return venueSlug;
  }

  static Future<Map<String, dynamic>?> fetchOnboardingState(String uid) async {
    if (uid.isEmpty) return null;
    final snap = await _userRef(uid).get();
    if (!snap.exists) return null;
    return snap.data();
  }

  static Future<void> updateOnboardingProgress(
      String uid, Map<String, dynamic> data) async {
    await _userRef(uid).set({
      ...data,
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }

  static Future<void> completeOnboarding(String uid, String venueSlug) async {
    await _userRef(uid).set({
      'venueId': venueSlug,
      'onboardingComplete': true,
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }

  static Future<void> saveBusinessInfo(
      String venueSlug, Map<String, dynamic> info) async {
    await _venueRef(venueSlug).set({
      'name': info['hallName'],
      'hallName': info['hallName'],
      'description': info['description'],
      'streetAddress': info['address'],
      'city': info['area'],
      'capacity': int.tryParse(info['capacity']?.toString() ?? '0') ?? 0,
      'profile': {
        'hall_name': info['hallName'],
        'address': info['address'],
        'area': info['area'],
        'phone_1': info['phone'] ?? '',
        'capacity': int.tryParse(info['capacity']?.toString() ?? '0') ?? 0,
        'description': info['description'] ?? '',
      },
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }

  static Future<void> savePricing(
      String venueSlug, Map<String, dynamic> pricingData) async {
    await _venueRef(venueSlug).set({
      'pricing': pricingData,
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }

  static Future<void> saveImages(
      String venueSlug, List<Map<String, dynamic>> images) async {
    final enhanced = images.asMap().entries.map((entry) {
      final im = Map<String, dynamic>.from(entry.value);
      im['isPrimary'] = entry.key == 0;
      return im;
    }).toList();
    await _venueRef(venueSlug).set({
      'images': enhanced,
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }

  static Future<void> saveFeatures(
      String venueSlug, List<String> features) async {
    await _venueRef(venueSlug).set({
      'features': features,
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }

  static Future<void> publishVenue(String venueSlug) async {
    await _venueRef(venueSlug).set({
      'serviceActive': true,
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }

  static Future<void> unpublishVenue(String venueSlug) async {
    await _venueRef(venueSlug).set({
      'serviceActive': false,
      'updatedAt': DateTime.now().toIso8601String(),
    }, SetOptions(merge: true));
  }
}
