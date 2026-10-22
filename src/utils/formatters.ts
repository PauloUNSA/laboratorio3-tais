export function formatTemperature(value: number): string {
  return `${value.toFixed(1)} °C`;
}

export function formatHumidity(value: number): string {
  return `${Math.round(value)} %`;
}

export function formatPrecipitation(value: number): string {
  return `${value.toFixed(1)} mm`;
}
