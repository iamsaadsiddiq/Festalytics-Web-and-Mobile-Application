import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/app_widgets.dart';

class Step3Gallery extends StatelessWidget {
  final Map<String, dynamic> formData;
  final ValueChanged<Map<String, dynamic>> onChanged;
  const Step3Gallery({super.key, required this.formData, required this.onChanged});

  void _addImage(String url, String label) {
    final images = List<Map<String, dynamic>>.from(formData['images'] as List? ?? []);
    images.add({'id': 'img-${DateTime.now().millisecondsSinceEpoch}', 'url': url, 'label': label, 'isPrimary': images.isEmpty});
    onChanged({...formData, 'images': images});
  }

  void _removeImage(int index) {
    final images = List<Map<String, dynamic>>.from(formData['images'] as List? ?? []);
    images.removeAt(index);
    if (images.isNotEmpty) images.first['isPrimary'] = true;
    onChanged({...formData, 'images': images});
  }

  @override
  Widget build(BuildContext context) {
    final images = List<Map<String, dynamic>>.from(formData['images'] as List? ?? []);

    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        const SectionTitle('Gallery', subtitle: 'Add images to showcase your venue.'),
        CandyCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Upload Images', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              const SizedBox(height: 4),
              const Text('Add high-quality photos of your venue, hall, catering, and decor.', style: TextStyle(color: AppColors.muted, fontSize: 13)),
              const SizedBox(height: 14),
              InkWell(
                onTap: () => _showAddDialog(context),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 28),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.border, width: 2, style: BorderStyle.solid),
                    borderRadius: BorderRadius.circular(16),
                    color: AppColors.background,
                  ),
                  child: const Column(children: [
                    Icon(Icons.add_photo_alternate_outlined, size: 36, color: AppColors.muted),
                    SizedBox(height: 6),
                    Text('Tap to add image URL', style: TextStyle(color: AppColors.muted)),
                  ]),
                ),
              ),
            ],
          ),
        ),
        if (images.isNotEmpty) ...[
          const SizedBox(height: 14),
          CandyCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Uploaded Images', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                const SizedBox(height: 10),
                ...images.asMap().entries.map((entry) {
                  final i = entry.key;
                  final img = entry.value;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: img['isPrimary'] == true ? AppColors.primary : AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 50, height: 50,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            color: AppColors.primary.withValues(alpha: .1),
                          ),
                          child: Center(child: Icon(Icons.image, color: img['isPrimary'] == true ? AppColors.primary : AppColors.muted)),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(img['label'] ?? 'Image', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                              if (img['isPrimary'] == true)
                                const Text('Primary', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w800)),
                            ],
                          ),
                        ),
                        if (img['isPrimary'] != true)
                          TextButton(
                            onPressed: () {
                              final list = List<Map<String, dynamic>>.from(formData['images'] as List? ?? []);
                              for (final e in list) { e['isPrimary'] = false; }
                              list[i]['isPrimary'] = true;
                              onChanged({...formData, 'images': list});
                            },
                            child: const Text('Set Primary', style: TextStyle(fontSize: 11)),
                          ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 18, color: AppColors.danger),
                          onPressed: () => _removeImage(i),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ],
      ],
    );
  }

  void _showAddDialog(BuildContext context) {
    final urlCtrl = TextEditingController();
    final labelCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Image'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: urlCtrl, decoration: const InputDecoration(labelText: 'Image URL *'), keyboardType: TextInputType.url),
            const SizedBox(height: 10),
            TextField(controller: labelCtrl, decoration: const InputDecoration(labelText: 'Label (e.g. Main Hall)')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final url = urlCtrl.text.trim();
              if (url.isEmpty) return;
              _addImage(url, labelCtrl.text.trim());
              Navigator.pop(ctx);
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
