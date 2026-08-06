import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/widgets/app_widgets.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../services/borrow_hub_service.dart';

class AddInventoryScreen extends StatefulWidget {
  const AddInventoryScreen({super.key});
  @override
  State<AddInventoryScreen> createState() => _AddInventoryScreenState();
}

class _AddInventoryScreenState extends State<AddInventoryScreen> {
  final _title = TextEditingController();
  final _category = TextEditingController(text: 'decor');
  final _qty = TextEditingController(text: '1');
  final _price = TextEditingController(text: '0');
  bool _busy = false;
  @override
  void dispose() { _title.dispose(); _category.dispose(); _qty.dispose(); _price.dispose(); super.dispose(); }

  Future<void> _save(String venueId) async {
    setState(() => _busy = true);
    try {
      final item = {
        'itemId': BorrowHubService.generateInventoryItemId(),
        'title': _title.text.trim(),
        'category': _category.text.trim(),
        'availableStockQuantity': int.tryParse(_qty.text) ?? 1,
        'totalStockQuantity': int.tryParse(_qty.text) ?? 1,
        'listingType': 'lend',
        'pricePerUnit': double.tryParse(_price.text) ?? 0,
        'unit': 'day',
        'isActive': true,
      };
      final snap = await FirebaseFirestore.instance.collection('venues').doc(venueId).get();
      final meta = snap.data() ?? <String, dynamic>{};
      final existing = List<Map<String, dynamic>>.from((meta['borrowableInventory'] as List<dynamic>? ?? []).map((e) => Map<String, dynamic>.from(e as Map)));
      existing.add(item);
      await BorrowHubService.publishBorrowHubCatalog(venueId, inventory: existing, borrowHub: {'enabled': true}, venueMeta: meta, forceEnable: true);
      if (mounted) Navigator.pop(context);
    } finally { if (mounted) setState(() => _busy = false); }
  }

  @override
  Widget build(BuildContext context) {
    final venueId = context.watch<app.AppAuthProvider>().currentUser?.venueId ?? '';
    return Scaffold(appBar: AppBar(title: const Text('Add Inventory')), body: ListView(padding: const EdgeInsets.all(18), children: [
      const SectionTitle('Inventory asset', subtitle: 'Publishes into borrowableInventory and inventory_listings like web add inventory.'),
      CandyCard(child: Column(children: [_field(_title, 'Asset title'), const SizedBox(height: 10), _field(_category, 'Category'), const SizedBox(height: 10), _field(_qty, 'Quantity', keyboard: TextInputType.number), const SizedBox(height: 10), _field(_price, 'Price per day', keyboard: TextInputType.number), const SizedBox(height: 14), SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _busy || venueId.isEmpty ? null : () => _save(venueId), child: Text(_busy ? 'Saving...' : 'Publish asset')))])),
    ]));
  }
  Widget _field(TextEditingController c, String label, {TextInputType? keyboard}) => TextField(controller: c, keyboardType: keyboard, decoration: InputDecoration(labelText: label));
}
