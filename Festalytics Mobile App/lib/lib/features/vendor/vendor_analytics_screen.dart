import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/app_widgets.dart';
import '../../providers/app_auth_provider.dart' as app;
import '../../services/analytics_service.dart';
import '../../web_clone/src/components/vendor/analytics/AnalyticsKPIs.dart';
import '../../web_clone/src/components/vendor/analytics/AnalyticsCharts.dart';
import '../../web_clone/src/components/vendor/analytics/AnalyticsTables.dart';
import 'package:festalytics_app/web_clone/src/lib/google/zaydanCallingSheet.dart';
import 'package:festalytics_app/web_clone/src/lib/google/sheetsAuth.dart';

class VendorAnalyticsScreen extends StatefulWidget {
  const VendorAnalyticsScreen({super.key});
  @override
  State<VendorAnalyticsScreen> createState() => _VendorAnalyticsScreenState();
}

class _VendorAnalyticsScreenState extends State<VendorAnalyticsScreen> {
  bool _sheetsBusy = false;
  String? _sheetsMessage;

  Future<void> _syncToSheets(String venueId) async {
    setState(() { _sheetsBusy = true; _sheetsMessage = null; });
    try {
      if (!SheetsAuth.isConfigured) {
        setState(() => _sheetsMessage = 'Sheets not configured. Set service account credentials in settings.');
        return;
      }
      final token = await SheetsAuth.getAccessToken();
      if (token == null) {
        setState(() => _sheetsMessage = 'Failed to authenticate with Google Sheets.');
        return;
      }
      ZaydanCallingSheet.setToken(token);
      final entry = ZaydanCallingSheetEntry( timestamp: DateTime.now().toIso8601String(), venue: venueId, status: 'Synced', notes: 'Manual sync from vendor analytics');
      final ok = await ZaydanCallingSheet.appendEntry(entry);
      setState(() => _sheetsMessage = ok ? 'Synced successfully!' : 'Sync failed.');
    } catch (e) {
      setState(() => _sheetsMessage = 'Error: $e');
    } finally { setState(() => _sheetsBusy = false); }
  }

  @override
  Widget build(BuildContext context) {
    final venueId = context.watch<app.AppAuthProvider>().currentUser?.venueId ?? '';
    return Scaffold(
      appBar: AppBar(title: const Text('Analytics & Sync')),
      body: venueId.isEmpty
          ? const EmptyState(icon: Icons.analytics_outlined, title: 'No venue', subtitle: 'Venue is not linked.')
          : StreamBuilder<VendorAnalyticsSnapshot>(
              stream: AnalyticsService.streamVendorAnalytics(venueId),
              builder: (_, snap) {
                if (!snap.hasData) return const LoadingView();
                final a = snap.data!;
                return ListView(padding: const EdgeInsets.all(18), children: [
                  const SectionTitle('Analytics KPIs'),
                  AnalyticsKPIs(data: a),
                  const SizedBox(height: 18),
                  const SectionTitle('Status Distribution'),
                  CandyCard(child: AnalyticsCharts(data: a.recentRows)),
                  const SizedBox(height: 18),
                  const SectionTitle('Recent Activity'),
                  CandyCard(child: AnalyticsTables(rows: a.recentRows, type: 'bookings')),
                  const SizedBox(height: 18),
                  const SectionTitle('Google Sheets Sync'),
                  CandyCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Append a sync record to the Zaydan Calling Sheet.', style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                    const SizedBox(height: 12),
                    if (_sheetsMessage != null) Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(_sheetsMessage!, style: TextStyle(color: _sheetsMessage!.contains('success') ? AppColors.success : AppColors.danger, fontWeight: FontWeight.w600))),
                    ElevatedButton.icon(
                      onPressed: _sheetsBusy ? null : () => _syncToSheets(venueId),
                      icon: _sheetsBusy ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.table_chart_outlined),
                      label: Text(_sheetsBusy ? 'Syncing...' : 'Sync to Google Sheets'),
                    ),
                  ])),
                ]);
              },
            ),
    );
  }
}
