import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';

class BookingFilters extends StatefulWidget {
  final ValueChanged<Map<String, String?>> onChanged;
  const BookingFilters({super.key, required this.onChanged});

  @override
  State<BookingFilters> createState() => _BookingFiltersState();
}

class _BookingFiltersState extends State<BookingFilters> {
  String? _statusFilter;
  String _searchQuery = '';
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _emit() {
    widget.onChanged({'status': _statusFilter, 'search': _searchQuery.isEmpty ? null : _searchQuery});
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
          child: TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              hintText: 'Search by name, ID...',
              prefixIcon: const Icon(Icons.search, size: 20),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(icon: const Icon(Icons.clear, size: 18), onPressed: () { _searchCtrl.clear(); setState(() => _searchQuery = ''); _emit(); })
                  : null,
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
            ),
            onChanged: (v) { setState(() => _searchQuery = v); _emit(); },
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 18),
          child: Row(
            children: [
              _chip('All', null),
              _chip('Confirmed', 'confirmed'),
              _chip('Pending', 'pending'),
              _chip('Declined', 'declined'),
              _chip('Cancelled', 'cancelled'),
              _chip('Completed', 'completed'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _chip(String label, String? value) {
    final selected = _statusFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: selected ? Colors.white : AppColors.text)),
        selected: selected,
        onSelected: (_) { setState(() => _statusFilter = value); _emit(); },
        selectedColor: AppColors.primary,
        checkmarkColor: Colors.white,
        backgroundColor: Colors.white,
        side: BorderSide(color: selected ? AppColors.primary : AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 0),
      ),
    );
  }
}
