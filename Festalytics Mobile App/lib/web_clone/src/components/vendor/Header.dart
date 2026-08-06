import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class VendorHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onMenuTap;
  const VendorHeader({super.key, required this.title, this.subtitle, this.trailing, this.onMenuTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        bottom: false,
        child: Row(
          children: [
            if (onMenuTap != null)
              IconButton(icon: const Icon(Icons.menu), onPressed: onMenuTap, padding: EdgeInsets.zero)
            else
              const SizedBox(width: 0),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900)),
                  if (subtitle != null) Text(subtitle!, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                ],
              ),
            ),
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}
