// Utility functions for handling environment variables

/**
 * Check if required environment variables are set
 * @returns Object with missing variables and a boolean indicating if all required variables are set
 */
export function checkRequiredEnvVars(): { missing: string[], allSet: boolean } {
  const requiredVars = [
    'OPENAI_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_KEY'
  ];
  
  const missing = requiredVars.filter(varName => {
    try {
      // Use dynamic import to check if the environment variable is set
      return !process.env[varName];
    } catch (error) {
      return true;
    }
  });
  
  return {
    missing,
    allSet: missing.length === 0
  };
}

/**
 * Get a formatted message about missing environment variables
 */
export function getMissingEnvVarsMessage(missingVars: string[]): string {
  if (missingVars.length === 0) return '';
  
  return `
    The following environment variables are missing:
    ${missingVars.map(v => `- ${v}`).join('\n')}
    
    Please add them to your .env file to enable full functionality.
  `;
}
