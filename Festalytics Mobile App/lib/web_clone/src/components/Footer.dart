import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class Footer extends StatelessWidget {
  const Footer({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: const Color(0xFF1A1A2E),
      padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Festalytics',
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Your premier wedding & event planning platform.',
            style: TextStyle(color: Colors.white54, fontSize: 13),
          ),
          const SizedBox(height: 24),
          _section('Quick Links', [
            'Home', 'Venues', 'About Us', 'Contact', 'Services'
          ]),
          const SizedBox(height: 20),
          _section('For Vendors', [
            'List Your Venue', 'Vendor Dashboard', 'Pricing', 'Resources'
          ]),
          const SizedBox(height: 20),
          _section('Support', [
            'Help Center', 'Privacy Policy', 'Terms of Service', 'FAQs'
          ]),
          const SizedBox(height: 28),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _social(Icons.facebook),
              const SizedBox(width: 16),
              _social(Icons.camera_alt_outlined),
              const SizedBox(width: 16),
              _social(Icons.alternate_email),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: Colors.white12),
          const SizedBox(height: 12),
          const Center(
            child: Text(
              '© 2025 Festalytics. All rights reserved.',
              style: TextStyle(color: Colors.white38, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _section(String title, List<String> links) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w800,
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 8),
        ...links.map((link) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                link,
                style: const TextStyle(color: Colors.white54, fontSize: 13),
              ),
            )),
      ],
    );
  }

  Widget _social(IconData icon) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: .1),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: Colors.white54, size: 20),
    );
  }
}
