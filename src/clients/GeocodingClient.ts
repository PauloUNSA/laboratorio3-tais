export class GeocodingClient {
  private readonly baseUrl = 'https://geocoding-api.open-meteo.com/v1/search';

  buildUrl(cityName: string): string {
    return `${this.baseUrl}?name=${encodeURIComponent(cityName)}&count=1`;
  }

  async search(cityName: string, timeoutMs = 10000): Promise<Response> {
    const url = this.buildUrl(cityName);
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } catch (err: any) {
      if (timedOut || (err && (err.name === 'AbortError' || err.name === 'TimeoutError') && timedOut)) {
        const timeoutErr = new Error('Geocoding request timed out');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
