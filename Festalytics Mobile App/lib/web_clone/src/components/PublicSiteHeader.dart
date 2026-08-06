import 'package:flutter/material.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_theme.dart';

class PublicSiteHeader extends StatelessWidget {
  final String? activeRoute;

  const PublicSiteHeader({super.key, this.activeRoute});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            const Icon(Icons.celebration_outlined, color: AppColors.primary),
            const SizedBox(width: 8),
            const Text(
              'Festalytics',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 22,
                color: AppColors.text,
              ),
            ),
            const Spacer(),
            _link('Home', AppRoutes.home, context),
            const SizedBox(width: 4),
            _link('Venues', AppRoutes.allVenues, context),
            const SizedBox(width: 4),
            _link('About', AppRoutes.about, context),
            const SizedBox(width: 4),
            TextButton(
              onPressed: () => Navigator.pushNamed(context, AppRoutes.login),
              style: TextButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Login',
                  style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _link(String label, String route, BuildContext ctx) {
    final active = activeRoute == route;
    return TextButton(
      onPressed: active
          ? null
          : () => Navigator.pushNamed(ctx, route),
      child: Text(
        label,
        style: TextStyle(
          color: active ? AppColors.primary : AppColors.muted,
          fontWeight: active ? FontWeight.w700 : FontWeight.w500,
        ),
      ),
    );
  }
}
