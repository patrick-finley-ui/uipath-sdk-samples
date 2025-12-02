# Debugging Guide for Start Process

## Key Findings from Other App Comparison

By inspecting the network payload from the working app, we discovered these **critical missing parameters**:

1. ✅ **`runAsMe: true`** - Runs the process under the current user's context (REQUIRED)
2. ✅ **`requiresUserInteraction: false`** - Specifies if user interaction is needed
3. ✅ **`jobPriority: "Normal"`** - Sets the job priority level

**Working Payload Structure (from other app):**
```json
{
  "startInfo": {
    "Strategy": "ModernJobsCount",
    "JobPriority": "Normal",
    "InputArguments": "{\"invoiceFilePath\":\" Invoice-INV-1025.pdf\"}",
    "RequiresUserInteraction": false,
    "RunAsMe": true,
    "ReleaseKey": "44479d67-c3d0-41e4-9ae0-3b337e320f9e"
  }
}
```

The SDK handles the conversion from our request object to the `startInfo` structure internally.

---

## 1. Console Debugging (Your App)

### Enhanced Logging
The app now has detailed console logging for the start process function:

**When you click "Start Process", you'll see:**
```
🚀 Starting Process
  Process Key: 44479d67-c3d0-41e4-9ae0-3b337e320f9e
  Folder ID: 2465659
  Invoice File Path: Invoice-INV-1025.pdf
  Request Payload: { processKey: ..., strategy: ..., inputArguments: ... }
  Full Request: { payload: ..., folderId: ... }
```

**On Success:**
```
✅ Process Started Successfully
  Result: [...]
  Result Type: object/array
  Result Keys: [...]
  Job Count: X
  Job 1: {...}
```

**On Error:**
```
❌ Error Starting Process
  Error Object: {...}
  Error Type: ...
  Error Message: ...
  Error Stack: ...
  Error Details: {...}
```

### How to View Console Logs

1. **Open DevTools**: Press `F12` or `Right-click → Inspect`
2. **Go to Console tab**
3. **Click the "Start Invoice Processing" button**
4. **Review the grouped logs** (they collapse/expand with arrows)

---

## 2. Inspecting Another Deployed Chrome App

### Method 1: Network Tab (Recommended)

This shows the actual HTTP requests being made:

1. **Open the deployed app** in Chrome
2. **Open DevTools** (`F12`)
3. **Go to Network tab**
4. **Click "Clear" (🚫)** to clear existing requests
5. **Filter by "Fetch/XHR"** (top-left filter buttons)
6. **Trigger the start process** in the app
7. **Look for API calls** to UiPath endpoints (likely containing `/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs` or similar)

**What to look for:**
- **Request URL**: The endpoint being called
- **Request Method**: Usually POST
- **Request Headers**: Authorization, Content-Type, etc.
- **Request Payload**: Click the "Payload" tab to see what's being sent
- **Response**: Click "Response" tab to see what comes back

#### Example Network Request:
```
POST https://staging.uipath.com/[orgname]/[tenantname]/odata/Jobs/UiPath.Server.Configuration.OData.StartJobs

Headers:
  Content-Type: application/json
  Authorization: Bearer [token]

Payload:
{
  "startInfo": {
    "ReleaseKey": "44479d67-c3d0-41e4-9ae0-3b337e320f9e",
    "Strategy": "ModernJobsCount",
    "InputArguments": "{\"invoiceFilePath\":\"Invoice-INV-1025.pdf\"}",
    "FolderId": 2465659
  }
}
```

### Method 2: Sources Tab (View JavaScript)

To see how they're calling the SDK:

1. **Open DevTools** (`F12`)
2. **Go to Sources tab**
3. **Use Ctrl+Shift+F** to search across all files
4. **Search for:**
   - `processes.start`
   - `sdk.processes`
   - `StartJobs`
   - The process key if you know it

