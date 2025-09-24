// Import individual operation objects
import { analysisById } from './analysisById';
import { analysisList } from './analysisList';
import { analysisSearch } from './analysisSearch';
import { analysisStats } from './analysisStats';

// Re-export all read operation modules
export { analysisById };
export { analysisList };
export { analysisSearch };
export { analysisStats };

// Create combined readOperations object
export const readOperations = {
  ...analysisById,
  ...analysisList,
  ...analysisSearch,
  ...analysisStats,
};
