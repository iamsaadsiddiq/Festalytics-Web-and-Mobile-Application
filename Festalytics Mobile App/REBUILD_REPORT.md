# Rebuild report

This zip was rebuilt from the uploaded complete web app and partial Flutter app.

- The app starts on the landing page `/`, not the vendor dashboard.
- Login first asks User or Vendor.
- Signup supports User and Vendor.
- Role mismatch is blocked using `users/{uid}.role` from Firestore.
- User-only modules are guarded and cannot be used without login.
- Vendor-only modules are guarded and cannot be used without vendor login.
- The uploaded backend folder is included at project root as `backend/`.
- The mobile app still has to call the backend through HTTP because Flutter cannot execute a Python FastAPI folder directly inside the app process.
- Web source files are mirrored as Dart paths and the original web source reference is included in `web_source_reference/`.

Run details are in `RUN_FLOW.md`.
