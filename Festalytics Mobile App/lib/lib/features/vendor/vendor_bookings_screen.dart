import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/app_widgets.dart';
import '../../core/routes/app_routes.dart';
import '../../models/venue.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../services/bookings_service.dart';
import '../../services/chat_service.dart';
import '../../services/quotations_service.dart';
import '../../services/venues_service.dart';
import '../../web_clone/src/components/vendor/bookings/BookingFilters.dart';
import '../../web_clone/src/components/vendor/bookings/BookingStats.dart';

String normalizeSheetStatus(String status) {
  final v = status.trim().toLowerCase();
  if (['accepted', 'confirmed', 'approve', 'approved'].contains(v)) return 'Confirmed';
  if (['cancelled', 'canceled', 'declined', 'rejected', 'cancel'].contains(v)) return 'Cancelled';
  return 'Pending';
}

String statusKey(String value) {
  return value.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '');
}

bool isPendingStatus(String status) {
  return statusKey(status) == 'pending';
}

bool isFinalStatus(String status) {
  final key = statusKey(status);
  return ['confirmed', 'cancelled', 'canceled', 'declined', 'accepted'].contains(key);
}

bool isQuotationActionable(String status) {
  if (isFinalStatus(status)) return false;
  final key = statusKey(status);
  return key == 'pending' || key == 'quoterequest' || key == 'counteroffer' || key == 'counter';
}

bool isAiCallEligible(Map<String, dynamic> booking) {
  if (booking['status'] == null || isFinalStatus(booking['status'].toString())) return false;
  return isQuotationActionable(booking['status'].toString()) || booking['isQuotation'] == true;
}

String selectedBookingId(Map<String, dynamic> booking) {
  return (booking['id'] ?? booking['docId'] ?? '').toString().trim();
}

String getProofUrlFromBooking(Map<String, dynamic> booking) {
  final candidate = booking['proof'] ??
      booking['voiceProofUrl'] ??
      booking['voiceCallRecordingUrl'] ??
      booking['callRecordingUrl'] ??
      booking['call_recording_url'] ??
      booking['public_recording_url'] ??
      '';
  return candidate.toString().trim();
}

String getBookingContactValue(Map<String, dynamic> booking) {
  final raw = booking['raw'] is Map ? booking['raw'] as Map<String, dynamic> : <String, dynamic>{};
  final customer = booking['customer'] is Map ? booking['customer'] as Map<String, dynamic> : <String, dynamic>{};
  final rawCustomer = raw['customer'] is Map ? raw['customer'] as Map<String, dynamic> : <String, dynamic>{};
  final sheetCols = booking['sheetColumns'] is Map ? booking['sheetColumns'] as Map<String, dynamic> : <String, dynamic>{};
  final candidates = [
    customer['contact'], customer['phone'], customer['mobile'],
    rawCustomer['contact'], rawCustomer['phone'], rawCustomer['mobile'],
    booking['contact'], booking['phone'], booking['mobile'],
    sheetCols['Contact'], sheetCols['Phone'], sheetCols['Phone Number'], sheetCols['Mobile'],
    sheetCols['Customer Contact'], sheetCols['Customer Phone'],
  ];
  for (final c in candidates) {
    if (c != null && c.toString().trim().isNotEmpty) {
      final cleaned = c.toString().replaceAll(RegExp(r'[\s().-]'), '');
      if (cleaned.length >= 10) return c.toString().trim();
    }
  }
  return 'No contact';
}

List<Map<String, dynamic>> mergeBookingRows(List<List<Map<String, dynamic>>> lists) {
  final map = <String, Map<String, dynamic>>{};
  for (final list in lists) {
    for (final row in list) {
      map[row['docId'] ?? row['id'] ?? ''] = row;
    }
  }
  return map.values.toList();
}

String formatAmount(num amount) {
  if (amount <= 0) return 'Estimate pending';
  return 'Rs. ${amount.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';
}

class VendorBookingsScreen extends StatefulWidget {
  const VendorBookingsScreen({super.key});
  @override
  State<VendorBookingsScreen> createState() => _VendorBookingsScreenState();
}

class _VendorBookingsScreenState extends State<VendorBookingsScreen> {
  String? _statusFilter;
  String? _searchQuery;
  bool _showWalkinForm = false;

  void _onFiltersChanged(Map<String, String?> filters) {
    setState(() {
      _statusFilter = filters['status'];
      _searchQuery = filters['search'];
    });
  }

  @override
  Widget build(BuildContext context) {
    final venueId = context.watch<app.AppAuthProvider>().currentUser?.venueId ?? '';
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bookings & Requests'),
        actions: [
          TextButton.icon(
            onPressed: () => setState(() => _showWalkinForm = !_showWalkinForm),
            icon: Icon(_showWalkinForm ? Icons.list : Icons.person_add),
            label: Text(_showWalkinForm ? 'List' : 'Walk-in'),
          ),
        ],
      ),
      body: venueId.isEmpty
          ? const EmptyState(icon: Icons.fact_check_outlined, title: 'No venue linked', subtitle: 'Bookings require a vendor venue.')
          : _showWalkinForm
              ? _WalkInBookingForm(venueId: venueId, onClose: () => setState(() => _showWalkinForm = false))
              : _BookingTabs(
                  venueId: venueId,
                  statusFilter: _statusFilter,
                  searchQuery: _searchQuery,
                  onFiltersChanged: _onFiltersChanged,
                ),
    );
  }
}

class _BookingTabs extends StatefulWidget {
  final String venueId;
  final String? statusFilter;
  final String? searchQuery;
  final ValueChanged<Map<String, String?>> onFiltersChanged;
  const _BookingTabs({
    required this.venueId,
    this.statusFilter,
    this.searchQuery,
    required this.onFiltersChanged,
  });
  @override
  State<_BookingTabs> createState() => _BookingTabsState();
}

