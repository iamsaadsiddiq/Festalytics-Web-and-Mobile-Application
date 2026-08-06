import 'package:flutter/material.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/signup_screen.dart';
import '../../features/auth/verify_email_screen.dart';
import '../../features/public/landing_screen.dart';
import '../../features/public/about_screen.dart';
import '../../features/public/services_screen.dart';
import '../../features/venues/all_venues_screen.dart';
import '../../features/venues/venue_details_screen.dart';
import '../../features/venues/service_discovery_screen.dart';
import '../../features/ai/ai_planner_screen.dart';
import '../../features/ai/find_decor_screen.dart';
import '../../features/ai/ai_call_screen.dart';
import '../../features/user/user_dashboard_screen.dart';
import '../../features/events/create_event_screen.dart';
import '../../features/events/manage_event_screen.dart';
import '../../features/events/my_events_screen.dart';
import '../../features/vendor/vendor_shell.dart';
import '../../features/vendor/vendor_dashboard_screen.dart';
import '../../features/vendor/vendor_bookings_screen.dart';
import '../../features/vendor/vendor_services_screen.dart';
import '../../features/vendor/vendor_analytics_screen.dart';
import '../../features/vendor/vendor_availability_screen.dart';
import '../../features/vendor/vendor_inventory_screen.dart';
import '../../features/vendor/add_inventory_screen.dart';
import '../../features/borrow/borrow_hub_screen.dart';
import '../../features/messages/messages_screen.dart';
import '../../features/settings/account_settings_screen.dart';
import '../../features/settings/business_settings_screen.dart';
import '../../features/settings/static_settings_screens.dart';
import '../../web_clone/src/components/ProtectedRoute.dart' as wc;

class AppRoutes {
  static const home = '/';
  static const login = '/login';
  static const signup = '/signup';
  static const verifyEmail = '/verify-email';
  static const about = '/about';
  static const services = '/services';
  static const allVenues = '/all-venues';
  static const venue = '/venue';
  static const serviceDiscovery = '/service-discovery';
  static const aiPlanner = '/ai-planner';
  static const findDecor = '/find-decor';
  static const aiCall = '/ai-call';
  static const userDashboard = '/user-dashboard';
  static const createEvent = '/create-event';
  static const editEvent = '/edit-event';
  static const manageEvent = '/manage-event';
  static const myEvents = '/my-events';
  static const vendorDashboard = '/vendor-dashboard';
  static const vendorAnalytics = '/vendor-dashboard/analytics';
  static const vendorAvailability = '/vendor-dashboard/availability';
  static const vendorBookings = '/vendor-dashboard/bookings';
  static const vendorBorrowHub = '/vendor-dashboard/borrow-hub';
  static const vendorMessages = '/vendor-dashboard/messages';
  static const vendorInventory = '/vendor-dashboard/my-inventory';
  static const vendorAddInventory = '/vendor-dashboard/my-inventory/add';
  static const vendorServices = '/vendor-dashboard/my-services';
  static const vendorServicesCreate = '/vendor-dashboard/my-services/create';
  static const vendorServicesEdit = '/vendor-dashboard/my-services/edit';
  static const settingsAccount = '/vendor-dashboard/settings/account';
  static const settingsBusiness = '/vendor-dashboard/settings/business';
  static const settingsHelp = '/vendor-dashboard/settings/help';
  static const settingsNotifications = '/vendor-dashboard/settings/notifications';
  static const settingsPayments = '/vendor-dashboard/settings/payments';
  static const settingsSecurity = '/vendor-dashboard/settings/security';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    final args = settings.arguments;
    Widget page;
    switch (settings.name) {
      case home:
        page = const LandingScreen();
        break;
      case login:
        page = const LoginScreen();
        break;
      case signup:
        page = const SignupScreen();
        break;
      case verifyEmail:
        page = const VerifyEmailScreen();
        break;
      case about:
        page = const AboutScreen();
        break;
      case services:
        page = const ServicesScreen();
        break;
      case allVenues:
        page = const AllVenuesScreen();
        break;
      case venue:
        page = VenueDetailsScreen(venueId: args.toString());
        break;
      case serviceDiscovery:
        page = const ServiceDiscoveryScreen();
        break;
      case aiPlanner:
        page = const AiPlannerScreen();
        break;
      case findDecor:
        page = const FindDecorScreen();
        break;
      case aiCall:
        final callArgs = args as Map<String, dynamic>? ?? {};
        page = CallStatusScreen(
          bookingId: callArgs['bookingId'] as String? ?? '',
          phoneNumber: callArgs['phoneNumber'] as String?,
          customerName: callArgs['customerName'] as String?,
        );
        break;
      case userDashboard:
        page = const wc.ProtectedRoute(requireUser: true, child: UserDashboardScreen());
        break;
      case createEvent:
        page = const wc.ProtectedRoute(requireUser: true, child: CreateEventScreen());
        break;
      case editEvent:
        page = wc.ProtectedRoute(requireUser: true, child: CreateEventScreen(eventId: args?.toString()));
        break;
      case manageEvent:
        page = wc.ProtectedRoute(requireUser: true, child: ManageEventScreen(eventId: args?.toString() ?? ''));
        break;
      case myEvents:
        page = const wc.ProtectedRoute(requireUser: true, child: MyEventsScreen());
        break;
      case vendorDashboard:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: VendorDashboardScreen()));
        break;
      case vendorAnalytics:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: VendorAnalyticsScreen()));
        break;
      case vendorAvailability:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: VendorAvailabilityScreen()));
        break;
      case vendorBookings:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: VendorBookingsScreen()));
        break;
      case vendorBorrowHub:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: BorrowHubScreen()));
        break;
      case vendorMessages:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: MessagesScreen()));
        break;
      case vendorInventory:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: VendorInventoryScreen()));
        break;
      case vendorAddInventory:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: AddInventoryScreen()));
        break;
      case vendorServices:
      case vendorServicesCreate:
      case vendorServicesEdit:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: VendorServicesScreen()));
        break;
      case settingsAccount:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: AccountSettingsScreen()));
        break;
      case settingsBusiness:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: BusinessSettingsScreen()));
        break;
      case settingsHelp:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: HelpSettingsScreen()));
        break;
      case settingsNotifications:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: NotificationsSettingsScreen()));
        break;
      case settingsPayments:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: PaymentsSettingsScreen()));
        break;
      case settingsSecurity:
        page = const wc.ProtectedRoute(requireVendor: true, child: VendorShell(child: SecuritySettingsScreen()));
        break;
      default:
        page = const LandingScreen();
    }
    return MaterialPageRoute(builder: (_) => page, settings: settings);
  }
}
