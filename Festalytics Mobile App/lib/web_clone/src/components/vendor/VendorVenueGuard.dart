import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/widgets/app_widgets.dart';
import '../../../../providers/app_auth_provider.dart' as app;

class VendorVenueGuard extends StatelessWidget {
  final Widget Function(BuildContext context, String venueId) builder;
  final String? title;
  const VendorVenueGuard({super.key, required this.builder, this.title});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<app.AppAuthProvider>();
    final venueId = auth.currentUser?.venueId ?? '';

    if (auth.isLoading) return const LoadingView(label: 'Loading profile...');

    if (venueId.isEmpty) {
      return Scaffold(
        appBar: title != null ? AppBar(title: Text(title!)) : null,
        body: EmptyState(
          icon: Icons.storefront_outlined,
          title: 'Venue not linked',
          subtitle: 'Complete your business settings to link a venue and start managing your services.',
          action: ElevatedButton.icon(
            onPressed: () => Navigator.pushNamed(context, '/vendor-dashboard/settings/business'),
            icon: const Icon(Icons.business_outlined),
            label: const Text('Open Business Settings'),
          ),
        ),
      );
    }

    return builder(context, venueId);
  }
}