class _BookingTabsState extends State<_BookingTabs> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _quotations = [];
  List<Map<String, dynamic>> _firestoreBookings = [];
  StreamSubscription? _quotationSub;
  StreamSubscription? _bookingSub;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _setupListeners();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _quotationSub?.cancel();
    _bookingSub?.cancel();
    super.dispose();
  }

  void _setupListeners() {
    final venueId = widget.venueId;
    _quotationSub = QuotationsService.listenToIncomingQuotations(venueId, (quotations) {
      final rows = quotations.map((q) {
        final mapped = QuotationsService.mapQuotationToBookingRow(q);
        mapped['raw'] = {
          ...(mapped['raw'] as Map? ?? {}),
          'userId': q.userId,
          'quotationId': q.quotationId,
        };
        return mapped;
      }).toList();
      if (mounted) setState(() => _quotations = rows);
    });

    _bookingSub = BookingsService.listenToVenueBookings(venueId, (bookings) {
      final rows = bookings.map((b) {
        final r = b.raw;
        final fin = r['financials'] is Map ? r['financials'] as Map<String, dynamic> : <String, dynamic>{};
        final ed = r['eventDetails'] is Map ? r['eventDetails'] as Map<String, dynamic> : <String, dynamic>{};
        final data = <String, dynamic>{
          'docId': b.docId,
          'id': b.docId,
          'customer': {
            'name': b.customer.name,
            'contact': b.customer.contact,
            'email': b.customer.email,
          },
          'eventDetails': b.eventDetails != null
              ? {
                  'category': ed['category'],
                  'date': ed['date'],
                  'guests': ed['guests'],
                  'timing': ed['timing'],
                }
              : null,
          'financials': b.financials != null
              ? {
                  'grandTotal': fin['grandTotal'],
                  'hallRent': fin['hallRent'],
                  'cateringCost': fin['cateringCost'],
                  'utilitiesCost': fin['utilitiesCost'],
                  'addonsCost': fin['addonsCost'],
                  'advancePaid': fin['advancePaid'],
                  'remainingBalance': fin['remainingBalance'],
                }
              : null,
          'status': b.status,
          'bookingSource': r['bookingSource'] ?? b.source,
          'eventDate': ed['date'] ?? '',
          'amount': b.amount,
        };
        return data;
      }).toList();
      if (mounted) setState(() {
        _firestoreBookings = rows;
        _isLoading = false;
      });
    });
  }

  List<Map<String, dynamic>> get _allRows {
    final merged = <String, Map<String, dynamic>>{};
    for (final q in _quotations) {
      merged[selectedBookingId(q)] = q;
    }
    for (final b in _firestoreBookings) {
      merged[selectedBookingId(b)] = b;
    }
    return merged.values.toList();
  }

  List<Map<String, dynamic>> _filterList(List<Map<String, dynamic>> rows) {
    var filtered = rows.toList();
    if (widget.statusFilter != null && widget.statusFilter!.isNotEmpty) {
      filtered = filtered.where((r) => statusKey(r['status']?.toString() ?? '').contains(statusKey(widget.statusFilter!))).toList();
    }
    if (widget.searchQuery != null && widget.searchQuery!.isNotEmpty) {
      final q = widget.searchQuery!.toLowerCase();
      filtered = filtered.where((r) {
        final customer = r['customer'] is Map ? r['customer'] as Map<String, dynamic> : <String, dynamic>{};
        final name = (customer['name'] ?? '').toString().toLowerCase();
        final id = selectedBookingId(r).toLowerCase();
        return name.contains(q) || id.contains(q);
      }).toList();
    }
    return filtered;
  }

  void _onBookingTap(Map<String, dynamic> booking) {
    _BookingDetailSheet.show(context, booking, widget.venueId);
  }

  @override
  Widget build(BuildContext context) {
    final all = _allRows;
    final stats = all;
    return Column(children: [
      BookingFilters(onChanged: widget.onFiltersChanged),
      BookingStats(bookings: stats),
      const SizedBox(height: 4),
      TabBar(
        controller: _tabController,
        labelColor: AppColors.primary,
        unselectedLabelColor: AppColors.muted,
        indicatorColor: AppColors.primary,
        tabs: [
          Tab(text: 'Quotations (${_quotations.length})'),
          Tab(text: 'Bookings (${_firestoreBookings.length})'),
        ],
      ),
      Expanded(
        child: TabBarView(
          controller: _tabController,
          children: [
            _buildList(0),
            _buildList(1),
          ],
        ),
      ),
    ]);
  }

  Widget _buildList(int tabIndex) {
    final source = tabIndex == 0 ? _quotations : _firestoreBookings;
    final filtered = _filterList(source);
    if (_isLoading) return const LoadingView();
    if (filtered.isEmpty) {
      return EmptyState(
        icon: Icons.inbox_outlined,
        title: tabIndex == 0 ? 'No quotations' : 'No bookings',
        subtitle: tabIndex == 0 ? 'Customer requests will appear here.' : 'Walk-in bookings will appear here.',
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.only(left: 18, right: 18, bottom: 18),
      itemCount: filtered.length,
      itemBuilder: (_, i) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: _BookingCard(row: filtered[i], onTap: () => _onBookingTap(filtered[i])),
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Map<String, dynamic> row;
  final VoidCallback onTap;
  const _BookingCard({required this.row, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final customer = row['customer'] is Map ? row['customer'] as Map<String, dynamic> : <String, dynamic>{};
    final name = (customer['name'] ?? 'Customer').toString();
    final fin = row['financials'] is Map ? row['financials'] as Map<String, dynamic> : null;
    final status = row['status']?.toString() ?? 'Pending';
    final eventDate = row['eventDate']?.toString() ?? (row['eventDetails'] is Map ? (row['eventDetails'] as Map)['date'] : '') ?? '';
    final isQuotation = row['isQuotation'] == true;
    return CandyCard(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primary.withValues(alpha: .1),
              child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary, fontSize: 14)),
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900))),
            StatusChip(status),
          ]),
          const SizedBox(height: 8),
          if (eventDate.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(children: [
                Icon(Icons.calendar_today, size: 13, color: AppColors.muted),
                const SizedBox(width: 4),
                Text(eventDate.toString(), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
              ]),
            ),
          Row(children: [
            if (fin != null)
              Text(formatMoney(fin['grandTotal'] ?? 0), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.primary)),
            if (fin == null && row['amount'] != null)
              Text(formatAmount((row['amount'] as num?)?.toDouble() ?? 0), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.primary)),
            const Spacer(),
            Text(
              isQuotation ? 'Online Portal' : (row['bookingSource'] ?? row['source'] ?? 'Walk-in').toString(),
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.muted),
            ),
          ]),
        ]),
      ),
    );
  }
}

