import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Breadcrumb, BreadcrumbItem } from './breadcrumb';

describe('Breadcrumb', () => {
  let fixture: ComponentFixture<Breadcrumb>;
  let element: HTMLElement;

  const items: readonly BreadcrumbItem[] = [
    {
      label: 'Home',
      route: '/',
    },
    {
      label: 'Contact Management',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breadcrumb],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Breadcrumb);
    element = fixture.nativeElement as HTMLElement;

    // Set the required signal input before rendering.
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render an accessible breadcrumb navigation', () => {
    const navigation = element.querySelector(
      'nav[aria-label="Breadcrumb"]',
    );

    expect(navigation).not.toBeNull();
  });

  it('should render all breadcrumb labels in order', () => {
    const labels = Array.from(
      element.querySelectorAll('ol > li'),
    ).map((item) =>
      item.querySelector('a, span')?.textContent?.trim(),
    );

    expect(labels).toEqual([
      'Home',
      'Contact Management',
    ]);
  });

  it('should render a link for a preceding item with a route', () => {
    const link = element.querySelector<HTMLAnchorElement>('a');

    expect(link?.textContent?.trim()).toBe('Home');
    expect(link?.getAttribute('href')).toBe('/');
  });

  it('should mark only the final item as the current page', () => {
    const currentItems = element.querySelectorAll(
      '[aria-current="page"]',
    );

    expect(currentItems.length).toBe(1);
    expect(currentItems[0].textContent?.trim())
      .toBe('Contact Management');
    expect(element.querySelector('a')?.hasAttribute('aria-current'))
      .toBeFalse();
  });

  it('should not render the final item as a link even with a route', () => {
    fixture.componentRef.setInput('items', [
      { label: 'Home', route: '/' },
      { label: 'Contacts', route: '/task-2' },
    ]);
    fixture.detectChanges();

    const lastItem = element.querySelector('li:last-child');

    expect(lastItem?.querySelector('a')).toBeNull();
    expect(
      lastItem?.querySelector('[aria-current="page"]')
        ?.textContent?.trim(),
    ).toBe('Contacts');
  });

  it('should render a preceding item without a route as plain text', () => {
    fixture.componentRef.setInput('items', [
      { label: 'Tasks' },
      { label: 'Compose Message' },
    ]);
    fixture.detectChanges();

    const firstItem = element.querySelector('li');

    expect(firstItem?.querySelector('a')).toBeNull();
    expect(firstItem?.querySelector('span')?.textContent?.trim())
      .toBe('Tasks');
    expect(
      firstItem?.querySelector('span')?.hasAttribute('aria-current'),
    ).toBeFalse();
  });

  it('should render separators only between items', () => {
    fixture.componentRef.setInput('items', [
      { label: 'Home', route: '/' },
      { label: 'Tasks', route: '/tasks' },
      { label: 'Compose Message' },
    ]);
    fixture.detectChanges();

    const separators = element.querySelectorAll('li > svg');

    expect(separators.length).toBe(2);
    expect(
      element.querySelector('li:last-child > svg'),
    ).toBeNull();

    separators.forEach((separator) => {
      expect(separator.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('should render a single item without a link or separator', () => {
    fixture.componentRef.setInput('items', [
      { label: 'Home', route: '/' },
    ]);
    fixture.detectChanges();

    expect(element.querySelectorAll('li').length).toBe(1);
    expect(element.querySelector('a')).toBeNull();
    expect(element.querySelector('svg')).toBeNull();
    expect(
      element.querySelector('[aria-current="page"]')
        ?.textContent?.trim(),
    ).toBe('Home');
  });

  it('should handle an empty items array', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    expect(element.querySelectorAll('li').length).toBe(0);
    expect(element.querySelector('a')).toBeNull();
    expect(element.querySelector('[aria-current]')).toBeNull();
  });

  it('should update when the input changes', () => {
    fixture.componentRef.setInput('items', [
      { label: 'Home', route: '/' },
      { label: 'Compose Message' },
    ]);
    fixture.detectChanges();

    expect(
      element.querySelector('[aria-current="page"]')
        ?.textContent?.trim(),
    ).toBe('Compose Message');

    expect(element.textContent)
      .not.toContain('Contact Management');
  });
});