5. **Set Breakpoints:**
   - Click the line number to add a breakpoint
   - Trigger the action
   - Inspect variables when paused

### Method 3: Application Tab (Check localStorage/sessionStorage)

Sometimes apps store config:

1. **Go to Application tab**
2. **Expand "Local Storage"** or **"Session Storage"**
3. **Look for stored values** like process keys, folder IDs, etc.

---

## 3. Comparing Parameters

### Common Parameter Formats:

**Option A (Current Setup - Matches Other App):**
```javascript
await sdk.processes.start({
  processKey: '44479d67-c3d0-41e4-9ae0-3b337e320f9e',
  strategy: 'ModernJobsCount',
  jobPriority: 'Normal',
  inputArguments: JSON.stringify({
    invoiceFilePath: 'Invoice-INV-1025.pdf'
  }),
  requiresUserInteraction: false,
  runAsMe: true
}, 2465659);
```

**What each parameter does:**
- `processKey` - The unique identifier for the process/release
- `strategy` - How to allocate jobs ('ModernJobsCount', 'Specific', 'JobsCount')
- `jobPriority` - Priority level ('Normal', 'High', 'Low')
- `inputArguments` - JSON string of input parameters for the process
- `requiresUserInteraction` - Whether the process requires user interaction
- `runAsMe` - Run the process under the current user's context

**Option B (Alternative with more options):**
```javascript
await sdk.processes.start({
  processKey: '44479d67-c3d0-41e4-9ae0-3b337e320f9e',
  strategy: 'ModernJobsCount',
  jobsCount: 1,
  inputArguments: JSON.stringify({
    invoiceFilePath: 'Invoice-INV-1025.pdf'
  }),
  runtimeType: 'Unattended'
}, 2465659);
```

**Option C (By Process Name):**
```javascript
await sdk.processes.start({
  processName: 'Invoice Processing',
  strategy: 'ModernJobsCount',
  inputArguments: JSON.stringify({
    invoiceFilePath: 'Invoice-INV-1025.pdf'
  })
}, 2465659);
```

### Key Things to Check:

1. **inputArguments format:**
   - ✅ Should be JSON.stringify(object)
   - ❌ NOT just the object

2. **folderId type:**
   - ✅ Should be a number: `2465659`
   - ❌ NOT a string: `"2465659"`

3. **strategy values:**
   - `'ModernJobsCount'` (modern)
   - `'Specific'` (specific robots)
   - `'JobsCount'` (legacy)

4. **Parameter order:**
   - First: request object `{}`
   - Second: folderId `number`

---

## 4. Testing Tips

### Test with Console Commands

You can also test directly in the console:

1. Open Console in your app
2. Type this to access the SDK:
```javascript
// The SDK should be available in your app context
// You can test parameters directly:

const testPayload = {
  processKey: '44479d67-c3d0-41e4-9ae0-3b337e320f9e',
  strategy: 'ModernJobsCount',
  inputArguments: JSON.stringify({
    invoiceFilePath: 'test.pdf'
  })
};

console.log('Testing payload:', testPayload);
```

### Common Issues:

1. **"Process not found"** → Check processKey is correct
2. **"Folder not found"** → Check folderId is correct and accessible
3. **"Invalid input arguments"** → Check JSON.stringify() is used
4. **"Unauthorized"** → Check authentication token is valid
5. **"Robot not available"** → Check strategy and robot availability

---

## 5. Network Request Debugging

Add this to see raw network requests from the SDK:

```javascript
// In browser console, before calling start:
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('🌐 Fetch Request:', args);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('🌐 Fetch Response:', response);
      return response;
    });
};
```

Then trigger your start process and you'll see all network calls!

---

## Contact & Resources

- **UiPath SDK Docs**: https://www.npmjs.com/package/@uipath/uipath-typescript
- **UiPath API Docs**: https://docs.uipath.com/orchestrator/automation-cloud/latest/api-guide