class _BookingDetailSheet extends StatefulWidget {
  final Map<String, dynamic> booking;
  final String venueId;
  const _BookingDetailSheet({required this.booking, required this.venueId});

  static void show(BuildContext context, Map<String, dynamic> booking, String venueId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BookingDetailSheet(booking: booking, venueId: venueId),
    );
  }

  @override
  State<_BookingDetailSheet> createState() => _BookingDetailSheetState();
}

class _BookingDetailSheetState extends State<_BookingDetailSheet> {
  final _counterCtl = TextEditingController();
  bool _isSubmitting = false;
  bool _isTwilioCalling = false;
  String? _toastMsg;

  bool get _hasValidContact {
    final contact = getBookingContactValue(widget.booking);
    return contact.isNotEmpty && contact != 'No contact';
  }

  @override
  void initState() {
    super.initState();
    _counterCtl.text = (widget.booking['amount'] ?? 0).toString();
  }

  @override
  void dispose() {
    _counterCtl.dispose();
    super.dispose();
  }

  void _toast(String msg) {
    if (!mounted) return;
    setState(() => _toastMsg = msg);
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _toastMsg = null);
    });
  }

  Future<void> _handleAction(String action) async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);
    try {
      final booking = widget.booking;
      final isQuotation = booking['isQuotation'] == true;
      final collection = isQuotation ? 'quotations' : 'bookings';
      final docId = selectedBookingId(booking);

      String nextStatus;
      if (action == 'accept') nextStatus = 'Confirmed';
      else if (action == 'decline') nextStatus = 'Cancelled';
      else if (action == 'counter') nextStatus = 'Counter Offer';
      else return;

      final updates = <String, dynamic>{'status': nextStatus, 'updatedAt': DateTime.now().toIso8601String()};

      if (action == 'counter') {
        final newTotal = double.tryParse(_counterCtl.text) ?? 0;
        if (newTotal <= 0) { _toast('Enter a valid counter amount'); setState(() => _isSubmitting = false); return; }
        updates['financials'] = {
          ...(booking['financials'] is Map ? booking['financials'] as Map<String, dynamic> : {}),
          'grandTotal': newTotal,
          'remainingBalance': newTotal,
        };
      }

      if (action == 'accept') {
        final eventDate = booking['eventDate'] ?? (booking['eventDetails'] is Map ? (booking['eventDetails'] as Map)['date'] : null);
        if (eventDate != null && eventDate.toString().isNotEmpty) {
          try {
            await FirebaseFirestore.instance.collection('venues').doc(widget.venueId).update({
              'blockedDates': FieldValue.arrayUnion([eventDate.toString()])
            });
          } catch (_) {}
        }
      }

      if (docId.isNotEmpty) {
        final statusMap = action == 'counter' ? updates : {
          'status': nextStatus,
          'updatedAt': DateTime.now().toIso8601String(),
        };
        await FirebaseFirestore.instance.collection(collection).doc(docId).set(statusMap, SetOptions(merge: true));
      }

      if (action == 'counter') {
        final raw = booking['raw'] is Map ? booking['raw'] as Map<String, dynamic> : <String, dynamic>{};
        final customerId = raw['userId']?.toString();
        final customer = booking['customer'] is Map ? booking['customer'] as Map<String, dynamic> : <String, dynamic>{};
        final customerName = (customer['name'] ?? 'Customer').toString();
        if (customerId != null && customerId.isNotEmpty && widget.venueId.isNotEmpty) {
          try {
            final chatId = ChatService.buildChatId(customerId, widget.venueId);
            await ChatService.ensureRoom(
              customerId: customerId,
              venueId: widget.venueId,
              customerName: customerName,
              venueName: widget.venueId,
            );
            await ChatService.sendMessage(
              chatId: chatId,
              senderId: widget.venueId,
              senderRole: 'vendor',
              text: 'We have sent you a counter offer for booking #${booking['id'] ?? docId}. Please review.',
              extraData: {
                'counterOffer': {
                  'bookingRefId': booking['id'] ?? docId,
                  'revisedGuestPrice': double.tryParse(_counterCtl.text) ?? 0,
                }
              },
            );
          } catch (_) {}
        }
      }

      _toast(action == 'accept' ? 'Booking confirmed!' : action == 'decline' ? 'Booking declined.' : 'Counter offer sent.');
      setState(() => _isSubmitting = false);
      Navigator.of(context).pop();
    } catch (e) {
      _toast('Action failed: $e');
      setState(() => _isSubmitting = false);
    }
  }

  Future<void> _startTwilioCall() async {
    if (_isTwilioCalling) return;
    setState(() { _isTwilioCalling = true; });
    try {
      final booking = widget.booking;
      final customer = booking['customer'] is Map ? booking['customer'] as Map<String, dynamic> : <String, dynamic>{};
      final phone = getBookingContactValue(booking);
      final bookingId = selectedBookingId(booking);
      if (phone.isEmpty || phone == 'No contact') { _toast('No phone number available'); setState(() => _isTwilioCalling = false); return; }
      Navigator.of(context).pop();
      await Navigator.pushNamed(context, AppRoutes.aiCall, arguments: {
        'bookingId': bookingId,
        'phoneNumber': phone,
        'customerName': customer['name'] ?? 'Customer',
      });
    } catch (e) {
      _toast('Call failed: $e');
      setState(() => _isTwilioCalling = false);
    }
  }

  Future<void> _initiateChat() async {
    final booking = widget.booking;
    final raw = booking['raw'] is Map ? booking['raw'] as Map<String, dynamic> : <String, dynamic>{};
    final customerId = raw['userId']?.toString();
    if (customerId == null || customerId.isEmpty) {
      _toast('No linked customer account for chat');
      return;
    }
    final customer = booking['customer'] is Map ? booking['customer'] as Map<String, dynamic> : <String, dynamic>{};
    final customerName = (customer['name'] ?? 'Customer').toString();
    try {
      await ChatService.ensureRoom(
        customerId: customerId,
        venueId: widget.venueId,
        customerName: customerName,
        venueName: widget.venueId,
      );
      Navigator.of(context).pop();
      Navigator.pushNamed(context, AppRoutes.vendorMessages);
    } catch (e) {
      _toast('Chat failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final booking = widget.booking;
    final customer = booking['customer'] is Map ? booking['customer'] as Map<String, dynamic> : <String, dynamic>{};
    final raw = booking['raw'] is Map ? booking['raw'] as Map<String, dynamic> : <String, dynamic>{};
    final eventDetails = booking['eventDetails'] is Map ? booking['eventDetails'] as Map<String, dynamic> : raw['eventDetails'] is Map ? raw['eventDetails'] as Map<String, dynamic> : <String, dynamic>{};
    final financials = raw['financials'] is Map ? raw['financials'] as Map<String, dynamic> : booking['financials'] is Map ? booking['financials'] as Map<String, dynamic> : <String, dynamic>{};
    final addons = raw['addons'] is Map ? raw['addons'] as Map<String, dynamic> : null;
    final catering = raw['catering'] is Map ? raw['catering'] as Map<String, dynamic> : null;
    final dishes = catering != null && catering['dishes'] is List ? List<String>.from(catering['dishes'] as List) : <String>[];
    final status = booking['status']?.toString() ?? 'Pending';
    final proofUrl = getProofUrlFromBooking(booking);
    final sheetColumns = booking['sheetColumns'] is Map ? booking['sheetColumns'] as Map<String, dynamic> : null;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _toastMsg != null
              ? Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  color: Colors.green.shade50,
                  child: Text(_toastMsg!, style: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.w700, fontSize: 13)),
                )
              : const SizedBox.shrink(),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              children: [
                Row(children: [
                  Expanded(child: Text((customer['name'] ?? 'Customer').toString(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isQuotationActionable(status) ? Colors.amber.shade50 : statusKey(status).contains('confirm') ? Colors.green.shade50 : Colors.red.shade50,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(status, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: isQuotationActionable(status) ? Colors.amber.shade800 : statusKey(status).contains('confirm') ? Colors.green.shade800 : Colors.red.shade800)),
                  ),
                ]),
                const SizedBox(height: 4),
                Text((customer['email'] ?? customer['contact'] ?? '').toString(), style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                const SizedBox(height: 16),
                _section('Event Specifications', [
                  _infoRow('Date', eventDetails['date']?.toString() ?? booking['eventDate']?.toString() ?? 'Not set'),
                  _infoRow('Guests', '${eventDetails['guests'] ?? ''}'),
                  _infoRow('Category', eventDetails['category']?.toString() ?? 'N/A'),
                  _infoRow('Package', catering?['packageName']?.toString() ?? 'Venue Hire Only'),
                ]),
                if (dishes.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.pink.shade50.withValues(alpha: .3), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.pink.shade100.withValues(alpha: .5))),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Catering Dishes', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.primary)),
                      const SizedBox(height: 6),
                      Wrap(spacing: 4, runSpacing: 4, children: dishes.map((d) => Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)), child: Text(d, style: const TextStyle(fontSize: 10)))).toList()),
                    ]),
                  ),
                ],
                if (addons != null) ...[
                  const SizedBox(height: 16),
                  _section('Add-ons Configured', [
                    _infoRow('AC', addons['ac'] == true ? 'Yes' : 'No'),
                    _infoRow('Generator', addons['generator'] == true ? 'Yes' : 'No'),
                    _infoRow('Decor', addons['decor'] == true ? 'Yes' : 'No'),
                    _infoRow('Sound', addons['sound'] == true ? 'Yes' : 'No'),
                    _infoRow('Security', addons['security'] == true ? 'Yes' : 'No'),
                  ]),
                ],
                if (financials.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.border)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Financial Breakdown', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.muted)),
                      const SizedBox(height: 12),
                      _finRow('Hall Rent', financials['hallRent']),
                      if ((financials['cateringCost'] ?? 0) > 0) _finRow('Catering', financials['cateringCost']),
                      if ((financials['utilitiesCost'] ?? 0) > 0) _finRow('Utilities', financials['utilitiesCost']),
                      if ((financials['addonsCost'] ?? 0) > 0) _finRow('Add-ons', financials['addonsCost']),
                      const Divider(height: 20),
                      _finRow('Total', financials['grandTotal'] ?? booking['amount'], bold: true),
                      if ((financials['advancePaid'] ?? 0) > 0) ...[
                        const SizedBox(height: 4),
                        _finRow('Advance Paid', financials['advancePaid'], color: Colors.green),
                        _finRow('Remaining', financials['remainingBalance'] ?? financials['grandTotal'], color: Colors.red, bold: true),
                      ],
                    ]),
                  ),
                ],
                if (proofUrl.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.indigo.shade100)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Voice Confirmation Proof', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.indigo.shade700)),
                      const SizedBox(height: 8),
                      Text(proofUrl, style: TextStyle(fontSize: 10, color: Colors.indigo.shade700)),
                    ]),
                  ),
                ],
                if (sheetColumns != null && sheetColumns.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Sheet Columns', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.muted)),
                      const SizedBox(height: 8),
                      ...sheetColumns.entries.map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          SizedBox(width: 100, child: Text(e.key, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.muted))),
                          Expanded(child: Text(e.value?.toString() ?? '-', style: const TextStyle(fontSize: 10))),
                        ]),
                      )),
                    ]),
                  ),
                ],
              ],
            ),
          ),
          if (isQuotationActionable(status))
            Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              decoration: BoxDecoration(color: Colors.grey.shade50, border: Border(top: BorderSide(color: AppColors.border))),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Row(children: [
                  Expanded(
                    child: TextField(
                      controller: _counterCtl,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Counter Offer (Rs.)',
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : () => _handleAction('counter'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: const Text('Counter', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                  ),
                ]),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isSubmitting ? null : () => _handleAction('decline'),
                      style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      icon: const Icon(Icons.close, size: 16),
                      label: const Text('Decline', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : () => _handleAction('accept'),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Accept', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ]),
              ]),
            ),
          Container(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
            decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.border))),
            child: SafeArea(
              top: false,
              child: Row(children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: (_isTwilioCalling || !_hasValidContact) ? null : _startTwilioCall,
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.indigo, side: const BorderSide(color: Colors.indigo), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    icon: _isTwilioCalling ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.call, size: 16),
                    label: Text(_isTwilioCalling ? 'Calling...' : (!_hasValidContact ? 'No Contact' : 'AI Call'), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _initiateChat,
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.pink, side: BorderSide(color: Colors.pink.shade200), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    icon: const Icon(Icons.chat, size: 16),
                    label: const Text('Chat', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.muted)),
      const SizedBox(height: 8),
      ...children,
    ]);
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        SizedBox(width: 100, child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.muted, fontWeight: FontWeight.w600))),
        Expanded(child: Text(value.isNotEmpty ? value : '-', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800))),
      ]),
    );
  }

  Widget _finRow(String label, dynamic value, {bool bold = false, Color? color}) {
    final amount = (value is num) ? value.toDouble() : (double.tryParse(value?.toString() ?? '') ?? 0);
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: TextStyle(fontWeight: bold ? FontWeight.w800 : FontWeight.w500, fontSize: 12, color: color ?? Colors.black87)),
        Text(formatMoney(amount), style: TextStyle(fontWeight: bold ? FontWeight.w900 : FontWeight.w700, fontSize: 12, color: color ?? AppColors.primary)),
      ]),
    );
  }
}

