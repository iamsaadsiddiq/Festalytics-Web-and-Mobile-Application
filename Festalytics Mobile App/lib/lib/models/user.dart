import 'package:cloud_firestore/cloud_firestore.dart';

class AppUser {
  final String uid;
  final String firstName;
  final String lastName;
  final String fullName;
  final String gender;
  final String mobileNumber;
  final String email;
  final String birthday;
  final String role;
  final String? cnic;
  final String? venueId;
  final String? hallName;
  final bool onboardingComplete;
  final bool isActive;
  final String? authProvider;
  final String? vendorStatus;
  final bool? registrationFeePaid;
  final DateTime? createdAt;

  AppUser({
    required this.uid,
    required this.firstName,
    required this.lastName,
    required this.fullName,
    required this.gender,
    required this.mobileNumber,
    required this.email,
    required this.birthday,
    required this.role,
    this.cnic,
    this.venueId,
    this.hallName,
    this.onboardingComplete = false,
    this.isActive = true,
    this.authProvider,
    this.vendorStatus,
    this.registrationFeePaid,
    this.createdAt,
  });

  factory AppUser.fromFirestore(String uid, Map<String, dynamic> data) {
    DateTime? ts;
    if (data['createdAt'] != null) {
      if (data['createdAt'] is Timestamp) {
        ts = (data['createdAt'] as Timestamp).toDate();
      } else {
        ts = DateTime.tryParse(data['createdAt'].toString());
      }
    }

    return AppUser(
      uid: uid,
      firstName: data['firstName'] ?? '',
      lastName: data['lastName'] ?? '',
      fullName: data['fullName'] ?? '',
      gender: data['gender'] ?? '',
      mobileNumber: data['mobile'] ?? data['mobileNumber'] ?? '',
      email: data['email'] ?? '',
      birthday: data['birthday'] ?? '',
      role: data['role'] ?? 'user',
      cnic: data['cnic'] as String?,
      venueId: data['venueId'] as String?,
      hallName: data['hallName'] as String?,
      onboardingComplete: data['onboardingComplete'] ?? false,
      isActive: data['isActive'] ?? true,
      authProvider: data['authProvider'] as String?,
      vendorStatus: data['vendorStatus'] as String?,
      registrationFeePaid: data['registrationFeePaid'] as bool?,
      createdAt: ts,
    );
  }

  Map<String, dynamic> toFirestore() => {
        'uid': uid,
        'firstName': firstName,
        'lastName': lastName,
        'fullName': fullName,
        'mobile': mobileNumber,
        'email': email,
        'gender': gender,
        'birthday': birthday,
        'role': role,
        'isActive': isActive,
        if (cnic != null) 'cnic': cnic,
        if (venueId != null) 'venueId': venueId,
        if (hallName != null) 'hallName': hallName,
        if (onboardingComplete) 'onboardingComplete': true,
        if (authProvider != null) 'authProvider': authProvider,
        if (vendorStatus != null) 'vendorStatus': vendorStatus,
        if (registrationFeePaid != null) 'registrationFeePaid': registrationFeePaid,
      };

  bool get isVendor => role == 'vendor';
}
