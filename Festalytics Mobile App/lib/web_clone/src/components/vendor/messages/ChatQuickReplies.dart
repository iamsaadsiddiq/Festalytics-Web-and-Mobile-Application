import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';

class ChatQuickReplies extends StatelessWidget {
  final ValueChanged<String> onSelect;
  final VoidCallback onManageTemplates;
  const ChatQuickReplies({super.key, required this.onSelect, required this.onManageTemplates});

  static const _defaultReplies = [
    'Thank you for your inquiry! We will get back to you shortly.',
    'Yes, that date is available. Would you like to book a visit?',
    'Please share your contact details so we can reach out.',
    'Our hall rent is PKR 250,000. Would you like a detailed quote?',
    'We offer catering packages starting from PKR 1,400 per plate.',
    'Can we schedule a site visit for you?',
    'Thank you for choosing our venue! Let us know if you need anything else.',
    'We have received your booking request and will confirm shortly.',
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Row(
            children: [
              const Expanded(child: Text('Quick Replies', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18))),
              TextButton.icon(
                onPressed: onManageTemplates,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Manage'),
              ),
            ],
          ),
        ),
        const Divider(height: 1),
        Flexible(
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _defaultReplies.length,
            itemBuilder: (_, i) => ListTile(
              title: Text(_defaultReplies[i], style: const TextStyle(fontSize: 14)),
              trailing: const Icon(Icons.send, size: 18, color: AppColors.primary),
              onTap: () => onSelect(_defaultReplies[i]),
            ),
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
