import {ComponentFixture,TestBed} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { TaskOne } from './task-one';
import { MessageComposer } from './message-composer/message-composer';
import { Breadcrumb } from '../../shared/components/breadcrumb/breadcrumb';

describe('TaskOne', () => {
  let fixture: ComponentFixture<TaskOne>;
  let component: TaskOne;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskOne],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskOne);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the page heading', () => {
    const heading = element.querySelector('h1');

    expect(heading?.textContent?.trim())
      .toBe('Customize Your Message');
  });

  it('should display the page description', () => {
    const description = element.querySelector('header p');
    const text = description?.textContent
      ?.replace(/\s+/g, ' ')
      .trim();

    expect(text).toBe(
      'Fill in the required details based on your selected ' +
      'template to complete the message setup.',
    );
  });

  it('should provide a back link to Home', () => {
    const backLink = element.querySelector<HTMLAnchorElement>(
      'a[aria-label="Back to Home"]',
    );

    expect(backLink).not.toBeNull();
    expect(backLink?.getAttribute('href')).toBe('/');
  });

  it('should pass breadcrumb items to the shared component', () => {
    const breadcrumb = fixture.debugElement
      .query(By.directive(Breadcrumb))
      .componentInstance as Breadcrumb;

    expect(breadcrumb.items()).toEqual([
      {
        label: 'Send Marketing Message',
        route: '/',
      },
      {
        label: 'Compose Message',
      },
    ]);
  });

  it('should display all selected-template details', () => {
    const details = Array.from(
      element.querySelectorAll('dl > div'),
    ).map((detail) => ({
      label: detail.querySelector('dt')?.textContent?.trim(),
      value: detail.querySelector('dd')?.textContent?.trim(),
    }));

    expect(details).toEqual([
      {
        label: 'Template Name',
        value: 'Diwali Sale',
      },
      {
        label: 'Template ID',
        value: '5798525851493',
      },
      {
        label: 'Message Type',
        value: 'Text and Rich Media',
      },
      {
        label: 'Language',
        value: 'English',
      },
    ]);
  });

  it('should render the message composer', () => {
    const composer = fixture.debugElement.query(
      By.directive(MessageComposer),
    );

    expect(composer).not.toBeNull();
  });
});