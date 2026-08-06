import 'package:flutter/material.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/event_display.dart';
import '../../core/utils/venue_pricing.dart';
import '../../core/widgets/app_widgets.dart';
import '../../services/events_service.dart';

class ManageEventScreen extends StatefulWidget {
  final String eventId;
  const ManageEventScreen({super.key, required this.eventId});
  @override
  State<ManageEventScreen> createState() => _ManageEventScreenState();
}

class _ManageEventScreenState extends State<ManageEventScreen> {
  int _tab = 0;
  static const _tabs = ['Overview', 'Menu & Services', 'Budget'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manage Event')),
      body: FutureBuilder<Map<String, dynamic>?>(
        future: EventsService.getEvent(widget.eventId),
        builder: (_, snap) {
          if (!snap.hasData) return const LoadingView(label: 'Loading event...');
          final e = snap.data;
          if (e == null) {
            return const EmptyState(icon: Icons.event_busy, title: 'Event not found', subtitle: 'This event was not found.');
          }

          final title = e['title']?.toString() ?? e['eventName']?.toString() ?? 'Untitled Event';
          final status = getStatusConfig(e['status']?.toString());
          final date = e['date']?.toString();
          final time = e['time']?.toString();
          final location = getEventLocation(e);
          final guestCount = e['guestCount']?.toString();
          final eventType = e['eventType']?.toString();
          final venueName = e['selectedVenueName']?.toString();
          final venueLocation = e['selectedVenueLocation']?.toString();
          final venuePrice = e['selectedVenuePrice']?.toString();
          final pkg = e['selectedCateringPackage'] as Map<String, dynamic>?;
          final addons = e['selectedAddons'] as Map<String, dynamic>? ?? {};
          final breakdownRaw = e['budgetBreakdown'] as List<dynamic>? ?? [];
          final budgetTotal = (e['budgetTotal'] ?? 0).toDouble();
          final hasQuotation = (e['quotationId']?.toString() ?? '').isNotEmpty;
          final daysLeft = getDaysUntil(date);
          final addonLabels = getSelectedAddonLabels(e);

          return Column(children: [
            Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade100)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22)),
                    const SizedBox(height: 4),
                    _detailChip(status),
                    if (eventType != null && eventType.isNotEmpty)
                      Padding(padding: const EdgeInsets.only(top: 4), child: Text('Event type: $eventType', style: TextStyle(color: Colors.grey.shade400, fontSize: 13))),
                  ])),
                  IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    onPressed: () => Navigator.pushNamed(context, AppRoutes.editEvent, arguments: widget.eventId),
                    style: IconButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                  ),
                ]),
                const SizedBox(height: 12),
                Wrap(spacing: 16, runSpacing: 8, children: [
                  if (date != null) _infoChip(Icons.calendar_today, formatEventDate(date)),
                  if (time != null) _infoChip(Icons.access_time, formatEventTime(time)),
                  if (location.isNotEmpty) _infoChip(Icons.location_on_outlined, location),
                  if (guestCount != null) _infoChip(Icons.people_outline, '$guestCount guests'),
                ]),
              ]),
            ),

            Container(
              height: 40,
              margin: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
              child: Row(children: List.generate(_tabs.length, (i) => Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _tab = i),
                  child: Container(
                    alignment: Alignment.center,
                    margin: EdgeInsets.all(i == _tab ? 3 : 0),
                    decoration: BoxDecoration(color: i == _tab ? Colors.white : Colors.transparent, borderRadius: BorderRadius.circular(10)),
                    child: Text(_tabs[i], style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: i == _tab ? AppColors.primary : Colors.grey.shade500)),
                  ),
                ),
              ))),
            ),

            Expanded(
              child: SingleChildScrollView(padding: const EdgeInsets.all(12), child: Column(children: [
                if (_tab == 0) _buildOverview(e, date, daysLeft, budgetTotal, hasQuotation, guestCount, venueName, venueLocation, venuePrice, pkg, addonLabels),
                if (_tab == 1) _buildMenuServices(pkg, guestCount, addons, addonLabels),
                if (_tab == 2) _buildBudget(breakdownRaw, budgetTotal),
              ])),
            ),
          ]);
        },
      ),
    );
  }

  Widget _buildOverview(Map<String, dynamic> e, String? date, int? daysLeft, double budgetTotal, bool hasQuotation, String? guestCount, String? venueName, String? venueLocation, String? venuePrice, Map<String, dynamic>? pkg, List<String> addonLabels) {
    return Column(children: [
      Row(children: [
        _statCard('Days Until Event', daysLeft != null ? (daysLeft >= 0 ? '$daysLeft' : 'Past') : '-', daysLeft != null && daysLeft < 0 ? 'Event date passed' : null),
        const SizedBox(width: 8),
        _statCard('Estimated Budget', budgetTotal > 0 ? formatMoney(budgetTotal) : '-'),
        const SizedBox(width: 8),
        _statCard('Guests', guestCount ?? '-'),
        const SizedBox(width: 8),
        _statCard('Quotation', hasQuotation ? 'Submitted' : 'Not sent'),
      ]),
      const SizedBox(height: 16),
      Row(children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade100)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [Icon(Icons.business, size: 18, color: AppColors.primary), const SizedBox(width: 6), const Text('Venue', style: TextStyle(fontWeight: FontWeight.w800))]),
              const SizedBox(height: 8),
              if (venueName != null && venueName.isNotEmpty) ...[
                Text(venueName, style: const TextStyle(fontWeight: FontWeight.w700)),
                if (venueLocation != null) Text(venueLocation, style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                if (venuePrice != null) Text(venuePrice, style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 13)),
              ] else
                Text('No venue selected', style: TextStyle(color: Colors.grey.shade400)),
            ]),
          ),
        ),
      ]),
      if (hasQuotation) ...[
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.amber.shade100)),
          child: Row(children: [
            Icon(Icons.description, color: Colors.amber.shade700, size: 22),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Quotation pending vendor approval', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.amber.shade900, fontSize: 13)),
              Text('The venue will review your proposal. Status updates live here.', style: TextStyle(color: Colors.amber.shade700, fontSize: 12)),
            ])),
          ]),
        ),
      ],
    ]);
  }

  Widget _buildMenuServices(Map<String, dynamic>? pkg, String? guestCount, Map<String, dynamic> addons, List<String> addonLabels) {
    return Column(children: [
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade100)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Icon(Icons.restaurant, size: 18, color: AppColors.primary), const SizedBox(width: 6), const Text('Selected Menu', style: TextStyle(fontWeight: FontWeight.w800))]),
          const SizedBox(height: 10),
          if (pkg != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: .05), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.primary.withValues(alpha: .1))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(pkg['name']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w800)),
                Text('${formatMoney((pkg['perPlatePrice'] ?? 0).toDouble())} per guest', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
                if (guestCount != null && guestCount.isNotEmpty)
                  Text('Subtotal: ${formatMoney(((pkg['perPlatePrice'] ?? 0).toDouble()) * (int.tryParse(guestCount) ?? 1))} ($guestCount guests)', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                if (pkg['dishes'] is List && (pkg['dishes'] as List).isNotEmpty)
                  Padding(padding: const EdgeInsets.only(top: 6),
                    child: Text((pkg['dishes'] as List).join(' · '), style: TextStyle(color: Colors.grey.shade600, fontSize: 12))),
              ]),
            ),
          ] else
            Text('No catering package selected', style: TextStyle(color: Colors.grey.shade400)),
        ]),
      ),
      const SizedBox(height: 12),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade100)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Icon(Icons.auto_awesome, size: 18, color: AppColors.primary), const SizedBox(width: 6), const Text('Add-ons', style: TextStyle(fontWeight: FontWeight.w800))]),
          const SizedBox(height: 10),
          if (addonLabels.isNotEmpty)
            ...addonLabels.map((l) => Padding(padding: const EdgeInsets.symmetric(vertical: 3), child: Row(children: [Container(width: 8, height: 8, decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)), const SizedBox(width: 8), Text(l, style: const TextStyle(fontSize: 13))])))
          else
            Text('No add-ons selected', style: TextStyle(color: Colors.grey.shade400)),
        ]),
      ),
    ]);
  }

  Widget _buildBudget(List<dynamic> breakdownRaw, double budgetTotal) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade100)),
      child: Column(children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: Colors.grey.shade100))),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [Icon(Icons.account_balance_wallet, size: 18, color: AppColors.primary), const SizedBox(width: 6), const Text('Budget Breakdown', style: TextStyle(fontWeight: FontWeight.w800))]),
              const SizedBox(height: 2),
              Text('Based on your venue, menu, and service selections', style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
            ])),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('GRAND TOTAL', style: TextStyle(color: Colors.grey.shade400, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1)),
              Text(formatMoney(budgetTotal), style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 20)),
            ]),
          ]),
        ),
        if (breakdownRaw.isEmpty)
          Padding(padding: const EdgeInsets.all(32), child: Text('No budget data saved for this event.', style: TextStyle(color: Colors.grey.shade400)))
        else
          ...breakdownRaw.map((b) {
            final item = b is Map ? b : <String, dynamic>{};
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(border: Border(bottom: BorderSide(color: Colors.grey.shade50))),
              child: Row(children: [
                Expanded(child: Text(item['item']?.toString() ?? '', style: const TextStyle(fontSize: 13))),
                Text(item['display']?.toString() ?? formatMoney((item['amount'] ?? 0).toDouble()), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              ]),
            );
          }),
      ]),
    );
  }

  Widget _detailChip(Map<String, dynamic> status) {
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

  Widget _infoChip(IconData icon, String text) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 14, color: AppColors.primary),
      const SizedBox(width: 4),
      Text(text, style: const TextStyle(fontSize: 13, color: Color(0xFF4A5568))),
    ]);
  }

  Widget _statCard(String label, String value, [String? sub]) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade100)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: TextStyle(color: Colors.grey.shade500, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
          if (sub != null) Text(sub, style: TextStyle(color: Colors.grey.shade400, fontSize: 10)),
        ]),
      ),
    );
  }
}
