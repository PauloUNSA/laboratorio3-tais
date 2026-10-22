# laboratorio3-tais

Single Page Application (SPA) para consultar el pronóstico del clima actual de cualquier ciudad utilizando la Geocoding API y la Forecast API de Open-Meteo sin backend intermedio.

Desarrollada con **Spec-Driven Development (SDD)**, TypeScript estricto, HTML/CSS vanilla y una suite completa de pruebas unitarias, de integración y basadas en propiedades (*property-based testing*) con **Vitest** y **fast-check**.

## Autor
- **Estudiante:** Paulo Andrei Hidalgo Chinchay
- **Curso/Actividad:** Laboratorio 3: Spec-Driven Development (SDD) - Caso Práctico

## Documentación del Proyecto
- [Documento de Requisitos (requirements.md)](./requirements.md)
- [Documento de Diseño Técnico (design.md)](./design.md)
- [Plan de Tareas de Implementación (tasks.md)](./tasks.md)

## Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo local
npm run dev

# 3. Ejecutar todas las pruebas (38 pruebas: unitarias, integración y propiedades)
npm test

# 4. Compilar proyecto para producción
npm run build
```

## Arquitectura

```
Presentación (CitySearchForm, WeatherDisplay, LoadingIndicator, ErrorMessage)
       │
       ▼
WeatherController (Orquestador de flujo y estado)
       │
       ├──────────────────────────────┐
       ▼                              ▼
GeocodingService              ForecastService
       ▼                              ▼
GeocodingClient               ForecastClient
       ▼                              ▼
Open-Meteo Geocoding API      Open-Meteo Forecast API
```
