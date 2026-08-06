import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';

class VendorShell extends StatelessWidget {
  final Widget child;
  const VendorShell({super.key, required this.child});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: Drawer(
        child: SafeArea(
          child: ListView(children: [
            const DrawerHeader(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Icon(Icons.celebration, color: AppColors.primary, size: 42), SizedBox(height: 8), Text('Vendor Portal', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)), Text('Same web sidebar modules') ])),
            _item(context, 'Dashboard', Icons.dashboard_outlined, AppRoutes.vendorDashboard),
            _item(context, 'Bookings', Icons.fact_check_outlined, AppRoutes.vendorBookings),
            _item(context, 'My Services', Icons.room_service_outlined, AppRoutes.vendorServices),
            _item(context, 'Availability', Icons.calendar_month_outlined, AppRoutes.vendorAvailability),
            _item(context, 'Analytics', Icons.analytics_outlined, AppRoutes.vendorAnalytics),
            _item(context, 'Borrow Hub', Icons.inventory_2_outlined, AppRoutes.vendorBorrowHub),
            _item(context, 'My Inventory', Icons.warehouse_outlined, AppRoutes.vendorInventory),
            _item(context, 'Messages', Icons.chat_bubble_outline, AppRoutes.vendorMessages),
            const Divider(),
            _item(context, 'Account Settings', Icons.person_outline, AppRoutes.settingsAccount),
            _item(context, 'Business Settings', Icons.business_outlined, AppRoutes.settingsBusiness),
            _item(context, 'Security', Icons.security_outlined, AppRoutes.settingsSecurity),
            ListTile(leading: const Icon(Icons.logout), title: const Text('Logout'), onTap: () async { await FirebaseAuth.instance.signOut(); if (context.mounted) Navigator.pushNamedAndRemoveUntil(context, AppRoutes.home, (_) => false); }),
          ]),
        ),
      ),
      body: child,
    );
  }

  Widget _item(BuildContext context, String title, IconData icon, String route) => ListTile(
    leading: Icon(icon), title: Text(title), onTap: () { Navigator.pop(context); Navigator.pushReplacementNamed(context, route); },
  );
}
