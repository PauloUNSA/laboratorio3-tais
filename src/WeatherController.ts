import { CitySearchForm } from './components/CitySearchForm';
import { WeatherDisplay } from './components/WeatherDisplay';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorMessage } from './components/ErrorMessage';
import { IGeocodingService, IForecastService, GeocodingError, ForecastError } from './types';

export interface WeatherControllerOptions {
  geocodingService: IGeocodingService;
  forecastService: IForecastService;
  searchForm: CitySearchForm;
  weatherDisplay: WeatherDisplay;
  loadingIndicator: LoadingIndicator;
  errorMessage: ErrorMessage;
}

export const ERROR_MESSAGES = {
  VALIDATION_EMPTY: 'El nombre de la ciudad es obligatorio.',
  CITY_NOT_FOUND: 'No se encontró la ciudad ingresada. Verifica el nombre e intenta de nuevo.',
  GEOCODING_NETWORK_ERROR: 'El servicio de geocodificación no está disponible. Verifica tu conexión.',
  GEOCODING_TIMEOUT: 'El servicio de geocodificación no respondió a tiempo.',
  GEOCODING_SERVICE_ERROR: 'El servicio de geocodificación retornó un error.',
  GEOCODING_INVALID_RESPONSE: 'Los datos recibidos del servicio de geocodificación no son válidos.',
  FORECAST_NETWORK_ERROR: 'El servicio de pronóstico no está disponible. Verifica tu conexión.',
  FORECAST_TIMEOUT: 'El servicio de pronóstico no respondió a tiempo.',
  FORECAST_SERVICE_ERROR: 'El servicio de pronóstico retornó un error.',
  FORECAST_INCOMPLETE_DATA: 'Los datos meteorológicos recibidos están incompletos.',
  FORECAST_INVALID_RESPONSE: 'Los datos recibidos del servicio de pronóstico no son válidos.',
} as const;

export class WeatherController {
  private geocodingService: IGeocodingService;
  private forecastService: IForecastService;
  private searchForm: CitySearchForm;
  private weatherDisplay: WeatherDisplay;
  private loadingIndicator: LoadingIndicator;
  private errorMessage: ErrorMessage;

  constructor(options: WeatherControllerOptions) {
    this.geocodingService = options.geocodingService;
    this.forecastService = options.forecastService;
    this.searchForm = options.searchForm;
    this.weatherDisplay = options.weatherDisplay;
    this.loadingIndicator = options.loadingIndicator;
    this.errorMessage = options.errorMessage;

    // Conectar el callback de búsqueda si el formulario existe
    this.searchForm.onSearch = (cityName: string) => {
      this.handleSearch(cityName);
    };
  }

  public async handleSearch(cityName: string): Promise<void> {
    const trimmed = cityName.trim();
    if (!trimmed) {
      this.errorMessage.show(ERROR_MESSAGES.VALIDATION_EMPTY);
      return;
    }

    // 1. Limpieza de estado previo
    this.weatherDisplay.clear();
    this.errorMessage.clear();
    this.loadingIndicator.show();

    try {
      // 2. Geocodificación
      const geoResult = await this.geocodingService.geocode(trimmed);
      if (!geoResult.success) {
        this.loadingIndicator.hide();
        this.showGeocodingError(geoResult.error);
        return;
      }

      const { latitude, longitude, cityName: returnedCityName } = geoResult.data;

      // 3. Consulta de pronóstico
      const forecastResult = await this.forecastService.getForecast(latitude, longitude);
      this.loadingIndicator.hide();

      if (!forecastResult.success) {
        this.showForecastError(forecastResult.error);
        return;
      }

      // 4. Renderizar datos
      this.weatherDisplay.render(forecastResult.data, returnedCityName, trimmed);
    } catch {
      this.loadingIndicator.hide();
      this.errorMessage.show('Ocurrió un error inesperado. Por favor intenta de nuevo.');
    }
  }

  private showGeocodingError(error: GeocodingError): void {
    switch (error.type) {
      case 'CITY_NOT_FOUND':
        this.errorMessage.show(ERROR_MESSAGES.CITY_NOT_FOUND);
        break;
      case 'NETWORK_ERROR':
        this.errorMessage.show(ERROR_MESSAGES.GEOCODING_NETWORK_ERROR);
        break;
      case 'TIMEOUT':
        this.errorMessage.show(ERROR_MESSAGES.GEOCODING_TIMEOUT);
        break;
      case 'SERVICE_ERROR':
        this.errorMessage.show(ERROR_MESSAGES.GEOCODING_SERVICE_ERROR);
        break;
      case 'INVALID_RESPONSE':
        this.errorMessage.show(ERROR_MESSAGES.GEOCODING_INVALID_RESPONSE);
        break;
    }
  }

  private showForecastError(error: ForecastError): void {
    switch (error.type) {
      case 'NETWORK_ERROR':
        this.errorMessage.show(ERROR_MESSAGES.FORECAST_NETWORK_ERROR);
        break;
      case 'TIMEOUT':
        this.errorMessage.show(ERROR_MESSAGES.FORECAST_TIMEOUT);
        break;
      case 'SERVICE_ERROR':
        this.errorMessage.show(ERROR_MESSAGES.FORECAST_SERVICE_ERROR);
        break;
      case 'INCOMPLETE_DATA':
        this.errorMessage.show(ERROR_MESSAGES.FORECAST_INCOMPLETE_DATA);
        break;
      case 'INVALID_RESPONSE':
        this.errorMessage.show(ERROR_MESSAGES.FORECAST_INVALID_RESPONSE);
        break;
    }
  }
}
