import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_widgets.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../services/analytics_service.dart';

class VendorDashboardScreen extends StatelessWidget {
  const VendorDashboardScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<app.AppAuthProvider>();
    final venueId = auth.currentUser?.venueId;
    return Scaffold(
      appBar: AppBar(title: const Text('Vendor Dashboard')),
      body: venueId == null || venueId.isEmpty
          ? EmptyState(icon: Icons.storefront_outlined, title: 'Venue not linked', subtitle: 'Complete vendor signup/business settings to link a venue.', action: ElevatedButton(onPressed: () => Navigator.pushNamed(context, AppRoutes.settingsBusiness), child: const Text('Open settings')))
          : StreamBuilder<VendorAnalyticsSnapshot>(
              stream: AnalyticsService.streamVendorAnalytics(venueId),
              builder: (context, snap) {
                final data = snap.data;
                return ListView(padding: const EdgeInsets.all(18), children: [
                  CandyCard(color: AppColors.primary, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Welcome, ${auth.currentUser?.firstName ?? 'Vendor'}', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
                    const SizedBox(height: 4),
                    Text('Venue: $venueId', style: const TextStyle(color: Colors.white70)),
                  ])),
                  const SizedBox(height: 16),
                  GridView.count(crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.25, children: [
                    _metric('Bookings', '${data?.totalBookings ?? 0}', Icons.event_available),
                    _metric('Pending', '${data?.pendingRequests ?? 0}', Icons.pending_actions),
                    _metric('Quotations', '${data?.quotations ?? 0}', Icons.request_quote),
                    _metric('Revenue', formatMoney(data?.revenue ?? 0), Icons.payments),
                  ]),
                  const SizedBox(height: 18),
                  const SectionTitle('Quick actions'),
                  _action(context, 'Manage bookings', 'Accept/reject quotations, convert bookings, initiate AI calls.', Icons.fact_check_outlined, AppRoutes.vendorBookings),
                  _action(context, 'My services', 'Edit venue profile, pricing, menu, features, gallery and FAQs.', Icons.room_service_outlined, AppRoutes.vendorServices),
                  _action(context, 'Borrow hub', 'Publish inventory and respond to vendor-to-vendor requests.', Icons.inventory_2_outlined, AppRoutes.vendorBorrowHub),
                  _action(context, 'Messages', 'Customer and vendor inbox.', Icons.chat_bubble_outline, AppRoutes.vendorMessages),
                ]);
              },
            ),
    );
  }

  Widget _metric(String title, String value, IconData icon) => CandyCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Icon(icon, color: AppColors.primary), Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)), Text(title, style: const TextStyle(color: AppColors.muted))]));
  Widget _action(BuildContext context, String title, String sub, IconData icon, String route) => Padding(padding: const EdgeInsets.only(bottom: 12), child: CandyCard(onTap: () => Navigator.pushNamed(context, route), child: Row(children: [Icon(icon, color: AppColors.primary), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.w900)), Text(sub, style: const TextStyle(color: AppColors.muted, fontSize: 12))])), const Icon(Icons.chevron_right)])));
}
