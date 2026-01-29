# Loan Origination Demo App – Requirements

## 1. Overview

This document describes the functional and technical requirements for a demo loan-origination / intake web application built on top of the UiPath TypeScript SDK.

The app is targeted at case workers handling loan applications. It is intentionally simple but demonstrates:

- Authentication using OAuth external app (via UiPath TypeScript SDK).
- Integration with Maestro processes (loan applications), tasks, entities, buckets, and other UiPath platform objects.
- Visualization of a loan’s BPMN workflow.
- Embedding of task forms in an iframe for execution.
- Brand-compliant UI using design primitives from the `context/` folder.

The deliverable is a working front-end (SPA) that can run against a UiPath test tenant, with mock/simulated data where back-end capabilities are not yet wired.

---

## 2. Goals and Non-Goals

### 2.1 Goals

- Demonstrate end-to-end flow:
  1. Login (OAuth external app).
  2. View dashboard of loan applications (Maestro process instances).
  3. Drill into a specific loan to view process diagram and metadata.
  4. View and execute open tasks for that loan in an iframe.
  5. Return to loan detail and observe updated status.

- Showcase UiPath TypeScript SDK usage for:
  - Authentication.
  - Maestro processes (list process instances, retrieve BPMN).
  - Tasks (list and open tasks for a process instance).
  - Optionally: entities/buckets to show auxiliary metadata.

- Provide a clean, modern UI consistent with brand guidelines from `context/`.

### 2.2 Non-Goals

- No real loan underwriting logic or rules engine.
- No back-office configuration UI (e.g., building / editing Maestro processes).
- No multi-tenant or role-based permission model beyond what the SDK / OAuth flow already enforces.
- No offline support.

---

## 3. Technical Stack & Architecture

### 3.1 Front-end

- SPA written in TypeScript.
- Framework: React (or other modern TS-friendly SPA framework; exact choice TBD by implementation team, but must support router, hooks, and functional components).
- State management:
  - Local component state + query library (e.g., React Query) or minimal global store.
  - Clear boundaries between UI components and UiPath SDK integration layer.

### 3.2 UiPath TypeScript SDK Integration

Use the UiPath TypeScript SDK as the primary integration surface:

- Authentication:
  - Implement OAuth external app flow using SDK-provided helpers (e.g., auth client, token manager).
  - Store access tokens securely in memory and/or session storage (not localStorage if avoidable).

- Maestro:
  - Use SDK to:
    - List process instances representing loan applications.
    - Retrieve process instance metadata (status, current step, timestamps).
    - Retrieve BPMN diagram for a given process instance (via `getBpmn()`-style API).

- Tasks:
  - Use SDK types for Tasks.
  - Fetch tasks associated with a specific Maestro process instance.
  - Use task metadata to obtain URL for the iframe-based task form.

- Entities and Buckets (optional but preferred):
  - If available, use entities/buckets to simulate or store:
    - Additional loan metadata (e.g., applicant name, loan product type).
    - Configuration values (e.g., KPI thresholds).

All direct calls to UiPath APIs should be encapsulated in a dedicated `uipathClient` or `services` module to keep UI components decoupled from SDK specifics.

---

## 4. Brand and Design Requirements

- Follow brand tokens, typography, colors, and spacing from resources in `context/`.
  - Import design tokens (e.g., colors, fonts, spacing scale) from `context/` and use them consistently.
- Layout:
  - Desktop-first responsive design; must render reasonably on tablet widths.
  - Max-width container for main content; centered layout on large screens.
- Components:
  - Reusable UI components for:
    - KPI card.
    - Data table.
    - Page header / breadcrumb.
    - Button / primary actions.
- Accessibility:
  - Semantic HTML for headings, tables, and buttons.
  - Keyboard-focus-visible on interactive elements.
  - Sufficient color contrast per brand constraints.

---

## 5. User Flows and Screens

### 5.1 Login Screen (OAuth External App)

