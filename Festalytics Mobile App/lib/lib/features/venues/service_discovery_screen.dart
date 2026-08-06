import 'package:flutter/material.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/theme/app_theme.dart';
import '../../models/venue.dart';
import '../../services/venues_service.dart';
import 'widgets/venue_card.dart';

class ServiceDiscoveryScreen extends StatefulWidget {
  const ServiceDiscoveryScreen({super.key});
  @override
  State<ServiceDiscoveryScreen> createState() => _ServiceDiscoveryScreenState();
}

class _ServiceDiscoveryScreenState extends State<ServiceDiscoveryScreen> {
  String _query = '';
  String _category = 'all';
  @override
  Widget build(BuildContext context) {
    return FestalyticsScaffold(
      title: 'Service Discovery',
      body: FutureBuilder<List<Venue>>(
        future: VenuesService.getAllVenues(),
        builder: (context, snap) {
          if (!snap.hasData) return const LoadingView(label: 'Loading services...');
          var venues = snap.data!;
          if (_query.isNotEmpty) {
            final q = _query.toLowerCase();
            venues = venues.where((v) => '${v.name} ${v.city} ${v.categories.join(' ')}'.toLowerCase().contains(q)).toList();
          }
          if (_category != 'all') {
            venues = venues.where((v) => v.categories.any((c) => c.toLowerCase().contains(_category))).toList();
          }
          return Column(children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                TextField(onChanged: (v) => setState(() => _query = v), decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search vendor services nearby...')),
                const SizedBox(height: 10),
                SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: ['all','banquet','catering','decor','photography'].map((c) => Padding(padding: const EdgeInsets.only(right: 8), child: ChoiceChip(label: Text(c.toUpperCase()), selected: _category == c, onSelected: (_) => setState(() => _category = c), selectedColor: AppColors.secondary))).toList())),
              ]),
            ),
            Expanded(child: venues.isEmpty ? const EmptyState(icon: Icons.map_outlined, title: 'No nearby services', subtitle: 'Try another category.') : ListView.builder(padding: const EdgeInsets.fromLTRB(18,0,18,18), itemCount: venues.length, itemBuilder: (_, i) => Padding(padding: const EdgeInsets.only(bottom: 12), child: VenueCard(venue: venues[i], compact: true)))),
          ]);
        },
      ),
    );
  }
}
