/**
 * Index Module Tests
 * 
 * Tests for the main module exports.
 */

import { describe, it, expect } from 'vitest';

describe('Module exports', () => {
    it('should export SamplingProvider class', async () => {
        const { SamplingProvider } = await import('../src/index.js');
        expect(SamplingProvider).toBeDefined();
        expect(typeof SamplingProvider).toBe('function');
    });

    it('should export createSamplingProvider factory', async () => {
        const { createSamplingProvider } = await import('../src/index.js');
        expect(createSamplingProvider).toBeDefined();
        expect(typeof createSamplingProvider).toBe('function');
    });

    it('should export SamplingErrorCode enum', async () => {
        const { SamplingErrorCode } = await import('../src/index.js');
        expect(SamplingErrorCode).toBeDefined();
        expect(SamplingErrorCode.UserRejected).toBe(-1);
        expect(SamplingErrorCode.InvalidParams).toBe(-32602);
        expect(SamplingErrorCode.InternalError).toBe(-32603);
    });

    it('should create provider via factory', async () => {
        const { createSamplingProvider } = await import('../src/index.js');
        
        const provider = createSamplingProvider({
            sessionId: 'test-123',
            clientName: 'TestClient',
        });

        expect(provider).toBeDefined();
        expect(provider.name).toBe('sampling');
    });
});
