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

  const VenuePricing({
    this.hallRent = 250000,
    this.acCost = 25000,
    this.generatorCost = 15000,
    this.decorAvailable = true,
    this.decorPrice = 120000,
    this.soundAvailable = true,
    this.soundPrice = 25000,
    this.securityAvailable = true,
    this.securityPrice = 20000,
    this.chickenPrice = 1400,
    this.beefPrice = 2000,
    this.muttonPrice = 3000,
    this.mehndiPrice = 1200,
  });

  factory VenuePricing.fromMap(Map<String, dynamic>? data) {
    final p = data ?? {};
    return VenuePricing(
      hallRent: _n(p['hallRent'] ?? 250000),
      acCost: _n(p['acCost'] ?? 25000),
      generatorCost: _n(p['generatorCost'] ?? 15000),
      decorAvailable: p['decorAvailable'] != false,
      decorPrice: _n(p['decorPrice'] ?? 120000),
      soundAvailable: p['soundAvailable'] != false,
      soundPrice: _n(p['soundPrice'] ?? 25000),
      securityAvailable: p['securityAvailable'] != false,
      securityPrice: _n(p['securityPrice'] ?? 20000),
      chickenPrice: _n(p['chickenPrice'] ?? 1400),
      beefPrice: _n(p['beefPrice'] ?? 2000),
      muttonPrice: _n(p['muttonPrice'] ?? 3000),
      mehndiPrice: _n(p['mehndiPrice'] ?? 1200),
    );
  }

  static double _n(dynamic v) => (v is num) ? v.toDouble() : double.tryParse(v.toString()) ?? 0;
}

class CateringPackage {
  final String id;
  final String name;
  final String type;
  final double perPlatePrice;
  final List<String> dishes;

  const CateringPackage({
    required this.id,
    required this.name,
    this.type = '',
    this.perPlatePrice = 0,
    this.dishes = const [],
  });
}

const venueHireOnly = CateringPackage(
  id: 'venue-hire-only',
  name: 'Venue Hire Only',
  type: 'None',
  perPlatePrice: 0,
);

List<CateringPackage> resolveCateringPackages(Map<String, dynamic>? dbVenue, {Map<String, dynamic>? hallFallback}) {
  final pricing = VenuePricing.fromMap(dbVenue);
  return _buildStandardPackages(pricing);
}

List<CateringPackage> _buildStandardPackages(VenuePricing p) {
  return [
    CateringPackage(id: 'pkg-2', name: 'Mehndi Feast Chicken Menu', type: 'Chicken', perPlatePrice: p.chickenPrice, dishes: ['Chicken Pulao', 'Chicken Seekh Kabab', 'Fresh Salad', 'Mint Raita', 'Jalebi']),
    CateringPackage(id: 'pkg-1', name: 'Barat Luxury Beef Menu', type: 'Beef', perPlatePrice: p.beefPrice, dishes: ['Beef Biryani', 'Beef Qorma', 'Raita & Salad', 'Assorted Naan', 'Shahi Kheer']),
    CateringPackage(id: 'pkg-3', name: 'Royal Mutton Walima Menu', type: 'Mutton', perPlatePrice: p.muttonPrice, dishes: ['Mutton Mandi', 'Mutton Karahi', 'Hummus & Pita', 'Special Salad', 'Shahi Tukray']),
    CateringPackage(id: 'pkg-4', name: 'Mehndi Special Menu', type: 'Mehndi', perPlatePrice: p.mehndiPrice, dishes: ['Puri Halwa Chana', 'Gol Gappay Setup', 'Dahi Bhallay', 'Kashmiri Chai', 'Live Jalebi']),
  ];
}

class BudgetBreakdown {
  final double hallRent;
  final double cateringSubtotal;
  final double utilitiesCost;
  final double addonsCost;
  final double grandTotal;
  final List<BudgetItem> breakdown;
  final VenuePricing pricing;
  final int guestCount;

  BudgetBreakdown({
    required this.hallRent,
    required this.cateringSubtotal,
    required this.utilitiesCost,
    required this.addonsCost,
    required this.grandTotal,
    required this.breakdown,
    required this.pricing,
    required this.guestCount,
  });
}

class BudgetItem {
  final String item;
  final double amount;
  final String display;

  BudgetItem({required this.item, required this.amount, required this.display});
}

