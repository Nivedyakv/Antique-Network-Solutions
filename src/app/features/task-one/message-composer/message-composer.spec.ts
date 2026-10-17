import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import { MessageComposer } from './message-composer';

describe('MessageComposer', () => {
  let fixture: ComponentFixture<MessageComposer>;
  let component: MessageComposer;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageComposer],
    }).compileComponents();

    fixture = TestBed.createComponent(MessageComposer);
    component = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;

    fixture.detectChanges();
  });

  afterEach(async () => {
    // Let the component's deferred focus callbacks finish.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });

  function fillValidForm(): void {
    component.form.patchValue({
      variable1: 'Hello customer',
      variable2: 'Diwali offer',
      latitude: 10,
      longitude: 76,
    });
  }

  function selectPicker(
    key: string,
    kind: 'variable' | 'emoji' = 'variable',
  ): void {
    component.picker.set({
      key,
      kind,
      left: 0,
      top: 0,
      above: false,
      arrowLeft: 12,
    });
  }

  describe('Initial state', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize coordinates to zero', () => {
      expect(component.form.controls.latitude.value).toBe(0);
      expect(component.form.controls.longitude.value).toBe(0);
    });

    it('should initially have no picker or preview open', () => {
      expect(component.picker()).toBeNull();
      expect(component.previewRows()).toBeNull();
      expect(component.notice()).toBe('');
    });

    it('should render the configured section headings', () => {
      const headings = Array.from(
        element.querySelectorAll('h2'),
      ).map((heading) => heading.textContent?.trim());

      expect(headings).toEqual([
        'Header',
        'Message',
        'Buttons',
      ]);
    });
  });

  describe('Form validation', () => {
    it('should reject empty required variables', () => {
      expect(component.form.controls.variable1.invalid).toBeTrue();
      expect(component.form.controls.variable2.invalid).toBeTrue();
    });

    it('should reject whitespace-only variables', () => {
      component.form.controls.variable1.setValue('   ');

      expect(
        component.form.controls.variable1.hasError('blank'),
      ).toBeTrue();
    });

    it('should accept a valid form', () => {
      fillValidForm();

      expect(component.form.valid).toBeTrue();
    });

    it('should allow empty optional media URLs', () => {
      expect(component.form.controls.imageUrl.valid).toBeTrue();
      expect(component.form.controls.videoUrl.valid).toBeTrue();
      expect(component.form.controls.documentUrl.valid).toBeTrue();
    });

    it('should accept an HTTPS media URL', () => {
      component.form.controls.imageUrl.setValue(
        'https://example.com/image.png',
      );

      expect(component.form.controls.imageUrl.valid).toBeTrue();
    });

    it('should accept a standalone variable token', () => {
      component.form.controls.imageUrl.setValue('{{image_url}}');

      expect(component.form.controls.imageUrl.valid).toBeTrue();
    });

    it('should accept a URL containing a variable token', () => {
      component.form.controls.imageUrl.setValue(
        'https://example.com/{{customer_id}}.png',
      );

      expect(component.form.controls.imageUrl.valid).toBeTrue();
    });

    it('should reject unsupported URL protocols', () => {
      component.form.controls.imageUrl.setValue(
        'ftp://example.com/image.png',
      );

      expect(
        component.form.controls.imageUrl.hasError('url'),
      ).toBeTrue();
    });

    it('should reject malformed URLs', () => {
      component.form.controls.imageUrl.setValue('not-a-url');

      expect(
        component.form.controls.imageUrl.hasError('url'),
      ).toBeTrue();
    });

    it('should enforce the variable character limit', () => {
      component.form.controls.variable1.setValue(
        'a'.repeat(2049),
      );

      expect(
        component.form.controls.variable1.hasError('maxlength'),
      ).toBeTrue();
    });

    it('should enforce the button payload character limit', () => {
      component.form.controls.yesPayload.setValue(
        'a'.repeat(129),
      );

      expect(
        component.form.controls.yesPayload.hasError('maxlength'),
      ).toBeTrue();
    });

    it('should accept coordinate boundary values', () => {
      component.form.controls.latitude.setValue(-90);
      component.form.controls.longitude.setValue(180);

      expect(component.form.controls.latitude.valid).toBeTrue();
      expect(component.form.controls.longitude.valid).toBeTrue();
    });

    it('should reject coordinates outside their ranges', () => {
      component.form.controls.latitude.setValue(91);
      component.form.controls.longitude.setValue(-181);

      expect(
        component.form.controls.latitude.hasError('max'),
      ).toBeTrue();

      expect(
        component.form.controls.longitude.hasError('min'),
      ).toBeTrue();
    });

    it('should require coordinates', () => {
      component.form.controls.latitude.setValue(null);

      expect(
        component.form.controls.latitude.hasError('required'),
      ).toBeTrue();
    });

    it('should show errors only after a control is touched', () => {
      expect(component.showError('variable1')).toBeFalse();

      component.form.controls.variable1.markAsTouched();

      expect(component.showError('variable1')).toBeTrue();
    });
  });

  describe('Attribute filtering', () => {
    it('should initially display standard attributes', () => {
      expect(component.filteredAttributes())
        .toEqual(component.standardAttributes);
    });

    it('should search attributes case-insensitively', () => {
      component.query.set(' FIRST ');

      expect(component.filteredAttributes()).toEqual([
        {
          label: 'First Name',
          token: 'first_name',
        },
      ]);
    });

    it('should display custom attributes when selected', () => {
      component.category.set('Custom');

      expect(component.filteredAttributes())
        .toEqual(component.customAttributes);
    });

    it('should return no attributes for an unmatched search', () => {
      component.query.set('unmatched-search');

      expect(component.filteredAttributes()).toEqual([]);
    });
  });

  describe('Picker and insertion', () => {
    it('should open and toggle the picker from its trigger', () => {
      const trigger = element.querySelector<HTMLButtonElement>(
        'button[aria-label="Choose variable for Image URL"]',
      );

      expect(trigger).not.toBeNull();

      trigger!.click();
      fixture.detectChanges();

      expect(component.picker()?.key).toBe('imageUrl');
      expect(component.picker()?.kind).toBe('variable');

      trigger!.click();

      expect(component.picker()).toBeNull();
    });

    it('should append a variable when no caret position is saved', () => {
      component.form.controls.variable1.setValue('Hello ');
      selectPicker('variable1');

      component.insert('{{first_name}}');

      expect(component.form.controls.variable1.value)
        .toBe('Hello {{first_name}}');
      expect(component.form.controls.variable1.dirty).toBeTrue();
      expect(component.picker()).toBeNull();
    });

    it('should replace selected text and restore the caret', () => {
      component.form.controls.variable1.setValue('Hello customer');
      fixture.detectChanges();

      const input = element.querySelector<HTMLInputElement>(
        '#variable1',
      )!;

      input.setSelectionRange(6, 14);
      input.dispatchEvent(new Event('select'));

      selectPicker('variable1');
      component.insert('{{first_name}}');
      fixture.detectChanges();

      expect(component.form.controls.variable1.value)
        .toBe('Hello {{first_name}}');

      expect(document.activeElement).toBe(input);
      expect(input.selectionStart).toBe(20);
      expect(input.selectionEnd).toBe(20);
    });

    it('should insert an emoji into the selected field', () => {
      component.form.controls.variable2.setValue('Offer ');
      selectPicker('variable2', 'emoji');

      component.insert('🎉');

      expect(component.form.controls.variable2.value)
        .toBe('Offer 🎉');
      expect(component.picker()).toBeNull();
    });

    it('should prevent insertion beyond the field limit', () => {
      const original = 'a'.repeat(128);

      component.form.controls.yesPayload.setValue(original);
      selectPicker('yesPayload');

      component.insert('x');

      expect(component.form.controls.yesPayload.value)
        .toBe(original);
      expect(component.notice())
        .toBe('This field allows up to 128 characters.');
      expect(component.picker()).not.toBeNull();
    });

    it('should close the picker on Escape', () => {
      selectPicker('variable1');

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape' }),
      );

      expect(component.picker()).toBeNull();
    });

    it('should close the picker when the window resizes', () => {
      selectPicker('variable1');

      window.dispatchEvent(new Event('resize'));

      expect(component.picker()).toBeNull();
    });

    it('should close the picker on an outside click', () => {
      selectPicker('variable1');
      fixture.detectChanges();

      document.body.click();

      expect(component.picker()).toBeNull();
    });
  });

  describe('Submission and preview', () => {
    it('should prevent preview when the form is invalid', () => {
      component.submit();

      expect(component.previewRows()).toBeNull();
      expect(component.notice())
        .toBe('Check the highlighted fields.');
      expect(component.form.controls.variable1.touched).toBeTrue();
      expect(component.form.controls.variable2.touched).toBeTrue();
    });

    it('should create preview rows for valid input', () => {
      fillValidForm();

      component.submit();

      expect(component.previewRows()).toContain({
        label: 'Variable {{1}}',
        value: 'Hello customer',
      });

      expect(component.previewRows()).toContain({
        label: 'Location Latitude',
        value: 10,
      });

      expect(component.previewRows()).toContain({
        label: 'Location Longitude',
        value: 76,
      });

      expect(component.notice()).toBe('');
    });

    it('should render the preview dialog after submission', () => {
      fillValidForm();

      component.submit();
      fixture.detectChanges();

      const preview = element.querySelector(
        '[role="dialog"][aria-labelledby="draft-preview-title"]',
      );

      expect(preview).not.toBeNull();
      expect(preview?.textContent)
        .toContain('This preview does not send a message.');
    });

    it('should close the preview and focus the submit button', () => {
      fillValidForm();
      component.submit();
      fixture.detectChanges();

      component.closePreview();
      fixture.detectChanges();

      expect(component.previewRows()).toBeNull();

      expect(document.activeElement).toBe(
        element.querySelector('button[type="submit"]'),
      );
    });

    it('should close the preview on Escape', () => {
      fillValidForm();
      component.submit();
      fixture.detectChanges();

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape' }),
      );

      expect(component.previewRows()).toBeNull();
    });
  });

  describe('Reset', () => {
    it('should clear values, preview, picker, and dirty state', () => {
      fillValidForm();
      component.form.markAsDirty();
      component.submit();
      selectPicker('variable1');

      component.reset();

      expect(component.form.controls.variable1.value).toBe('');
      expect(component.form.controls.variable2.value).toBe('');
      expect(component.form.controls.latitude.value).toBe(0);
      expect(component.form.controls.longitude.value).toBe(0);
      expect(component.form.pristine).toBeTrue();
      expect(component.form.untouched).toBeTrue();
      expect(component.picker()).toBeNull();
      expect(component.previewRows()).toBeNull();
      expect(component.notice())
        .toBe('Your message draft has been reset.');
    });
  });
});