**Purpose:** Authenticate user via UiPath OAuth external app and initialize SDK client.

#### 5.1.1 Requirements

- On first visit:
  - Display branded login page with:
    - Product name (e.g., “Loan Origination Workspace”).
    - Short description (1–2 lines).
    - Primary “Sign in with UiPath” button.

- When user clicks “Sign in with UiPath”:
  - Trigger OAuth external app flow using the UiPath TypeScript SDK:
    - Redirect to UiPath authorization URL.
    - Handle redirect/callback route.
    - Exchange authorization code for tokens.
    - Store tokens in a suitable client-side mechanism.
  - After successful login:
    - Route user to the main dashboard.

- Error handling:
  - Display error message in case of OAuth failure:
    - Token exchange failure.
    - Redirect errors.
  - Provide a “Try again” action.

- Logged-in state:
  - Main app routes (dashboard, loan detail) must be behind an auth guard.
  - If no valid token is found, redirect to login.

---

### 5.2 Main Dashboard Screen

**Purpose:** Provide at-a-glance overview of loan pipeline and list of loan applications (Maestro process instances).

#### 5.2.1 Layout

- Page header:
  - Title: “Dashboard”.
  - Optional subtitle: “Loan intake overview”.
  - Right-aligned user menu showing logged-in user + logout.

- KPIs row (top):
  - Horizontally laid-out set of KPI cards (3–4 cards).
  - Cards use reusable “KPI card” component.

- Process instances table (below KPIs):
  - Full-width table listing Maestro process instances representing loan applications.

#### 5.2.2 KPIs

Use mock data for initial implementation; later wire to SDK if desired.

Example KPI cards (configurable):

1. “New Applications (Today)”
2. “Applications In Review”
3. “Average Time to Decision (Last 7 Days)”
4. “Total Loan Volume (This Month)”

Each KPI card:

- Displays a label and numeric value.
- Optionally shows:
  - Trend indicator (up/down).
  - Secondary text (e.g., “vs last week”).

KPIs should be computed from mock data in the front-end (initially) and structured so they can later be fed by real metrics from UiPath entities/buckets/analytics.

#### 5.2.3 Process Instances Table

The table represents loan applications. Each row corresponds to a Maestro process instance.

Columns (minimum):

- Loan ID / Application ID:
  - Identifier (e.g., process instance ID or human-friendly ID).
- Applicant:
  - Mock applicant name (from mock metadata; may be stored as entity/bucket attributes).
- Loan Amount:
  - Mock numeric value (e.g., `$120,000`).
- Product Type:
  - e.g., “Home Mortgage”, “Auto Loan”, “Small Business”.
- Status:
  - Values derived from Maestro process instance status (e.g., “New”, “In Review”, “Pending Docs”, “Approved”, “Rejected”).
- Current Step:
  - Name of the workflow step / activity the process is currently at.
- Documents Submitted:
  - e.g., “3 / 5” or simple yes/no indicator.
- Last Updated:
  - Timestamp from process instance metadata.

Behavior:

- Table must support:
  - Sorting by at least Loan Amount, Status, Last Updated.
  - Basic search or filter (e.g., by applicant name or status).
- On row click:
  - Navigate to the Loan Detail page for that specific process instance.
  - Route pattern (example): `/loans/:processInstanceId`.

Data sourcing:

- Integrate with UiPath SDK to list Maestro process instances:
  - Map instance metadata to the above columns.
  - Augment with mock fields (applicant name, loan amount, documents submitted) in code if not directly available from the instance.
- Handle loading and error states:
  - Show loading indicator while fetching.
  - Show error message and retry on failure.

---

### 5.3 Loan Detail Screen

**Purpose:** Display a single loan application (Maestro process instance) with its BPMN diagram, metadata, and related tasks.

Route example: `/loans/:processInstanceId`

#### 5.3.1 Layout

