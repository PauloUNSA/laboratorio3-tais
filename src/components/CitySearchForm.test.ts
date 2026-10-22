import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { CitySearchForm } from './CitySearchForm';

describe('CitySearchForm', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  // Feature: weather-forecast-app, Propiedad 1: Rechazo de entradas de solo whitespace
  it('Propiedad 1: Rechazo de entradas de solo whitespace', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r')),
        (whitespaceStr) => {
          const testContainer = document.createElement('div');
          const onSearch = vi.fn();
          const form = new CitySearchForm(testContainer, { onSearch });

          form.setInputValue(whitespaceStr);
          form.handleSubmit();

          expect(onSearch).not.toHaveBeenCalled();
          expect(form.validationErrorElement.textContent).toBe('El nombre de la ciudad es obligatorio.');
          expect(form.validationErrorElement.style.display).not.toBe('none');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: weather-forecast-app, Propiedad 2: Trim del nombre de ciudad antes de enviar
  it('Propiedad 2: Trim del nombre de ciudad antes de enviar', () => {
    const whitespaceGen = fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'));
    const nonWhitespaceGen = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);

    const paddedCityGen = fc
      .tuple(whitespaceGen, nonWhitespaceGen, whitespaceGen)
      .map(([left, core, right]) => `${left}${core}${right}`);

    fc.assert(
      fc.property(paddedCityGen, (cityName) => {
        const testContainer = document.createElement('div');
        const onSearch = vi.fn();
        const form = new CitySearchForm(testContainer, { onSearch });

        form.setInputValue(cityName);
        form.handleSubmit();

        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith(cityName.trim());
      }),
      { numRuns: 100 }
    );
  });

  describe('Pruebas unitarias de CitySearchForm', () => {
    it('debe renderizar el campo City_Input con maxlength=100', () => {
      const form = new CitySearchForm(container);
      expect(form.inputElement).not.toBeNull();
      expect(form.inputElement.maxLength).toBe(100);
      expect(form.inputElement.id).toBe('city-input');
    });

    it('debe iniciar búsqueda con clic en el botón de envío', () => {
      const onSearch = vi.fn();
      const form = new CitySearchForm(container, { onSearch });

      form.setInputValue('Barcelona');
      form.submitButton.click();

      expect(onSearch).toHaveBeenCalledWith('Barcelona');
    });

    it('debe iniciar búsqueda al presionar la tecla Enter en City_Input', () => {
      const onSearch = vi.fn();
      const form = new CitySearchForm(container, { onSearch });

      form.setInputValue('Sevilla');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      form.inputElement.dispatchEvent(enterEvent);

      expect(onSearch).toHaveBeenCalledWith('Sevilla');
    });

    it('City_Input debe permanecer accesible tras un intento fallido', () => {
      const onSearch = vi.fn();
      const form = new CitySearchForm(container, { onSearch });

      form.setInputValue('   ');
      form.handleSubmit();

      expect(form.inputElement.disabled).toBe(false);
      expect(form.validationErrorElement.textContent).toBe('El nombre de la ciudad es obligatorio.');
    });
  });
});
