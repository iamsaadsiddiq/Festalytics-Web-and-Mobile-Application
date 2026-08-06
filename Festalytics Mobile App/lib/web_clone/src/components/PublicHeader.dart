import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/app_auth_provider.dart' as app;

class PublicHeader extends StatelessWidget {
  final VoidCallback? onMenuTap;

  const PublicHeader({super.key, this.onMenuTap});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<app.AppAuthProvider>();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: .04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            if (onMenuTap != null)
              IconButton(
                icon: const Icon(Icons.menu),
                onPressed: onMenuTap,
                color: AppColors.text,
              ),
            if (onMenuTap != null) const SizedBox(width: 4),
            const Icon(Icons.celebration_outlined, color: AppColors.primary),
            const SizedBox(width: 8),
            const Text(
              'Festalytics',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 20,
                color: AppColors.text,
              ),
            ),
            const Spacer(),
            if (auth.isLoggedIn)
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.primary.withValues(alpha: .12),
                child: Text(
                  (auth.currentUser?.fullName.isNotEmpty == true
                          ? auth.currentUser!.fullName[0]
                          : auth.firebaseUser?.email?[0] ?? 'U')
                      .toUpperCase(),
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
              )
            else
              TextButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.login),
                label: const Text('Login'),
              ),
          ],
        ),
      ),
    );
  }
}
