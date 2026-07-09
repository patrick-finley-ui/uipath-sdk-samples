# Personal Injury Claims Case Management Demo

React + TypeScript + Vite coded web app for the SKO claims case management demo.

## Configuration

Runtime settings live in `.env`.

- `VITE_UIPATH_BASE_URL` should use the UiPath API host for the target environment.
- `VITE_UIPATH_ORG_NAME`, `VITE_UIPATH_TENANT_NAME`, and `VITE_UIPATH_CLIENT_ID` must match the target External Application.
- `VITE_CASE_ID` is the Maestro case process key.
- `VITE_UIPATH_FOLDER_KEY` is the folder key for that case.
- `VITE_CASE_ENTITY_ID` is the Data Fabric case entity.
- `VITE_CASE_EVENT_ENTITY_ID` is the Data Fabric case event entity.
- `VITE_APPROVAL_WEBHOOK_URL` is required for the claim approval button.
- `VITE_UIPATH_SCOPE` must include `ConversationalAgents`, `DataFabric.Data.Read`, `DataFabric.Data.Write`, and `DataFabric.Schema.Read`.

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```
