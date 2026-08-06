import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../../../../core/routes/app_routes.dart';
import '../../../../core/theme/app_theme.dart';

class VendorSidebar extends StatelessWidget {
  final String currentRoute;
  const VendorSidebar({super.key, this.currentRoute = ''});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: ListView(children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: AppColors.primary),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Icon(Icons.celebration, color: Colors.white, size: 42),
              SizedBox(height: 8),
              Text('Vendor Portal', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)),
              Text('Manage your business', style: TextStyle(color: Colors.white70, fontSize: 13)),
            ]),
          ),
          _item(context, 'Dashboard', Icons.dashboard_outlined, AppRoutes.vendorDashboard),
          _item(context, 'Bookings', Icons.fact_check_outlined, AppRoutes.vendorBookings),
          _item(context, 'My Services', Icons.room_service_outlined, AppRoutes.vendorServices),
          _item(context, 'Availability', Icons.calendar_month_outlined, AppRoutes.vendorAvailability),
          _item(context, 'Analytics', Icons.analytics_outlined, AppRoutes.vendorAnalytics),
          _item(context, 'Borrow Hub', Icons.inventory_2_outlined, AppRoutes.vendorBorrowHub),
          _item(context, 'My Inventory', Icons.warehouse_outlined, AppRoutes.vendorInventory),
          _item(context, 'Messages', Icons.chat_bubble_outline, AppRoutes.vendorMessages),
          const Divider(height: 24),
          _item(context, 'Account Settings', Icons.person_outline, AppRoutes.settingsAccount),
          _item(context, 'Business Settings', Icons.business_outlined, AppRoutes.settingsBusiness),
          _item(context, 'Security', Icons.security_outlined, AppRoutes.settingsSecurity),
          const Spacer(),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.danger),
            title: const Text('Logout', style: TextStyle(color: AppColors.danger)),
            onTap: () async {
              await FirebaseAuth.instance.signOut();
              if (context.mounted) Navigator.pushNamedAndRemoveUntil(context, AppRoutes.home, (_) => false);
            },
          ),
        ]),
      ),
    );
  }

  Widget _item(BuildContext context, String title, IconData icon, String route) {
    final active = currentRoute == route;
    return Container(
      decoration: BoxDecoration(
        color: active ? AppColors.primary.withValues(alpha: .08) : null,
        border: Border.all(color: active ? AppColors.primary.withValues(alpha: .2) : Colors.transparent),
      ),
      child: ListTile(
        leading: Icon(icon, color: active ? AppColors.primary : AppColors.muted),
        title: Text(title, style: TextStyle(color: active ? AppColors.primary : AppColors.text, fontWeight: active ? FontWeight.w800 : FontWeight.w500)),
        selected: active,
        onTap: () {
          Navigator.pop(context);
          if (route != currentRoute) Navigator.pushReplacementNamed(context, route);
        },
      ),
    );
  }
}
