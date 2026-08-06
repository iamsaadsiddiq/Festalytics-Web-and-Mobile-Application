import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers/app_auth_provider.dart' as app;

class Navbar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int>? onTap;

  const Navbar({super.key, this.currentIndex = 0, this.onTap});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<app.AppAuthProvider>();
    final isLoggedIn = auth.isLoggedIn;

    final items = [
      _Item(Icons.home_outlined, Icons.home, 'Home'),
      _Item(Icons.search_outlined, Icons.search, 'Explore'),
      _Item(Icons.favorite_outline, Icons.favorite, 'Favorites'),
      _Item(
        isLoggedIn ? Icons.person_outline : Icons.login_outlined,
        isLoggedIn ? Icons.person : Icons.login,
        isLoggedIn ? 'Profile' : 'Login',
      ),
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: .06),
            blurRadius: 18,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(items.length, (i) {
              final item = items[i];
              final active = i == currentIndex;
              return GestureDetector(
                onTap: () => onTap?.call(i),
                behavior: HitTestBehavior.opaque,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      active ? item.activeIcon : item.icon,
                      color: active ? AppColors.primary : AppColors.muted,
                      size: 24,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item.label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight:
                            active ? FontWeight.w700 : FontWeight.w500,
                        color: active ? AppColors.primary : AppColors.muted,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _Item {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  _Item(this.icon, this.activeIcon, this.label);
}
