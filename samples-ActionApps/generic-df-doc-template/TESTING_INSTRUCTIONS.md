# Local Testing Instructions

This guide explains how to test the generic task template locally with different configurations.

## Prerequisites

1. **Node.js 18+** installed
2. **npm** or **yarn** package manager
3. All dependencies installed (`npm install`)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will start at `http://localhost:5173` (or another port if 5173 is busy).

## Testing with Mock Data

### Option 1: Browser Console (Recommended for Quick Testing)

1. Start the dev server: `npm run dev`
2. Open the app in your browser
3. Open browser DevTools (F12)
4. In the console, run:

```javascript
// Test with loan application config (default)
window.mockActionCenter()

// Or use the helper to load example configs:
// First, copy and paste the content of examples/load-config.js into the console
// Then use:
loadExampleConfig('loan')      // Loan application
loadExampleConfig('invoice')   // Invoice approval
loadExampleConfig('claim')     // Insurance claim
loadExampleConfig('contract')  // Contract review
loadExampleConfig('onboarding') // Employee onboarding

// Or test with a custom config
window.mockActionCenter({
  entityId: "your-entity-id",
  entityFields: {
    field1: { label: "Field 1", mapping: "field1" }
  },
  // ... rest of config
})
```

### Option 2: Modify Form Component (For Persistent Testing)

1. Open `src/components/Form.tsx`
2. Add this import at the top:

```typescript
import { mockActionCenterData } from '../mockActionCenter';
import loanConfig from '../../examples/loan-application-config.json';
```

3. In the `useEffect` that initializes from Action Center (around line 129), add this before the `sdk.taskEvents.getTaskDetailsFromActionCenter` call:

```typescript
useEffect(() => {
  // FOR LOCAL TESTING ONLY - Remove in production
  if (import.meta.env.DEV) {
    // Uncomment the config you want to test:
    mockActionCenterData(loanConfig);
    // mockActionCenterData(invoiceConfig);
    // mockActionCenterData(claimConfig);
    // mockActionCenterData(contractConfig);
    // mockActionCenterData(onboardingConfig);
    return; // Comment this out if you want to test with real Action Center
  }
  
  // Original Action Center initialization code...
  sdk.taskEvents.getTaskDetailsFromActionCenter((data: any) => {
    // ...
  });
}, []);
```

**Important:** Remove or comment out the mock code before deploying to production!

## Example Configurations

Five example configurations are provided in the `examples/` folder:

1. **loan-application-config.json** - Loan application review
2. **invoice-config.json** - Invoice approval workflow
3. **insurance-claim-config.json** - Insurance claim processing
4. **contract-review-config.json** - Contract review and approval
5. **employee-onboarding-config.json** - Employee onboarding workflow

### Using Example Configs

1. Copy the JSON from an example file
2. Use it in the browser console:

```javascript
// Load config from file (you'll need to copy-paste the JSON)
const config = {
  entityId: "f5cc0fa5-54dc-f011-8196-00224882fdd3",
  entityFields: { /* ... */ },
  // ... rest of config
};

window.mockActionCenter(config);
```

Or import it in your code:

```typescript
import loanConfig from '../../examples/loan-application-config.json';
mockActionCenterData(loanConfig);
```

## Testing Different Features

### Test Entity History Tab

1. Use a valid `entityId` in your config
2. Ensure `entityFields` are properly mapped
3. Click the "Applicant History" tab (or equivalent)
4. The table should display columns based on `entityFields`

**Note:** For local testing, the SDK will try to make real API calls. You may see errors if:
- The entity ID doesn't exist
- You don't have valid authentication
- The API endpoint is not accessible

To avoid API errors during local testing, you can mock the SDK responses (see Advanced Testing below).

### Test Document Filtering

1. Set `storageBucketId` in your config
2. Set `filePath` to filter documents (e.g., `"invoices/2024/"`)
3. Go to the "Attachments" tab
4. Documents should be filtered by the file path
5. Leave `filePath` empty (`""`) to show all documents

