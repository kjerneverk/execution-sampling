/**
 * Types for MCP Sampling Provider
 * 
 * Defines types for using MCP sampling to delegate AI generation to clients.
 */

/**
 * MCP sampling request parameters
 * 
 * Matches the MCP specification for sampling/createMessage requests.
 * See: https://modelcontextprotocol.io/specification/2025-11-25/server/sampling
 */
export interface SamplingCreateMessageRequest {
    /** Messages to send to the LLM */
    messages: SamplingMessage[];
    
    /** Model preferences (client may ignore) */
    modelPreferences?: ModelPreferences;
    
    /** System prompt to prepend */
    systemPrompt?: string;
    
    /** Maximum tokens to generate */
    maxTokens?: number;
    
    /** Sampling temperature (0-1) */
    temperature?: number;
    
    /** Stop sequences */
    stopSequences?: string[];
    
    /** Additional metadata */
    metadata?: Record<string, unknown>;
    
    /** Whether to include priority in the request */
    includeContext?: 'none' | 'thisServer' | 'allServers';
}

/**
 * Message in a sampling request
 */
export interface SamplingMessage {
    role: 'user' | 'assistant';
    content: SamplingContent;
}

/**
 * Content in a sampling message
 */
export type SamplingContent = TextContent | ImageContent;

/**
 * Text content
 */
export interface TextContent {
    type: 'text';
    text: string;
}

/**
 * Image content
 */
export interface ImageContent {
    type: 'image';
    data: string;
    mimeType: string;
}

/**
 * Model preferences for sampling
 */
export interface ModelPreferences {
    /** Hints about desired model capabilities */
    hints?: ModelHint[];
    
    /** Cost priority (0-1, lower = prefer cheaper) */
    costPriority?: number;
    
    /** Speed priority (0-1, lower = prefer faster) */
    speedPriority?: number;
    
    /** Intelligence priority (0-1, lower = prefer more capable) */
    intelligencePriority?: number;
}

/**
 * Model capability hints
 */
export interface ModelHint {
    /** Hint name (e.g., 'claude-3-5-sonnet', 'gpt-4') */
    name?: string;
}

/**
 * Response from MCP sampling request
 */
export interface SamplingCreateMessageResponse {
    /** Role of the response (always 'assistant') */
    role: 'assistant';
    
    /** Content of the response */
    content: SamplingContent;
    
    /** Model used by client */
    model: string;
    
    /** Stop reason */
    stopReason?: 'endTurn' | 'stopSequence' | 'maxTokens';
}

/**
 * MCP sampling error codes
 */
export enum SamplingErrorCode {
    /** User rejected the sampling request */
    UserRejected = -1,
    
    /** Invalid parameters */
    InvalidParams = -32602,
    
    /** Internal error */
    InternalError = -32603,
}

/**
 * MCP sampling error
 */
export interface SamplingError {
    code: number;
    message: string;
    data?: unknown;
}

/**
 * Configuration for SamplingProvider
 */
export interface SamplingProviderConfig {
    /** Session ID for this connection */
    sessionId: string;
    
    /** Client name (for logging) */
    clientName?: string;
    
    /** Whether client supports tools in sampling */
    supportsTools?: boolean;
    
    /** Default model preferences */
    defaultModelPreferences?: ModelPreferences;
    
    /** Timeout for sampling requests (ms) */
    timeout?: number;
    
    /** Enable debug logging */
    debug?: boolean;
}

/**
 * Sampling request context
 */
export interface SamplingContext {
    /** Request ID for correlation */
    requestId: string;
    
    /** Timestamp when request started */
    startedAt: Date;
    
    /** Model requested */
    model: string;
    
    /** Number of messages in request */
    messageCount: number;
}
