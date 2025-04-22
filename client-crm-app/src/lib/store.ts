// This file is maintained for backward compatibility
// New code should import from './stores' directly

// Re-export everything from the modular store structure
export * from './stores';

// Export the main store hook for convenience
import { useClientStore } from './stores';
export { useClientStore };
