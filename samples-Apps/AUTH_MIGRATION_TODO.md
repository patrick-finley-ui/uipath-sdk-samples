# UiPath SDK 1.1 Auth Migration TODO

## Reference Pattern
- Source: `conversationalAgentTest/src/hooks/useAuth.tsx`
- Required behavior:
  - Use imports from `@uipath/uipath-typescript/core`
  - On mount: `isInOAuthCallback()` -> `completeOAuth()` -> `isAuthenticated()`
  - Login: `sdk.initialize()`
  - Logout: clear `sessionStorage` keys and create fresh `UiPath` instance
  - Use `VITE_UIPATH_SCOPES` (with temporary fallback to `VITE_UIPATH_SCOPE`)

## Project Checklist
- [x] `Benefits-Claims-App`: auth hook + app config migrated
- [x] `BlankProCodeAppTemplate`: auth hook + app config migrated
- [x] `Target360`: auth hook + app config migrated
- [x] `invoice-app`: auth hook + app config migrated
- [x] `loan-origination-app`: auth hook migrated, scope config aligned
- [x] `sko-claims-adhoc-case-mgmt`: auth hook migrated, scope config aligned
- [x] `PKPproject`: auth context migrated, logout token cleanup added

## Validation TODO
- [x] Run `npm run build` in `Benefits-Claims-App`
- [x] Run `npm run build` in `BlankProCodeAppTemplate`
- [x] Run `npm run build` in `Target360`
- [x] Run `npm run build` in `invoice-app`
- [x] Run `npm run build` in `loan-origination-app`
- [x] Run `npm run build` in `sko-claims-adhoc-case-mgmt`
- [ ] `PKPproject`: no `package.json` in project root, build command not available

## Runtime Auth Smoke Test TODO (per project)
- [ ] Start app with `npm run dev`
- [ ] Click login and verify redirect to UiPath
- [ ] Verify callback returns to app and auth state becomes authenticated
- [ ] Click logout and verify a new login is required
