import { GeocodingClient } from './clients/GeocodingClient';
import { ForecastClient } from './clients/ForecastClient';
import { GeocodingService } from './services/GeocodingService';
import { ForecastService } from './services/ForecastService';
import { CitySearchForm } from './components/CitySearchForm';
import { WeatherDisplay } from './components/WeatherDisplay';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorMessage } from './components/ErrorMessage';
import { WeatherController } from './WeatherController';

export function initializeApp(): {
  controller: WeatherController;
  searchForm: CitySearchForm;
  weatherDisplay: WeatherDisplay;
  loadingIndicator: LoadingIndicator;
  errorMessage: ErrorMessage;
} {
  const searchContainer = document.getElementById('search-container') || document.body;
  const loadingContainer = document.getElementById('loading-container') || document.body;
  const errorContainer = document.getElementById('error-container') || document.body;
  const weatherContainer = document.getElementById('weather-container') || document.body;

  const geocodingClient = new GeocodingClient();
  const forecastClient = new ForecastClient();

  const geocodingService = new GeocodingService(geocodingClient);
  const forecastService = new ForecastService(forecastClient);

  const searchForm = new CitySearchForm(searchContainer);
  const weatherDisplay = new WeatherDisplay(weatherContainer);
  const loadingIndicator = new LoadingIndicator(loadingContainer);
  const errorMessage = new ErrorMessage(errorContainer);

  const controller = new WeatherController({
    geocodingService,
    forecastService,
    searchForm,
    weatherDisplay,
    loadingIndicator,
    errorMessage,
  });

  return {
    controller,
    searchForm,
    weatherDisplay,
    loadingIndicator,
    errorMessage,
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
  });
}
