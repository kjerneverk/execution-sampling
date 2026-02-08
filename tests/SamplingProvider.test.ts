/**
 * SamplingProvider Tests
 * 
 * Basic unit tests for the SamplingProvider class.
 * Full integration tests are in riotplan/tests/sampling/ using FastMCP.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SamplingProvider } from '../src/SamplingProvider.js';
import type { SamplingProviderConfig } from '../src/types.js';

describe('SamplingProvider', () => {
    let provider: SamplingProvider;
    let config: SamplingProviderConfig;

    beforeEach(() => {
        config = {
            sessionId: 'test-session-123',
            clientName: 'TestClient',
            supportsTools: false,
            timeout: 5000,
            debug: false,
        };
        provider = new SamplingProvider(config);
    });

    it('should create provider with correct name', () => {
        expect(provider.name).toBe('sampling');
    });

    it('should support all models', () => {
        expect(provider.supportsModel('claude-sonnet-4-5')).toBe(true);
        expect(provider.supportsModel('gpt-4o')).toBe(true);
        expect(provider.supportsModel('any-model')).toBe(true);
    });

    it('should throw error if sampling client not configured', async () => {
        await expect(async () => {
            await provider.execute({
                model: 'claude-sonnet-4-5',
                messages: [{ role: 'user', content: 'test' }],
                responseFormat: undefined,
                validator: undefined,
                addMessage: () => {},
            });
        }).rejects.toThrow('Sampling client not configured');
    });

    it('should accept sampling client configuration', () => {
        const mockClient = { sendRequest: async () => ({}) };
        provider.setSamplingClient(mockClient);
        // No error means it was set successfully
        expect(true).toBe(true);
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
