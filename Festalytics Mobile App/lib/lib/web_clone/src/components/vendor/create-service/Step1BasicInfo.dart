import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/app_widgets.dart';

class Step1BasicInfo extends StatelessWidget {
  final Map<String, dynamic> formData;
  final ValueChanged<Map<String, dynamic>> onChanged;
  const Step1BasicInfo({super.key, required this.formData, required this.onChanged});

  void _update(String key, dynamic value) {
    onChanged({...formData, key: value});
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        const SectionTitle('Basic Information', subtitle: 'Tell clients about your venue or service.'),
        CandyCard(
          child: Column(
            children: [
              TextFormField(
                decoration: const InputDecoration(labelText: 'Service / Venue Name *'),
                initialValue: formData['name'] ?? '',
                onChanged: (v) => _update('name', v),
              ),
              const SizedBox(height: 14),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Description *'),
                maxLines: 4,
                initialValue: formData['description'] ?? '',
                onChanged: (v) => _update('description', v),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      decoration: const InputDecoration(labelText: 'Address *'),
                      initialValue: formData['address'] ?? '',
                      onChanged: (v) => _update('address', v),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      decoration: const InputDecoration(labelText: 'City *'),
                      initialValue: formData['city'] ?? '',
                      onChanged: (v) => _update('city', v),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                initialValue: formData['venueType'] as String?,
                decoration: const InputDecoration(labelText: 'Venue Type'),
                items: ['Banquet Hall', 'Marquee', 'Hotel / Restaurant', 'Farmhouse', 'Other'].map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                onChanged: (v) => _update('venueType', v),
              ),
              const SizedBox(height: 14),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Capacity (seated guests) *'),
                keyboardType: TextInputType.number,
                initialValue: formData['capacity']?.toString() ?? '',
                onChanged: (v) => _update('capacity', int.tryParse(v) ?? 0),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        CandyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Categories', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: ['BANQUET HALL', 'CATERING', 'DECOR', 'SOUND', 'SECURITY'].map((c) {
                  final selected = (formData['categories'] as List?)?.contains(c) ?? false;
                  return FilterChip(
                    label: Text(c, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: selected ? Colors.white : AppColors.text)),
                    selected: selected,
                    onSelected: (_) {
                      final list = List<String>.from(formData['categories'] as List? ?? []);
                      selected ? list.remove(c) : list.add(c);
                      _update('categories', list);
                    },
                    selectedColor: AppColors.primary,
                    checkmarkColor: Colors.white,
                    backgroundColor: Colors.white,
                    side: BorderSide(color: selected ? AppColors.primary : AppColors.border),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
