/**
 * SamplingProvider - MCP Sampling Provider Implementation
 * 
 * Implements the Provider interface using MCP sampling to delegate
 * AI generation to the calling client.
 */

import type {
    Provider,
    Request,
    ProviderResponse,
    ExecutionOptions,
} from '@kjerneverk/execution';

import type {
    SamplingProviderConfig,
    SamplingCreateMessageRequest,
    SamplingCreateMessageResponse,
    SamplingMessage,
    SamplingContext,
    SamplingError,
} from './types.js';

import { randomUUID } from 'node:crypto';

/**
 * MCP Sampling Provider
 * 
 * Uses MCP sampling/createMessage to delegate AI generation to the client.
 * Requires the client to support MCP sampling capability.
 */
export class SamplingProvider implements Provider {
    readonly name = 'sampling';
    
    private config: Required<SamplingProviderConfig>;
    private samplingClient: any; // Will be injected
    
    constructor(config: SamplingProviderConfig) {
        this.config = {
            sessionId: config.sessionId,
            clientName: config.clientName ?? 'unknown',
            supportsTools: config.supportsTools ?? false,
            defaultModelPreferences: config.defaultModelPreferences ?? {},
            timeout: config.timeout ?? 120000, // 2 minutes default
            debug: config.debug ?? false,
        };
    }
    
    /**
     * Set the MCP client for sending sampling requests
     * 
     * This must be called before execute() can be used.
     * The client should have a sendRequest() method that sends
     * MCP requests and returns responses.
     */
    setSamplingClient(client: any): void {
        this.samplingClient = client;
    }
    
    /**
     * Execute a request using MCP sampling
     * 
     * Converts the execution request to MCP sampling format,
     * sends it to the client, and converts the response back.
     */
    async execute(
        request: Request,
        options?: ExecutionOptions
    ): Promise<ProviderResponse> {
        if (!this.samplingClient) {
            throw new Error('Sampling client not configured. Call setSamplingClient() first.');
        }
        
        const context: SamplingContext = {
            requestId: randomUUID(),
            startedAt: new Date(),
            model: options?.model ?? request.model,
            messageCount: request.messages.length,
        };
        
        this.log(`Sampling request ${context.requestId}`, {
            model: context.model,
            messages: context.messageCount,
            client: this.config.clientName,
        });
        
        try {
            // Convert execution request to MCP sampling request
            const samplingRequest = this.convertToSamplingRequest(
                request,
                options
            );
            
            // Send sampling request to client
            const response = await this.sendSamplingRequest(
                samplingRequest,
                context
            );
            
            // Convert MCP response to provider response
            const providerResponse = this.convertFromSamplingResponse(
                response,
                context
            );
            
            this.log(`Sampling response ${context.requestId}`, {
                model: providerResponse.model,
                contentLength: providerResponse.content.length,
                duration: Date.now() - context.startedAt.getTime(),
            });
            
            return providerResponse;
            
        } catch (error) {
            this.log(`Sampling error ${context.requestId}`, {
                error: error instanceof Error ? error.message : String(error),
            });
            
            // Re-throw with context
            if (error instanceof Error) {
                error.message = `MCP Sampling failed: ${error.message}`;
            }
            throw error;
        }
    }
    
    /**
     * Check if this provider supports a given model
     * 
     * Sampling provider supports all models since the client
     * decides which model to use based on preferences.
     */
    supportsModel(_model: string): boolean {
        return true; // Client decides model
    }
    