- Page header:
  - Breadcrumb: Dashboard > Loan [Loan ID].
  - Title: “Loan [Loan ID] – [Applicant Name]”.
  - Secondary actions (optional):
    - “Refresh status”.
    - “Back to dashboard”.

- Main content layout:
  - Upper section: Process diagram (BPMN) visualization.
  - Lower section:
    - Left: Loan metadata and current step details.
    - Right or bottom: List of open tasks for this process instance.

#### 5.3.2 Process Diagram (BPMN)

- Use the `getBpmn()`-style method from the Maestro process instance via UiPath SDK to retrieve BPMN definition.
  - Format of response may be XML or JSON; implementation must parse accordingly.
- Render the BPMN diagram using a suitable BPMN rendering library.
- Requirements:
  - Diagram should fit within a scrollable container with a fixed height.
  - Highlight the current step/activity (if possible based on data).
  - Provide pan/zoom controls or at least basic zoom.

Error handling:

- If the BPMN cannot be loaded:
  - Display a message (“Unable to load process diagram”) and a retry button.
  - Do not block the rest of the page.

#### 5.3.3 Loan Metadata and Current Step Details

Display key details in a structured layout (cards or definition list):

- Loan metadata (top-level):
  - Loan ID / Application ID.
  - Applicant name (mock or retrieved from entities).
  - Loan amount.
  - Product type.
  - Submission date.
  - Current overall status (e.g., “In Review”).
- Current step information:
  - Name of the current activity / step in the BPMN.
  - Step status (e.g., “Waiting for documents”, “In progress”).
  - Any relevant deadlines / SLA if available (optional).

Data source:

- Use UiPath SDK to retrieve:
  - Process instance details/status.
  - Any associated entity data (optional).

#### 5.3.4 Tasks Section

This section lists open tasks that are related to the specific Maestro process instance.

Requirements:

- Fetch tasks:
  - Use UiPath SDK method(s) to retrieve tasks scoped to the process instance.
  - Determine mapping from process instance ID to task query (e.g., by process reference or correlation information).
- Display task table or list with columns:
  - Task name.
  - Type/form name (if available).
  - Status (e.g., “Open”, “In progress”, “Completed”).
  - Assignee (or “Unassigned”).
  - Created / due dates.
- For each open task:
  - Provide a primary action button “Open Task”.
  - Clicking the button transitions to an iframe view (see 5.4).

Behavior:

- If no open tasks:
  - Display “No open tasks for this loan.”
- Ensure tasks can be refetched (manual refresh button) after a task completion.

---

### 5.4 Task Execution in iFrame

**Purpose:** Allow case workers to interact with UiPath-hosted task forms directly inside the app.

#### 5.4.1 General Behavior

- When user clicks “Open Task” from the Loan Detail page:
  - Retrieve the task’s URL from the Task object via UiPath SDK (e.g., `task.formUrl` or equivalent).
  - Display a modal or route-level view that contains an iframe pointing to this URL.

- UI options:
  - Preferred: Full-screen overlay/modal with:
    - Header: Task name and loan identifier.
    - Close / “Back to loan” button.
    - Body: iframe that fills remaining space.
  - Alternative: Dedicated route `/loans/:processInstanceId/tasks/:taskId` with full-page iframe.

#### 5.4.2 iFrame Requirements

- The iframe must:
  - Use the task URL from UiPath.
  - Fill the available width and height of its container.
  - Be resizable with the viewport.

- Interaction:
  - User performs all task actions (fill form, attach docs, submit) inside the iframe.
  - On successful completion:
    - UiPath task backend updates the task status and potentially advances the process instance.

Because the app cannot reliably detect completion from within the iframe content alone (unless the SDK provides a postMessage or callback mechanism):

- The client should:
  - Provide a “Close and refresh” button that:
    - Closes the iframe view.
    - Triggers a refresh of:
      - Task list for this process instance.
      - Process instance metadata (status, current step).

Optional enhancement:

