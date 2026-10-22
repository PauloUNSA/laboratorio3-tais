import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { GeocodingService } from './GeocodingService';
import { GeocodingClient } from '../clients/GeocodingClient';

describe('GeocodingService', () => {
  // Feature: weather-forecast-app, Propiedad 4: Extracción de coordenadas del primer resultado
  it('Propiedad 4: Extracción de coordenadas del primer resultado', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.float({ noNaN: true, noDefaultInfinity: true }),
          longitude: fc.float({ noNaN: true, noDefaultInfinity: true }),
          name: fc.string(),
        }),
        async (firstResult) => {
          const mockClient = {
            search: vi.fn().mockResolvedValue(
              new Response(
                JSON.stringify({
                  results: [firstResult, { latitude: 0, longitude: 0, name: 'other' }],
                }),
                { status: 200 }
              )
            ),
          } as unknown as GeocodingClient;

          const service = new GeocodingService(mockClient);
          const result = await service.geocode('AnyCity');

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.latitude === firstResult.latitude).toBe(true);
            expect(result.data.longitude === firstResult.longitude).toBe(true);
            expect(result.data.cityName).toBe(firstResult.name);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: weather-forecast-app, Propiedad 5: Validación de campos de coordenadas faltantes
  it('Propiedad 5: Validación de campos de coordenadas faltantes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: fc.oneof(fc.constant(null), fc.constant(undefined)),
          longitude: fc.oneof(fc.constant(null), fc.constant(undefined)),
          name: fc.string(),
        }),
        async (incompleteResult) => {
          const mockClient = {
            search: vi.fn().mockResolvedValue(
              new Response(
                JSON.stringify({
                  results: [incompleteResult],
                }),
                { status: 200 }
              )
            ),
          } as unknown as GeocodingClient;

          const service = new GeocodingService(mockClient);
          const result = await service.geocode('AnyCity');

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.type).toBe('CITY_NOT_FOUND');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: weather-forecast-app, Propiedad 8 (parte Geocoding): Respuestas HTTP no-2xx siempre generan error
  it('Propiedad 8 (parte Geocoding): Respuestas HTTP no-2xx siempre generan error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 300, max: 599 }),
        async (statusCode) => {
          const mockClient = {
            search: vi.fn().mockResolvedValue(
              new Response(
                statusCode === 204 || statusCode === 304 ? null : JSON.stringify({ error: 'Server error' }),
                { status: statusCode }
              )
            ),
          } as unknown as GeocodingClient;

          const service = new GeocodingService(mockClient);
          const result = await service.geocode('AnyCity');

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.type).toBe('SERVICE_ERROR');
            if (result.error.type === 'SERVICE_ERROR') {
              expect(result.error.statusCode).toBe(statusCode);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  describe('Pruebas unitarias', () => {
    it('debe retornar CITY_NOT_FOUND cuando la respuesta tiene 0 resultados', async () => {
      const mockClient = {
        search: vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ results: [] }), { status: 200 })
        ),
      } as unknown as GeocodingClient;

      const service = new GeocodingService(mockClient);
      const result = await service.geocode('UnknownCity');

      expect(result).toEqual({
        success: false,
        error: { type: 'CITY_NOT_FOUND' },
      });
    });

    it('debe retornar NETWORK_ERROR ante un fallo de red', async () => {
      const mockClient = {
        search: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
      } as unknown as GeocodingClient;

      const service = new GeocodingService(mockClient);
      const result = await service.geocode('AnyCity');

      expect(result).toEqual({
        success: false,
        error: { type: 'NETWORK_ERROR' },
      });
    });

    it('debe retornar TIMEOUT cuando ocurre un error de tiempo de espera', async () => {
      const timeoutErr = new Error('Geocoding request timed out');
      timeoutErr.name = 'TimeoutError';
      const mockClient = {
        search: vi.fn().mockRejectedValue(timeoutErr),
      } as unknown as GeocodingClient;

      const service = new GeocodingService(mockClient);
      const result = await service.geocode('AnyCity');

      expect(result).toEqual({
        success: false,
        error: { type: 'TIMEOUT' },
      });
    });

    it('debe retornar respuesta exitosa con un resultado válido', async () => {
      const mockClient = {
        search: vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              results: [
                {
                  id: 1,
                  name: 'Madrid',
                  latitude: 40.4165,
                  longitude: -3.70256,
                },
              ],
            }),
            { status: 200 }
          )
        ),
      } as unknown as GeocodingClient;

      const service = new GeocodingService(mockClient);
      const result = await service.geocode('Madrid');

      expect(result).toEqual({
        success: true,
        data: {
          latitude: 40.4165,
          longitude: -3.70256,
          cityName: 'Madrid',
        },
      });
    });

    it('debe retornar INVALID_RESPONSE cuando el cuerpo no es JSON válido', async () => {
      const mockClient = {
        search: vi.fn().mockResolvedValue(
          new Response('Not a json response', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          })
        ),
      } as unknown as GeocodingClient;

      const service = new GeocodingService(mockClient);
      const result = await service.geocode('InvalidCity');

      expect(result).toEqual({
        success: false,
        error: { type: 'INVALID_RESPONSE' },
      });
    });
  });
});
