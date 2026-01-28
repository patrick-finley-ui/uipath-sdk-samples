import { UiPath } from '@uipath/uipath-typescript';

let sdk = new UiPath({
  baseUrl: 'dummy',
  orgName: 'dummy',
  tenantName: 'dummy',
  secret: 'dummy',
});

/**
 * Initialize or reinitialize the SDK with runtime configuration
 */
export const initializeSdk = (config: {
  baseUrl: string;
  orgName: string;
  tenantName: string;
  token: string;
}): void => {
  sdk = new UiPath({
    baseUrl: config.baseUrl,
    orgName: config.orgName,
    tenantName: config.tenantName,
    secret: config.token,
  });
  console.log('UiPath SDK initialized with runtime config');
};

export default sdk;