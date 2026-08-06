import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/quotation.dart';
import '../services/quotations_service.dart';

class QuotationProvider extends ChangeNotifier {
  List<Quotation> _quotations = [];
  bool _isLoading = false;
  String? _error;
  StreamSubscription? _subscription;

  List<Quotation> get quotations => _quotations;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void subscribeToIncomingQuotations(String vendorSlug) {
    _subscription?.cancel();
    if (vendorSlug.isEmpty) return;

    _isLoading = true;
    notifyListeners();

    _subscription = QuotationsService.listenToIncomingQuotations(
      vendorSlug,
      (quotations) {
        _quotations = quotations;
        _isLoading = false;
        notifyListeners();
      },
      onError: (e) {
        _error = e.toString();
        _isLoading = false;
        notifyListeners();
      },
    );
  }

  Future<String?> submitQuotation(Map<String, dynamic> payload) async {
    try {
      final id = await QuotationsService.submitCustomerQuotation(payload);
      return id;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
