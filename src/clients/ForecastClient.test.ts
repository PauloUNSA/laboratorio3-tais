import { describe, it, expect, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { ForecastClient } from './ForecastClient';

describe('ForecastClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Feature: weather-forecast-app, Propiedad 6: Construcción correcta de la URL de Pronóstico
  it('Propiedad 6: Construcción correcta de la URL de Pronóstico', () => {
    const client = new ForecastClient();
    fc.assert(
      fc.property(
        fc.tuple(
          fc.float({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true }),
          fc.float({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true })
        ),
        ([lat, lon]) => {
          const urlString = client.buildUrl(lat, lon);
          const url = new URL(urlString);

          expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
          expect(url.searchParams.get('latitude')).toBe(lat.toString());
          expect(url.searchParams.get('longitude')).toBe(lon.toString());
          expect(url.searchParams.get('current')).toBe('temperature_2m,relative_humidity_2m,precipitation');
          expect(urlString).toContain('current=temperature_2m,relative_humidity_2m,precipitation');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('debe lanzar TimeoutError cuando la solicitud excede el tiempo de espera', async () => {
    const client = new ForecastClient();
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

    await expect(client.getForecast(40, -3, 10)).rejects.toThrow('Forecast request timed out');
  });
});
