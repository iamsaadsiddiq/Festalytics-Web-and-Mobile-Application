# Auth Flow Fix Report

This build fixes the startup/auth flow to match the web app more closely.

## Fixed

- App startup now opens the public landing page instead of automatically routing an existing Firebase session into a dashboard.
- Login screen now starts with explicit role selection: **Log in as Vendor** or **Log in as User**.
- Cross-role login is blocked using the Firestore `users/{uid}.role` value.
- Vendor signup now stores `pendingVendorOnboarding` and sends the user to email verification before creating/linking the venue, matching the web flow.
- Email verification screen now creates/links the vendor venue from `pendingVendorOnboarding` after Firebase email verification.
- User signup routes to user dashboard after account creation, like the web flow.

## Important

If the device already has a Firebase session, the landing page still opens first. The dashboard is reached only after pressing login and completing the selected role flow, or by navigating from an already-authenticated protected action.
