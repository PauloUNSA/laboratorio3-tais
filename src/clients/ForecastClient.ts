export class ForecastClient {
  private readonly baseUrl = 'https://api.open-meteo.com/v1/forecast';

  buildUrl(lat: number, lon: number): string {
    return `${this.baseUrl}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation`;
  }

  async getForecast(lat: number, lon: number, timeoutMs = 10000): Promise<Response> {
    const url = this.buildUrl(lat, lon);
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
        const timeoutErr = new Error('Forecast request timed out');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
