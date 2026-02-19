# Loan Origination Demo App

A demo loan-origination / intake web application built on top of the UiPath TypeScript SDK. This application demonstrates integration with UiPath Platform services including Maestro processes, tasks, and BPMN workflow visualization.

## Features

- **OAuth Authentication**: Secure login using UiPath OAuth external app flow
- **Dashboard**: Overview of loan pipeline with KPI cards and process instances table
- **Loan Detail View**: Detailed view of individual loan applications with:
  - BPMN process diagram visualization
  - Loan metadata and current step information
  - List of open tasks for the loan
- **Task Execution**: Embedded iframe for executing UiPath task forms
- **Mock Mode**: Demo mode with mock data for testing without a live UiPath tenant

## Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- UiPath Cloud account with:
  - External App configured for OAuth
  - Maestro processes set up (for real data mode)
  - Tasks configured (for real data mode)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the following variables:
     ```
     VITE_UIPATH_CLIENT_ID=your-client-id
     VITE_UIPATH_ORG_NAME=your-organization
     VITE_UIPATH_TENANT_NAME=your-tenant
     VITE_UIPATH_BASE_URL=https://cloud.uipath.com
     VITE_UIPATH_REDIRECT_URI=http://localhost:5173
     VITE_UIPATH_SCOPE=offline_access OR.Tasks OR.Tasks.Read OR.Tasks.Write OR.Folders OR.Folders.Read
     VITE_MAESTRO_PROCESS_KEY=your-process-key
     VITE_UIPATH_FOLDER_ID=your-folder-id
     VITE_USE_CORS_PROXY=false
     ```

3. **Important - Process Key Configuration:**
   - Set `VITE_MAESTRO_PROCESS_KEY` to the key of your Loan Origination Maestro process
   - This ensures the app only displays loan application instances from the correct process
   - You can find the process key in UiPath Cloud under Maestro → Processes
   - If not set, the app will show ALL process instances (not recommended for production)

4. **Important - Folder ID Configuration:**
   - Set `VITE_UIPATH_FOLDER_ID` to the folder ID where your loan process instances are located
   - This is required for:
     - Fetching process instances and their details
     - Retrieving BPMN diagrams
     - Loading tasks associated with process instances
   - You can find the folder ID in UiPath Cloud under Admin → Folders
   - If not set, the app will use 'default' as a fallback (may cause errors in production)

5. For mock mode (no UiPath connection required):
   ```
   VITE_MOCK_MODE=true
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Configuration

### OAuth Setup

1. Create an External App in UiPath Cloud:
   - Go to Admin → External Applications
   - Create a new non-confidential external app
   - Note the Client ID
   - Configure redirect URI: `http://localhost:5173` (or your production URL)
   - **Required Scopes**: 
     - `offline_access` - For token refresh
     - `OR.Tasks` - For accessing tasks
     - `OR.Tasks.Read` - For reading task data
     - `OR.Tasks.Write` - For completing/updating tasks
     - `OR.Folders` and `OR.Folders.Read` - For accessing folder-scoped resources (required for Maestro process instances)
     - **Maestro API scopes** - For accessing Maestro process instances (these may be automatically included or need to be explicitly added depending on your UiPath version)
     - **Note**: In UiPath Cloud Admin, you may see these as "Tasks", "Tasks.Read", "Tasks.Write", "Folders", and "Folders.Read" under Orchestrator scopes
     - **If you get 403 errors**: You may need additional scopes. Check the browser console for the specific API endpoint that's failing and add the corresponding scope

2. Update `.env` with your Client ID and organization details

### CORS Proxy Setup (Local Development)

When developing locally, you may encounter CORS errors when making requests to UiPath APIs. To fix this:

1. **Update `vite.config.ts`**:
   - Open `vite.config.ts`
   - Find the proxy configuration in the `server.proxy` section
   - Replace `/your-org` with your actual organization/tenant path
   - The path should match: `/{orgName}/{tenantName}/*`
   - Example: If your org is `acme-corp` and tenant is `production`, use `/acme-corp/production`

