import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_widgets.dart';
import '../../models/venue.dart';
import '../../services/chat_service.dart';
import '../../services/quotations_service.dart';
import '../../services/venues_service.dart';

class VenueDetailsScreen extends StatefulWidget {
  final String venueId;
  const VenueDetailsScreen({super.key, required this.venueId});
  @override
  State<VenueDetailsScreen> createState() => _VenueDetailsScreenState();
}

class _VenueDetailsScreenState extends State<VenueDetailsScreen> {
  DateTime? _date;
  String _timing = 'Evening';
  int _guests = 300;
  String _category = 'Wedding';
  bool _busy = false;

  Future<void> _requestQuote(Venue venue) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      Navigator.pushNamed(context, AppRoutes.login);
      return;
    }
    setState(() => _busy = true);
    try {
      final perPlate = venue.pricing.chickenPrice == 0 ? 1400 : venue.pricing.chickenPrice;
      final payload = {
        'userId': user.uid,
        'customerName': user.displayName ?? user.email ?? 'Customer',
        'targetVenueId': venue.id,
        'eventDate': dateKey(_date ?? DateTime.now()),
        'guestCount': _guests,
        'selectedMenu': {
          'packageName': 'Chicken Menu Package',
          'type': 'Chicken',
          'perPlatePrice': perPlate,
          'dishes': ['Chicken Karahi', 'Chicken Biryani', 'Fresh Salad'],
        },
        'mobileMeta': {
          'venueName': venue.name,
          'timing': _timing,
          'category': _category,
          'source': 'Mobile App',
        },
      };
      await QuotationsService.submitCustomerQuotation(payload);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Quotation request sent to vendor.'), backgroundColor: AppColors.success));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: AppColors.danger));
    } finally { if (mounted) setState(() => _busy = false); }
  }

  Future<void> _chat(Venue venue) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      Navigator.pushNamed(context, AppRoutes.login);
      return;
    }
    final chatId = await ChatService.ensureRoom(customerId: user.uid, venueId: venue.id, customerName: user.displayName ?? user.email ?? 'Customer', venueName: venue.name);
    await ChatService.sendMessage(chatId: chatId, senderId: user.uid, senderRole: 'customer', text: 'Hi, I am interested in ${venue.name}.');
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Chat started. Vendor can see it in Messages.')));
  }

  @override
  Widget build(BuildContext context) {
    return FestalyticsScaffold(
      title: 'Venue Details',
      body: FutureBuilder<Venue?>(
        future: VenuesService.getVenue(widget.venueId),
        builder: (_, snap) {
          if (!snap.hasData) return const LoadingView(label: 'Loading venue details...');
          final venue = snap.data;
          if (venue == null) return const EmptyState(icon: Icons.error_outline, title: 'Venue not found', subtitle: 'This venue does not exist in Firestore.');
          final image = venue.images.isNotEmpty && venue.images.first is Map ? venue.images.first['url'].toString() : 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1000&q=80';
          return ListView(padding: const EdgeInsets.all(18), children: [
            ClipRRect(borderRadius: BorderRadius.circular(28), child: Image.network(image, height: 220, width: double.infinity, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(height: 220, color: AppColors.secondary))),
            const SizedBox(height: 16),
            Text(venue.name, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 6),
            Text('${venue.streetAddress} ${venue.city}', style: const TextStyle(color: AppColors.muted)),
            const SizedBox(height: 14),
            Wrap(spacing: 8, runSpacing: 8, children: [StatusChip('${venue.capacity} guests'), StatusChip(venue.venueType.isEmpty ? 'Banquet Hall' : venue.venueType), StatusChip(formatMoney(venue.pricing.hallRent))]),
            const SizedBox(height: 18),
            CandyCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const SectionTitle('Request quotation', subtitle: 'Creates the same quotations document used by the web booking flow.'),
              Row(children: [Expanded(child: Text('Date: ${_date == null ? 'Select date' : prettyDate(_date!.toIso8601String())}')), TextButton(onPressed: () async { final d = await showDatePicker(context: context, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 720)), initialDate: DateTime.now()); if (d != null) setState(() => _date = d); }, child: const Text('Pick'))]),
              Row(children: [Expanded(child: TextField(keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Guests'), controller: TextEditingController(text: _guests.toString()), onChanged: (v) => _guests = int.tryParse(v) ?? _guests)), const SizedBox(width: 8), Expanded(child: DropdownButtonFormField<String>(initialValue: _timing, items: ['Morning','Evening','Full day'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(), onChanged: (v) => setState(() => _timing = v ?? _timing), decoration: const InputDecoration(labelText: 'Timing')))]),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(initialValue: _category, items: ['Wedding','Mehndi','Walima','Corporate','Birthday'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(), onChanged: (v) => setState(() => _category = v ?? _category), decoration: const InputDecoration(labelText: 'Event category')),
              const SizedBox(height: 14),
              Row(children: [Expanded(child: ElevatedButton(onPressed: _busy ? null : () => _requestQuote(venue), child: const Text('Request quote'))), const SizedBox(width: 10), IconButton.filledTonal(onPressed: () => _chat(venue), icon: const Icon(Icons.chat_bubble_outline))]),
            ])),
            const SizedBox(height: 18),
            const SectionTitle('Description'),
            Text(venue.description.isEmpty ? venue.profile.description : venue.description, style: const TextStyle(height: 1.5)),
            const SizedBox(height: 18),
            const SectionTitle('Packages & pricing'),
            ...venue.cateringPackages.map((pkg) => CandyCard(child: ListTile(contentPadding: EdgeInsets.zero, title: Text((pkg is Map ? pkg['name'] : 'Package').toString(), style: const TextStyle(fontWeight: FontWeight.w800)), subtitle: Text(pkg is Map ? (pkg['dishes'] ?? pkg['categories'] ?? '').toString() : ''), trailing: Text(formatMoney(pkg is Map ? pkg['perPlatePrice'] : 0))))),
            const SizedBox(height: 18),
            const SectionTitle('Features'),
            Wrap(spacing: 8, runSpacing: 8, children: venue.features.map((f) => StatusChip(f)).toList()),
            const SizedBox(height: 18),
            const SectionTitle('FAQs'),
            ...venue.faqs.whereType<Map>().map((f) => ExpansionTile(title: Text((f['question'] ?? '').toString()), children: [Padding(padding: const EdgeInsets.all(14), child: Text((f['answer'] ?? '').toString()))])),
          ]);
        },
      ),
    );
  }
}
