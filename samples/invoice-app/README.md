# Invoice Processing App

A modern Invoice Processing application built with React, TypeScript, and UiPath Data Fabric integration.

## Features

- **Invoice Grid**: Display invoices from UiPath Data Fabric in a beautiful, responsive table
- **Fields Display**: Shows all invoice fields including:
  - Invoice ID, Contract Number, Vendor information
  - Invoice Date, Acceptance Date, Payment Due Date
  - Invoice Total (formatted as currency)
  - Status, Remarks, and Invoice Document references
- **SDK Integration**: Uses UiPath TypeScript SDK to fetch data from Data Fabric
- **Modern UI**: Beautiful gradient design with professional styling
- **Responsive Design**: Works on different screen sizes

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- UiPath Cloud account with Data Fabric access
- Personal Access Token (PAT) from UiPath Cloud

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

### Configuration

Configure the UiPath SDK connection using environment variables:

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your UiPath Cloud credentials:
   - **VITE_UIPATH_BASE_URL**: `https://cloud.uipath.com` (or your custom cloud URL)
   - **VITE_UIPATH_ORG_NAME**: Your UiPath organization name
   - **VITE_UIPATH_TENANT_NAME**: Your tenant name (usually "default")
   - **VITE_UIPATH_CLIENT_ID**: Your OAuth client ID
   - **VITE_UIPATH_REDIRECT_URI**: OAuth redirect URI (default: `http://localhost:5173`)
   - **VITE_UIPATH_SCOPE**: Required scopes (e.g., `OR.Entities.READ OR.Entities.WRITE`)

3. To create an OAuth client in UiPath:
   - Go to UiPath Cloud → Admin → External Applications
   - Create a new External Application
   - Set type to "Non-confidential"
   - Add the redirect URI
   - Copy the Client ID and add it to your `.env` file

### Running the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
invoice/
├── src/
│   ├── components/
│   │   ├── InvoiceGrid.tsx      # Main invoice grid component
│   │   └── InvoiceGrid.css      # Invoice grid styles
│   ├── App.tsx                   # Main app component with SDK initialization
│   ├── App.css                   # App-level styles
│   ├── main.tsx                  # Application entry point
│   ├── index.css                 # Global styles
│   └── vite-env.d.ts             # Environment variable type definitions
├── index.html                    # HTML template
├── .env.example                  # Example environment variables
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite configuration
```

## How It Works

1. The app reads environment variables from `.env` file on startup
2. It initializes the UiPath SDK with OAuth configuration and automatically starts the OAuth flow

3. It fetches invoice records using the UUID: `9f8f532a-a6ae-f011-8e61-002248862cce` -> DoD Invoices
4. The data is fetched using:
   ```typescript
   const records = await sdk.entities.getRecordsById('entity-uuid', {
     pageSize: 100,
     expansionLevel: 1
   });
   ```
5. Invoices are displayed in a sortable, responsive table

## Technologies Used

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **UiPath TypeScript SDK** - Data Fabric integration
- **CSS3** - Styling with modern features

## License

ISC

