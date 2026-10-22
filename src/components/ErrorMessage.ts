export class ErrorMessage {
  public element: HTMLElement;

  constructor(private container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.id = 'error-message';
    this.element.className = 'error-message';
    this.element.setAttribute('role', 'alert');
    this.element.setAttribute('aria-live', 'assertive');
    this.container.appendChild(this.element);
    this.clear();
  }

  public show(message: string): void {
    this.element.textContent = message;
    this.element.style.display = 'block';
  }

  public clear(): void {
    this.element.textContent = '';
    this.element.style.display = 'none';
  }

  public getMessage(): string {
    return this.element.textContent || '';
  }
}
