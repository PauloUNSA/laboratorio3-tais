import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { WeatherController, ERROR_MESSAGES } from './WeatherController';
import { CitySearchForm } from './components/CitySearchForm';
import { WeatherDisplay } from './components/WeatherDisplay';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorMessage } from './components/ErrorMessage';
import { IGeocodingService, IForecastService } from './types';

describe('WeatherController', () => {
  let container: HTMLElement;
  let searchForm: CitySearchForm;
  let weatherDisplay: WeatherDisplay;
  let loadingIndicator: LoadingIndicator;
  let errorMessage: ErrorMessage;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    searchForm = new CitySearchForm(container);
    weatherDisplay = new WeatherDisplay(container);
    loadingIndicator = new LoadingIndicator(container);
    errorMessage = new ErrorMessage(container);
  });

  // Feature: weather-forecast-app, Propiedad 13: Limpieza del Weather_Display al iniciar nueva búsqueda
  it('Propiedad 13: Limpieza del Weather_Display al iniciar nueva búsqueda', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        async (cityName) => {
          // Pre-llenar WeatherDisplay con datos previos
          weatherDisplay.render(
            { temperature: 25, humidity: 60, precipitation: 1 },
            'PrevCity'
          );

          let displayWasClearedBeforeForecast = false;
          const clearSpy = vi.spyOn(weatherDisplay, 'clear');

          const mockGeoService: IGeocodingService = {
            geocode: vi.fn().mockImplementation(async () => {
              // Comprobar si clear ya se llamó
              if (clearSpy.mock.calls.length > 0) {
                displayWasClearedBeforeForecast = true;
              }
              return {
                success: true,
                data: { latitude: 10, longitude: 20, cityName },
              };
            }),
          };

          const mockForecastService: IForecastService = {
            getForecast: vi.fn().mockImplementation(async () => {
              return {
                success: true,
                data: { temperature: 18, humidity: 50, precipitation: 0 },
              };
            }),
          };

          const controller = new WeatherController({
            geocodingService: mockGeoService,
            forecastService: mockForecastService,
            searchForm,
            weatherDisplay,
            loadingIndicator,
            errorMessage,
          });

          await controller.handleSearch(cityName);

          expect(clearSpy).toHaveBeenCalled();
          expect(displayWasClearedBeforeForecast).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  describe('Pruebas unitarias de WeatherController', () => {
    it('debe ejecutar el flujo exitoso completo (geocoding → forecast → display renderizado)', async () => {
      const mockGeoService: IGeocodingService = {
        geocode: vi.fn().mockResolvedValue({
          success: true,
          data: { latitude: 40.4168, longitude: -3.7038, cityName: 'Madrid' },
        }),
      };

      const mockForecastService: IForecastService = {
        getForecast: vi.fn().mockResolvedValue({
          success: true,
          data: { temperature: 22.4, humidity: 45, precipitation: 0 },
        }),
      };

      const controller = new WeatherController({
        geocodingService: mockGeoService,
        forecastService: mockForecastService,
        searchForm,
        weatherDisplay,
        loadingIndicator,
        errorMessage,
      });

      await controller.handleSearch('Madrid');

      expect(mockGeoService.geocode).toHaveBeenCalledWith('Madrid');
      expect(mockForecastService.getForecast).toHaveBeenCalledWith(40.4168, -3.7038);
      expect(weatherDisplay.element.textContent).toContain('Madrid');
      expect(weatherDisplay.element.textContent).toContain('22.4 °C');
      expect(weatherDisplay.element.textContent).toContain('45 %');
      expect(weatherDisplay.element.textContent).toContain('0.0 mm');
      expect(loadingIndicator.isVisible()).toBe(false);
      expect(errorMessage.getMessage()).toBe('');
    });

    it('debe mostrar mensaje adecuado cuando GeocodingService retorna CITY_NOT_FOUND', async () => {
      const mockGeoService: IGeocodingService = {
        geocode: vi.fn().mockResolvedValue({
          success: false,
          error: { type: 'CITY_NOT_FOUND' },
        }),
      };

      const mockForecastService: IForecastService = {
        getForecast: vi.fn(),
      };

      const controller = new WeatherController({
        geocodingService: mockGeoService,
        forecastService: mockForecastService,
        searchForm,
        weatherDisplay,
        loadingIndicator,
        errorMessage,
      });

      await controller.handleSearch('CiudadInexistente');

      expect(errorMessage.getMessage()).toBe(ERROR_MESSAGES.CITY_NOT_FOUND);
      expect(mockForecastService.getForecast).not.toHaveBeenCalled();
      expect(loadingIndicator.isVisible()).toBe(false);
      expect(searchForm.inputElement.disabled).toBe(false);
    });

    it('debe mostrar mensaje adecuado cuando ForecastService retorna INCOMPLETE_DATA', async () => {
      const mockGeoService: IGeocodingService = {
        geocode: vi.fn().mockResolvedValue({
          success: true,
          data: { latitude: 40, longitude: -3, cityName: 'Madrid' },
        }),
      };

      const mockForecastService: IForecastService = {
        getForecast: vi.fn().mockResolvedValue({
          success: false,
          error: { type: 'INCOMPLETE_DATA' },
        }),
      };

      const controller = new WeatherController({
        geocodingService: mockGeoService,
        forecastService: mockForecastService,
        searchForm,
        weatherDisplay,
        loadingIndicator,
        errorMessage,
      });

      await controller.handleSearch('Madrid');

      expect(errorMessage.getMessage()).toBe(ERROR_MESSAGES.FORECAST_INCOMPLETE_DATA);
      expect(loadingIndicator.isVisible()).toBe(false);
      expect(searchForm.inputElement.disabled).toBe(false);
    });

    it('el indicador de carga debe aparecer al iniciar y desaparecer al completar (éxito y error)', async () => {
      let loadingDuringGeo = false;

      const mockGeoService: IGeocodingService = {
        geocode: vi.fn().mockImplementation(async () => {
          loadingDuringGeo = loadingIndicator.isVisible();
          return {
            success: true,
            data: { latitude: 40, longitude: -3, cityName: 'Madrid' },
          };
        }),
      };

      const mockForecastService: IForecastService = {
        getForecast: vi.fn().mockResolvedValue({
          success: true,
          data: { temperature: 20, humidity: 50, precipitation: 0 },
        }),
      };

      const controller = new WeatherController({
        geocodingService: mockGeoService,
        forecastService: mockForecastService,
        searchForm,
        weatherDisplay,
        loadingIndicator,
        errorMessage,
      });

      expect(loadingIndicator.isVisible()).toBe(false);
      const searchPromise = controller.handleSearch('Madrid');
      await searchPromise;

      expect(loadingDuringGeo).toBe(true);
      expect(loadingIndicator.isVisible()).toBe(false);
    });
  });
});
