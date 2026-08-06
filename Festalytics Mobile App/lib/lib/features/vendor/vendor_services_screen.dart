import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../services/venues_service.dart';

class VendorServicesScreen extends StatefulWidget {
  const VendorServicesScreen({super.key});
  @override
  State<VendorServicesScreen> createState() => _VendorServicesScreenState();
}

class _VendorServicesScreenState extends State<VendorServicesScreen> {
  bool _busy = false;
  final _name = TextEditingController();
  final _desc = TextEditingController();
  final _address = TextEditingController();
  final _city = TextEditingController();
  final _capacity = TextEditingController();
  final _rent = TextEditingController();
  final _chicken = TextEditingController();
  final _beef = TextEditingController();
  final _mutton = TextEditingController();
  String? _loadedVenue;

  @override
  void dispose() { for (final c in [_name,_desc,_address,_city,_capacity,_rent,_chicken,_beef,_mutton]) { c.dispose(); } super.dispose(); }

  Future<void> _load(String venueId) async {
    if (_loadedVenue == venueId) return;
    final v = await VenuesService.getVenue(venueId);
    if (v == null || !mounted) return;
    setState(() {
      _loadedVenue = venueId;
      _name.text = v.name;
      _desc.text = v.description;
      _address.text = v.streetAddress;
      _city.text = v.city;
      _capacity.text = v.capacity.toString();
      _rent.text = v.pricing.hallRent.round().toString();
      _chicken.text = v.pricing.chickenPrice.round().toString();
      _beef.text = v.pricing.beefPrice.round().toString();
      _mutton.text = v.pricing.muttonPrice.round().toString();
    });
  }

  Future<void> _save(String venueId) async {
    setState(() => _busy = true);
    try {
      await VenuesService.saveVenue(venueId, {
        'name': _name.text.trim(),
        'hallName': _name.text.trim(),
        'description': _desc.text.trim(),
        'streetAddress': _address.text.trim(),
        'city': _city.text.trim(),
        'capacity': int.tryParse(_capacity.text) ?? 0,
        'profile': {'hall_name': _name.text.trim(), 'address': _address.text.trim(), 'area': _city.text.trim(), 'capacity': int.tryParse(_capacity.text) ?? 0, 'description': _desc.text.trim()},
        'pricing': {
          'hallRent': double.tryParse(_rent.text) ?? 0,
          'chickenPrice': double.tryParse(_chicken.text) ?? 0,
          'beefPrice': double.tryParse(_beef.text) ?? 0,
          'muttonPrice': double.tryParse(_mutton.text) ?? 0,
          'decorAvailable': true,
          'decorPrice': 120000,
          'soundAvailable': true,
          'soundPrice': 25000,
          'securityAvailable': true,
          'securityPrice': 20000,
        },
        'serviceActive': true,
      });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Service saved.'), backgroundColor: AppColors.success));
    } finally { if (mounted) setState(() => _busy = false); }
  }

  @override
  Widget build(BuildContext context) {
    final venueId = context.watch<app.AppAuthProvider>().currentUser?.venueId ?? '';
    if (venueId.isNotEmpty) _load(venueId);
    return Scaffold(
      appBar: AppBar(title: const Text('My Services')),
      body: venueId.isEmpty ? const EmptyState(icon: Icons.room_service_outlined, title: 'Venue not linked', subtitle: 'Complete business settings first.') : ListView(padding: const EdgeInsets.all(18), children: [
        const SectionTitle('Venue profile & packages', subtitle: 'Mobile equivalent of web My Services tabs: overview, pricing, menu, gallery, FAQs and service status.'),
        CandyCard(child: Column(children: [
          _field(_name, 'Business / hall name'), const SizedBox(height: 10), _field(_desc, 'Description', maxLines: 4), const SizedBox(height: 10), _field(_address, 'Address'), const SizedBox(height: 10), Row(children: [Expanded(child: _field(_city, 'City')), const SizedBox(width: 8), Expanded(child: _field(_capacity, 'Capacity', keyboard: TextInputType.number))]),
        ])),
        const SizedBox(height: 14),
        CandyCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SectionTitle('Pricing'),
          _field(_rent, 'Hall rent', keyboard: TextInputType.number), const SizedBox(height: 10),
          Row(children: [Expanded(child: _field(_chicken, 'Chicken / plate', keyboard: TextInputType.number)), const SizedBox(width: 8), Expanded(child: _field(_beef, 'Beef / plate', keyboard: TextInputType.number))]), const SizedBox(height: 10), _field(_mutton, 'Mutton / plate', keyboard: TextInputType.number),
        ])),
        const SizedBox(height: 14),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _busy ? null : () => _save(venueId), child: Text(_busy ? 'Saving...' : 'Save changes'))),
      ]),
    );
  }

  Widget _field(TextEditingController c, String label, {int maxLines = 1, TextInputType? keyboard}) => TextField(controller: c, maxLines: maxLines, keyboardType: keyboard, decoration: InputDecoration(labelText: label));
}
