import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../services/venues_service.dart';

class HeroSearchSelect extends StatefulWidget {
  final ValueChanged<String>? onSelected;
  final String? initialValue;

  const HeroSearchSelect({
    super.key,
    this.onSelected,
    this.initialValue,
  });

  @override
  State<HeroSearchSelect> createState() => _HeroSearchSelectState();
}

class _HeroSearchSelectState extends State<HeroSearchSelect> {
  final _controller = TextEditingController();
  List<Map<String, String>> _results = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialValue != null) {
      _controller.text = widget.initialValue!;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _search(String query) async {
    if (query.trim().isEmpty) {
      setState(() => _results = []);
      return;
    }
    setState(() => _loading = true);
    try {
      final venues = await VenuesService.getAllVenues();
      final filtered = venues
          .where((v) =>
              v.name.toLowerCase().contains(query.toLowerCase()) ||
              v.city.toLowerCase().contains(query.toLowerCase()))
          .map((v) => {'id': v.id, 'name': v.name, 'city': v.city})
          .toList();
      if (mounted) setState(() => _results = filtered);
    } catch (e) {
      if (mounted) setState(() => _results = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(60),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: .08),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: TextField(
            controller: _controller,
            onChanged: _search,
            decoration: InputDecoration(
              hintText: 'Search venues by name or city...',
              prefixIcon: const Icon(Icons.search, color: AppColors.muted),
              suffixIcon: _loading
                  ? const Padding(
                      padding: EdgeInsets.all(14),
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : _controller.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _controller.clear();
                            setState(() => _results = []);
                          },
                        )
                      : null,
              border: InputBorder.none,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            ),
          ),
        ),
        if (_results.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: .08),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            constraints: const BoxConstraints(maxHeight: 240),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 4),
              shrinkWrap: true,
              itemCount: _results.length,
              separatorBuilder: (_, __) =>
                  const Divider(height: 1, indent: 16, endIndent: 16),
              itemBuilder: (_, i) {
                final venue = _results[i];
                return ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: AppColors.secondary,
                    child: Icon(Icons.location_city,
                        color: AppColors.primary, size: 20),
                  ),
                  title: Text(venue['name'] ?? '',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text(venue['city'] ?? '',
                      style: const TextStyle(color: AppColors.muted)),
                  onTap: () {
                    _controller.text = venue['name'] ?? '';
                    setState(() => _results = []);
                    widget.onSelected?.call(venue['id'] ?? '');
                  },
                );
              },
            ),
          ),
      ],
    );
  }
}
