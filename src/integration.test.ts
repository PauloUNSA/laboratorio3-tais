import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeocodingClient } from './clients/GeocodingClient';
import { ForecastClient } from './clients/ForecastClient';
import { GeocodingService } from './services/GeocodingService';
import { ForecastService } from './services/ForecastService';
import { CitySearchForm } from './components/CitySearchForm';
import { WeatherDisplay } from './components/WeatherDisplay';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorMessage } from './components/ErrorMessage';
import { WeatherController, ERROR_MESSAGES } from './WeatherController';

describe('End-to-End Integration Tests', () => {
  let searchContainer: HTMLElement;
  let loadingContainer: HTMLElement;
  let errorContainer: HTMLElement;
  let weatherContainer: HTMLElement;

  let geocodingClient: GeocodingClient;
  let forecastClient: ForecastClient;
  let geocodingService: GeocodingService;
  let forecastService: ForecastService;
  let searchForm: CitySearchForm;
  let weatherDisplay: WeatherDisplay;
  let loadingIndicator: LoadingIndicator;
  let errorMessage: ErrorMessage;
  let controller: WeatherController;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="search-container"></div>
      <div id="loading-container"></div>
      <div id="error-container"></div>
      <div id="weather-container"></div>
    `;

    searchContainer = document.getElementById('search-container')!;
    loadingContainer = document.getElementById('loading-container')!;
    errorContainer = document.getElementById('error-container')!;
    weatherContainer = document.getElementById('weather-container')!;

    geocodingClient = new GeocodingClient();
    forecastClient = new ForecastClient();
    geocodingService = new GeocodingService(geocodingClient);
    forecastService = new ForecastService(forecastClient);

    searchForm = new CitySearchForm(searchContainer);
    weatherDisplay = new WeatherDisplay(weatherContainer);
    loadingIndicator = new LoadingIndicator(loadingContainer);
    errorMessage = new ErrorMessage(errorContainer);

    controller = new WeatherController({
      geocodingService,
      forecastService,
      searchForm,
      weatherDisplay,
      loadingIndicator,
      errorMessage,
    });
    expect(controller).toBeDefined();
  });

  it('flujo exitoso: búsqueda -> geocoding -> forecast -> datos visibles en el DOM', async () => {
    // Mock Geocoding API response
    vi.spyOn(geocodingClient, 'search').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              id: 3117735,
              name: 'Madrid',
              latitude: 40.4165,
              longitude: -3.70256,
              country: 'España',
            },
          ],
        }),
        { status: 200 }
      )
    );

    // Mock Forecast API response
    vi.spyOn(forecastClient, 'getForecast').mockResolvedValue(
      new Response(
        JSON.stringify({
          latitude: 40.42,
          longitude: -3.7,
          current: {
            temperature_2m: 18.4,
            relative_humidity_2m: 62.3,
            precipitation: 0.0,
          },
        }),
        { status: 200 }
      )
    );

    // User types in the input and clicks the submit button
    searchForm.inputElement.value = '   Madrid   ';
    searchForm.submitButton.click();

    // Wait for the async flow to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify DOM updates
    const cityNameEl = document.getElementById('weather-city-name');
    const tempEl = document.getElementById('weather-temperature');
    const humEl = document.getElementById('weather-humidity');
    const precEl = document.getElementById('weather-precipitation');

    expect(cityNameEl?.textContent).toBe('Madrid');
    expect(tempEl?.textContent).toBe('18.4 °C');
    expect(humEl?.textContent).toBe('62 %');
    expect(precEl?.textContent).toBe('0.0 mm');

    // Indicator hidden, error message empty, input remains accessible
    expect(loadingIndicator.isVisible()).toBe(false);
    expect(errorMessage.getMessage()).toBe('');
    expect(searchForm.inputElement.disabled).toBe(false);
  });

  it('flujo de error: geocoding no encuentra la ciudad -> mensaje visible, City_Input accesible', async () => {
    vi.spyOn(geocodingClient, 'search').mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), { status: 200 })
    );

    searchForm.inputElement.value = 'NonExistentPlaceXYZ';
    searchForm.submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(errorMessage.getMessage()).toBe(ERROR_MESSAGES.CITY_NOT_FOUND);
    expect(loadingIndicator.isVisible()).toBe(false);
    expect(weatherDisplay.element.style.display).toBe('none');
    expect(searchForm.inputElement.disabled).toBe(false);
  });

  it('flujo de error: Forecast API falla con 500 -> mensaje visible, City_Input accesible', async () => {
    vi.spyOn(geocodingClient, 'search').mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [{ name: 'Paris', latitude: 48.85, longitude: 2.35 }],
        }),
        { status: 200 }
      )
    );

    vi.spyOn(forecastClient, 'getForecast').mockResolvedValue(
      new Response(JSON.stringify({ error: true }), { status: 500 })
    );

    searchForm.inputElement.value = 'Paris';
    searchForm.submitButton.click();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(errorMessage.getMessage()).toBe(ERROR_MESSAGES.FORECAST_SERVICE_ERROR);
    expect(loadingIndicator.isVisible()).toBe(false);
    expect(weatherDisplay.element.style.display).toBe('none');
    expect(searchForm.inputElement.disabled).toBe(false);
  });
});