class _WalkInBookingForm extends StatefulWidget {
  final String venueId;
  final VoidCallback onClose;
  const _WalkInBookingForm({required this.venueId, required this.onClose});

  @override
  State<_WalkInBookingForm> createState() => _WalkInBookingFormState();
}

class _WalkInBookingFormState extends State<_WalkInBookingForm> {
  final _formKey = GlobalKey<FormState>();
  bool _isSaving = false;
  Map<String, dynamic>? _createdReceipt;

  final _nameCtl = TextEditingController();
  final _contactCtl = TextEditingController();
  final _otherNameCtl = TextEditingController();
  final _addressCtl = TextEditingController();
  final _guestsCtl = TextEditingController(text: '150');
  final _eventDateCtl = TextEditingController();
  final _advanceCtl = TextEditingController();

  String _eventTiming = 'Morning (1:00 PM - 4:00 PM)';
  String _eventCategory = 'Barat';
  String _customCategory = '';

  Venue? _venue;
  bool _venueLoading = true;

  String _selectedPkgId = '';

  bool _includeAC = true;
  bool _includeGenerator = true;
  bool _includeDecor = false;
  bool _includeSound = false;
  bool _includeSecurity = false;

  double _customHallRent = 250000;
  double _customAcCost = 25000;
  double _customGeneratorCost = 15000;
  double _customDecorPrice = 120000;
  double _customSoundPrice = 25000;
  double _customSecurityPrice = 20000;
  final Map<String, double> _customPlatePrices = {};

