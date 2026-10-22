export class LoadingIndicator {
  public element: HTMLElement;

  constructor(private container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.id = 'loading-indicator';
    this.element.className = 'loading-indicator';
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-live', 'polite');
    this.element.innerHTML = `
      <div class="spinner" aria-hidden="true"></div>
      <span class="loading-text">Cargando pronóstico...</span>
    `;
    this.container.appendChild(this.element);
    this.hide();
  }

  public show(): void {
    this.element.style.display = 'flex';
  }

  public hide(): void {
    this.element.style.display = 'none';
  }

  public isVisible(): boolean {
    return this.element.style.display !== 'none';
  }
}
