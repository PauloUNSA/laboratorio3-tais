export interface CitySearchFormOptions {
  onSearch?: (cityName: string) => void;
}

export class CitySearchForm {
  public formElement: HTMLFormElement;
  public inputElement: HTMLInputElement;
  public submitButton: HTMLButtonElement;
  public validationErrorElement: HTMLElement;
  public onSearch?: (cityName: string) => void;

  constructor(private container: HTMLElement, options?: CitySearchFormOptions) {
    this.onSearch = options?.onSearch;

    this.formElement = document.createElement('form');
    this.formElement.id = 'search-form';
    this.formElement.className = 'search-form';

    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.id = 'city-input';
    this.inputElement.className = 'city-input';
    this.inputElement.name = 'cityName';
    this.inputElement.placeholder = 'Ingresa el nombre de una ciudad...';
    this.inputElement.maxLength = 100;
    this.inputElement.setAttribute('aria-label', 'Nombre de la ciudad');

    this.submitButton = document.createElement('button');
    this.submitButton.type = 'submit';
    this.submitButton.id = 'search-button';
    this.submitButton.className = 'search-button';
    this.submitButton.textContent = 'Buscar Clima';

    this.validationErrorElement = document.createElement('div');
    this.validationErrorElement.id = 'validation-error';
    this.validationErrorElement.className = 'validation-error';
    this.validationErrorElement.setAttribute('role', 'alert');
    this.validationErrorElement.setAttribute('aria-live', 'polite');

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper';
    inputWrapper.appendChild(this.inputElement);
    inputWrapper.appendChild(this.submitButton);

    this.formElement.appendChild(inputWrapper);
    this.formElement.appendChild(this.validationErrorElement);
    this.container.appendChild(this.formElement);

    this.attachEvents();
  }

  private attachEvents(): void {
    this.formElement.addEventListener('submit', (e: Event) => {
      e.preventDefault();
      this.handleSubmit();
    });

    this.inputElement.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleSubmit();
      }
    });

    this.inputElement.addEventListener('input', () => {
      if (this.validationErrorElement.textContent) {
        this.clearValidation();
      }
    });
  }

  public handleSubmit(): void {
    const raw = this.inputElement.value;
    const trimmed = raw.trim();

    if (!trimmed) {
      this.showValidation('El nombre de la ciudad es obligatorio.');
      return;
    }

    this.clearValidation();
    if (this.onSearch) {
      this.onSearch(trimmed);
    }
  }

  public showValidation(message: string): void {
    this.validationErrorElement.textContent = message;
    this.validationErrorElement.style.display = 'block';
  }

  public clearValidation(): void {
    this.validationErrorElement.textContent = '';
    this.validationErrorElement.style.display = 'none';
  }

  public getInputValue(): string {
    return this.inputElement.value;
  }

  public setInputValue(val: string): void {
    this.inputElement.value = val;
  }
}
