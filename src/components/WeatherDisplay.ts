import { WeatherData } from '../types';
import { formatTemperature, formatHumidity, formatPrecipitation } from '../utils/formatters';

export class WeatherDisplay {
  public element: HTMLElement;

  constructor(private container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.id = 'weather-display';
    this.element.className = 'weather-display';
    this.container.appendChild(this.element);
    this.clear();
  }

  public render(weather: WeatherData, returnedCityName: string, fallbackCityName = ''): void {
    const finalCityName =
      returnedCityName && returnedCityName.trim().length > 0
        ? returnedCityName
        : fallbackCityName;

    const tempStr = formatTemperature(weather.temperature);
    const humStr = formatHumidity(weather.humidity);
    const precStr = formatPrecipitation(weather.precipitation);

    this.element.innerHTML = `
      <div class="weather-card">
        <h2 class="city-name" id="weather-city-name"></h2>
        <div class="weather-metrics">
          <div class="metric-item temperature">
            <span class="metric-label">Temperatura</span>
            <span class="metric-value" id="weather-temperature"></span>
          </div>
          <div class="metric-item humidity">
            <span class="metric-label">Humedad</span>
            <span class="metric-value" id="weather-humidity"></span>
          </div>
          <div class="metric-item precipitation">
            <span class="metric-label">Precipitación</span>
            <span class="metric-value" id="weather-precipitation"></span>
          </div>
        </div>
      </div>
    `;

    const cityNameEl = this.element.querySelector('#weather-city-name');
    const tempEl = this.element.querySelector('#weather-temperature');
    const humEl = this.element.querySelector('#weather-humidity');
    const precEl = this.element.querySelector('#weather-precipitation');

    if (cityNameEl) cityNameEl.textContent = finalCityName;
    if (tempEl) tempEl.textContent = tempStr;
    if (humEl) humEl.textContent = humStr;
    if (precEl) precEl.textContent = precStr;

    this.element.style.display = 'block';
  }

  public clear(): void {
    this.element.innerHTML = '';
    this.element.style.display = 'none';
  }
}