- If the task endpoint supports success redirect URLs:
  - Configure redirect back to the host app route as part of the task URL, and on load of that route, trigger refresh.

#### 5.4.3 Closing and Returning

- Closing behavior:
  - On “Close”:
    - Navigate back to the Loan Detail page (if route-based).
    - Or hide the task-modal and show the underlying Loan Detail view (if modal-based).
  - After close:
    - Automatically refresh the process instance and tasks.
    - Visual feedback:
      - Show updated status/current step if progression occurred.
      - Show completed task moved out of “Open” list or marked as completed.

---

## 6. Navigation & Routing

- Route structure (example):

  - `/login` – login screen.
  - `/dashboard` – main dashboard.
  - `/loans/:processInstanceId` – loan detail.
  - `/loans/:processInstanceId/tasks/:taskId` – optional dedicated task iframe route.

- Auth guard:
  - Routes under `/dashboard` and `/loans/*` require authenticated user.
  - If token missing/expired, redirect to `/login` with optional return URL.

- Global navigation:
  - Basic layout with top bar containing:
    - App title / logo.
    - User info.
    - Logout button.

---

## 7. Error Handling, Loading States, and UX

- Each data-fetching view (dashboard, loan detail, tasks) must handle:
  - Loading:
    - Show skeletons or spinners in context (cards, tables).
  - Error:
    - Show human-readable message.
    - Provide “Retry” action.
- Global errors:
  - If authentication error (token expired, invalid):
    - Clear auth state and redirect to login.
- Empty states:
  - Dashboard: If no process instances exist, show an empty state message and explanation.
  - Loan detail: If loan not found, show “Loan not found” and link back to dashboard.

---

## 8. Security & Compliance

- Do not log sensitive token data to console.
- Use HTTPS for all environments.
- Store auth tokens in a secure manner:
  - Prefer in-memory + refresh token via SDK where possible.
  - If persistent storage is required, document rationale and risks.
- Respect CORS and iframe security requirements:
  - Ensure task URLs can be embedded (X-Frame-Options, CSP). If not, document limitations.

---

## 9. Configuration

- Provide a configuration file or environment variables for:
  - OAuth client ID / client secret (never committed to repo).
  - UiPath tenant / organization details.
  - Base URLs for UiPath endpoints (auth, API, task forms).
- Provide a simple `.env.example` or config template.

---

## 10. Mock Data and Demo Mode

To support running the app without a live UiPath tenant (for pure UI demo):

- Implement a “mock mode” toggle:
  - When enabled, replace UiPath SDK calls with mock services returning static/deterministic data.
- Mock data should include:
  - 10–20 loan applications with varied statuses, loan amounts, applicants.
  - Representative BPMN diagram (static XML/JSON asset).
  - 1–3 open tasks per active loan.

---

## 11. Acceptance Criteria

The app is considered complete when:

1. Authentication:
   - User can log in via OAuth external app using UiPath SDK.
   - Authenticated state persists for the session and protects routes.

2. Dashboard:
   - KPI cards render above a table of Maestro process instances.
   - Table displays required columns and supports basic sort and filter.
   - Clicking a row navigates to loan detail.

3. Loan Detail:
   - Loan metadata and current step are displayed.
   - BPMN diagram for the selected process instance is rendered.
   - Open tasks related to the process instance are listed.

4. Task Execution:
   - Clicking “Open Task” shows a task form in an iframe based on the Task URL.
   - User can close the iframe and see updated process/task state (after refresh).

5. Branding:
   - Typography, spacing, and color usage align with design tokens and patterns from `context/`.
   - UI appears consistent and polished.

6. Robustness:
   - All data operations have clear loading, error, and empty states.
   - Auth and network errors are handled gracefully.

7. Documentation:
   - README / setup instructions describe how to configure OAuth, connect to UiPath, and run in mock mode.
   - Key architectural decisions and important SDK usage patterns are briefly documented.