    /**
     * Convert execution request to MCP sampling request
     */
    private convertToSamplingRequest(
        request: Request,
        options?: ExecutionOptions
    ): SamplingCreateMessageRequest {
        // Separate system messages from conversation messages
        const systemMessages = request.messages.filter(
            m => m.role === 'system' || m.role === 'developer'
        );
        const conversationMessages = request.messages.filter(
            m => m.role === 'user' || m.role === 'assistant'
        );
        
        // Convert messages to sampling format
        const messages: SamplingMessage[] = conversationMessages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: {
                type: 'text' as const,
                text: Array.isArray(msg.content)
                    ? msg.content.join('\n')
                    : msg.content ?? '',
            },
        }));
        
        // Combine system messages into systemPrompt
        const systemPrompt = systemMessages.length > 0
            ? systemMessages
                .map(m => Array.isArray(m.content) ? m.content.join('\n') : m.content)
                .filter(Boolean)
                .join('\n\n')
            : undefined;
        
        // Build sampling request
        // maxTokens is required by the MCP sampling spec
        const samplingRequest: SamplingCreateMessageRequest = {
            messages,
            systemPrompt,
            maxTokens: options?.maxTokens ?? 8192,
            temperature: options?.temperature,
            modelPreferences: this.config.defaultModelPreferences,
            includeContext: 'thisServer',
        };
        
        return samplingRequest;
    }
    
    /**
     * Send sampling request to MCP client
     */
    private async sendSamplingRequest(
        request: SamplingCreateMessageRequest,
        _context: SamplingContext
    ): Promise<SamplingCreateMessageResponse> {
        try {
            // Create timeout promise
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(
                    () => reject(new Error(`Sampling request timed out after ${this.config.timeout}ms`)),
                    this.config.timeout
                );
            });
            
            // Send request with timeout
            const response = await Promise.race([
                this.samplingClient.sendRequest('sampling/createMessage', request),
                timeoutPromise,
            ]);
            
            return response as SamplingCreateMessageResponse;
            
        } catch (error: any) {
            // Handle MCP-specific errors with clear, actionable messages
            if (error.code !== undefined) {
                const samplingError = error as SamplingError;
                
                if (samplingError.code === -1) {
                    // User rejected the sampling request
                    const message = [
                        '❌ User rejected the AI generation request.',
                        '',
                        'The MCP client prompted you to approve AI generation, but you declined.',
                        '',
                        'To proceed:',
                        '  1. Try again and approve the request',
                        '  2. Set up direct API keys (ANTHROPIC_API_KEY, etc.)',
                        '  3. Create plan steps manually with riotplan_step_add',
                    ].join('\n');
                    throw new Error(message);
                    
                } else if (samplingError.code === -32602) {
                    // Invalid parameters
                    const message = [
                        '❌ Invalid sampling request parameters.',
                        '',
                        `Error: ${samplingError.message}`,
                        '',
                        'This is likely a bug in RiotPlan. Please report it:',
                        'https://github.com/kjerneverk/riotplan/issues',
                    ].join('\n');
                    throw new Error(message);
                    
                } else {
                    // Other MCP errors
                    const message = [
                        `❌ MCP sampling error (code ${samplingError.code})`,
                        '',
                        `Error: ${samplingError.message}`,
                        '',
                        'Try:',
                        '  1. Check your MCP client logs for details',
                        '  2. Use direct API keys as a fallback',
                        '  3. Report persistent issues to RiotPlan',
                    ].join('\n');
                    throw new Error(message);
                }
            }
            
            throw error;
        }
    }
    
    /**
     * Convert MCP sampling response to provider response
     */
    private convertFromSamplingResponse(
        response: SamplingCreateMessageResponse,
        _context: SamplingContext
    ): ProviderResponse {
        // Extract text content
        let content = '';
        if (response.content.type === 'text') {
            content = response.content.text;
        }
        
        return {
            content,
            model: response.model,
            // MCP sampling doesn't provide token usage
            usage: undefined,
            toolCalls: undefined,
        };
    }
    
    /**
     * Log debug information
     */
    private log(message: string, data?: Record<string, any>): void {
        if (this.config.debug) {
            // eslint-disable-next-line no-console
            console.log('[SamplingProvider]', message, data ?? '');
        }
    }
}

/**
 * Create a SamplingProvider instance
 * 
 * @param config - Provider configuration
 * @returns SamplingProvider instance
 */
export function createSamplingProvider(
    config: SamplingProviderConfig
): SamplingProvider {
    return new SamplingProvider(config);
}
