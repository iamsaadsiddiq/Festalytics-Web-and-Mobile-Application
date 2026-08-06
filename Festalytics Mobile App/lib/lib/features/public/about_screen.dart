import 'package:flutter/material.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/theme/app_theme.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return FestalyticsScaffold(
      title: 'About Festalytics',
      body: ListView(padding: const EdgeInsets.all(18), children: const [
        CandyCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Reimagining event planning', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900)),
          SizedBox(height: 8),
          Text('Festalytics is an AI-powered event planning platform for users and vendors. This mobile screen follows the same web About page story: faster discovery, smart planning, transparent vendor workflows, and operational analytics.', style: TextStyle(color: AppColors.muted, height: 1.5)),
        ])),
        SizedBox(height: 14),
        _AboutTile(icon: Icons.search, title: 'Find the right venue', text: 'Search venues by area, budget, capacity and service type.'),
        _AboutTile(icon: Icons.auto_awesome, title: 'AI-powered planning', text: 'Use the RAG planning backend to recommend venues and packages.'),
        _AboutTile(icon: Icons.analytics, title: 'Vendor analytics', text: 'Vendors manage bookings, inventory, calendars and revenue.'),
      ]),
    );
  }
}

class _AboutTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String text;
  const _AboutTile({required this.icon, required this.title, required this.text});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: CandyCard(child: Row(children: [Icon(icon, color: AppColors.primary, size: 34), const SizedBox(width: 14), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.w900)), Text(text, style: const TextStyle(color: AppColors.muted))]))])),
  );
}
