# Quick Start Guide

## Fastest Way to Test Locally

### Step 1: Start the App
```bash
npm install
npm run dev
```

### Step 2: Open Browser Console
1. Open `http://localhost:5173` (or the port shown)
2. Press F12 to open DevTools
3. Go to the Console tab

### Step 3: Load Mock Data

The mock helpers are automatically loaded! Just use:

```javascript
// Load example configs by name (Easiest!)
loadExampleConfig('loan')      // Test loan application
loadExampleConfig('invoice')   // Test invoice approval
loadExampleConfig('claim')     // Test insurance claim
loadExampleConfig('contract')  // Test contract review
loadExampleConfig('onboarding') // Test employee onboarding

// Or use mockActionCenter with a string name
window.mockActionCenter('loan')
window.mockActionCenter('invoice')

// Or use mockActionCenter with a custom config object
window.mockActionCenter({
  entityId: "f5cc0fa5-54dc-f011-8196-00224882fdd3",
  entityFields: {
    loanType: { label: "Loan Type", mapping: "loanType" },
    amount: { label: "Amount", mapping: "amount" },
    status: { label: "Status", mapping: "status" }
  },
  readOnlyFields: {
    applicantName: { label: "Applicant Name", value: "John Doe" },
    loanAmount: { label: "Loan Amount", value: "50000" }
  },
  outputFields: {
    riskFactor: { type: "string", required: true },
    reviewerComments: { type: "textarea", required: false }
  },
  outcomes: {
    Approve: { type: "string", label: "Accept Application" },
    Reject: { type: "string", label: "Reject Application" }
  }
})
```

**Option C: Copy from example JSON files**
1. Open any example config file (e.g., `examples/loan-application-config.json`)
2. Copy the JSON content
3. In browser console:
   ```javascript
   const config = { /* paste JSON here */ };
   window.mockActionCenter(config);
   ```

## What to Test

1. **Review Tab**: Check read-only fields and output fields render correctly
2. **History Tab**: Click to see entity history (may show API errors if entity ID is invalid - that's OK for local testing)
3. **Attachments Tab**: Test document filtering with filePath
4. **Form Validation**: Try submitting without filling required fields
5. **Outcomes**: Click different outcome buttons

## Troubleshooting

- **No data appears**: Make sure you called `window.mockActionCenter()` or `loadExampleConfig()`
- **API errors**: Normal for local testing - the app will try to make real API calls. Ignore entity/document loading errors.
- **Buttons disabled**: Fill in all required output fields first

For detailed instructions, see `TESTING_INSTRUCTIONS.md`
