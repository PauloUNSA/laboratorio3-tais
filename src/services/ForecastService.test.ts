import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { ForecastService } from './ForecastService';
import { ForecastClient } from '../clients/ForecastClient';

describe('ForecastService', () => {
  // Feature: weather-forecast-app, Propiedad 7: Round-trip de parseo de la respuesta Forecast → WeatherData
  it('Propiedad 7: Round-trip de parseo de la respuesta Forecast → WeatherData', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          temperature_2m: fc.float({ noNaN: true, noDefaultInfinity: true }),
          relative_humidity_2m: fc.float({ noNaN: true, noDefaultInfinity: true }),
          precipitation: fc.float({ noNaN: true, noDefaultInfinity: true }),
        }),
        async (current) => {
          const mockClient = {
            getForecast: vi.fn().mockResolvedValue(
              new Response(
                JSON.stringify({
                  current,
                }),
                { status: 200 }
              )
            ),
          } as unknown as ForecastClient;

          const service = new ForecastService(mockClient);
          const result = await service.getForecast(40, -3);

          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.temperature === current.temperature_2m).toBe(true);
            expect(result.data.humidity === current.relative_humidity_2m).toBe(true);
            expect(result.data.precipitation === current.precipitation).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: weather-forecast-app, Propiedad 10: Campos meteorológicos faltantes generan error de datos incompletos
  it('Propiedad 10: Campos meteorológicos faltantes generan error de datos incompletos', async () => {
    // Generate an invalid field scenario where at least one field is missing or null or undefined
    const missingValueArbitrary = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.string()
    );

    const incompleteCurrentArbitrary = fc
      .record(
        {
          tempPresent: fc.boolean(),
          tempVal: fc.float({ noNaN: true, noDefaultInfinity: true }),
          tempMissing: missingValueArbitrary,
          humPresent: fc.boolean(),
          humVal: fc.float({ noNaN: true, noDefaultInfinity: true }),
          humMissing: missingValueArbitrary,
          precPresent: fc.boolean(),
          precVal: fc.float({ noNaN: true, noDefaultInfinity: true }),
          precMissing: missingValueArbitrary,
        }
      )
      .filter((rec) => !rec.tempPresent || !rec.humPresent || !rec.precPresent)
      .map((rec) => {
        const obj: any = {};
        if (rec.tempPresent) obj.temperature_2m = rec.tempVal;
        else if (rec.tempMissing !== undefined) obj.temperature_2m = rec.tempMissing;

        if (rec.humPresent) obj.relative_humidity_2m = rec.humVal;
        else if (rec.humMissing !== undefined) obj.relative_humidity_2m = rec.humMissing;

        if (rec.precPresent) obj.precipitation = rec.precVal;
        else if (rec.precMissing !== undefined) obj.precipitation = rec.precMissing;

        return obj;
      });

    await fc.assert(
      fc.asyncProperty(incompleteCurrentArbitrary, async (current) => {
        const mockClient = {
          getForecast: vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ current }), { status: 200 })
          ),
        } as unknown as ForecastClient;

        const service = new ForecastService(mockClient);
        const result = await service.getForecast(40, -3);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('INCOMPLETE_DATA');
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: weather-forecast-app, Propiedad 8 (parte Forecast): Respuestas HTTP no-2xx siempre generan error
  it('Propiedad 8 (parte Forecast): Respuestas HTTP no-2xx siempre generan error', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 300, max: 599 }), async (statusCode) => {
        const mockClient = {
          getForecast: vi.fn().mockResolvedValue(
            new Response(
              statusCode === 204 || statusCode === 304 ? null : JSON.stringify({ error: 'Server error' }),
              { status: statusCode }
            )
          ),
        } as unknown as ForecastClient;

        const service = new ForecastService(mockClient);
        const result = await service.getForecast(40, -3);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('SERVICE_ERROR');
          if (result.error.type === 'SERVICE_ERROR') {
            expect(result.error.statusCode).toBe(statusCode);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: weather-forecast-app, Propiedad 9 (parte Forecast): Respuestas 2xx con cuerpo inválido generan error
  it('Propiedad 9 (parte Forecast): Respuestas 2xx con cuerpo inválido generan error', async () => {
    // Generate responses that are not valid Forecast JSON (e.g. without 'current' object or invalid JSON string)
    const invalidBodyArbitrary = fc.oneof(
      fc.string().filter((s) => {
        try {
          const parsed = JSON.parse(s);
          return typeof parsed !== 'object' || parsed === null || !('current' in parsed);
        } catch {
          return true; // Malformed JSON
        }
      }),
      fc.record({
        otherField: fc.string(),
      }).map((rec) => JSON.stringify(rec))
    );

    await fc.assert(
      fc.asyncProperty(invalidBodyArbitrary, async (bodyString) => {
        const mockClient = {
          getForecast: vi.fn().mockResolvedValue(
            new Response(bodyString, {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          ),
        } as unknown as ForecastClient;

        const service = new ForecastService(mockClient);
        const result = await service.getForecast(40, -3);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('INVALID_RESPONSE');
        }
      }),
      { numRuns: 100 }
    );
  });

  describe('Pruebas unitarias', () => {
    it('debe retornar NETWORK_ERROR ante un fallo de red', async () => {
      const mockClient = {
        getForecast: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
      } as unknown as ForecastClient;

      const service = new ForecastService(mockClient);
      const result = await service.getForecast(40, -3);

      expect(result).toEqual({
        success: false,
        error: { type: 'NETWORK_ERROR' },
      });
    });

    it('debe retornar TIMEOUT cuando ocurre un error de tiempo de espera', async () => {
      const timeoutErr = new Error('Forecast request timed out');
      timeoutErr.name = 'TimeoutError';
      const mockClient = {
        getForecast: vi.fn().mockRejectedValue(timeoutErr),
      } as unknown as ForecastClient;

      const service = new ForecastService(mockClient);
      const result = await service.getForecast(40, -3);

      expect(result).toEqual({
        success: false,
        error: { type: 'TIMEOUT' },
      });
    });

    it('debe retornar respuesta exitosa con todos los campos presentes', async () => {
      const mockClient = {
        getForecast: vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              latitude: 40.4,
              longitude: -3.7,
              current: {
                time: '2024-01-15T12:00',
                temperature_2m: 14.5,
                relative_humidity_2m: 65,
                precipitation: 0.2,
              },
            }),
            { status: 200 }
          )
        ),
      } as unknown as ForecastClient;

      const service = new ForecastService(mockClient);
      const result = await service.getForecast(40.4, -3.7);

      expect(result).toEqual({
        success: true,
        data: {
          temperature: 14.5,
          humidity: 65,
          precipitation: 0.2,
        },
      });
    });
  });
});
