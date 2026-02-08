/**
 * @kjerneverk/execution-sampling
 * 
 * MCP sampling provider for AI generation - no API keys needed!
 * 
 * This package provides a Provider implementation that uses MCP sampling
 * to delegate AI generation to the calling client, eliminating the need
 * for duplicate API keys when your tool is used via MCP.
 */

export {
    SamplingProvider,
    createSamplingProvider,
} from './SamplingProvider.js';

export type {
    // Configuration
    SamplingProviderConfig,
    
    // Request/Response
    SamplingCreateMessageRequest,
    SamplingCreateMessageResponse,
    SamplingMessage,
    SamplingContent,
    TextContent,
    ImageContent,
    
    // Model preferences
    ModelPreferences,
    ModelHint,
    
    // Errors
    SamplingError,
    
    // Context
    SamplingContext,
} from './types.js';

export { SamplingErrorCode } from './types.js';
