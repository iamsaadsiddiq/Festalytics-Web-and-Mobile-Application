import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class GoogleServiceAccount {
  final String type;
  final String projectId;
  final String privateKeyId;
  final String privateKey;
  final String clientEmail;
  final String clientId;
  final String authUri;
  final String tokenUri;
  final String authProviderX509CertUrl;
  final String clientX509CertUrl;

  GoogleServiceAccount({
    this.type = 'service_account',
    required this.projectId,
    required this.privateKeyId,
    required this.privateKey,
    required this.clientEmail,
    required this.clientId,
    this.authUri = 'https://accounts.google.com/o/oauth2/auth',
    this.tokenUri = 'https://oauth2.googleapis.com/token',
    this.authProviderX509CertUrl = 'https://www.googleapis.com/oauth2/v1/certs',
    this.clientX509CertUrl = '',
  });

  factory GoogleServiceAccount.fromJson(Map<String, dynamic> json) =>
      GoogleServiceAccount(
        type: json['type'] ?? 'service_account',
        projectId: json['project_id'] ?? '',
        privateKeyId: json['private_key_id'] ?? '',
        privateKey: json['private_key'] ?? '',
        clientEmail: json['client_email'] ?? '',
        clientId: json['client_id'] ?? '',
        authUri: json['auth_uri'] ?? 'https://accounts.google.com/o/oauth2/auth',
        tokenUri: json['token_uri'] ?? 'https://oauth2.googleapis.com/token',
        authProviderX509CertUrl: json['auth_provider_x509_cert_url'] ??
            'https://www.googleapis.com/oauth2/v1/certs',
        clientX509CertUrl: json['client_x509_cert_url'] ?? '',
      );

  Map<String, dynamic> toJson() => {
    'type': type,
    'project_id': projectId,
    'private_key_id': privateKeyId,
    'private_key': privateKey,
    'client_email': clientEmail,
    'client_id': clientId,
    'auth_uri': authUri,
    'token_uri': tokenUri,
    'auth_provider_x509_cert_url': authProviderX509CertUrl,
    'client_x509_cert_url': clientX509CertUrl,
  };
}

class SheetsAuth {
  static GoogleServiceAccount? _serviceAccount;
  static String? _accessToken;
  static DateTime? _tokenExpiry;

  static const String _scope = 'https://www.googleapis.com/auth/spreadsheets';
  static const String _tokenEndpoint = 'https://oauth2.googleapis.com/token';

  static void configure(GoogleServiceAccount account) {
    _serviceAccount = account;
    _accessToken = null;
    _tokenExpiry = null;
  }

  static GoogleServiceAccount? get serviceAccount => _serviceAccount;
  static String? get accessToken => _accessToken;
  static bool get isConfigured => _serviceAccount != null;

  static bool get isTokenValid =>
      _accessToken != null &&
      _tokenExpiry != null &&
      DateTime.now().isBefore(_tokenExpiry!);

  static String _base64UrlEncode(String data) {
    return base64Url.encode(utf8.encode(data)).replaceAll('=', '');
  }

  static Future<String?> getAccessToken() async {
    if (isTokenValid) return _accessToken;
    if (_serviceAccount == null) return null;

    try {
      final now = DateTime.now();
      final expiry = now.add(const Duration(hours: 1));
      final iat = now.millisecondsSinceEpoch ~/ 1000;
      final exp = expiry.millisecondsSinceEpoch ~/ 1000;

      final jwtHeader = _base64UrlEncode(jsonEncode({
        'alg': 'RS256',
        'typ': 'JWT',
        'kid': _serviceAccount!.privateKeyId,
      }));

      final jwtPayload = _base64UrlEncode(jsonEncode({
        'iss': _serviceAccount!.clientEmail,
        'scope': _scope,
        'aud': _tokenEndpoint,
        'exp': exp,
        'iat': iat,
      }));

      final signatureInput = '$jwtHeader.$jwtPayload';
      final signer = _RSASigner(_serviceAccount!.privateKey);
      final signature = _base64UrlEncode(signer.sign(signatureInput));
      final assertion = '$jwtHeader.$jwtPayload.$signature';

      final response = await http.post(
        Uri.parse(_tokenEndpoint),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          'assertion': assertion,
        },
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        _accessToken = data['access_token'] as String?;
        final expiresIn = (data['expires_in'] as int?) ?? 3600;
        _tokenExpiry = DateTime.now().add(Duration(seconds: expiresIn));
        return _accessToken;
      }
    } catch (_) {}

    return null;
  }

  static Future<void> clearToken() async {
    _accessToken = null;
    _tokenExpiry = null;
  }

  static Map<String, String> get authHeaders {
    final token = _accessToken;
    if (token == null) return {};
    return {'Authorization': 'Bearer $token'};
  }

  static Future<Map<String, dynamic>?> fetchSheet({
    required String spreadsheetId,
    String range = 'Sheet1!A1:Z1000',
  }) async {
    final token = await getAccessToken();
    if (token == null) return null;

    try {
      final url = 'https://sheets.googleapis.com/v4/spreadsheets/$spreadsheetId/values/$range';
      final response = await http.get(
        Uri.parse(url),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      }
    } catch (_) {}

    return null;
  }

  static Future<bool> appendRow({
    required String spreadsheetId,
    required List<dynamic> values,
    String range = 'Sheet1!A:Z',
  }) async {
    final token = await getAccessToken();
    if (token == null) return false;

    try {
      final url = 'https://sheets.googleapis.com/v4/spreadsheets/$spreadsheetId/values/$range:append?valueInputOption=USER_ENTERED';
      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'values': [values],
        }),
      ).timeout(const Duration(seconds: 30));

      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}

class _RSASigner {
  final String privateKey;

  _RSASigner(this.privateKey);

  String sign(String data) {
    try {
      final process = Process.runSync(
        'openssl',
        ['dgst', '-sha256', '-sign', '/dev/stdin'],
        runInShell: true,
      );
      if (process.exitCode == 0) {
        return base64Url.encode(process.stdout as List<int>);
      }
    } catch (_) {}

    final bytes = utf8.encode(data);
    return base64Url.encode(bytes);
  }
}
