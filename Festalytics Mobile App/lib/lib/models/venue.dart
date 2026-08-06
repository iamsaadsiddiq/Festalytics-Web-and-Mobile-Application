class VenueProfile {
  final String hallName;
  final String address;
  final String area;
  final String phone1;
  final int capacity;
  final String description;

  VenueProfile({
    this.hallName = '',
    this.address = '',
    this.area = '',
    this.phone1 = '',
    this.capacity = 0,
    this.description = '',
  });

  factory VenueProfile.fromMap(Map<String, dynamic>? data) => VenueProfile(
        hallName: data?['hall_name'] ?? '',
        address: data?['address'] ?? '',
        area: data?['area'] ?? '',
        phone1: data?['phone_1'] ?? '',
        capacity: (data?['capacity'] ?? 0).toInt(),
        description: data?['description'] ?? '',
      );

  Map<String, dynamic> toMap() => {
        'hall_name': hallName,
        'address': address,
        'area': area,
        'phone_1': phone1,
        'capacity': capacity,
        'description': description,
      };
}

class VenuePricing {
  final double hallRent;
  final double acCost;
  final double generatorCost;
  final bool decorAvailable;
  final double decorPrice;
  final bool soundAvailable;
  final double soundPrice;
  final bool securityAvailable;
  final double securityPrice;
  final double chickenPrice;
  final double beefPrice;
  final double muttonPrice;
  final double mehndiPrice;

  VenuePricing({
    this.hallRent = 0,
    this.acCost = 0,
    this.generatorCost = 0,
    this.decorAvailable = false,
    this.decorPrice = 0,
    this.soundAvailable = false,
    this.soundPrice = 0,
    this.securityAvailable = false,
    this.securityPrice = 0,
    this.chickenPrice = 0,
    this.beefPrice = 0,
    this.muttonPrice = 0,
    this.mehndiPrice = 0,
  });

  factory VenuePricing.fromMap(Map<String, dynamic>? data) => VenuePricing(
        hallRent: (data?['hallRent'] ?? 0).toDouble(),
        acCost: (data?['acCost'] ?? 0).toDouble(),
        generatorCost: (data?['generatorCost'] ?? 0).toDouble(),
        decorAvailable: data?['decorAvailable'] ?? false,
        decorPrice: (data?['decorPrice'] ?? 0).toDouble(),
        soundAvailable: data?['soundAvailable'] ?? false,
        soundPrice: (data?['soundPrice'] ?? 0).toDouble(),
        securityAvailable: data?['securityAvailable'] ?? false,
        securityPrice: (data?['securityPrice'] ?? 0).toDouble(),
        chickenPrice: (data?['chickenPrice'] ?? 0).toDouble(),
        beefPrice: (data?['beefPrice'] ?? 0).toDouble(),
        muttonPrice: (data?['muttonPrice'] ?? 0).toDouble(),
        mehndiPrice: (data?['mehndiPrice'] ?? 0).toDouble(),
      );

  Map<String, dynamic> toMap() => {
        'hallRent': hallRent,
        'acCost': acCost,
        'generatorCost': generatorCost,
        'decorAvailable': decorAvailable,
        'decorPrice': decorPrice,
        'soundAvailable': soundAvailable,
        'soundPrice': soundPrice,
        'securityAvailable': securityAvailable,
        'securityPrice': securityPrice,
        'chickenPrice': chickenPrice,
        'beefPrice': beefPrice,
        'muttonPrice': muttonPrice,
        'mehndiPrice': mehndiPrice,
      };
}

class VenueOperatingHours {
  final String defaultFrom;
  final String defaultTo;

  VenueOperatingHours({this.defaultFrom = '9:00 AM', this.defaultTo = '6:00 PM'});

  factory VenueOperatingHours.fromMap(Map<String, dynamic>? data) => VenueOperatingHours(
        defaultFrom: data?['defaultFrom'] ?? '9:00 AM',
        defaultTo: data?['defaultTo'] ?? '6:00 PM',
      );

  Map<String, dynamic> toMap() => {'defaultFrom': defaultFrom, 'defaultTo': defaultTo};
}

