import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatTemperature, formatHumidity, formatPrecipitation } from './formatters';

describe('formatters', () => {
  // Feature: weather-forecast-app, Propiedad 11: Formateo numérico correcto de los valores del clima
  it('Propiedad 11: Formateo numérico correcto de los valores del clima', () => {
    const floatArbitrary = fc.float({
      min: Math.fround(-1e20),
      max: Math.fround(1e20),
      noNaN: true,
      noDefaultInfinity: true,
    });

    fc.assert(
      fc.property(floatArbitrary, floatArbitrary, floatArbitrary, (temp, hum, prec) => {
        const tempFormatted = formatTemperature(temp);
        const humFormatted = formatHumidity(hum);
        const precFormatted = formatPrecipitation(prec);

        // Temperatura: Máximo 1 decimal + unidad "°C"
        expect(tempFormatted.endsWith(' °C')).toBe(true);
        const tempNumStr = tempFormatted.replace(' °C', '');
        const tempDecimals = tempNumStr.includes('.') ? tempNumStr.split('.')[1].length : 0;
        expect(tempDecimals).toBeLessThanOrEqual(1);

        // Humedad: Número entero (sin decimales) + unidad "%"
        expect(humFormatted.endsWith(' %')).toBe(true);
        const humNumStr = humFormatted.replace(' %', '');
        expect(humNumStr.includes('.')).toBe(false);

        // Precipitación: Máximo 1 decimal + unidad "mm"
        expect(precFormatted.endsWith(' mm')).toBe(true);
        const precNumStr = precFormatted.replace(' mm', '');
        const precDecimals = precNumStr.includes('.') ? precNumStr.split('.')[1].length : 0;
        expect(precDecimals).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  describe('Pruebas unitarias de formateo', () => {
    it('debe formatear valores específicos correctamente', () => {
      expect(formatTemperature(8.4)).toBe('8.4 °C');
      expect(formatTemperature(8.456)).toBe('8.5 °C');
      expect(formatHumidity(72.4)).toBe('72 %');
      expect(formatHumidity(72.6)).toBe('73 %');
      expect(formatPrecipitation(0)).toBe('0.0 mm');
      expect(formatPrecipitation(1.23)).toBe('1.2 mm');
    });
  });
});
