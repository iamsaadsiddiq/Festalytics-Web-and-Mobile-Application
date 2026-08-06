import 'package:flutter/material.dart';
import '../../../../../core/widgets/app_widgets.dart';

class Step2Pricing extends StatelessWidget {
  final Map<String, dynamic> formData;
  final ValueChanged<Map<String, dynamic>> onChanged;
  const Step2Pricing({super.key, required this.formData, required this.onChanged});

  void _update(String key, dynamic value) {
    final pricing = Map<String, dynamic>.from(formData['pricing'] as Map? ?? {});
    pricing[key] = value;
    onChanged({...formData, 'pricing': pricing});
  }

  @override
  Widget build(BuildContext context) {
    final pricing = Map<String, dynamic>.from(formData['pricing'] as Map? ?? {});

    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        const SectionTitle('Pricing', subtitle: 'Set your venue pricing and package rates.'),
        CandyCard(
          child: Column(
            children: [
              TextFormField(
                decoration: const InputDecoration(labelText: 'Hall Rent (PKR) *', prefixText: 'PKR '),
                keyboardType: TextInputType.number,
                initialValue: (pricing['hallRent'] ?? '').toString(),
                onChanged: (v) => _update('hallRent', double.tryParse(v) ?? 0),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      decoration: const InputDecoration(labelText: 'AC Cost', prefixText: 'PKR '),
                      keyboardType: TextInputType.number,
                      initialValue: (pricing['acCost'] ?? '').toString(),
                      onChanged: (v) => _update('acCost', double.tryParse(v) ?? 0),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      decoration: const InputDecoration(labelText: 'Generator Cost', prefixText: 'PKR '),
                      keyboardType: TextInputType.number,
                      initialValue: (pricing['generatorCost'] ?? '').toString(),
                      onChanged: (v) => _update('generatorCost', double.tryParse(v) ?? 0),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        CandyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Catering Packages (per plate)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Chicken Package', prefixText: 'PKR '),
                keyboardType: TextInputType.number,
                initialValue: (pricing['chickenPrice'] ?? '').toString(),
                onChanged: (v) => _update('chickenPrice', double.tryParse(v) ?? 0),
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Beef Package', prefixText: 'PKR '),
                keyboardType: TextInputType.number,
                initialValue: (pricing['beefPrice'] ?? '').toString(),
                onChanged: (v) => _update('beefPrice', double.tryParse(v) ?? 0),
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Mutton Package', prefixText: 'PKR '),
                keyboardType: TextInputType.number,
                initialValue: (pricing['muttonPrice'] ?? '').toString(),
                onChanged: (v) => _update('muttonPrice', double.tryParse(v) ?? 0),
              ),
              const SizedBox(height: 12),
              TextFormField(
                decoration: const InputDecoration(labelText: 'Mehndi Package', prefixText: 'PKR '),
                keyboardType: TextInputType.number,
                initialValue: (pricing['mehndiPrice'] ?? '').toString(),
                onChanged: (v) => _update('mehndiPrice', double.tryParse(v) ?? 0),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        CandyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Add-on Services', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      decoration: const InputDecoration(labelText: 'Decor Price', prefixText: 'PKR '),
                      keyboardType: TextInputType.number,
                      initialValue: (pricing['decorPrice'] ?? '').toString(),
                      onChanged: (v) => _update('decorPrice', double.tryParse(v) ?? 0),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      decoration: const InputDecoration(labelText: 'Sound Price', prefixText: 'PKR '),
                      keyboardType: TextInputType.number,
                      initialValue: (pricing['soundPrice'] ?? '').toString(),
                      onChanged: (v) => _update('soundPrice', double.tryParse(v) ?? 0),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