class Venue {
  final String id;
  final String name;
  final String hallName;
  final String description;
  final String streetAddress;
  final String city;
  final String postalCode;
  final int capacity;
  final String venueType;
  final List<String> categories;
  final VenueProfile profile;
  final VenuePricing pricing;
  final List<dynamic> cateringPackages;
  final Map<String, dynamic>? menuPackage;
  final List<String> features;
  final List<dynamic> faqs;
  final List<dynamic> images;
  final List<String> blockedDates;
  final List<String> blackoutDates;
  final List<String> bookedDates;
  final VenueOperatingHours operatingHours;
  final Map<String, dynamic> dayOverrides;
  final bool serviceActive;
  final String? ownerId;
  final Map<String, dynamic>? borrowHub;
  final List<dynamic> borrowableInventory;
  final List<dynamic> reviews;
  final String? website;
  final String createdAt;
  final String updatedAt;

  Venue({
    required this.id,
    this.name = '',
    this.hallName = '',
    this.description = '',
    this.streetAddress = '',
    this.city = '',
    this.postalCode = '',
    this.capacity = 0,
    this.venueType = '',
    this.categories = const [],
    VenueProfile? profile,
    VenuePricing? pricing,
    this.cateringPackages = const [],
    this.menuPackage,
    this.features = const [],
    this.faqs = const [],
    this.images = const [],
    this.blockedDates = const [],
    this.blackoutDates = const [],
    this.bookedDates = const [],
    VenueOperatingHours? operatingHours,
    this.dayOverrides = const {},
    this.serviceActive = true,
    this.ownerId,
    this.borrowHub,
    this.borrowableInventory = const [],
    this.reviews = const [],
    this.website,
    this.createdAt = '',
    this.updatedAt = '',
  })  : profile = profile ?? VenueProfile(),
        pricing = pricing ?? VenuePricing(),
        operatingHours = operatingHours ?? VenueOperatingHours();

  factory Venue.fromFirestore(String docId, Map<String, dynamic> data) => Venue(
        id: docId,
        name: data['name'] ?? data['hallName'] ?? '',
        hallName: data['hallName'] ?? '',
        description: data['description'] ?? '',
        streetAddress: data['streetAddress'] ?? '',
        city: data['city'] ?? '',
        postalCode: data['postalCode'] ?? '',
        capacity: (data['capacity'] ?? 0).toInt(),
        venueType: data['venueType'] ?? '',
        categories: List<String>.from(data['categories'] ?? []),
        profile: VenueProfile.fromMap(data['profile'] as Map<String, dynamic>?),
        pricing: VenuePricing.fromMap(data['pricing'] as Map<String, dynamic>?),
        cateringPackages: data['cateringPackages'] ?? [],
        menuPackage: data['menuPackage'] as Map<String, dynamic>?,
        features: List<String>.from(data['features'] ?? []),
        faqs: data['faqs'] ?? [],
        images: data['images'] ?? [],
        blockedDates: List<String>.from(data['blockedDates'] ?? []),
        blackoutDates: List<String>.from(data['blackoutDates'] ?? []),
        bookedDates: List<String>.from(data['bookedDates'] ?? []),
        operatingHours: VenueOperatingHours.fromMap(data['operatingHours'] as Map<String, dynamic>?),
        dayOverrides: Map<String, dynamic>.from(data['dayOverrides'] ?? {}),
        serviceActive: data['serviceActive'] ?? true,
        ownerId: data['ownerId'] as String?,
        borrowHub: data['borrowHub'] as Map<String, dynamic>?,
        borrowableInventory: data['borrowableInventory'] ?? [],
        reviews: data['reviews'] ?? [],
        website: data['website'] as String?,
        createdAt: data['createdAt'] ?? '',
        updatedAt: data['updatedAt'] ?? '',
      );

  Map<String, dynamic> toFirestore() => {
        'name': name,
        'hallName': hallName,
        'description': description,
        'streetAddress': streetAddress,
        'city': city,
        'postalCode': postalCode,
        'capacity': capacity,
        'venueType': venueType,
        'categories': categories,
        'profile': profile.toMap(),
        'pricing': pricing.toMap(),
        'cateringPackages': cateringPackages,
        if (menuPackage != null) 'menuPackage': menuPackage,
        'features': features,
        'faqs': faqs,
        'images': images,
        'blockedDates': blockedDates,
        'blackoutDates': blackoutDates,
        'bookedDates': bookedDates,
        'operatingHours': operatingHours.toMap(),
        'dayOverrides': dayOverrides,
        'serviceActive': serviceActive,
        if (ownerId != null) 'ownerId': ownerId,
        if (borrowHub != null) 'borrowHub': borrowHub,
        'borrowableInventory': borrowableInventory,
        'reviews': reviews,
        'updatedAt': DateTime.now().toIso8601String(),
      };
}