**Note:** Document loading requires a valid bucket ID and will make real API calls.

### Test Read-Only Fields

1. Configure `readOnlyFields` in your config
2. Go to the "Review Application" tab
3. Read-only fields should display in the "Details" section

### Test Output Fields

1. Configure `outputFields` in your config
2. Go to the "Review Application" tab
3. Input fields should appear based on `outputFields` configuration
4. Required fields should disable the action buttons until filled

### Test Dynamic Outcomes

1. Configure `outcomes` in your config
2. Action buttons should appear based on the outcomes configuration
3. Clicking a button should trigger `handleOutcome` with the outcome name

## Advanced Testing

### Mocking SDK Responses

To test without making real API calls, you can mock the SDK:

```typescript
// In your test setup or browser console
const originalGetRecordsById = sdk.entities.getRecordsById;
sdk.entities.getRecordsById = async (entityId: string, options?: any) => {
  return {
    items: [
      { loanType: "Personal", amount: 50000, processingDate: "2024-01-15", status: "Approved", duration: "5 years" },
      { loanType: "Auto", amount: 25000, processingDate: "2024-02-01", status: "Pending", duration: "3 years" }
    ]
  };
};

const originalGetFileMetaData = sdk.buckets.getFileMetaData;
sdk.buckets.getFileMetaData = async (bucketId: number, orgUnitId: string) => {
  return {
    items: [
      { path: "/document1.pdf", size: 1024000, lastModified: "2024-01-15T10:00:00Z" },
      { path: "/document2.pdf", size: 2048000, lastModified: "2024-01-16T10:00:00Z" }
    ]
  };
};
```

### Testing Form Validation

1. Configure `outputFields` with some `required: true` fields
2. Try to click action buttons without filling required fields
3. Buttons should be disabled
4. Fill required fields and buttons should become enabled

### Testing File Path Filtering

1. Set `filePath: "invoices/"` in config
2. Mock document list with various paths:
   - `invoices/2024/doc1.pdf` (should show)
   - `invoices/2023/doc2.pdf` (should show)
   - `contracts/doc3.pdf` (should NOT show)
3. Verify only matching documents appear

## Production Testing

For production testing in UiPath Action Center:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to Action Center** following UiPath Action App deployment procedures

3. **Configure the Action App** with your desired configuration in the Action Center task definition

4. **Test with real data:**
   - Create a task in Action Center
   - The app will receive real configuration from Action Center
   - Test with actual entity IDs, bucket IDs, etc.

## Troubleshooting

### App doesn't load mock data

- Check browser console for errors
- Ensure `mockActionCenterData()` is called
- Verify the config JSON is valid

### Entity history doesn't load

- Check if `entityId` is valid
- Verify `entityFields` mapping matches Data Fabric field names
- Check browser console for API errors
- Ensure SDK is properly initialized

### Documents don't load

- Verify `storageBucketId` is set
- Check if bucket exists and is accessible
- Verify `organizationUnitId` is set in mock data
- Check browser console for API errors

### Form validation not working

- Ensure `outputFields` has `required: true` for some fields
- Check that field names match between config and form data
- Verify `isFormValid` logic is checking all required fields

## Configuration Schema Reference

See `action-schema.json` for the complete schema definition.

Key fields:
- `entityId` (required): Data Fabric entity ID
- `entityFields` (required): Field mappings for history table
- `readOnlyFields` (optional): Display-only fields
- `outputFields` (required): Form input fields configuration
- `outcomes` (required): Task outcome buttons
- `storageBucketId` (optional): Document storage bucket
- `filePath` (optional): Document path filter
- `aiAgentHTML` (optional): AI analysis HTML content

## Next Steps

1. Test each example configuration
2. Customize configurations for your use cases
3. Test with real Action Center data
4. Deploy to production

For questions or issues, refer to the main README.md or UiPath Action Apps documentation.
