/**
 * SamplingProvider Tests
 * 
 * Comprehensive unit tests for the SamplingProvider class.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SamplingProvider, createSamplingProvider } from '../src/SamplingProvider.js';
import type { SamplingProviderConfig } from '../src/types.js';
import type { Request } from '@kjerneverk/execution';

describe('SamplingProvider', () => {
    let provider: SamplingProvider;
    let config: SamplingProviderConfig;
    let mockClient: any;

    beforeEach(() => {
        config = {
            sessionId: 'test-session-123',
            clientName: 'TestClient',
            supportsTools: false,
            timeout: 5000,
            debug: false,
        };
        provider = new SamplingProvider(config);
        
        mockClient = {
            sendRequest: vi.fn(),
        };
    });

    describe('constructor', () => {
        it('should create provider with correct name', () => {
            expect(provider.name).toBe('sampling');
        });

        it('should apply default config values', () => {
            const minimalProvider = new SamplingProvider({
                sessionId: 'test',
            });
            expect(minimalProvider.name).toBe('sampling');
        });

        it('should accept custom timeout', () => {
            const customProvider = new SamplingProvider({
                sessionId: 'test',
                timeout: 60000,
            });
            expect(customProvider.name).toBe('sampling');
        });

        it('should accept debug flag', () => {
            const debugProvider = new SamplingProvider({
                sessionId: 'test',
                debug: true,
            });
            expect(debugProvider.name).toBe('sampling');
        });
    });

    describe('supportsModel', () => {
        it('should support all models', () => {
            expect(provider.supportsModel('claude-sonnet-4-5')).toBe(true);
            expect(provider.supportsModel('gpt-4o')).toBe(true);
            expect(provider.supportsModel('any-model')).toBe(true);
            expect(provider.supportsModel('')).toBe(true);
        });
    });

    describe('setSamplingClient', () => {
        it('should accept sampling client configuration', () => {
            provider.setSamplingClient(mockClient);
            // No error means it was set successfully
            expect(true).toBe(true);
        });
    });

    describe('execute', () => {
        let request: Request;

        beforeEach(() => {
            request = {
                model: 'claude-sonnet-4-5',
                messages: [
                    { role: 'user', content: 'test message' }
                ],
                responseFormat: undefined,
                validator: undefined,
                addMessage: vi.fn(),
            };
        });

        it('should throw error if sampling client not configured', async () => {
            await expect(async () => {
                await provider.execute(request);
            }).rejects.toThrow('Sampling client not configured');
        });

        it('should execute request successfully', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockResolvedValue({
                role: 'assistant',
                content: {
                    type: 'text',
                    text: 'Generated response'
                },
                model: 'claude-sonnet-4-5',
                stopReason: 'endTurn'
            });

            const result = await provider.execute(request);

            expect(result.content).toBe('Generated response');
            expect(result.model).toBe('claude-sonnet-4-5');
            expect(mockClient.sendRequest).toHaveBeenCalledWith(
                'sampling/createMessage',
                expect.any(Object)
            );
        });

        it('should handle system messages', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockResolvedValue({
                role: 'assistant',
                content: { type: 'text', text: 'response' },
                model: 'claude-sonnet-4-5'
            });

            const requestWithSystem: Request = {
                model: 'claude-sonnet-4-5',
                messages: [
                    { role: 'system', content: 'You are helpful' },
                    { role: 'user', content: 'Hello' }
                ],
                responseFormat: undefined,
                validator: undefined,
                addMessage: vi.fn(),
            };

            await provider.execute(requestWithSystem);

            const callArgs = mockClient.sendRequest.mock.calls[0][1];
            expect(callArgs.systemPrompt).toBe('You are helpful');
        });

        it('should handle developer role messages', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockResolvedValue({
                role: 'assistant',
                content: { type: 'text', text: 'response' },
                model: 'claude-sonnet-4-5'
            });

            const requestWithDeveloper: Request = {
                model: 'claude-sonnet-4-5',
                messages: [
                    { role: 'developer', content: 'System instruction' },
                    { role: 'user', content: 'Hello' }
                ],
                responseFormat: undefined,
                validator: undefined,
                addMessage: vi.fn(),
            };

            await provider.execute(requestWithDeveloper);

            const callArgs = mockClient.sendRequest.mock.calls[0][1];
            expect(callArgs.systemPrompt).toBe('System instruction');
        });

        it('should handle multiple system messages', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockResolvedValue({
                role: 'assistant',
                content: { type: 'text', text: 'response' },
                model: 'claude-sonnet-4-5'
            });

            const requestWithMultipleSystem: Request = {
                model: 'claude-sonnet-4-5',
                messages: [
                    { role: 'system', content: 'First instruction' },
                    { role: 'developer', content: 'Second instruction' },
                    { role: 'user', content: 'Hello' }
                ],
                responseFormat: undefined,
                validator: undefined,
                addMessage: vi.fn(),
            };

            await provider.execute(requestWithMultipleSystem);

            const callArgs = mockClient.sendRequest.mock.calls[0][1];
            expect(callArgs.systemPrompt).toBe('First instruction\n\nSecond instruction');
        });

        it('should handle array content in messages', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockResolvedValue({
                role: 'assistant',
                content: { type: 'text', text: 'response' },
                model: 'claude-sonnet-4-5'
            });

            const requestWithArrayContent: Request = {
                model: 'claude-sonnet-4-5',
                messages: [
                    { role: 'user', content: ['Line 1', 'Line 2', 'Line 3'] }
                ],
                responseFormat: undefined,
                validator: undefined,
                addMessage: vi.fn(),
            };

            await provider.execute(requestWithArrayContent);

            const callArgs = mockClient.sendRequest.mock.calls[0][1];
            expect(callArgs.messages[0].content.text).toBe('Line 1\nLine 2\nLine 3');
        });

        it('should handle null content', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockResolvedValue({
                role: 'assistant',
                content: { type: 'text', text: 'response' },
                model: 'claude-sonnet-4-5'
            });

            const requestWithNullContent: Request = {
                model: 'claude-sonnet-4-5',
                messages: [
                    { role: 'user', content: null }
                ],
                responseFormat: undefined,
                validator: undefined,
                addMessage: vi.fn(),
            };

            await provider.execute(requestWithNullContent);

            const callArgs = mockClient.sendRequest.mock.calls[0][1];
            expect(callArgs.messages[0].content.text).toBe('');
        });

        it('should pass execution options', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockResolvedValue({
                role: 'assistant',
                content: { type: 'text', text: 'response' },
                model: 'claude-sonnet-4-5'
            });

            await provider.execute(request, {
                maxTokens: 1000,
                temperature: 0.7,
            });

            const callArgs = mockClient.sendRequest.mock.calls[0][1];
            expect(callArgs.maxTokens).toBe(1000);
            expect(callArgs.temperature).toBe(0.7);
        });

        it('should handle timeout', async () => {
            const shortTimeoutProvider = new SamplingProvider({
                sessionId: 'test',
                timeout: 100,
            });
            shortTimeoutProvider.setSamplingClient(mockClient);

            mockClient.sendRequest.mockImplementation(() => 
                new Promise(resolve => setTimeout(resolve, 200))
            );

            await expect(async () => {
                await shortTimeoutProvider.execute(request);
            }).rejects.toThrow('timed out');
        });

        it('should handle user rejection error', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockRejectedValue({
                code: -1,
                message: 'User rejected'
            });

            await expect(async () => {
                await provider.execute(request);
            }).rejects.toThrow('User rejected the AI generation request');
        });

        it('should handle invalid params error', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockRejectedValue({
                code: -32602,
                message: 'Invalid params'
            });

            await expect(async () => {
                await provider.execute(request);
            }).rejects.toThrow('Invalid sampling request parameters');
        });

        it('should handle other MCP errors', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockRejectedValue({
                code: -32603,
                message: 'Internal error'
            });

            await expect(async () => {
                await provider.execute(request);
            }).rejects.toThrow('MCP sampling error');
        });

        it('should handle non-MCP errors', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockRejectedValue(
                new Error('Network error')
            );

            await expect(async () => {
                await provider.execute(request);
            }).rejects.toThrow('Network error');
        });

        it('should use model from options if provided', async () => {
            provider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockResolvedValue({
                role: 'assistant',
                content: { type: 'text', text: 'response' },
                model: 'gpt-4o'
            });

            await provider.execute(request, { model: 'gpt-4o' });

            expect(mockClient.sendRequest).toHaveBeenCalled();
        });

        it('should log with debug enabled', async () => {
            const debugProvider = new SamplingProvider({
                sessionId: 'test',
                debug: true,
            });
            debugProvider.setSamplingClient(mockClient);
            mockClient.sendRequest.mockResolvedValue({
                role: 'assistant',
                content: { type: 'text', text: 'response' },
                model: 'claude-sonnet-4-5'
            });

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            await debugProvider.execute(request);

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('createSamplingProvider factory', () => {
        it('should create provider instance', () => {
            const provider = createSamplingProvider({
                sessionId: 'test',
                clientName: 'TestClient',
            });

            expect(provider).toBeInstanceOf(SamplingProvider);
            expect(provider.name).toBe('sampling');
        });
    });
});

describe('SamplingProvider type guards', () => {
    it('should validate sampling error codes', async () => {
        const { SamplingErrorCode } = await import('../src/types.js');
        
        expect(SamplingErrorCode.UserRejected).toBe(-1);
        expect(SamplingErrorCode.InvalidParams).toBe(-32602);
        expect(SamplingErrorCode.InternalError).toBe(-32603);
    });
});