BudgetBreakdown computeEventBudget({
  required Map<String, dynamic>? dbVenue,
  required String guestCount,
  required CateringPackage? selectedPkg,
  Map<String, bool> addons = const {},
}) {
  final pricing = VenuePricing.fromMap(dbVenue);
  final guests = _parseInt(guestCount, 1);
  final pkg = selectedPkg ?? venueHireOnly;
  final mergedAddons = {
    'ac': false, 'generator': false, 'decor': false, 'sound': false, 'security': false,
    ...addons,
  };

  final hallRent = pricing.hallRent;
  final perPlate = pkg.perPlatePrice;
  final cateringSubtotal = perPlate > 0 ? perPlate * guests : 0.0;
  final utilitiesCost =
    ((mergedAddons['ac'] == true ? pricing.acCost : 0.0) +
    (mergedAddons['generator'] == true ? pricing.generatorCost : 0.0)).toDouble();
  final addonsCost =
    ((mergedAddons['decor'] == true && pricing.decorAvailable ? pricing.decorPrice : 0.0) +
    (mergedAddons['sound'] == true && pricing.soundAvailable ? pricing.soundPrice : 0.0) +
    (mergedAddons['security'] == true && pricing.securityAvailable ? pricing.securityPrice : 0.0)).toDouble();
  final grandTotal = hallRent + cateringSubtotal + utilitiesCost + addonsCost;

  final breakdown = <BudgetItem>[];
  breakdown.add(BudgetItem(item: 'Hall Rent', amount: hallRent, display: formatMoney(hallRent)));
  if (perPlate > 0) {
    breakdown.add(BudgetItem(item: 'Catering: ${pkg.name} ($guests x ${formatMoney(perPlate)})', amount: cateringSubtotal, display: formatMoney(cateringSubtotal)));
  } else {
    breakdown.add(BudgetItem(item: 'Catering: Venue Hire Only', amount: 0, display: formatMoney(0)));
  }
  if (mergedAddons['ac'] == true) breakdown.add(BudgetItem(item: 'Air Conditioning', amount: pricing.acCost, display: formatMoney(pricing.acCost)));
  if (mergedAddons['generator'] == true) breakdown.add(BudgetItem(item: 'Generator', amount: pricing.generatorCost, display: formatMoney(pricing.generatorCost)));
  if (mergedAddons['decor'] == true && pricing.decorAvailable) breakdown.add(BudgetItem(item: 'Decor Package', amount: pricing.decorPrice, display: formatMoney(pricing.decorPrice)));
  if (mergedAddons['sound'] == true && pricing.soundAvailable) breakdown.add(BudgetItem(item: 'Sound System', amount: pricing.soundPrice, display: formatMoney(pricing.soundPrice)));
  if (mergedAddons['security'] == true && pricing.securityAvailable) breakdown.add(BudgetItem(item: 'Security', amount: pricing.securityPrice, display: formatMoney(pricing.securityPrice)));

  return BudgetBreakdown(
    hallRent: hallRent,
    cateringSubtotal: cateringSubtotal,
    utilitiesCost: utilitiesCost,
    addonsCost: addonsCost,
    grandTotal: grandTotal,
    breakdown: breakdown,
    pricing: pricing,
    guestCount: guests,
  );
}

List<Map<String, dynamic>> getAddonOptions(Map<String, dynamic>? dbVenue) {
  final p = VenuePricing.fromMap(dbVenue);
  final options = <Map<String, dynamic>>[];
  options.add({'key': 'ac', 'label': 'Air Conditioning', 'price': p.acCost, 'available': true});
  options.add({'key': 'generator', 'label': 'Generator', 'price': p.generatorCost, 'available': true});
  if (p.decorAvailable) options.add({'key': 'decor', 'label': 'Decor Package', 'price': p.decorPrice, 'available': true});
  if (p.soundAvailable) options.add({'key': 'sound', 'label': 'Sound System', 'price': p.soundPrice, 'available': true});
  if (p.securityAvailable) options.add({'key': 'security', 'label': 'Security', 'price': p.securityPrice, 'available': true});
  return options;
}

String formatMoney(double amount) {
  final n = amount.round();
  if (n >= 10000000) return 'Rs. ${(n / 10000000).toStringAsFixed(1)}Cr';
  if (n >= 100000) return 'Rs. ${(n / 100000).toStringAsFixed(1)}L';
  return 'Rs. ${n.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';
}

int _parseInt(String? v, int fallback) {
  if (v == null || v.isEmpty) return fallback;
  return int.tryParse(v) ?? fallback;
}


