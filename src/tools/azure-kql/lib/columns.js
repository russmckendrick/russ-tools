import { APPS_NOTES } from './columns/apps.js';
import { COMPUTE_NOTES } from './columns/compute.js';
import { IDENTITY_NOTES } from './columns/identity.js';
import { NETWORK_NOTES } from './columns/network.js';
import { PLATFORM_NOTES } from './columns/platform.js';
import { SECURITY_NOTES } from './columns/security.js';

export const TABLE_NOTES = {
  ...NETWORK_NOTES,
  ...IDENTITY_NOTES,
  ...PLATFORM_NOTES,
  ...COMPUTE_NOTES,
  ...SECURITY_NOTES,
  ...APPS_NOTES,
};
