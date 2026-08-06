import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/venue.dart';

class VenuesService {
  static const String _collection = 'venues';
  static const String _placeholderImage =
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80';

  static CollectionReference get _ref =>
      FirebaseFirestore.instance.collection(_collection);

  static Future<Venue?> getVenue(String venueId) async {
    if (venueId.isEmpty) return null;
    final snap = await _ref.doc(venueId).get();
    if (!snap.exists) return null;
    return Venue.fromFirestore(venueId, snap.data() as Map<String, dynamic>);
  }

  static Future<List<Venue>> getAllVenues() async {
    final snap = await _ref.get();
    return snap.docs
        .map((d) => Venue.fromFirestore(d.id, d.data() as Map<String, dynamic>))
        .toList();
  }

  static Future<void> saveVenue(
      String venueId, Map<String, dynamic> data) async {
    await _ref.doc(venueId).set(
          {
            ...data,
            'updatedAt': DateTime.now().toIso8601String(),
          },
          SetOptions(merge: true),
        );
  }

  static Stream<DocumentSnapshot<Map<String, dynamic>>> streamVenue(
      String venueId) {
    return _ref.doc(venueId).snapshots().cast<DocumentSnapshot<Map<String, dynamic>>>();
  }

  static String slugifyHallName(String name) {
    return name
        .toLowerCase()
        .trim()
        .replaceAll(RegExp(r'[^a-z0-9\s-]'), '')
        .replaceAll(RegExp(r'\s+'), '-')
        .replaceAll(RegExp(r'-+'), '-')
        .replaceAll(RegExp(r'^-|-$'), '');
  }

  static Future<String> ensureUniqueVenueSlug(String baseSlug) async {
    if (baseSlug.isEmpty) {
      throw ArgumentError('Hall name must produce a valid URL slug.');
    }

    var candidate = baseSlug;
    var suffix = 2;

    while (true) {
      final snap = await _ref.doc(candidate).get();
      if (!snap.exists) {
        return candidate;
      }
      candidate = '$baseSlug-$suffix';
      suffix++;
    }
  }

  static Map<String, dynamic> buildDefaultVenueDocument({
    required String hallName,
    required String area,
    required String address,
    required int capacity,
    String phone = '',
    String description = '',
    required String ownerId,
    required String venueSlug,
  }) {
    final desc = description.trim().isNotEmpty
        ? description.trim()
        : '$hallName is a premium wedding and event venue in $area, offering elegant setups and bespoke catering.';

    return {
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
        'hallRent': 250000,
        'acCost': 25000,
        'generatorCost': 15000,
        'decorAvailable': true,
        'decorPrice': 120000,
        'soundAvailable': true,
        'soundPrice': 25000,
        'securityAvailable': true,
        'securityPrice': 20000,
        'chickenPrice': 1400,
        'beefPrice': 2000,
        'muttonPrice': 3000,
        'mehndiPrice': 1200,
      },
      'cateringPackages': [
        {
          'id': 'pkg-chicken',
          'name': 'Chicken Menu Package',
          'type': 'Chicken',
          'perPlatePrice': 1400,
          'dishes': [
            'Chicken Karahi',
            'Chicken Biryani',
            'Fresh Salad',
            'Mint Raita',
            'Shahi Kheer'
          ],
        },
        {
          'id': 'pkg-beef',
          'name': 'Beef Signature Menu',
          'type': 'Beef',
          'perPlatePrice': 2000,
          'dishes': [
            'Beef Biryani',
            'Beef Kabab Platters',
            'Special Salad',
            'Roghni Naan'
          ],
        },
        {
          'id': 'pkg-mutton',
          'name': 'Royal Mutton Walima Menu',
          'type': 'Mutton',
          'perPlatePrice': 3000,
          'dishes': [
            'Mutton Mandi',
            'Mutton Karahi',
            'Hummus & Pita',
            'Shahi Tukray'
          ],
        },
      ],
      'menuPackage': {
        'name': 'Chicken Menu Package',
        'status': true,
        'categories': [
          {
            'id': 'cat-1',
            'name': 'Main Course',
            'icon': 'dinner_dining',
            'items': [
              {
                'id': 'item-1',
                'name': 'Chicken Karahi',
                'description':
                    'Wok-fried chicken with ginger, green chillies and traditional spices.',
                'price': 350,
                'active': true,
              },
              {
                'id': 'item-2',
                'name': 'Chicken Biryani',
                'description':
                    'Aromatic basmati rice layered with spiced chicken and saffron.',
                'price': 300,
                'active': true,
              },
            ],
          },
          {
            'id': 'cat-2',
            'name': 'Sides & Salads',
            'icon': 'bakery_dining',
            'items': [
              {
                'id': 'item-4',
                'name': 'Fresh Salad',
                'description': 'Seasonal garden fresh vegetables.',
                'price': 50,
                'active': true,
              },
            ],
          },
        ],
      },
      'features': [
        'Premium Sound System',
        'Custom Mood Lighting',
        'Valet Parking Access',
        'Integrated Stage',
        'Full Bar Setup',
      ],
      'faqs': [
        {
          'id': 'faq-1',
          'question':
              'Is catering included in the base venue hire price?',
          'answer':
              'Catering is not included in the base venue rate. You can choose to add our custom catering packages.',
          'active': true,
        },
        {
          'id': 'faq-2',
          'question': 'What is the maximum capacity of the venue?',
          'answer':
              'Capacity depends on your hall setup. Contact us for exact seated and standing numbers.',
          'active': true,
        },
      ],
      'images': [
        {
          'id': 'img-1',
          'url': _placeholderImage,
          'label': '$hallName — Main Hall',
          'isPrimary': true,
        },
      ],
      'blockedDates': [],
      'blackoutDates': [],
      'bookedDates': [],
      'operatingHours': {
        'defaultFrom': '9:00 AM',
        'defaultTo': '6:00 PM',
      },
      'dayOverrides': {},
      'serviceActive': true,
      'ownerId': ownerId,
      'createdAt': DateTime.now().toIso8601String(),
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }

