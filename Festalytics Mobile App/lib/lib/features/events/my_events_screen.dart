import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_widgets.dart';
import '../../services/events_service.dart';

class MyEventsScreen extends StatelessWidget {
  const MyEventsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    return FestalyticsScaffold(
      title: 'My Events',
      floatingActionButton: FloatingActionButton.extended(onPressed: () => Navigator.pushNamed(context, AppRoutes.createEvent), icon: const Icon(Icons.add), label: const Text('Create')),
      body: uid == null ? const EmptyState(icon: Icons.lock_outline, title: 'Login required', subtitle: 'Please login to see your events.') : StreamBuilder<List<Map<String, dynamic>>>(
        stream: EventsService.streamUserEvents(uid),
        builder: (context, snap) {
          if (!snap.hasData) return const LoadingView(label: 'Loading events...');
          final events = snap.data!;
          if (events.isEmpty) return EmptyState(icon: Icons.event_busy, title: 'No events yet', subtitle: 'Create your first event plan.', action: ElevatedButton(onPressed: () => Navigator.pushNamed(context, AppRoutes.createEvent), child: const Text('Create event')));
          return ListView.builder(
            padding: const EdgeInsets.all(18),
            itemCount: events.length,
            itemBuilder: (_, i) {
              final e = events[i];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: CandyCard(onTap: () => Navigator.pushNamed(context, AppRoutes.manageEvent, arguments: e['id']), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [Expanded(child: Text((e['eventName'] ?? e['title'] ?? 'Untitled Event').toString(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900))), StatusChip((e['status'] ?? 'draft').toString())]),
                  const SizedBox(height: 6),
                  Text('${e['eventType'] ?? 'Event'} • ${prettyDate(e['date'])} • ${e['guests'] ?? 0} guests', style: const TextStyle(color: AppColors.muted)),
                  const SizedBox(height: 10),
                  LinearProgressIndicator(value: ((e['progress'] ?? 35) as num).toDouble() / 100, backgroundColor: AppColors.secondary, color: AppColors.primary),
                ])),
              );
            },
          );
        },
      ),
    );
  }
}