  @override
  void initState() {
    super.initState();
    _loadVenue();
  }

  @override
  void dispose() {
    _nameCtl.dispose();
    _contactCtl.dispose();
    _otherNameCtl.dispose();
    _addressCtl.dispose();
    _guestsCtl.dispose();
    _eventDateCtl.dispose();
    _advanceCtl.dispose();
    super.dispose();
  }

  Future<void> _loadVenue() async {
    try {
      final venue = await VenuesService.getVenue(widget.venueId);
      if (mounted && venue != null) {
        setState(() {
          _venue = venue;
          _venueLoading = false;
          _customHallRent = venue.pricing.hallRent;
          _customAcCost = venue.pricing.acCost;
          _customGeneratorCost = venue.pricing.generatorCost;
          _customDecorPrice = venue.pricing.decorPrice;
          _customSoundPrice = venue.pricing.soundPrice;
          _customSecurityPrice = venue.pricing.securityPrice;
          if (venue.cateringPackages.isNotEmpty) {
            _selectedPkgId = venue.cateringPackages.first['id']?.toString() ?? '';
            for (final pkg in venue.cateringPackages) {
              final id = pkg['id']?.toString() ?? '';
              final price = (pkg['perPlatePrice'] ?? 0).toDouble();
              _customPlatePrices[id] = price;
            }
          }
        });
      }
    } catch (_) {
      if (mounted) setState(() => _venueLoading = false);
    }
  }