  static Future<String> provisionVendorVenue(
      String userId, Map<String, dynamic> businessInput) async {
    if (userId.isEmpty) {
      throw ArgumentError('userId is required.');
    }

    final hallName = (businessInput['hallName'] as String? ?? '').trim();
    final area = (businessInput['area'] as String? ?? '').trim();
    final address = (businessInput['address'] as String? ?? '').trim();
    final capacity =
        int.tryParse((businessInput['capacity'] ?? '').toString()) ?? 0;

    if (hallName.isEmpty) throw ArgumentError('Hall / business name is required.');
    if (area.isEmpty) throw ArgumentError('City / area is required.');
    if (address.isEmpty) throw ArgumentError('Street address is required.');
    if (capacity < 1) throw ArgumentError('Seated capacity must be at least 1.');

    final baseSlug = slugifyHallName(hallName);
    final venueSlug = await ensureUniqueVenueSlug(baseSlug);

    final venuePayload = buildDefaultVenueDocument(
      hallName: hallName,
      area: area,
      address: address,
      capacity: capacity,
      phone: businessInput['businessPhone'] ?? businessInput['mobileNumber'] ?? '',
      description: businessInput['description'] ?? '',
      ownerId: userId,
      venueSlug: venueSlug,
    );

    await _ref.doc(venueSlug).set(venuePayload);

    await FirebaseFirestore.instance.collection('users').doc(userId).set(
          {
            'venueId': venueSlug,
            'hallName': hallName,
            'onboardingComplete': true,
            'updatedAt': DateTime.now().toIso8601String(),
          },
          SetOptions(merge: true),
        );

    return venueSlug;
  }

  static Future<String> linkVendorToVenue(
      String userId, String venueSlug) async {
    if (userId.isEmpty || venueSlug.isEmpty) {
      throw ArgumentError('User and venue are required.');
    }

    final venueRef = _ref.doc(venueSlug);
    final venueSnap = await venueRef.get();

    if (!venueSnap.exists) {
      throw Exception('Venue "$venueSlug" was not found in Firestore.');
    }

    final venue = venueSnap.data() as Map<String, dynamic>;
    if (venue['ownerId'] != null && venue['ownerId'] != userId) {
      throw Exception('This venue is already linked to another vendor account.');
    }

    await venueRef.set(
      {
        'ownerId': userId,
        'updatedAt': DateTime.now().toIso8601String(),
      },
      SetOptions(merge: true),
    );

    await FirebaseFirestore.instance.collection('users').doc(userId).set(
          {
            'venueId': venueSlug,
            'onboardingComplete': true,
            'updatedAt': DateTime.now().toIso8601String(),
          },
          SetOptions(merge: true),
        );

    return venueSlug;
  }

  static Future<String?> resolveVendorVenueId(String userId,
      {Map<String, dynamic>? userData}) async {
    if (userId.isEmpty) return null;
    if (userData != null && userData['venueId'] != null) {
      return userData['venueId'] as String?;
    }

    try {
      final ownedSnap = await _ref
          .where('ownerId', isEqualTo: userId)
          .limit(5)
          .get();
      if (ownedSnap.docs.isNotEmpty) {
        final slug = ownedSnap.docs.first.id;
        await FirebaseFirestore.instance.collection('users').doc(userId).set(
              {
                'venueId': slug,
                'onboardingComplete': true,
                'updatedAt': DateTime.now().toIso8601String(),
              },
              SetOptions(merge: true),
            );
        return slug;
      }
    } catch (e) {
      // Silently fail
    }

    return null;
  }

