import { checkRequiredEnvVars } from '$lib/utils/env';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const { missing, allSet } = checkRequiredEnvVars();
  
  return {
    apiKeysConfigured: allSet,
    missingKeys: missing
  };
};
