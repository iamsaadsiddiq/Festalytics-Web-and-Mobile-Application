import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_theme.dart';

class FileUploadWidget extends StatelessWidget {
  final File? image;
  final ValueChanged<File?> onImagePicked;

  const FileUploadWidget({super.key, required this.image, required this.onImagePicked});

  Future<void> _pick(ImageSource source) async {
    final picked = await ImagePicker().pickImage(source: source, imageQuality: 85);
    if (picked != null) onImagePicked(File(picked.path));
  }

  void _showOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(99))),
            const SizedBox(height: 20),
            const Text('Upload Inspiration', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
            const SizedBox(height: 16),
            ListTile(
              leading: const CircleAvatar(backgroundColor: AppColors.secondary, child: Icon(Icons.camera_alt, color: AppColors.primary)),
              title: const Text('Camera'),
              onTap: () { Navigator.pop(context); _pick(ImageSource.camera); },
            ),
            ListTile(
              leading: const CircleAvatar(backgroundColor: AppColors.secondary, child: Icon(Icons.photo_library, color: AppColors.primary)),
              title: const Text('Gallery'),
              onTap: () { Navigator.pop(context); _pick(ImageSource.gallery); },
            ),
          ]),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showOptions(context),
      child: Container(
        height: 220,
        width: double.infinity,
        decoration: BoxDecoration(color: AppColors.secondary.withValues(alpha: .45), borderRadius: BorderRadius.circular(22), border: Border.all(color: AppColors.border)),
        child: image == null
            ? const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.cloud_upload_outlined, size: 52, color: AppColors.primary),
                SizedBox(height: 8),
                Text('Tap to upload moodboard / decor image', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600)),
                SizedBox(height: 4),
                Text('Camera or Gallery', style: TextStyle(color: AppColors.muted, fontSize: 12)),
              ])
            : Stack(fit: StackFit.expand, children: [
                ClipRRect(borderRadius: BorderRadius.circular(22), child: Image.file(image!, fit: BoxFit.cover)),
                Positioned(
                  top: 8, right: 8,
                  child: GestureDetector(
                    onTap: () => onImagePicked(null),
                    child: Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(99)), child: const Icon(Icons.close, color: Colors.white, size: 18)),
                  ),
                ),
              ]),
      ),
    );
  }
}
