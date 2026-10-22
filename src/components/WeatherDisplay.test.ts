import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { WeatherDisplay } from './WeatherDisplay';
import { formatTemperature, formatHumidity, formatPrecipitation } from '../utils/formatters';

describe('WeatherDisplay', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  // Feature: weather-forecast-app, Propiedad 12: Weather_Display contiene todos los campos con sus unidades
  it('Propiedad 12: Weather_Display contiene todos los campos con sus unidades', () => {
    const floatGen = fc.float({
      min: Math.fround(-1e20),
      max: Math.fround(1e20),
      noNaN: true,
      noDefaultInfinity: true,
    });

    fc.assert(
      fc.property(
        fc.record({
          temperature: floatGen,
          humidity: floatGen,
          precipitation: floatGen,
        }),
        fc.string({ minLength: 1 }),
        (weather, cityName) => {
          const testContainer = document.createElement('div');
          const display = new WeatherDisplay(testContainer);

          display.render(weather, cityName);

          const html = display.element.textContent || '';
          const tempFormatted = formatTemperature(weather.temperature);
          const humFormatted = formatHumidity(weather.humidity);
          const precFormatted = formatPrecipitation(weather.precipitation);

          // Contiene el nombre de ciudad
          expect(html).toContain(cityName);

          // Contiene los valores y unidades correspondientes
          expect(html).toContain(tempFormatted);
          expect(html).toContain('°C');

          expect(html).toContain(humFormatted);
          expect(html).toContain('%');

          expect(html).toContain(precFormatted);
          expect(html).toContain('mm');
        }
      ),
      { numRuns: 100 }
    );
  });

  describe('Pruebas unitarias de WeatherDisplay', () => {
    it('debe usar fallbackCityName si el nombre retornado está vacío', () => {
      const display = new WeatherDisplay(container);
      display.render(
        { temperature: 20, humidity: 50, precipitation: 0 },
        '',
        'CiudadFallback'
      );

      const cityNameEl = display.element.querySelector('#weather-city-name');
      expect(cityNameEl?.textContent).toBe('CiudadFallback');
    });

    it('debe limpiar el display al llamar clear()', () => {
      const display = new WeatherDisplay(container);
      display.render(
        { temperature: 20, humidity: 50, precipitation: 0 },
        'Madrid'
      );
      expect(display.element.style.display).not.toBe('none');

      display.clear();
      expect(display.element.innerHTML).toBe('');
      expect(display.element.style.display).toBe('none');
    });
  });
});
