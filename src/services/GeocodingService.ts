import { GeocodingClient } from '../clients/GeocodingClient';
import { Coordinates, GeocodingResult, IGeocodingService } from '../types';

export class GeocodingService implements IGeocodingService {
  constructor(private client: GeocodingClient = new GeocodingClient()) {}

  async geocode(cityName: string): Promise<GeocodingResult> {
    let response: Response;
    try {
      response = await this.client.search(cityName);
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

    if (!body || typeof body !== 'object') {
      return { success: false, error: { type: 'INVALID_RESPONSE' } };
    }

    if (!body.results || !Array.isArray(body.results) || body.results.length === 0) {
      return { success: false, error: { type: 'CITY_NOT_FOUND' } };
    }

    const first = body.results[0];
    if (
      !first ||
      typeof first !== 'object' ||
      first.latitude === null ||
      first.latitude === undefined ||
      first.longitude === null ||
      first.longitude === undefined ||
      typeof first.latitude !== 'number' ||
      typeof first.longitude !== 'number' ||
      Number.isNaN(first.latitude) ||
      Number.isNaN(first.longitude)
    ) {
      return { success: false, error: { type: 'CITY_NOT_FOUND' } };
    }

    const coordinates: Coordinates = {
      latitude: first.latitude,
      longitude: first.longitude,
      cityName: first.name ?? '',
    };

    return {
      success: true,
      data: coordinates,
    };
  }
}
