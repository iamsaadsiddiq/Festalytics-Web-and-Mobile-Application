import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/app_widgets.dart';

class Step4Review extends StatelessWidget {
  final Map<String, dynamic> formData;
  final bool saving;
  final VoidCallback onSubmit;
  const Step4Review({super.key, required this.formData, this.saving = false, required this.onSubmit});

  @override
  Widget build(BuildContext context) {
    final pricing = formData['pricing'] as Map<String, dynamic>? ?? {};
    final images = formData['images'] as List? ?? [];
    final categories = formData['categories'] as List? ?? [];

    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        const SectionTitle('Review & Submit', subtitle: 'Double-check your information before publishing.'),
        CandyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Basic Info', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.primary)),
              const SizedBox(height: 8),
              _row('Name', formData['name'] ?? '-'),
              _row('Description', ((formData['description'] as String?)?.length ?? 0) > 60 ? '${(formData['description'] as String?)?.substring(0, 60)}...' : formData['description'] ?? '-'),
              _row('Address', formData['address'] ?? '-'),
              _row('City', formData['city'] ?? '-'),
              _row('Type', formData['venueType'] ?? '-'),
              _row('Capacity', '${formData['capacity'] ?? '-'} guests'),
              _row('Categories', categories.join(', ')),
            ],
          ),
        ),
        const SizedBox(height: 12),
        CandyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Pricing', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.primary)),
              const SizedBox(height: 8),
              _row('Hall Rent', 'PKR ${pricing['hallRent'] ?? 0}'),
              _row('AC Cost', 'PKR ${pricing['acCost'] ?? 0}'),
              _row('Generator Cost', 'PKR ${pricing['generatorCost'] ?? 0}'),
              _row('Chicken (per plate)', 'PKR ${pricing['chickenPrice'] ?? 0}'),
              _row('Beef (per plate)', 'PKR ${pricing['beefPrice'] ?? 0}'),
              _row('Mutton (per plate)', 'PKR ${pricing['muttonPrice'] ?? 0}'),
              _row('Decor', 'PKR ${pricing['decorPrice'] ?? 0}'),
              _row('Sound', 'PKR ${pricing['soundPrice'] ?? 0}'),
            ],
          ),
        ),
        if (images.isNotEmpty) ...[
          const SizedBox(height: 12),
          CandyCard(
            child: Row(children: [
              const Text('Images: ', style: TextStyle(fontWeight: FontWeight.w800)),
              Text('${images.length} image(s) uploaded'),
            ]),
          ),
        ],
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: saving ? null : onSubmit,
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            child: Text(saving ? 'Publishing...' : 'Publish Service', style: const TextStyle(fontSize: 16)),
          ),
        ),
      ],
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13))),
        ],
      ),
    );
  }
}
