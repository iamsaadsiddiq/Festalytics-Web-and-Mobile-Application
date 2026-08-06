import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/event_display.dart';
import '../../core/widgets/app_widgets.dart';
import '../../services/events_service.dart';

class MyEventsScreen extends StatelessWidget {
  const MyEventsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    return Scaffold(
      backgroundColor: const Color(0xFFF4F5F7),
      appBar: AppBar(
        title: const Text('My Events'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilledButton.icon(
              onPressed: () => Navigator.pushNamed(context, AppRoutes.createEvent),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Create'),
              style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            ),
          ),
        ],
      ),
      body: uid == null
        ? const EmptyState(icon: Icons.lock_outline, title: 'Login required', subtitle: 'Please login to see your events.')
        : StreamBuilder<List<Map<String, dynamic>>>(
            stream: EventsService.streamUserEvents(uid),
            builder: (_, snap) {
              if (!snap.hasData) return const LoadingView(label: 'Loading events...');
              final events = snap.data!;
              if (events.isEmpty) {
                return EmptyState(
                  icon: Icons.event_busy, title: 'No events yet',
                  subtitle: 'Create your first event plan.',
                  action: ElevatedButton(onPressed: () => Navigator.pushNamed(context, AppRoutes.createEvent), child: const Text('Create your first event')),
                );
              }
              return RefreshIndicator(
                onRefresh: () async {},
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: events.length,
                  itemBuilder: (_, i) {
                    final e = events[i];
                    final status = getStatusConfig(e['status']?.toString());
                    final venueName = e['selectedVenueName']?.toString();
                    final location = getEventLocation(e);
                    final hasQuotation = (e['quotationId']?.toString() ?? '').isNotEmpty;
                    final budgetTotal = (e['budgetTotal'] ?? 0).toDouble();
                    final guestCount = e['guestCount']?.toString();
                    final date = e['date']?.toString();
                    final time = e['time']?.toString();
                    final title = e['title']?.toString() ?? e['eventName']?.toString() ?? 'Untitled Event';
                    final eventType = e['eventType']?.toString();
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      clipBehavior: Clip.antiAlias,
                      child: InkWell(
                        onTap: () => Navigator.pushNamed(context, AppRoutes.manageEvent, arguments: events[i]['id']),
                        child: Column(children: [
                          Container(height: 4, decoration: const BoxDecoration(gradient: LinearGradient(colors: [AppColors.primary, Color(0xFFFF9EC4)]))),
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
                                  if (eventType != null && eventType.isNotEmpty)
                                    Text(eventType.toUpperCase(), style: TextStyle(color: Colors.grey.shade400, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1)),
                                ])),
                                const SizedBox(width: 8),
                                _statusChip(status),
                              ]),
                              const SizedBox(height: 12),
                              _infoRow(Icons.calendar_today, date != null ? formatEventDate(date) : 'Date not set', time != null ? formatEventTime(time) : null),
                              if (venueName != null && venueName.isNotEmpty)
                                _infoRow(Icons.business, venueName),
                              _infoRow(Icons.location_on_outlined, location),
                              if (guestCount != null && guestCount.isNotEmpty)
                                _infoRow(Icons.people_outline, '$guestCount guests'),
                              if (budgetTotal > 0)
                                _infoRow(Icons.account_balance_wallet_outlined, 'Est. ${formatRs(budgetTotal)}'),
                              if (hasQuotation)
                                Container(
                                  margin: const EdgeInsets.only(top: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
                                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                                    Icon(Icons.description, size: 14, color: Colors.green.shade700),
                                    const SizedBox(width: 4),
                                    Text('Quotation sent to venue', style: TextStyle(color: Colors.green.shade700, fontSize: 12, fontWeight: FontWeight.w700)),
                                  ]),
                                ),
                              const SizedBox(height: 12),
                              Row(children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () => Navigator.pushNamed(context, AppRoutes.editEvent, arguments: events[i]['id']),
                                    icon: const Icon(Icons.edit, size: 16),
                                    label: const Text('Edit', style: TextStyle(fontSize: 13)),
                                    style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 10)),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  icon: Icon(Icons.delete_outline, color: Colors.red.shade400, size: 20),
                                  onPressed: () async {
                                    final confirm = await showDialog<bool>(context: context, builder: (c) => AlertDialog(title: const Text('Delete event?'), content: const Text('This cannot be undone.'), actions: [
                                      TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                                      TextButton(onPressed: () => Navigator.pop(c, true), child: Text('Delete', style: TextStyle(color: Colors.red.shade400))),
                                    ]));
                                    if (confirm == true) {
                                      await EventsService.deleteEvent(events[i]['id'].toString());
                                    }
                                  },
                                ),
                              ]),
                            ]),
                          ),
                        ]),
                      ),
                    );
                  },
                ),
              );
            },
          ),
    );
  }

  Widget _statusChip(Map<String, dynamic> status) {
    Color bg, fg;
    final className = status['className'] as String? ?? '';
    if (className == 'pending') { bg = Colors.amber.shade50; fg = Colors.amber.shade700; }
    else if (className == 'draft') { bg = Colors.grey.shade100; fg = Colors.grey.shade600; }
    else if (className == 'confirmed') { bg = Colors.green.shade50; fg = Colors.green.shade700; }
    else if (className == 'declined') { bg = Colors.red.shade50; fg = Colors.red.shade700; }
    else { bg = Colors.green.shade50; fg = Colors.green.shade700; }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(99), border: Border.all(color: bg)),
      child: Text(status['label']?.toString() ?? '', style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w800)),
    );
  }

  Widget _infoRow(IconData icon, String text, [String? sub]) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        Icon(icon, size: 16, color: AppColors.primary),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: Color(0xFF4A5568)))),
        if (sub != null) Text(sub, style: TextStyle(fontSize: 13, color: Colors.grey.shade400)),
      ]),
    );
  }
}
