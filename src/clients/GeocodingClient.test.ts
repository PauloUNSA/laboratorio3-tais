import { describe, it, expect, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { GeocodingClient } from './GeocodingClient';

describe('GeocodingClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Feature: weather-forecast-app, Propiedad 3: Construcción correcta de la URL de Geocodificación
  it('Propiedad 3: Construcción correcta de la URL de Geocodificación', () => {
    const client = new GeocodingClient();
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (cityName) => {
        const urlString = client.buildUrl(cityName);
        const url = new URL(urlString);

        expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
        expect(url.searchParams.get('count')).toBe('1');
        expect(url.searchParams.get('name')).toBe(cityName);
        expect(urlString).toContain(`name=${encodeURIComponent(cityName)}`);
        expect(urlString).toContain('count=1');
      }),
      { numRuns: 100 }
    );
  });

  it('debe lanzar TimeoutError cuando la solicitud excede el tiempo de espera', async () => {
    const client = new GeocodingClient();
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, options?: RequestInit) => {
      return new Promise((_, reject) => {
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            const abortErr = new Error('The operation was aborted');
            abortErr.name = 'AbortError';
            reject(abortErr);
          });
        }
      });
    });

    await expect(client.search('Paris', 10)).rejects.toThrow('Geocoding request timed out');
  });
});
