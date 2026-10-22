export interface Coordinates {
  latitude: number;
  longitude: number;
  cityName: string;
}

export type GeocodingError =
  | { type: 'CITY_NOT_FOUND' }
  | { type: 'NETWORK_ERROR' }
  | { type: 'TIMEOUT' }
  | { type: 'SERVICE_ERROR'; statusCode: number }
  | { type: 'INVALID_RESPONSE' };

export type GeocodingResult =
  | { success: true; data: Coordinates }
  | { success: false; error: GeocodingError };

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
}

export type ForecastError =
  | { type: 'NETWORK_ERROR' }
  | { type: 'TIMEOUT' }
  | { type: 'SERVICE_ERROR'; statusCode: number }
  | { type: 'INCOMPLETE_DATA' }
  | { type: 'INVALID_RESPONSE' };

export type ForecastResult =
  | { success: true; data: WeatherData }
  | { success: false; error: ForecastError };

export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; cityName: string; weather: WeatherData }
  | { status: 'error'; message: string };

export interface IGeocodingService {
  geocode(cityName: string): Promise<GeocodingResult>;
}

export interface IForecastService {
  getForecast(lat: number, lon: number): Promise<ForecastResult>;
}