  int get _guests => int.tryParse(_guestsCtl.text) ?? 0;
  double get _advancePaid => double.tryParse(_advanceCtl.text) ?? 0;

  Map<String, dynamic>? get _selectedPkg {
    final venue = _venue;
    if (venue == null) return null;
    for (final pkg in venue.cateringPackages) {
      if (pkg['id']?.toString() == _selectedPkgId) return pkg as Map<String, dynamic>;
    }
    return null;
  }

  double get _selectedPkgPrice => _customPlatePrices[_selectedPkgId] ?? (_selectedPkg?['perPlatePrice']?.toDouble() ?? 0);
  double get _cateringCost => _selectedPkgPrice * _guests;
  double get _utilitiesCost => (_includeAC ? _customAcCost : 0) + (_includeGenerator ? _customGeneratorCost : 0);
  double get _addonsCost {
    final pricing = _venue?.pricing ?? VenuePricing();
    return (_includeDecor && pricing.decorAvailable ? _customDecorPrice : 0) +
           (_includeSound && pricing.soundAvailable ? _customSoundPrice : 0) +
           (_includeSecurity && pricing.securityAvailable ? _customSecurityPrice : 0);
  }
  double get _grandTotal => _customHallRent + _cateringCost + _utilitiesCost + _addonsCost;
  double get _remainingBalance => (_grandTotal - _advancePaid).clamp(0, _grandTotal);

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_nameCtl.text.trim().isEmpty || _contactCtl.text.trim().isEmpty || _eventDateCtl.text.isEmpty) {
      _showSnack('Fill in Client Name, Contact, and Event Date');
      return;
    }

    if (_venue?.blockedDates.contains(_eventDateCtl.text) ?? false) {
      _showSnack('Date $_eventDateCtl.text is already locked for another booking!');
      return;
    }

    setState(() => _isSaving = true);
    final bookingId = 'BK-${DateTime.now().millisecondsSinceEpoch % 10000}';

    final payload = <String, dynamic>{
      'id': bookingId,
      'targetVenueId': widget.venueId,
      'customer': {
        'name': _nameCtl.text.trim(),
        'contact': _contactCtl.text.trim(),
        'otherName': _otherNameCtl.text.trim(),
        'address': _addressCtl.text.trim(),
      },
      'eventDetails': {
        'category': _eventCategory == 'Other' ? (_customCategory.trim().isEmpty ? 'Other' : _customCategory.trim()) : _eventCategory,
        'date': _eventDateCtl.text,
        'timing': _eventTiming,
        'guests': _guests,
        'venueId': widget.venueId,
        'source': 'Walk-in ERP',
      },
      'catering': {
        'packageId': _selectedPkgId,
        'packageName': _selectedPkg?['name'] ?? 'N/A',
        'perPlatePrice': _selectedPkgPrice,
        'dishes': _selectedPkg?['dishes'] ?? [],
      },
      'addons': {
        'ac': _includeAC,
        'generator': _includeGenerator,
        'addonsCost': _addonsCost,
        'decor': _includeDecor,
        'sound': _includeSound,
        'security': _includeSecurity,
      },
      'financials': {
        'hallRent': _customHallRent,
        'cateringCost': _cateringCost,
        'utilitiesCost': _utilitiesCost,
        'addonsCost': _addonsCost,
        'taxPercentage': 0,
        'taxCost': 0,
        'grandTotal': _grandTotal,
        'advancePaid': _advancePaid,
        'remainingBalance': _remainingBalance,
      },
      'status': 'Confirmed',
      'bookingSource': 'walk-in',
      'bookedDate': DateTime.now().toIso8601String().substring(0, 10),
    };

    try {
      final docId = await BookingsService.submitWalkInBooking(widget.venueId, payload);
      try {
        await FirebaseFirestore.instance.collection('venues').doc(widget.venueId).update({
          'blockedDates': FieldValue.arrayUnion([_eventDateCtl.text]),
        });
      } catch (_) {}
      setState(() {
        _createdReceipt = {...payload, 'firestoreDocId': docId};
        _isSaving = false;
      });
      _showSnack('Walk-in Booking Registered & Date Locked!');
    } catch (e) {
      _showSnack('Save failed: $e');
      setState(() => _isSaving = false);
    }
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    if (_createdReceipt != null) return _ReceiptModal(receipt: _createdReceipt!, onClose: () => setState(() => _createdReceipt = null));
    if (_venueLoading) return const LoadingView();

    final pricing = _venue?.pricing ?? VenuePricing();
    final packages = _venue?.cateringPackages ?? [];
    final blockedDates = _venue?.blockedDates ?? <String>[];
    final dateBlocked = _eventDateCtl.text.isNotEmpty && blockedDates.contains(_eventDateCtl.text);

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 80),
        children: [
          Text('On-site Booking Registration', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
          const SizedBox(height: 20),
          _sectionCard('1. Customer Identification', Icons.badge, [
            _buildTextField(_nameCtl, 'Full Name *'),
            _buildTextField(_contactCtl, 'Contact Number *', keyboardType: TextInputType.phone),
            _buildTextField(_otherNameCtl, 'Bride / Groom / Secondary Contact'),
            _buildTextField(_addressCtl, 'Permanent Home Address'),
          ]),
          const SizedBox(height: 12),
          _sectionCard('2. Event Scheduling & Capacity', Icons.calendar_month, [
            TextFormField(
              controller: _eventDateCtl,
              decoration: InputDecoration(
                labelText: 'Event Date *',
                suffixIcon: const Icon(Icons.calendar_today, size: 18),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                errorText: dateBlocked ? 'Already Booked!' : null,
              ),
              readOnly: true,
              onTap: () async {
                final picked = await showDatePicker(context: context, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
                if (picked != null) _eventDateCtl.text = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
              },
            ),
            const SizedBox(height: 12),
            Text('Event Timing *', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted)),
            const SizedBox(height: 6),
            Row(children: [
              Expanded(child: _timingButton('Morning', '1PM - 4PM', 'Morning (1:00 PM - 4:00 PM)')),
              const SizedBox(width: 8),
              Expanded(child: _timingButton('Evening', '7PM - 10PM', 'Evening (7:00 PM - 10:00 PM)')),
            ]),
            const SizedBox(height: 12),
            _buildTextField(_guestsCtl, 'Total Guests *', keyboardType: TextInputType.number),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _eventCategory,
              decoration: InputDecoration(labelText: 'Event Category *', border: OutlineInputBorder(borderRadius: BorderRadius.circular(14))),
              items: ['Mehndi', 'Barat', 'Walima', 'Party', 'Bdy', 'Corporate Event', 'Other'].map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setState(() => _eventCategory = v ?? 'Barat'),
            ),
            if (_eventCategory == 'Other')
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: _buildTextField(TextEditingController(text: _customCategory), 'Specify Event Type', onChanged: (v) => _customCategory = v),
              ),
          ]),
          const SizedBox(height: 12),
          _sectionCard('3. Catering Package', Icons.restaurant_menu, [
            if (packages.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('No catering packages configured.', style: TextStyle(color: AppColors.muted)),
              )
            else
              ...packages.map((pkg) {
                final pkgMap = pkg as Map<String, dynamic>;
                final id = pkgMap['id']?.toString() ?? '';
                final isSelected = _selectedPkgId == id;
                return GestureDetector(
                  onTap: () => setState(() => _selectedPkgId = id),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary.withValues(alpha: .05) : Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: isSelected ? AppColors.primary : AppColors.border, width: isSelected ? 2 : 1),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(child: Text(pkgMap['name']?.toString() ?? '', style: TextStyle(fontWeight: FontWeight.w800, color: isSelected ? AppColors.primary : null))),
                        Icon(isSelected ? Icons.radio_button_checked : Icons.radio_button_off, color: isSelected ? AppColors.primary : AppColors.muted, size: 20),
                      ]),
                      const SizedBox(height: 4),
                      Text(pkgMap['type']?.toString() ?? '', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                      const SizedBox(height: 8),
                      Wrap(spacing: 4, runSpacing: 4, children: (pkgMap['dishes'] as List? ?? []).map((d) => Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)), child: Text(d.toString(), style: const TextStyle(fontSize: 10)))).toList()),
                      const SizedBox(height: 8),
                      Row(children: [
                        const Text('Per Plate: ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        SizedBox(
                          width: 70,
                          child: TextField(
                            controller: TextEditingController(text: (_customPlatePrices[id] ?? pkgMap['perPlatePrice']?.toDouble() ?? 0).toStringAsFixed(0)),
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 6, vertical: 6)),
                            onChanged: (v) => setState(() => _customPlatePrices[id] = double.tryParse(v) ?? 0),
                          ),
                        ),
                      ]),
                    ]),
                  ),
                );
              }),
          ]),
          const SizedBox(height: 12),
          _sectionCard('4. Operations & Logistics', Icons.electric_bolt, [
            _toggleRow('Air Conditioning (AC)', _includeAC, (v) => setState(() => _includeAC = v), _customAcCost, (v) => _customAcCost = v),
            _toggleRow('Backup Generator', _includeGenerator, (v) => setState(() => _includeGenerator = v), _customGeneratorCost, (v) => _customGeneratorCost = v),
            if (pricing.decorAvailable) _toggleRow('Decor Package', _includeDecor, (v) => setState(() => _includeDecor = v), _customDecorPrice, (v) => _customDecorPrice = v),
            if (pricing.soundAvailable) _toggleRow('Sound & DJ', _includeSound, (v) => setState(() => _includeSound = v), _customSoundPrice, (v) => _customSoundPrice = v),
            if (pricing.securityAvailable) _toggleRow('Valet & Security', _includeSecurity, (v) => setState(() => _includeSecurity = v), _customSecurityPrice, (v) => _customSecurityPrice = v),
          ]),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: .05),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.primary.withValues(alpha: .2)),
            ),
            child: Column(children: [
              Text('Invoice Calculator', style: TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary)),
              const SizedBox(height: 12),
              _calcRow('Hall Rent', _customHallRent, (v) => _customHallRent = v),
              _calcRow('Catering (${_selectedPkg?['name'] ?? 'None'})', _cateringCost, null),
              if (_utilitiesCost > 0) _calcRow('Utilities', _utilitiesCost, null),
              if (_addonsCost > 0) _calcRow('Add-ons', _addonsCost, null),
              const Divider(height: 20),
              _calcTotal('Grand Total', _grandTotal),
              const SizedBox(height: 8),
              TextField(
                controller: _advanceCtl,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: 'Advance Payment (Rs.)', border: OutlineInputBorder(borderRadius: BorderRadius.circular(14))),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 8),
              _calcTotal('Remaining Balance', _remainingBalance, color: Colors.red),
            ]),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _isSaving ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              icon: _isSaving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.assignment_turned_in),
              label: Text(_isSaving ? 'Saving...' : 'Confirm & Lock Booking', style: const TextStyle(fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionCard(String title, IconData icon, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.muted)),
        ]),
        const SizedBox(height: 12),
        ...children,
      ]),
    );
  }

  Widget _buildTextField(TextEditingController ctl, String label, {TextInputType? keyboardType, ValueChanged<String>? onChanged}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: ctl,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
        onChanged: onChanged,
      ),
    );
  }

  Widget _timingButton(String label, String sub, String value) {
    final selected = _eventTiming == value;
    return GestureDetector(
      onTap: () => setState(() => _eventTiming = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary.withValues(alpha: .1) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: selected ? 2 : 1),
        ),
        child: Column(children: [
          Text(label, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: selected ? AppColors.primary : null)),
          Text(sub, style: TextStyle(fontSize: 10, color: AppColors.muted)),
        ]),
      ),
    );
  }

  Widget _toggleRow(String label, bool value, ValueChanged<bool> onChanged, double price, ValueChanged<double> onPriceChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(children: [
        SizedBox(
          width: 70,
          child: TextField(
            controller: TextEditingController(text: price.toStringAsFixed(0)),
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 6, vertical: 4)),
            onChanged: (v) => onPriceChanged(double.tryParse(v) ?? 0),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
        Switch(value: value, onChanged: onChanged),
      ]),
    );
  }

  Widget _calcRow(String label, double value, ValueChanged<double>? onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(children: [
        Expanded(child: Text(label, style: const TextStyle(fontSize: 12))),
        if (onChanged != null)
          SizedBox(
            width: 80,
            child: TextField(
              controller: TextEditingController(text: value.toStringAsFixed(0)),
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 6, vertical: 4)),
              onChanged: (v) => onChanged(double.tryParse(v) ?? 0),
            ),
          )
        else
          Text(formatMoney(value), style: const TextStyle(fontWeight: FontWeight.w800)),
      ]),
    );
  }

  Widget _calcTotal(String label, double value, {Color? color}) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: TextStyle(fontWeight: FontWeight.w900, color: color ?? Colors.black87, fontSize: 14)),
      Text(formatMoney(value), style: TextStyle(fontWeight: FontWeight.w900, color: color ?? AppColors.primary, fontSize: 16)),
    ]);
  }
}