  static Map<String, dynamic> buildVenueSavePayload(
      Map<String, dynamic> state) {
    final businessName = state['businessName'] ?? '';
    final vendorDescription = state['vendorDescription'] ?? '';
    final pricing = state['pricing'] as Map<String, dynamic>? ?? {};
    final activePackageName = state['activePackageName'] ?? '';
    final activePackageStatus = state['activePackageStatus'] ?? true;
    final categories = state['categories'] as List<dynamic>? ?? [];
    final cateringPackages = state['cateringPackages'] as List<dynamic>? ?? [];
    final features = state['features'] as List<dynamic>? ?? [];
    final serviceActive = state['serviceActive'] ?? true;
    final faqs = state['faqs'] as List<dynamic>? ?? [];
      final images = (state['images'] as List<dynamic>?) ?? [];
    final capacity = int.tryParse((state['capacity'] ?? '').toString()) ?? 0;
    final streetAddress = state['streetAddress'] ?? '';
    final city = state['city'] ?? '';
    final postalCode = state['postalCode'] ?? '';
    final venueType = state['venueType'] ?? '';
    final venueCategories = state['venueCategories'] as List<dynamic>? ?? [];
    final reviews = state['reviews'] as List<dynamic>? ?? [];
    final venueId = state['venueId'] as String?;

    final packageType = activePackageName.toString().contains('Beef')
        ? 'Beef'
        : activePackageName.toString().contains('Mutton')
            ? 'Mutton'
            : activePackageName.toString().contains('Mehndi')
                ? 'Mehndi'
                : 'Chicken';

    final headPriceKey = '${packageType[0].toLowerCase()}${packageType.substring(1)}Price';
    final headPrice = pricing[headPriceKey] ?? pricing['chickenPrice'] ?? 0;

    final syncedPackages = cateringPackages.map((pkg) {
      final pkgMap = Map<String, dynamic>.from(pkg);
      final pkgType = pkgMap['type'] ?? '';
      if (pkgType == 'Chicken') pkgMap['perPlatePrice'] = pricing['chickenPrice'] ?? 0;
      if (pkgType == 'Beef') pkgMap['perPlatePrice'] = pricing['beefPrice'] ?? 0;
      if (pkgType == 'Mutton') pkgMap['perPlatePrice'] = pricing['muttonPrice'] ?? 0;
      if (pkgType == 'Mehndi') pkgMap['perPlatePrice'] = pricing['mehndiPrice'] ?? 0;
      return pkgMap;
    }).toList();

    final activePkgId = 'pkg-${packageType.toLowerCase()}';
    final nonActivePackages = syncedPackages
        .where((p) => p['type'] != packageType && p['id'] != activePkgId)
        .toList();

    final updatedPackages = [
      {
        'id': activePkgId,
        'name': activePackageName,
        'type': packageType,
        'perPlatePrice': headPrice,
        'categories': categories,
        'dishes': categories
            .expand((c) => (c['items'] as List<dynamic>?)
                    ?.where((it) => it['active'] == true)
                    .map((it) => it['name'])
                    .toList() ??
                [])
            .take(8)
            .toList(),
      },
      ...nonActivePackages,
    ];

    return {
      'name': businessName,
      'hallName': businessName,
      'description': vendorDescription,
      'vendorDescription': vendorDescription,
      'pricing': pricing,
      'menuPackage': {
        'name': activePackageName ?? 'Menu Package',
        'status': activePackageStatus,
        'categories': categories,
      },
      'cateringPackages': updatedPackages,
      'features': features,
      'serviceActive': serviceActive,
      'faqs': faqs,
      'images': images.asMap().entries.map((entry) {
        final im = Map<String, dynamic>.from(entry.value);
        im['isPrimary'] = entry.key == 0;
        return im;
      }).toList(),
      'capacity': capacity,
      'streetAddress': streetAddress,
      'city': city,
      'postalCode': postalCode,
      'venueType': venueType,
      'categories': venueCategories,
      'reviews': reviews,
      'profile': {
        'hall_name': businessName,
        'address': streetAddress,
        'area': city,
        'capacity': capacity,
        'description': vendorDescription,
      },
      if (venueId != null) 'website': 'https://festalytics.com/venue/$venueId',
      'updatedAt': DateTime.now().toIso8601String(),
    };
  }
}
