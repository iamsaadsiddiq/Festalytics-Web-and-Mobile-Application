import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/widgets/app_widgets.dart';
import '../../models/venue.dart';
import '../../services/venues_service.dart';
import 'widgets/venue_card.dart';

class AllVenuesScreen extends StatefulWidget {
  const AllVenuesScreen({super.key});
  @override
  State<AllVenuesScreen> createState() => _AllVenuesScreenState();
}

class _AllVenuesScreenState extends State<AllVenuesScreen> {
  final _search = TextEditingController();
  String _area = '';
  String _event = '';
  int _minGuests = 0;
  List<Venue> _allVenues = [];
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() { _search.dispose(); super.dispose(); }

  Future<void> _load() async {
    if (_loaded) return;
    try {
      final firestoreVenues = await VenuesService.getAllVenues();
      final seenIds = firestoreVenues.map((v) => v.id).toSet();
      final jsonVenues = <Venue>[];
      try {
        final data = await rootBundle.loadString('assets/data/halls.json');
        final List<dynamic> decoded = jsonDecode(data);
        for (final h in decoded) {
          final hall = h as Map<String, dynamic>;
          final id = (hall['hall_id'] ?? '').toString();
          if (id.isEmpty || seenIds.contains(id)) continue;
          jsonVenues.add(Venue(
            id: id,
            name: hall['hall_name']?.toString() ?? '',
            hallName: hall['hall_name']?.toString() ?? '',
            description: hall['address']?.toString() ?? hall['full_address']?.toString() ?? '',
            streetAddress: hall['full_address']?.toString() ?? hall['address']?.toString() ?? '',
            city: hall['area']?.toString() ?? 'Lahore',
            capacity: int.tryParse(hall['capacity']?.toString() ?? '0') ?? 0,
            images: [hall['image_url']?.toString() ?? hall['image']?.toString() ?? ''],
          ));
        }
      } catch (_) {}
      if (mounted) setState(() { _allVenues = [...firestoreVenues, ...jsonVenues]; _loaded = true; });
    } catch (_) {
      if (mounted) setState(() => _loaded = true);
    }
  }

  bool _matches(Venue v) {
    final q = _search.text.toLowerCase().trim();
    final text = '${v.name} ${v.hallName} ${v.city} ${v.streetAddress} ${v.description} ${v.categories.join(' ')}'.toLowerCase();
    if (q.isNotEmpty && !text.contains(q)) return false;
    if (_area.isNotEmpty && !(v.city.toLowerCase().contains(_area.toLowerCase()) || v.profile.area.toLowerCase().contains(_area.toLowerCase()))) return false;
    if (_event.isNotEmpty && !text.contains(_event.toLowerCase())) return false;
    if (_minGuests > 0 && v.capacity < _minGuests) return false;
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return FestalyticsScaffold(
      title: 'All Venues',
      body: _loaded
          ? Column(children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  TextField(controller: _search, onChanged: (_) => setState(() {}), decoration: const InputDecoration(hintText: 'Search hall, area, service...', prefixIcon: Icon(Icons.search))),
                  const SizedBox(height: 10),
                  Row(children: [
                    Expanded(child: TextField(onChanged: (v) => setState(() => _area = v), decoration: const InputDecoration(hintText: 'Area'))),
                    const SizedBox(width: 8),
                    Expanded(child: TextField(onChanged: (v) => setState(() => _event = v), decoration: const InputDecoration(hintText: 'Event'))),
                    const SizedBox(width: 8),
                    Expanded(child: TextField(keyboardType: TextInputType.number, onChanged: (v) => setState(() => _minGuests = int.tryParse(v) ?? 0), decoration: const InputDecoration(hintText: 'Guests'))),
                  ]),
                ]),
              ),
              Padding(padding: const EdgeInsets.symmetric(horizontal: 18), child: SectionTitle('${_allVenues.length} venues (${_allVenues.where(_matches).length} shown)', subtitle: 'Loaded from Firestore + halls.json (273 halls).')),
              Expanded(
                child: _allVenues.where(_matches).toList().isEmpty
                    ? const EmptyState(icon: Icons.search_off, title: 'No matching venues', subtitle: 'Try a different area, event type or guest count.')
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
                        itemCount: _allVenues.where(_matches).length,
                        itemBuilder: (_, i) => Padding(padding: const EdgeInsets.only(bottom: 14), child: VenueCard(venue: _allVenues.where(_matches).toList()[i])),
                      ),
              ),
            ])
          : const LoadingView(label: 'Loading venues from Firestore & halls.json...'),
    );
  }
}