2. **Enable CORS Proxy**:
   - Add to your `.env` file:
     ```
     VITE_USE_CORS_PROXY=true
     ```

3. **Restart your dev server**:
   ```bash
   npm run dev
   ```

4. **How it works**:
   - When `VITE_USE_CORS_PROXY=true` and in development mode, the app uses `window.location.origin` as the base URL
   - Vite's proxy forwards requests from your local server to UiPath Cloud
   - This avoids CORS issues since requests appear to come from the same origin

5. **Disable for production**:
   - Set `VITE_USE_CORS_PROXY=false` or remove it
   - The app will use the direct UiPath Cloud URL

### Mock Mode

Set `VITE_MOCK_MODE=true` in your `.env` file to use mock data instead of real SDK calls. This is useful for:
- UI development without UiPath connection
- Demo purposes
- Testing the application flow

## Application Structure

```
src/
├── components/
│   ├── layout/
│   │   └── Header.tsx          # App header with navigation
│   ├── ui/
│   │   └── KPICard.tsx          # Reusable KPI card component
│   ├── BpmnViewer.tsx           # BPMN diagram viewer
│   ├── Dashboard.tsx            # Main dashboard with KPIs and table
│   ├── LoanDetail.tsx          # Loan detail page
│   ├── LoginScreen.tsx         # OAuth login screen
│   ├── TaskExecution.tsx       # Task iframe view
│   └── TaskList.tsx            # Task list component
├── hooks/
│   └── useAuth.tsx             # Authentication hook
├── services/
│   ├── loanService.ts          # Service for loan/process operations
│   └── mockData.ts             # Mock data for demo mode
├── types/
│   └── loan.ts                 # TypeScript type definitions
├── utils/
│   └── config.ts               # Configuration utilities
├── App.tsx                     # Main app component with routing
└── main.tsx                    # Application entry point
```

## Key Features Implementation

### Authentication

The app uses the UiPath TypeScript SDK's OAuth flow:
- `AuthProvider` manages SDK initialization and authentication state
- `useAuth` hook provides authentication context to components
- Protected routes require authentication

### Dashboard

- **KPI Cards**: Display key metrics (new applications, in review, average time, total volume)
- **Process Instances Table**: Lists all loan applications with:
  - Loan ID, Applicant, Amount, Product Type
  - Status, Current Step, Documents, Last Updated
  - Clickable rows navigate to loan detail

### Loan Detail

- **BPMN Diagram**: Visual representation of the loan process workflow
  - Highlights current step
  - Supports pan/zoom
- **Loan Metadata**: Key loan information and current step details
- **Tasks List**: Open tasks related to the loan with "Open Task" action

### Task Execution

- **iFrame Integration**: Embeds UiPath task forms
- **Refresh Mechanism**: "Close and Refresh" button updates loan status after task completion

## Design System

The application follows UiPath brand guidelines:
- **Primary Color**: UiPath Orange (#FA4616)
- **Typography**: System font stack for clean, readable text
- **Components**: Consistent spacing, shadows, and border radius
- **Accessibility**: WCAG AA compliant color contrast and keyboard navigation

## Troubleshooting

### Authentication Issues

- Verify Client ID, Org Name, and Tenant Name in `.env`
- Ensure redirect URI matches External App configuration
- Check browser console for OAuth errors

### BPMN Not Loading

- Verify process instance has a valid BPMN definition
- Check network tab for API errors
- In mock mode, BPMN is always available

### Tasks Not Appearing

- Ensure tasks are created and assigned to the process instance
- Check folder ID configuration
- In mock mode, tasks are always available

## Development Notes

- The app uses React Query for data fetching and caching
- Mock mode allows development without UiPath connection
- All SDK calls are wrapped in error handling with fallback to mock data
- TypeScript provides type safety throughout

## License

MIT
