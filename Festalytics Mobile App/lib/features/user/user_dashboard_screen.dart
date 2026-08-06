import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';
import '../../providers/app_auth_provider.dart' as app;

class UserDashboardScreen extends StatefulWidget {
  const UserDashboardScreen({super.key});
  @override
  State<UserDashboardScreen> createState() => _UserDashboardScreenState();
}

class _UserDashboardScreenState extends State<UserDashboardScreen> {

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<app.AppAuthProvider>();
    final name = auth.currentUser?.firstName.isNotEmpty == true ? auth.currentUser!.firstName : 'Planner';
    final cards = [
      ('Find Venues', 'Search and book venues', Icons.storefront_outlined, AppRoutes.allVenues),
      ('Create Event', 'Build your event plan', Icons.add_circle_outline, AppRoutes.createEvent),
      ('My Events', 'Track and manage plans', Icons.event_note_outlined, AppRoutes.myEvents),
      ('AI Planner', 'Plan with AI', Icons.auto_awesome, AppRoutes.aiPlanner),
      ('Decor Matcher', 'Find style matches', Icons.image_search, AppRoutes.findDecor),
      ('Service Discovery', 'Explore nearby vendors', Icons.map_outlined, AppRoutes.serviceDiscovery),
    ];
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Text('Hi, $name'),
        actions: [IconButton(onPressed: () async { await FirebaseAuth.instance.signOut(); if (context.mounted) Navigator.pushNamedAndRemoveUntil(context, AppRoutes.home, (_) => false); }, icon: const Icon(Icons.logout))],
      ),
      body: ListView(padding: const EdgeInsets.all(18), children: [
        CandyCard(color: AppColors.primary, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Your smart event dashboard', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 6),
          const Text('Same user-side web flow: venues, quotations, AI planning, events and vendor messaging.', style: TextStyle(color: Colors.white70)),
          const SizedBox(height: 14),
          ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppColors.primary), onPressed: () => Navigator.pushNamed(context, AppRoutes.createEvent), child: const Text('Start planning')),
        ])),
        const SizedBox(height: 18),
        const SectionTitle('Explore'),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: cards.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: .98, mainAxisSpacing: 12, crossAxisSpacing: 12),
          itemBuilder: (_, i) => CandyCard(onTap: () => Navigator.pushNamed(context, cards[i].$4), child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Icon(cards[i].$3, color: AppColors.primary, size: 30), Text(cards[i].$1, style: const TextStyle(fontWeight: FontWeight.w900)), Text(cards[i].$2, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.muted, fontSize: 12))])),
        ),
      ]),
    );
  }
}
