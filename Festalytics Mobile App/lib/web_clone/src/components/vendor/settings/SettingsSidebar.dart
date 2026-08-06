import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';

class SettingsSidebar extends StatelessWidget {
  final String currentRoute;
  final ValueChanged<String> onNavigate;
  const SettingsSidebar({super.key, required this.currentRoute, required this.onNavigate});

  static const _settings = [
    {'route': '/vendor-dashboard/settings/account', 'label': 'Account', 'icon': Icons.person_outline},
    {'route': '/vendor-dashboard/settings/business', 'label': 'Business', 'icon': Icons.business_outlined},
    {'route': '/vendor-dashboard/settings/notifications', 'label': 'Notifications', 'icon': Icons.notifications_outlined},
    {'route': '/vendor-dashboard/settings/payments', 'label': 'Payments', 'icon': Icons.payments_outlined},
    {'route': '/vendor-dashboard/settings/security', 'label': 'Security', 'icon': Icons.security_outlined},
    {'route': '/vendor-dashboard/settings/help', 'label': 'Help & Support', 'icon': Icons.help_outline},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 20, 16, 12),
          child: Text('Settings', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
        ),
        ..._settings.map((s) {
          final active = currentRoute == s['route'];
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: active ? AppColors.primary.withValues(alpha: .08) : null,
              borderRadius: BorderRadius.circular(12),
            ),
            child: ListTile(
              dense: true,
              leading: Icon(s['icon'] as IconData, color: active ? AppColors.primary : AppColors.muted, size: 22),
              title: Text(
                s['label'] as String,
                style: TextStyle(
                  fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                  color: active ? AppColors.primary : AppColors.text,
                  fontSize: 14,
                ),
              ),
              selected: active,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              onTap: () => onNavigate(s['route'] as String),
            ),
          );
        }),
      ],
    );
  }
}
