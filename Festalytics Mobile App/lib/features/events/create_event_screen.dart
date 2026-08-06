import 'dart:convert';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/event_display.dart';
import '../../core/utils/venue_pricing.dart';
import '../../services/events_service.dart';
import '../../services/quotations_service.dart';

class CreateEventScreen extends StatefulWidget {
  final String? eventId;
  const CreateEventScreen({super.key, this.eventId});
  @override
  State<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends State<CreateEventScreen> {
  int _step = 1;
  bool _submitting = false;
  String _submitError = '';

  final _titleCtrl = TextEditingController();
  String _eventType = '';
  String _date = '';
  String _time = '';
  String _location = '';
  String _guestCount = '';

  String _selectedVenueSlug = '';
  String _selectedVenueId = '';
  String _selectedVenueName = '';
  String _selectedVenueLocation = '';
  String _selectedVenuePrice = '';
  String _venuePreviewImage = '';

  String _selectedCateringPackageId = '';
  CateringPackage? _selectedPackage;

  Map<String, bool> _addons = {};

  List<BudgetItem> _budgetBreakdown = [];
  double _budgetTotal = 0;

  List<Map<String, dynamic>> _allHalls = [];
  Map<String, Map<String, dynamic>> _dbVenuesMap = {};
  bool _hallsLoaded = false;

  List<String> get _areaOptions {
    final areas = <String>{};
    for (final h in _allHalls) {
      final a = h['area']?.toString().trim();
      if (a != null && a.isNotEmpty) areas.add(a);
    }
    final sorted = areas.toList()..sort();
    return sorted;
  }

  @override
  void initState() {
    super.initState();
    _loadHalls();
    _listenToVenues();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _searchCtl.dispose();
    super.dispose();
  }

  void _loadHalls() async {
    try {
      final data = await rootBundle.loadString('assets/data/halls.json');
      final List<dynamic> decoded = jsonDecode(data);
      setState(() {
        _allHalls = decoded.cast<Map<String, dynamic>>();
        _hallsLoaded = true;
      });
    } catch (e) {
      setState(() => _hallsLoaded = true);
    }
  }

  void _listenToVenues() {
    FirebaseFirestore.instance.collection('venues').snapshots().listen((snap) {
      final map = <String, Map<String, dynamic>>{};
      for (final doc in snap.docs) {
        map[doc.id] = doc.data();
      }
      if (mounted) setState(() => _dbVenuesMap = map);
    });
  }

  bool get _canProceed {
    if (_step == 1) return _titleCtrl.text.trim().isNotEmpty;
    if (_step == 2) return _selectedVenueSlug.isNotEmpty;
    if (_step == 3) return _selectedCateringPackageId.isNotEmpty;
    return true;
  }

  void _selectVenue(Map<String, dynamic> hall) {
    final slug = _getVenueDocId(hall);
    final dbData = _dbVenuesMap[slug];
    final pricing = VenuePricing.fromMap(dbData);
    setState(() {
      _selectedVenueSlug = slug;
      _selectedVenueId = (hall['hall_id'] ?? '').toString();
      _selectedVenueName = (hall['hall_name'] ?? '').toString();
      _selectedVenuePrice = hall['price_range']?.toString() ?? formatMoney(pricing.hallRent);
      _selectedVenueLocation = hall['full_address']?.toString() ?? hall['area']?.toString() ?? '';
      _venuePreviewImage = _buildImagePath(hall);
      _selectedCateringPackageId = '';
      _selectedPackage = null;
      _addons = {};
    });
    _syncBudget();
  }

  String _getVenueDocId(Map<String, dynamic> hall) {
    final name = (hall['hall_name'] ?? '').toString().toLowerCase();
    if (hall['hall_id']?.toString() == '1' || name.contains('zaydan banquet')) return 'zaydan-banquet-hall';
    if (hall['hall_id']?.toString() == '2' || name.contains('qasar e zaydan')) return 'qasar-e-zaydan';
    return hall['hall_id']?.toString() ?? name.replaceAll(RegExp(r'\s+'), '-');
  }

  String _buildImagePath(Map<String, dynamic> hall) {
    final images = hall['images'] as List<dynamic>? ?? [];
    if (images.isNotEmpty) {
      final first = images.first.toString();
      if (!first.contains('placeholder')) return first.replaceAll('/Marriage Hall/', '/Marriage_hall/');
    }
    final name = (hall['hall_name'] ?? '').toString().toLowerCase().trim();
    if (name.isNotEmpty) return '/Marriage_hall/$name/1.jpeg';
    return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2698&auto=format&fit=crop';
  }

  void _selectPackage(CateringPackage pkg) {
    setState(() {
      _selectedCateringPackageId = pkg.id;
      _selectedPackage = pkg;
    });
    _syncBudget();
  }

  void _toggleAddon(String key) {
    setState(() => _addons[key] = _addons[key] != true);
    _syncBudget();
  }

  void _syncBudget() {
    final budget = computeEventBudget(
      dbVenue: _dbVenuesMap[_selectedVenueSlug],
      guestCount: _guestCount,
      selectedPkg: _selectedPackage,
      addons: _addons,
    );
    setState(() {
      _budgetBreakdown = budget.breakdown;
      _budgetTotal = budget.grandTotal;
    });
  }

  Future<void> _handleFinalize() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) { Navigator.pushNamed(context, AppRoutes.login); return; }
    if (_selectedVenueSlug.isEmpty) { _showError('Please select a venue'); return; }
    if (_date.isEmpty) { _showError('Event date is required'); return; }

