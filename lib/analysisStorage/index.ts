// Import the operations directly
import { readOperations } from './readOperations';
import { writeOperations } from './writeOperations';
import { userOperations } from './userOperations';

// Re-export all operations from the modularized files
export { readOperations };
export { writeOperations };
export { userOperations };

// Create a unified interface for backward compatibility
export const analysisStorage = {
  ...readOperations,
  ...writeOperations,
  ...userOperations,
};
