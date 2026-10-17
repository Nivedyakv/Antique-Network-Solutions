import {
  ComponentFixture,
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display the page heading', () => {
    const heading = element.querySelector('h1');

    expect(heading?.textContent?.trim())
      .toBe('Frontend Assignment');
  });

  it('should display the introductory text', () => {
    const paragraph = element.querySelector('p');

    expect(paragraph?.textContent?.trim())
      .toBe('Select a task to get started.');
  });

  it('should initially show the deferred placeholder', () => {
    expect(element.querySelector('.animate-pulse')).not.toBeNull();
    expect(element.querySelectorAll('a').length).toBe(0);
  });

  it('should display both task links after deferred content loads', async () => {
    const [deferBlock] = await fixture.getDeferBlocks();

    await deferBlock.render(DeferBlockState.Complete);
    fixture.detectChanges();

    const links = element.querySelectorAll<HTMLAnchorElement>('a');

    expect(links.length).toBe(2);

    expect(links[0].textContent?.trim())
      .toBe('Task 1 — Message Composer');
    expect(links[0].getAttribute('href')).toBe('/task-1');

    expect(links[1].textContent?.trim())
      .toBe('Task 2 — Contact Management');
    expect(links[1].getAttribute('href')).toBe('/task-2');

    expect(element.querySelector('.animate-pulse')).toBeNull();
  });
});