    setState(() { _submitting = true; _submitError = ''; });
    try {
      final menuPayload = {
        'packageId': _selectedPackage?.id ?? '',
        'packageName': _selectedPackage?.name ?? 'Venue Hire Only',
        'perPlatePrice': _selectedPackage?.perPlatePrice ?? 0,
        'dishes': _selectedPackage?.dishes ?? [],
      };

      final hallRent = _budgetBreakdown.isNotEmpty ? _budgetBreakdown[0].amount : 0.0;
      final cateringCost = _budgetBreakdown.length > 1 ? _budgetBreakdown[1].amount : 0.0;
      final addonsCost = _budgetBreakdown.skip(2).fold(0.0, (s, b) => s + b.amount);

      final eventPayload = <String, dynamic>{
        'userId': user.uid,
        'title': _titleCtrl.text.trim(),
        'eventType': _eventType,
        'date': _date,
        'time': _time,
        'location': _location,
        'guestCount': _guestCount,
        'selectedVenueId': _selectedVenueId,
        'selectedVenueSlug': _selectedVenueSlug,
        'selectedVenueName': _selectedVenueName,
        'selectedVenueLocation': _selectedVenueLocation,
        'selectedVenuePrice': _selectedVenuePrice,
        'venuePreviewImage': _venuePreviewImage,
        'selectedCateringPackageId': _selectedCateringPackageId,
        'selectedCateringPackage': {
          'id': _selectedPackage?.id ?? '',
          'name': _selectedPackage?.name ?? '',
          'type': _selectedPackage?.type ?? '',
          'perPlatePrice': _selectedPackage?.perPlatePrice ?? 0,
          'dishes': _selectedPackage?.dishes ?? [],
        },
        'selectedAddons': _addons,
        'budgetBreakdown': _budgetBreakdown.map((b) => {'item': b.item, 'amount': b.amount, 'display': b.display}).toList(),
        'budgetTotal': _budgetTotal,
        'status': 'Pending',
        'quotationId': '',
        'createdAt': FieldValue.serverTimestamp(),
      };

      final eventId = await EventsService.saveEvent(id: widget.eventId, payload: eventPayload);

      final quotationId = await QuotationsService.submitCustomerQuotation({
        'userId': user.uid,
        'customerName': user.displayName ?? (_titleCtrl.text.trim().isNotEmpty ? _titleCtrl.text.trim() : 'Festalytics Customer'),
        'targetVenueId': _selectedVenueSlug,
        'eventDate': _date,
        'guestCount': _guestCount.isNotEmpty ? int.tryParse(_guestCount) ?? 1 : 1,
        'selectedMenu': menuPayload,
        'eventTitle': _titleCtrl.text.trim(),
        'eventType': _eventType,
        'eventTime': _time,
        'eventLocation': _location,
        'selectedAddons': _addons,
        'financials': {'hallRent': hallRent, 'cateringCost': cateringCost, 'addonsCost': addonsCost, 'grandTotal': _budgetTotal},
        'source': 'create_event_wizard',
      });

      if (quotationId.isNotEmpty) {
        await EventsService.saveEvent(id: eventId, payload: {'quotationId': quotationId});
      }

      if (mounted) Navigator.pushReplacementNamed(context, AppRoutes.myEvents);
    } catch (e) {
      setState(() => _submitError = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showError(String msg) {
    setState(() => _submitError = msg);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.eventId == null ? 'Create Event' : 'Edit Event')),
      body: Column(children: [
        Container(height: 6, color: Colors.grey.shade100, child: Row(children: [
          AnimatedContainer(duration: const Duration(milliseconds: 300), width: MediaQuery.of(context).size.width * (_step / 5), height: 6, decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(3))),
        ])),
        Expanded(child: SingleChildScrollView(padding: const EdgeInsets.all(18), child: _buildStep())),
        if (_step < 5) SafeArea(top: false, child: Padding(padding: const EdgeInsets.all(14), child: Row(children: [
          if (_step > 1) Expanded(child: OutlinedButton(onPressed: () => setState(() => _step--), child: const Text('Back'))),
          if (_step > 1) const SizedBox(width: 12),
          Expanded(child: ElevatedButton(onPressed: _canProceed ? () => setState(() => _step++) : null, child: const Text('Next Step'))),
        ]))),
        if (_submitError.isNotEmpty) Padding(padding: const EdgeInsets.fromLTRB(18, 0, 18, 8), child: Text(_submitError, style: const TextStyle(color: Colors.red, fontSize: 13))),
      ]),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 1: return _buildBasicDetails();
      case 2: return _buildVenueSelection();
      case 3: return _buildVendors();
      case 4: return _buildBudget();
      case 5: return _buildReview();
      default: return const SizedBox();
    }
  }

  Widget _buildBasicDetails() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 40),
      child: Column(children: [
        const SizedBox(height: 20),
        Text('Basic Details', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 6),
        const Text('Let\'s get the basics down to start planning.', style: TextStyle(color: AppColors.muted)),
        const SizedBox(height: 24),
        _label('Event Name'),
        const SizedBox(height: 6),
        TextField(controller: _titleCtrl, decoration: const InputDecoration(hintText: "e.g. Sarah's 25th Birthday")),
        const SizedBox(height: 14),
        _label('Event Type'),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          initialValue: _eventType.isEmpty ? null : _eventType,
          decoration: const InputDecoration(hintText: 'Select an event type'),
          items: const [
            DropdownMenuItem(value: 'wedding', child: Text('Wedding')),
            DropdownMenuItem(value: 'birthday', child: Text('Birthday')),
            DropdownMenuItem(value: 'corporate', child: Text('Corporate')),
            DropdownMenuItem(value: 'party', child: Text('Party')),
            DropdownMenuItem(value: 'other', child: Text('Other')),
          ],
          onChanged: (v) => setState(() => _eventType = v ?? ''),
        ),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _label('Date'),
            const SizedBox(height: 6),
            TextField(
              readOnly: true,
              decoration: InputDecoration(
                hintText: 'Pick date',
                prefixIcon: const Icon(Icons.calendar_today, size: 18, color: AppColors.primary),
                suffixIcon: _date.isNotEmpty ? IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () => setState(() => _date = '')) : null,
              ),
              controller: TextEditingController(text: _date.isEmpty ? '' : formatEventDate(_date)),
              onTap: () async {
                final d = await showDatePicker(context: context, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 720)), initialDate: DateTime.now());
                if (d != null) setState(() => _date = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}');
              },
            ),
          ])),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _label('Time'),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              initialValue: _time.isEmpty ? null : _time,
              decoration: const InputDecoration(hintText: 'Select Timing'),
              items: const [
                DropdownMenuItem(value: 'morning', child: Text('Morning')),
                DropdownMenuItem(value: 'evening', child: Text('Evening')),
              ],
              onChanged: (v) => setState(() => _time = v ?? ''),
            ),
          ])),
        ]),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _label('Area/Location'),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              initialValue: _location.isEmpty ? null : _location,
              decoration: const InputDecoration(hintText: 'Select area', prefixIcon: Icon(Icons.location_on_outlined, size: 18, color: AppColors.primary)),
              items: _areaOptions.map((a) => DropdownMenuItem(value: a, child: Text(a))).toList(),
              onChanged: (v) => setState(() => _location = v ?? ''),
            ),
          ])),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _label('Guests'),
            const SizedBox(height: 6),
            TextField(
              keyboardType: TextInputType.number,
              decoration: InputDecoration(hintText: '300', prefixIcon: Icon(Icons.people_outline, size: 18, color: AppColors.primary)),
              controller: TextEditingController(text: _guestCount),
              onChanged: (v) { _guestCount = v; _syncBudget(); },
            ),
          ])),
        ]),
      ]),
    );
  }

  Widget _buildVenueSelection() {
    if (!_hallsLoaded) return const Center(child: CircularProgressIndicator());

    final filtered = _allHalls.where((h) {
      final query = _searchQuery.toLowerCase();
      if (query.isNotEmpty) {
        final name = (h['hall_name'] ?? '').toString().toLowerCase();
        final area = (h['area'] ?? '').toString().toLowerCase();
        final addr = (h['full_address'] ?? '').toString().toLowerCase();
        if (!name.contains(query) && !area.contains(query) && !addr.contains(query)) return false;
      }
      return true;
    }).toList();

    return Padding(
      padding: const EdgeInsets.only(bottom: 40),
      child: Column(children: [
        const SizedBox(height: 20),
        Text('Select a Venue', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 6),
        const Text('Halls matching your event requirements', style: TextStyle(color: AppColors.muted)),
        const SizedBox(height: 16),
        TextField(
          controller: _searchCtl,
          onChanged: (v) => searchQuery = v,
          decoration: InputDecoration(hintText: 'Search hall name...', prefixIcon: Icon(Icons.search, color: AppColors.primary)),
        ),
        const SizedBox(height: 16),
        if (_selectedVenueSlug.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: .08), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.primary.withValues(alpha: .3))),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.check_circle, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Text('Selected: $_selectedVenueName', style: const TextStyle(fontWeight: FontWeight.w800)),
              ]),
              const SizedBox(height: 4),
              Text(_selectedVenueLocation, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
              Text(_selectedVenuePrice, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
            ]),
          ),
        if (filtered.isEmpty)
          Center(
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.storefront_outlined, size: 60, color: Colors.grey.shade300),
              const SizedBox(height: 12),
              Text('No Halls Found', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.grey.shade600)),
              const SizedBox(height: 4),
              Text('Try adjusting your search or filters', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
            ]),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: filtered.length,
            itemBuilder: (_, i) {
              final hall = filtered[i];
              final slug = _getVenueDocId(hall);
              final isSelected = _selectedVenueSlug == slug;
              final images = hall['images'] as List<dynamic>? ?? [];
              final firstImage = images.isNotEmpty ? images.first.toString() : null;
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: isSelected ? AppColors.primary : Colors.grey.shade200, width: isSelected ? 2 : 1),
                ),
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => _selectVenue(hall),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: SizedBox(
                          width: 80,
                          height: 80,
                          child: firstImage != null
                            ? Image.network(firstImage, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade200, child: const Icon(Icons.store, color: Colors.grey)))
                            : Container(color: Colors.grey.shade200, child: const Icon(Icons.store, color: Colors.grey)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(hall['hall_name']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w800)),
                        const SizedBox(height: 2),
                        Text(hall['area']?.toString() ?? '', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                        const SizedBox(height: 2),
                        Text(hall['price_range']?.toString() ?? 'Contact for price', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 12)),
                        Text('Capacity: ${hall['capacity_sitting'] ?? 'N/A'} guests', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                        if (isSelected)
                          Container(margin: const EdgeInsets.only(top: 4), padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(20)), child: const Text('Selected', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700))),
                      ])),
                      Icon(isSelected ? Icons.check_circle : Icons.chevron_right, color: isSelected ? AppColors.primary : Colors.grey),
                    ]),
                  ),
                ),
              );
            },
          ),
      ]),
    );
  }

  final _searchCtl = TextEditingController();
  String _searchQuery = '';
  set searchQuery(String q) => setState(() => _searchQuery = q);

  Widget _buildVendors() {
    final packages = [_getVenueHireOnly(), ...resolveCateringPackages(_dbVenuesMap[_selectedVenueSlug])];
    final addonOptions = getAddonOptions(_dbVenuesMap[_selectedVenueSlug]);
    final selectedPkg = packages.where((p) => p.id == _selectedCateringPackageId).firstOrNull;

    if (_selectedVenueSlug.isEmpty) {
      return const Center(child: Text('Please select a venue in the previous step.', style: TextStyle(color: AppColors.muted)));
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 40),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 20),
        Text('Menu & Services', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 6),
        Text('Choose catering and add-ons for $_selectedVenueName', style: const TextStyle(color: AppColors.muted)),
        const SizedBox(height: 20),
        const Text('Catering Packages', style: TextStyle(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        ...packages.map((pkg) => _packageTile(pkg, selectedPkg?.id == pkg.id)),
        const SizedBox(height: 20),
        const Text('Add-ons', style: TextStyle(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        ...addonOptions.map((opt) => _addonTile(opt)),
        const SizedBox(height: 16),
        if (selectedPkg != null)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(16)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(selectedPkg.name, style: const TextStyle(fontWeight: FontWeight.w800)),
              Text('${formatMoney(selectedPkg.perPlatePrice)}/head', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
              if (_guestCount.isNotEmpty) Text('Est. catering: ${formatMoney(selectedPkg.perPlatePrice * (int.tryParse(_guestCount) ?? 1))}', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
            ]),
          ),
      ]),
    );
  }

  Widget _packageTile(CateringPackage pkg, bool selected) {
    return GestureDetector(
      onTap: () => _selectPackage(pkg),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: selected ? AppColors.primary : Colors.grey.shade200, width: selected ? 2 : 1),
          color: selected ? AppColors.primary.withValues(alpha: .05) : Colors.white,
        ),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(pkg.name, style: TextStyle(fontWeight: FontWeight.w800, color: selected ? AppColors.primary : Colors.black87)),
            if (pkg.dishes.isNotEmpty) Text(pkg.dishes.join(' · '), style: const TextStyle(fontSize: 12, color: AppColors.muted), maxLines: 1, overflow: TextOverflow.ellipsis),
          ])),
          const SizedBox(width: 8),
          Text(formatMoney(pkg.perPlatePrice), style: TextStyle(fontWeight: FontWeight.w800, color: selected ? AppColors.primary : Colors.black54)),
          if (selected) const Padding(padding: EdgeInsets.only(left: 8), child: Icon(Icons.check_circle, color: AppColors.primary, size: 20)),
        ]),
      ),
    );
  }

  Widget _addonTile(Map<String, dynamic> opt) {
    final key = opt['key'] as String;
    final isOn = _addons[key] == true;
    return GestureDetector(
      onTap: () => _toggleAddon(key),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isOn ? AppColors.primary : Colors.grey.shade200),
          color: isOn ? AppColors.primary.withValues(alpha: .05) : Colors.white,
        ),
        child: Row(children: [
          Expanded(child: Text(opt['label']?.toString() ?? '', style: TextStyle(fontWeight: FontWeight.w700, color: isOn ? AppColors.primary : Colors.black87))),
          Text(formatMoney((opt['price'] as num?)?.toDouble() ?? 0), style: TextStyle(fontWeight: FontWeight.w600, color: isOn ? AppColors.primary : Colors.black54)),
          const SizedBox(width: 8),
          Icon(isOn ? Icons.check_box : Icons.check_box_outline_blank, color: isOn ? AppColors.primary : Colors.grey, size: 22),
        ]),
      ),
    );
  }

  Widget _buildBudget() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 40),
      child: Column(children: [
        const SizedBox(height: 20),
        Text('Budget Overview', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 6),
        Text('Estimated costs based on your venue and selections', style: const TextStyle(color: AppColors.muted)),
        const SizedBox(height: 20),
        Row(children: [
          Expanded(child: _budgetCard('Total Estimated', formatMoney(_budgetTotal), AppColors.primary)),
          const SizedBox(width: 8),
          Expanded(child: _budgetCard('Paid So Far', formatMoney(0), Colors.green)),
          const SizedBox(width: 8),
          Expanded(child: _budgetCard('Remaining', formatMoney(_budgetTotal), Colors.red.shade400)),
        ]),
        const SizedBox(height: 20),
        Container(
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
          child: Column(children: [
            Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12), decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: const BorderRadius.vertical(top: Radius.circular(15))), child: Row(children: [Text('Expense Item', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.grey.shade700)), const Spacer(), Text('Estimated Cost', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.grey.shade700))])),
            if (_budgetBreakdown.isEmpty)
              const Padding(padding: EdgeInsets.all(24), child: Text('Complete the Menu & Services step to see your budget.', style: TextStyle(color: AppColors.muted)))
            else
              ..._budgetBreakdown.map((b) => Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10), child: Row(children: [Text(b.item, style: const TextStyle(fontSize: 13)), const Spacer(), Text(b.display, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13))]))),
            Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.pink.shade50, borderRadius: const BorderRadius.vertical(bottom: Radius.circular(15))), child: Row(children: [const Text('Grand Total', style: TextStyle(fontWeight: FontWeight.w900)), const Spacer(), Text(formatMoney(_budgetTotal), style: TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary))])),
          ]),
        ),
      ]),
    );
  }

  Widget _budgetCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: label == 'Total Estimated' ? Colors.grey.shade900 : Colors.white,
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(color: label == 'Total Estimated' ? Colors.grey.shade400 : Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: color)),
      ]),
    );
  }

  Widget _buildReview() {
    final pkg = _selectedPackage;
    return Padding(
      padding: const EdgeInsets.only(bottom: 40),
      child: Column(children: [
        const SizedBox(height: 20),
        Text('Review & Submit', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            _reviewRow('Event Name', _titleCtrl.text.isEmpty ? 'Untitled Event' : _titleCtrl.text),
            _reviewRow('Event Type', _eventType.isEmpty ? 'Not set' : _eventType),
            _reviewRow('Date', _date.isEmpty ? 'Not set' : formatEventDate(_date)),
            _reviewRow('Time', _time.isEmpty ? 'Not set' : formatEventTime(_time)),
            _reviewRow('Location', _location.isEmpty ? 'Not set' : _location),
            _reviewRow('Guests', _guestCount.isEmpty ? 'Not set' : '$_guestCount guests'),
            const Divider(height: 20),
            _reviewRow('Venue', _selectedVenueName.isEmpty ? 'Not selected' : _selectedVenueName),
            _reviewRow('Menu', pkg?.name ?? 'Venue Hire Only'),
            _reviewRow('Budget', formatMoney(_budgetTotal)),
          ]),
        ),
        if (_selectedVenueSlug.isNotEmpty) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.amber.shade200)),
            child: Row(children: [
              Icon(Icons.info_outline, color: Colors.amber.shade700, size: 20),
              const SizedBox(width: 8),
              const Expanded(child: Text('A quotation will be sent to the venue for review.', style: TextStyle(fontSize: 13))),
            ]),
          ),
        ],
        const SizedBox(height: 24),
        if (_submitError.isNotEmpty)
          Container(margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)), child: Text(_submitError, style: TextStyle(color: Colors.red.shade700, fontSize: 13))),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            onPressed: _submitting ? null : _handleFinalize,
            icon: _submitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.send),
            label: Text(_submitting ? 'Submitting...' : 'Create Event & Send to Venue'),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () => Navigator.pushNamed(context, AppRoutes.myEvents),
            child: const Text('Save as Draft'),
          ),
        ),
      ]),
    );
  }

  Widget _reviewRow(String label, String value) {
    return Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(width: 100, child: Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 13))),
      Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
    ]));
  }

  Widget _label(String text) => Text(text, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13));

  CateringPackage _getVenueHireOnly() => venueHireOnly;
}