class _ReceiptModal extends StatelessWidget {
  final Map<String, dynamic> receipt;
  final VoidCallback onClose;
  const _ReceiptModal({required this.receipt, required this.onClose});

  @override
  Widget build(BuildContext context) {
    final customer = receipt['customer'] is Map ? receipt['customer'] as Map<String, dynamic> : <String, dynamic>{};
    final eventDetails = receipt['eventDetails'] is Map ? receipt['eventDetails'] as Map<String, dynamic> : <String, dynamic>{};
    final financials = receipt['financials'] is Map ? receipt['financials'] as Map<String, dynamic> : <String, dynamic>{};

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(18),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(32)),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.task_alt, size: 56, color: Colors.green.shade600),
            const SizedBox(height: 8),
            const Text('Booking Registered!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
            Text('Walk-in Enrollment Invoice', style: TextStyle(fontSize: 11, color: AppColors.muted, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            _receiptRow('Booking ID', receipt['id']?.toString() ?? ''),
            _receiptRow('Client Name', customer['name']?.toString() ?? ''),
            _receiptRow('Contact', customer['contact']?.toString() ?? ''),
            if ((customer['otherName'] ?? '').toString().isNotEmpty) _receiptRow('Event Name', customer['otherName'].toString()),
            const Divider(height: 20),
            _receiptRow('Event Date', eventDetails['date']?.toString() ?? ''),
            _receiptRow('Category', eventDetails['category']?.toString() ?? ''),
            _receiptRow('Guests', '${eventDetails['guests'] ?? ''} PAX'),
            const Divider(height: 20),
            _receiptRow('Hall Rent', formatMoney(financials['hallRent'])),
            _receiptRow('Catering', formatMoney(financials['cateringCost'])),
            if ((financials['utilitiesCost'] ?? 0) > 0) _receiptRow('Utilities', formatMoney(financials['utilitiesCost'])),
            if ((financials['addonsCost'] ?? 0) > 0) _receiptRow('Add-ons', formatMoney(financials['addonsCost'])),
            const Divider(height: 20),
            _receiptRow('Grand Total', formatMoney(financials['grandTotal']), bold: true),
            _receiptRow('Advance Paid', formatMoney(financials['advancePaid']), color: Colors.green),
            _receiptRow('Remaining', formatMoney(financials['remainingBalance']), color: Colors.red, bold: true),
            const SizedBox(height: 20),
            Row(children: [
              Expanded(child: OutlinedButton(onPressed: onClose, child: const Text('Finish')),),
            ]),
          ]),
        ),
      ),
    );
  }

  Widget _receiptRow(String label, String value, {bool bold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: TextStyle(fontSize: 12, color: AppColors.muted)),
        Text(value, style: TextStyle(fontWeight: bold ? FontWeight.w900 : FontWeight.w700, fontSize: 13, color: color)),
      ]),
    );
  }
}
