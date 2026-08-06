import 'package:flutter/material.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final rows = [
      ('Venue Discovery', 'Find venues and compare live details from Firestore.', Icons.storefront_outlined, AppRoutes.allVenues),
      ('AI Event Planner', 'Generate planning guidance from the same RAG backend.', Icons.auto_awesome, AppRoutes.aiPlanner),
      ('Decor Matching', 'Image matching via the same CLIP backend route.', Icons.image_search, AppRoutes.findDecor),
      ('Vendor ERP', 'Bookings, services, inventory, analytics and messages.', Icons.dashboard_customize_outlined, AppRoutes.vendorDashboard),
    ];
    return FestalyticsScaffold(
      title: 'Services',
      body: ListView.builder(
        padding: const EdgeInsets.all(18),
        itemCount: rows.length + 1,
        itemBuilder: (context, i) {
          if (i == 0) return const Padding(padding: EdgeInsets.only(bottom: 18), child: SectionTitle('Everything from web, optimized for mobile', subtitle: 'The same core modules are exposed as native Flutter flows.'));
          final r = rows[i - 1];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: CandyCard(
              onTap: () => Navigator.pushNamed(context, r.$4),
              child: Row(children: [Icon(r.$3, color: AppColors.primary, size: 34), const SizedBox(width: 14), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(r.$1, style: const TextStyle(fontWeight: FontWeight.w900)), Text(r.$2, style: const TextStyle(color: AppColors.muted))])), const Icon(Icons.chevron_right)]),
            ),
          );
        },
      ),
    );
  }
}
