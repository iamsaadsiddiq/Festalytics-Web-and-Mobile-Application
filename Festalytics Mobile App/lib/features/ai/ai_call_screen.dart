import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/ai_backend_service.dart';

class CallStatusScreen extends StatefulWidget {
  final String bookingId;
  final String? phoneNumber;
  final String? customerName;
  const CallStatusScreen({super.key, required this.bookingId, this.phoneNumber, this.customerName});
  @override
  State<CallStatusScreen> createState() => _CallStatusScreenState();
}

class _CallStatusScreenState extends State<CallStatusScreen> {
  Map<String, dynamic>? _info;
  String? _error;
  Timer? _poll;
  bool _initiated = false;

  @override
  void initState() {
    super.initState();
    _startCall();
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _startCall() async {
    setState(() => _error = null);
    try {
      await AiBackendService.initiateAiCall(
        bookingId: widget.bookingId,
        phoneNumber: widget.phoneNumber ?? '',
        customerName: widget.customerName,
      );
      _initiated = true;
      _poll = Timer.periodic(const Duration(seconds: 2), (_) => _fetchStatus());
    } catch (e) {
      if (mounted) setState(() => _error = 'Call initiation failed: $e');
    }
  }

  Future<void> _fetchStatus() async {
    try {
      final info = await AiBackendService.getBookingInfo(widget.bookingId);
      if (mounted) {
        setState(() => _info = info);
        final status = (info['status'] ?? '').toString();
        if (status == 'accepted' || status == 'cancelled' || status == 'completed') {
          _poll?.cancel();
        }
      }
    } catch (_) {}
  }

  String _callStage() {
    if (_error != null) return 'Failed';
    if (!_initiated) return 'Initiating';
    final status = (_info?['status'] ?? '').toString();
    if (status == 'accepted') return 'Accepted';
    if (status == 'cancelled') return 'Declined';
    if (status == 'completed') return 'Completed';
    if (status == 'in-progress' || _info?['call_sid'] != null) return 'In Progress';
    if (_info != null) return 'Ringing';
    return 'Initiating';
  }

  @override
  Widget build(BuildContext context) {
    final stage = _callStage();
    final recordingUrl = _info?['call_recording_url'] ?? _info?['public_recording_url'] ?? _info?['recording_url'] as String?;
    final decision = _info?['decision'] as String?;
    return Scaffold(
      appBar: AppBar(title: Text('AI Call: ${widget.bookingId.substring(0, 8)}...')),
      body: ListView(padding: const EdgeInsets.all(24), children: [
        Icon(_iconFor(stage), size: 72, color: _colorFor(stage)),
        const SizedBox(height: 16),
        Text(stage, textAlign: TextAlign.center, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: _colorFor(stage))),
        const SizedBox(height: 8),
        if (_error != null) ...[
          Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.red, fontSize: 13)),
        ] else if (!_initiated) ...[
          const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator())),
        ] else ...[
          Text('Booking: ${widget.bookingId}', textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
          if (widget.customerName != null) Text('Customer: ${widget.customerName}', textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
          if (widget.phoneNumber != null && widget.phoneNumber!.isNotEmpty) Text('Phone: ${widget.phoneNumber}', textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
        ],
        if (stage == 'Initiating' || stage == 'Ringing' || stage == 'In Progress') ...[
          const SizedBox(height: 32),
          const LinearProgressIndicator(),
        ],
        if (decision != null) ...[
          const SizedBox(height: 24),
          const Divider(),
          Text('Decision', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(decision, style: const TextStyle(fontSize: 16)),
          const SizedBox(height: 4),
          Text('Confidence: ${_info?['confidence'] ?? '-'}', style: const TextStyle(color: Colors.grey)),
        ],
        if (recordingUrl != null && recordingUrl.isNotEmpty) ...[
          const SizedBox(height: 24),
          const Divider(),
          Text('Recording', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
            child: SelectableText(recordingUrl, style: const TextStyle(fontSize: 12)),
          ),
        ],
        if (stage == 'Completed' || stage == 'Accepted' || stage == 'Declined') ...[
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.check),
            label: const Text('Done'),
          ),
        ],
      ]),
    );
  }

  IconData _iconFor(String stage) {
    switch (stage) {
      case 'Accepted': return Icons.check_circle;
      case 'Completed': return Icons.check_circle_outline;
      case 'Declined': return Icons.cancel;
      case 'Failed': return Icons.error;
      case 'In Progress': return Icons.call_received;
      case 'Ringing': return Icons.ring_volume;
      default: return Icons.call_made;
    }
  }

  Color _colorFor(String stage) {
    switch (stage) {
      case 'Accepted':
      case 'Completed': return Colors.green;
      case 'Declined':
      case 'Failed': return Colors.red;
      case 'In Progress': return const Color(0xFF8E24AA);
      default: return Colors.orange;
    }
  }
}
