import '../../../core/utils/formatters.dart';

class PricingTier {
  final String label;
  final double minPerPerson;
  final double maxPerPerson;

  const PricingTier({
    required this.label,
    required this.minPerPerson,
    required this.maxPerPerson,
  });
}

class VenuePricingModel {
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

  const VenuePricingModel({
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

  factory VenuePricingModel.fromMap(Map<String, dynamic>? data) =>
      VenuePricingModel(
        hallRent: asDouble(data?['hallRent']),
        acCost: asDouble(data?['acCost']),
        generatorCost: asDouble(data?['generatorCost']),
        decorAvailable: data?['decorAvailable'] ?? false,
        decorPrice: asDouble(data?['decorPrice']),
        soundAvailable: data?['soundAvailable'] ?? false,
        soundPrice: asDouble(data?['soundPrice']),
        securityAvailable: data?['securityAvailable'] ?? false,
        securityPrice: asDouble(data?['securityPrice']),
        chickenPrice: asDouble(data?['chickenPrice']),
        beefPrice: asDouble(data?['beefPrice']),
        muttonPrice: asDouble(data?['muttonPrice']),
        mehndiPrice: asDouble(data?['mehndiPrice']),
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

class VenueBudgetCalculator {
  static const List<PricingTier> pricingTiers = [
    PricingTier(label: 'Very Low', minPerPerson: 0, maxPerPerson: 1000),
    PricingTier(label: 'Low', minPerPerson: 1001, maxPerPerson: 1600),
    PricingTier(label: 'Medium', minPerPerson: 1601, maxPerPerson: 2500),
    PricingTier(label: 'High', minPerPerson: 2501, maxPerPerson: 4000),
    PricingTier(label: 'Very High', minPerPerson: 4001, maxPerPerson: 10000),
  ];

  static String getTierLabel(double perPersonPrice) {
    for (final tier in pricingTiers) {
      if (perPersonPrice >= tier.minPerPerson &&
          perPersonPrice <= tier.maxPerPerson) {
        return tier.label;
      }
    }
    return 'Custom';
  }

  static double estimateTotal({
    required double perPlatePrice,
    required int guestCount,
    double hallRent = 0,
    double acCost = 0,
    double generatorCost = 0,
    double decorPrice = 0,
    double soundPrice = 0,
    double securityPrice = 0,
  }) {
    final foodCost = perPlatePrice * guestCount;
    return foodCost +
        hallRent +
        acCost +
        generatorCost +
        decorPrice +
        soundPrice +
        securityPrice;
  }

  static Map<String, dynamic> calculateBudgetBreakdown({
    required double perPlatePrice,
    required int guestCount,
    double hallRent = 0,
    double acCost = 0,
    double generatorCost = 0,
    double decorPrice = 0,
    double soundPrice = 0,
    double securityPrice = 0,
  }) {
    final foodCost = perPlatePrice * guestCount;
    final total = estimateTotal(
      perPlatePrice: perPlatePrice,
      guestCount: guestCount,
      hallRent: hallRent,
      acCost: acCost,
      generatorCost: generatorCost,
      decorPrice: decorPrice,
      soundPrice: soundPrice,
      securityPrice: securityPrice,
    );
    return {
      'foodCost': foodCost,
      'hallRent': hallRent,
      'acCost': acCost,
      'generatorCost': generatorCost,
      'decorPrice': decorPrice,
      'soundPrice': soundPrice,
      'securityPrice': securityPrice,
      'total': total,
      'perPersonTotal': total / (guestCount > 0 ? guestCount : 1),
      'guestCount': guestCount,
      'perPlatePrice': perPlatePrice,
    };
  }

  static String formatPrice(double amount) => formatMoney(amount);

  static double calculatePerPlateAverage(VenuePricingModel pricing) {
    final prices = [
      pricing.chickenPrice,
      pricing.beefPrice,
      pricing.muttonPrice,
      pricing.mehndiPrice,
    ].where((p) => p > 0).toList();
    if (prices.isEmpty) return 0;
    return prices.reduce((a, b) => a + b) / prices.length;
  }

  static bool isWithinBudget(
      VenuePricingModel pricing, double maxPerPerson) {
    return pricing.chickenPrice <= maxPerPerson &&
        pricing.beefPrice <= maxPerPerson &&
        pricing.muttonPrice <= maxPerPerson;
  }
}

class VenuePricingUtils {
  static String chickenPriceLabel(double price) =>
      price > 0 ? 'PKR ${price.toStringAsFixed(0)}/person' : 'Contact for pricing';

  static String beefPriceLabel(double price) =>
      price > 0 ? 'PKR ${price.toStringAsFixed(0)}/person' : 'Contact for pricing';

  static String muttonPriceLabel(double price) =>
      price > 0 ? 'PKR ${price.toStringAsFixed(0)}/person' : 'Contact for pricing';

  static List<Map<String, dynamic>> formatPackagePricing(
      Map<String, dynamic> pricing) {
    final list = <Map<String, dynamic>>[];
    final p = VenuePricingModel.fromMap(pricing);
    if (p.chickenPrice > 0) {
      list.add({
        'type': 'Chicken',
        'price': p.chickenPrice,
        'label': chickenPriceLabel(p.chickenPrice),
      });
    }
    if (p.beefPrice > 0) {
      list.add({
        'type': 'Beef',
        'price': p.beefPrice,
        'label': beefPriceLabel(p.beefPrice),
      });
    }
    if (p.muttonPrice > 0) {
      list.add({
        'type': 'Mutton',
        'price': p.muttonPrice,
        'label': muttonPriceLabel(p.muttonPrice),
      });
    }
    if (p.mehndiPrice > 0) {
      list.add({
        'type': 'Mehndi',
        'price': p.mehndiPrice,
        'label': 'PKR ${p.mehndiPrice.toStringAsFixed(0)}/person',
      });
    }
    return list;
  }
}
