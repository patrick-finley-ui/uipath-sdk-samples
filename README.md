# UiPath SDK Sample Apps

This repository contains a collection of existing sample applications for Solutions Engineers building pro-code apps with the UiPath SDK.

## Structure

Each sample is a standalone project under the `samples/` folder.  
Open any sample folder and read its local `README.md` (if present) for details on setup and usage.

## Samples

- `samples/BlankProCodeAppTemplate` – A minimal starter template for building pro-code apps with the UiPath SDK. Includes React + TypeScript setup with Vite, Tailwind CSS styling, authentication flow with LoginScreen and Header components, and a ready-to-use `useAuth` hook. Perfect for starting new projects from scratch.
- `samples/invoice-app` – Invoice-related sample app copied from `samples/invoice-app`. Showcases an invoice processing dashboard for DoD
- `samples/Benefits-Claims-App` – SNAP benefits application processing app.
- `samples/process-app` – Process app sample copied from SDK

## How SEs should use this repo

1. Browse the `samples/` directory.
2. Pick the sample closest to your use case.
3. Open that folder in your IDE (e.g. Cursor, VS Code).
4. Follow the instructions in the sample's `README.md` or `package.json` scripts to install dependencies and run it.

This repo does not change the internal structure of the sample apps; it simply organizes them in one place.
