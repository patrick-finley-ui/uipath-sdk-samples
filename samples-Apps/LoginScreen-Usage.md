# Dynamic LoginScreen Component Usage Guide

The LoginScreen component has been refactored to be a reusable, plug-and-play component that can be easily customized for different applications and customers.

## Component Props

```typescript
export interface LoginScreenProps {
  customerLogo?: string;        // URL to customer logo image (optional - if not provided, no customer logo is shown)
  customerName?: string;         // Name of the customer organization
  appName?: string;              // Name of the application
  appDescription?: string;       // Short description of the app
  systemFeatures?: string[];     // Array of feature descriptions
  detailedDescription?: string;  // Detailed description shown below title
}
```

## Logo Display Behavior

- **If `customerLogo` is provided**: The customer logo is displayed at the top of the login card
- **If `customerLogo` is NOT provided**: No customer logo is shown at the top (invoice-app falls back to DoD logo from local assets)
- **If customer logo fails to load**: The image is hidden automatically via error handling
- **UiPath logo**: Always displayed at the bottom of the login card (permanent, non-dynamic)

## Usage Examples

### Example 1: Department of Defense - Invoice Processing App (uses local DoD logo)

```tsx
<LoginScreen
  customerName="Department of Defense"
  appName="Invoice Processing Dashboard"
  appDescription="Automated Invoice Management"
  detailedDescription="Access the invoice processing system to manage, verify, and track invoice documents."
  systemFeatures={[
    'Real-time invoice tracking',
    'Document verification status',
    'Automated processing workflows',
    'Analytics and reporting',
  ]}
/>
```

### Example 2: USDA - SNAP Benefits App (with external logo URL)

```tsx
<LoginScreen
  customerLogo="https://www.usda.gov/themes/custom/usda_uswds/img/USDA_logo_640.png"
  customerName="US Department of Agriculture"
  appName="SNAP Benefits Applications Dashboard"
  appDescription="Automated Benefits Processing & Management"
  detailedDescription="Access the SNAP benefits processing system to manage, review, and approve benefits applications."
  systemFeatures={[
    'Real-time application tracking',
    'AI-powered eligibility verification',
    'Automated document processing',
    'Fraud detection and prevention',
  ]}
/>
```

### Example 3: No Customer Logo (Template/Default)

```tsx
// No customerLogo prop = no customer logo displayed, only UiPath logo at bottom
<LoginScreen
  appName="My Application"
  appDescription="Custom Workflow Automation"
  systemFeatures={[
    'Real-time processing',
    'Automated workflows',
  ]}
/>
```

### Example 4: Minimal Custom Branding

```tsx
<LoginScreen
  appName="My Custom App"
  appDescription="Custom Workflow Automation"
/>
```

## Features

- **Plug-and-Play**: Copy the component to any app and customize with props
- **Fallback Support**: Falls back to UiPath logo if no customer logo provided
- **Responsive Design**: Works on mobile and desktop
- **Consistent UX**: Maintains consistent login experience across apps
- **Accessible**: Proper alt text and semantic HTML

## Implementation Steps

1. **Copy the LoginScreen component** to your app's components folder
2. **Copy the logoUtils.ts** to your utils folder (for fallback logo support)
3. **Update your App.tsx** to pass the appropriate props:

```tsx
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isAuthenticated) {
    return (
      <LoginScreen
        customerLogo="your-logo-url"
        customerName="Your Customer"
        appName="Your App Name"
        appDescription="Your App Description"
        systemFeatures={['Feature 1', 'Feature 2']}
      />
    );
  }

  return <YourDashboard />;
}
```

## Default Values

If you don't provide props, these defaults are used:

- **customerName**: 'UiPath'
- **appName**: 'Application Dashboard'
- **appDescription**: 'Automated Workflow Management'
- **systemFeatures**:
  - 'Real-time processing tracking'
  - 'Document verification status'
  - 'Automated processing workflows'
  - 'Analytics and reporting'

## Styling

The component uses Tailwind CSS classes and maintains:
- Blue gradient background
- White card with rounded corners
- Responsive padding and spacing
- Hover states and animations
- Loading spinner during authentication

## Logo Requirements

- **Format**: PNG, SVG, or JPG
- **Recommended Size**: 800x800px or larger
- **Aspect Ratio**: Square or horizontal logos work best
- **Height**: Component will scale logo to h-28 (112px)
