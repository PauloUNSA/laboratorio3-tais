import { ForecastClient } from '../clients/ForecastClient';
import { ForecastResult, IForecastService, WeatherData } from '../types';

export class ForecastService implements IForecastService {
  constructor(private client: ForecastClient = new ForecastClient()) {}

  async getForecast(lat: number, lon: number): Promise<ForecastResult> {
    let response: Response;
    try {
      response = await this.client.getForecast(lat, lon);
    } catch (err: any) {
      if (err?.name === 'TimeoutError') {
        return { success: false, error: { type: 'TIMEOUT' } };
      }
      return { success: false, error: { type: 'NETWORK_ERROR' } };
    }

    if (!response.ok) {
      return {
        success: false,
        error: { type: 'SERVICE_ERROR', statusCode: response.status },
      };
    }

    let body: any;
    try {
      body = await response.json();
    } catch {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    if (!('current' in body) || body.current === null || typeof body.current !== 'object' || Array.isArray(body.current)) {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    const { temperature_2m, relative_humidity_2m, precipitation } = body.current;

    const isInvalidNumber = (val: any) =>
      val === null || val === undefined || typeof val !== 'number' || Number.isNaN(val);

    if (
      isInvalidNumber(temperature_2m) ||
      isInvalidNumber(relative_humidity_2m) ||
      isInvalidNumber(precipitation)
    ) {
      return { success: false, error: { type: 'INCOMPLETE_DATA' } };
    }

    const weatherData: WeatherData = {
      temperature: temperature_2m,
      humidity: relative_humidity_2m,
      precipitation: precipitation,
    };

    return {
      success: true,
      data: weatherData,
    };
  }
}
