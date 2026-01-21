import { ModuleLoader } from './modules/ModuleLoader';
import { GovernanceModule } from '@/modules/governance/manifest';

/**
 * Initializes the application core and modules.
 * This should be called before rendering the React root.
 */
export async function initApp() {
  console.log('[Core] Initializing application...');

  // 1. Register Core Modules
  // In the future, this could be dynamic based on configuration or license
  ModuleLoader.register(GovernanceModule);

  // 2. Activate Modules
  // This triggers the onActivate hook for each module
  await ModuleLoader.activate('governance');

  console.log('[Core] Application initialized.');
}