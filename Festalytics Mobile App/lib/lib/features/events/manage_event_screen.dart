import 'package:flutter/material.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_widgets.dart';
import '../../services/events_service.dart';

class ManageEventScreen extends StatelessWidget {
  final String eventId;
  const ManageEventScreen({super.key, required this.eventId});
  @override
  Widget build(BuildContext context) {
    return FestalyticsScaffold(
      title: 'Manage Event',
      actions: [IconButton(onPressed: () => Navigator.pushNamed(context, AppRoutes.editEvent, arguments: eventId), icon: const Icon(Icons.edit))],
      body: FutureBuilder<Map<String, dynamic>?>(
        future: EventsService.getEvent(eventId),
        builder: (_, snap) {
          if (!snap.hasData) return const LoadingView(label: 'Loading event...');
          final e = snap.data;
          if (e == null) return const EmptyState(icon: Icons.event_busy, title: 'Event not found', subtitle: 'This event was not found.');
          final timeline = List<dynamic>.from(e['timeline'] ?? []);
          final vendors = List<dynamic>.from(e['vendors'] ?? []);
          return ListView(padding: const EdgeInsets.all(18), children: [
            CandyCard(color: AppColors.primary, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text((e['eventName'] ?? 'Untitled Event').toString(), style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
              const SizedBox(height: 6),
              Text('${e['eventType']} • ${prettyDate(e['date'])} • ${e['guests']} guests', style: const TextStyle(color: Colors.white70)),
              const SizedBox(height: 12),
              LinearProgressIndicator(value: ((e['progress'] ?? 35) as num).toDouble() / 100, backgroundColor: Colors.white24, color: Colors.white),
            ])),
            const SizedBox(height: 18),
            const SectionTitle('Timeline'),
            ...timeline.map((t) => CandyCard(child: Row(children: [const Icon(Icons.check_circle_outline, color: AppColors.primary), const SizedBox(width: 10), Expanded(child: Text(t.toString()))]))),
            const SizedBox(height: 18),
            const SectionTitle('Vendors required'),
            Wrap(spacing: 8, runSpacing: 8, children: vendors.map((v) => StatusChip(v.toString())).toList()),
            const SizedBox(height: 18),
            Row(children: [Expanded(child: ElevatedButton.icon(onPressed: () => Navigator.pushNamed(context, AppRoutes.allVenues), icon: const Icon(Icons.storefront), label: const Text('Find venues'))), const SizedBox(width: 10), Expanded(child: OutlinedButton.icon(onPressed: () => Navigator.pushNamed(context, AppRoutes.aiPlanner), icon: const Icon(Icons.auto_awesome), label: const Text('Ask AI')))]),
          ]);
        },
      ),
    );
  }
}
