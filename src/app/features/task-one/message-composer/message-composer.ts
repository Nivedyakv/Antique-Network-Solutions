import { Component, ElementRef, HostListener, ViewChild, computed, effect, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

interface ComposerField {
  key: string;
  label: string;
  placeholder: string;
  max: number;
  helper?: string;
  emoji?: boolean;
  info?: string;
}

interface ComposerSection {
  id: string;
  title: string;
  fields: ComposerField[];
}

interface PickerState {
  key: string;
  kind: 'variable' | 'emoji';
  left: number;
  top: number;
  above: boolean;
  arrowLeft: number;
}

function nonBlank(control: AbstractControl): ValidationErrors | null {
  return String(control.value ?? '').trim()
    ? null
    : { blank: true };
}

function mediaUrl(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();

  if (!value) {
    return null;
  }

  // Allow a standalone variable token.
  if (/^\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}$/.test(value)) {
    return null;
  }

  try {
    const normalized = value.replace(
      /\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/g,
      'value',
    );

    const url = new URL(normalized);

    return ['http:', 'https:'].includes(url.protocol) && url.hostname
      ? null
      : { url: true };
  } catch {
    return { url: true };
  }
}

@Component({
  selector: 'app-message-composer',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './message-composer.html',
  styleUrl: './message-composer.css',
})
export class MessageComposer {
  @ViewChild('composerForm')
  composerForm?: ElementRef<HTMLFormElement>;

  @ViewChild('pickerPanel')
  pickerPanel?: ElementRef<HTMLElement>;

  @ViewChild('previewPanel')
  previewPanel?: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      this.filteredAttributes();
      this.query();
      this.category();

      const current = this.picker();
      if (!current?.above) return;

      setTimeout(() => {
        const panel = this.pickerPanel?.nativeElement;
        const triggerEl = this.trigger;
        if (!panel || !triggerEl) return;

        const actualHeight = panel.getBoundingClientRect().height;
        const buttonRect = triggerEl.getBoundingClientRect();
        const snappedTop = window.scrollY + Math.max(12, buttonRect.top - actualHeight - 13);

        if (Math.abs(snappedTop - current.top) > 1) {
          this.picker.set({ ...current, top: snappedTop });
        }
      });
    });
  }

  readonly sections: ComposerSection[] = [
    {
      id: 'header',
      title: 'Header',
      fields: [
        {
          key: 'imageUrl',
          label: 'Image URL',
          placeholder: 'https://',
          max: 2048,
          helper:
            'Link to supported file format: .jpg, .jpeg, .png up to 5MB. ' +
            'Image may be cropped on certain devices. ' +
            'Recommended resolution: 1125 x 600 px.',
        },
        {
          key: 'videoUrl',
          label: 'Video URL',
          placeholder: 'https://',
          max: 2048,
          helper:
            'Link to supported file format: MP4 up to 16 MB. ' +
            'Video may be cropped on certain devices. ' +
            'Recommended resolution: 1125 x 600 px.',
        },
        {
          key: 'documentUrl',
          label: 'Document URL',
          placeholder: 'https://',
          max: 2048,
          helper: 'Link to supported file format: PDF up to 100MB.',
        },
      ],
    },
    {
      id: 'message',
      title: 'Message',
      fields: [
        {
          key: 'variable1',
          label: 'Variable {{1}}',
          placeholder: 'Enter variable content',
          max: 2048,
          emoji: true,
        },
        {
          key: 'variable2',
          label: 'Variable {{2}}',
          placeholder: 'Enter variable content',
          max: 2048,
          emoji: true,
        },
      ],
    },
    {
      id: 'buttons',
      title: 'Buttons',
      fields: [
        {
          key: 'yesPayload',
          label: '"Yes" button payload',
          placeholder: 'Enter the payload',
          max: 128,
          emoji: true,
          info: 'Value returned when the Yes button is selected.',
        },
        {
          key: 'noPayload',
          label: '"No" button payload',
          placeholder: 'Enter the payload',
          max: 128,
          emoji: true,
          info: 'Value returned when the No button is selected.',
        },
        {
          key: 'unsubscribePayload',
          label: '"Unsubscribe" button payload',
          placeholder: 'Enter the payload',
          max: 128,
          emoji: true,
          info: 'Value returned when the Unsubscribe button is selected.',
        },
        {
          key: 'websiteParameter',
          label: '"Visit website" URL parameter',
          placeholder: 'Enter the payload',
          max: 128,
          emoji: true,
          info: 'Dynamic parameter for the template website URL.',
        },
      ],
    },
  ];

  readonly coordinates = [
    {
      key: 'latitude',
      label: 'Location Latitude',
      min: -90,
      max: 90,
      helper: 'Latitude can be any number between -90 and 90',
    },
    {
      key: 'longitude',
      label: 'Location Longitude',
      min: -180,
      max: 180,
      helper: 'Longitude can be any number between -180 and 180',
    },
  ];

  readonly form = new FormGroup({
    imageUrl: new FormControl('', {
      nonNullable: true,
      validators: [mediaUrl, Validators.maxLength(2048)],
    }),
    videoUrl: new FormControl('', {
      nonNullable: true,
      validators: [mediaUrl, Validators.maxLength(2048)],
    }),
    documentUrl: new FormControl('', {
      nonNullable: true,
      validators: [mediaUrl, Validators.maxLength(2048)],
    }),
    latitude: new FormControl<number | null>(0, [
      Validators.required,
      Validators.min(-90),
      Validators.max(90),
    ]),
    longitude: new FormControl<number | null>(0, [
      Validators.required,
      Validators.min(-180),
      Validators.max(180),
    ]),
    variable1: new FormControl('', {
      nonNullable: true,
      validators: [nonBlank, Validators.maxLength(2048)],
    }),
    variable2: new FormControl('', {
      nonNullable: true,
      validators: [nonBlank, Validators.maxLength(2048)],
    }),
    yesPayload: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(128)],
    }),
    noPayload: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(128)],
    }),
    unsubscribePayload: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(128)],
    }),
    websiteParameter: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(128)],
    }),
  });

  readonly picker = signal<PickerState | null>(null);
  readonly query = signal('');
  readonly category = signal<'Standard' | 'Custom'>('Standard');
  readonly notice = signal('');

  readonly previewRows = signal<
    { label: string; value: string | number | null }[] | null
  >(null);

  readonly categories = ['Standard', 'Custom'] as const;

  readonly standardAttributes = [
    { label: 'First Name', token: 'first_name' },
    { label: 'Last Name', token: 'last_name' },
    { label: 'Address', token: 'address' },
    { label: 'City', token: 'city' },
    { label: 'Country', token: 'country' },
    { label: 'Gender', token: 'gender' },
  ];

  readonly customAttributes = [
    { label: 'Customer ID', token: 'customer_id' },
    { label: 'Order ID', token: 'order_id' },
    { label: 'Offer Code', token: 'offer_code' },
  ];

  readonly filteredAttributes = computed(() => {
    const attributes =
      this.category() === 'Standard'
        ? this.standardAttributes
        : this.customAttributes;

    const search = this.query().trim().toLowerCase();

    return attributes.filter(attribute =>
      attribute.label.toLowerCase().includes(search),
    );
  });

  readonly emojis = [
    '😊', '🎉', '✨', '👍', '❤️', '🙏',
    '🎁', '✅', '👋', '🔥', '💬', '🌟',
  ];

  readonly braces = '{}';

  private trigger: HTMLElement | null = null;

  private readonly caret = new Map<
    string,
    { start: number; end: number }
  >();

  textControl(key: string): FormControl<string> {
    return this.form.get(key) as FormControl<string>;
  }

  showError(key: string): boolean {
    const control = this.form.get(key);

    return !!control && control.invalid && control.touched;
  }

  errorMessage(field: ComposerField): string {
    const control = this.textControl(field.key);

    if (control.hasError('blank') || control.hasError('required')) {
      return 'Enter the variable content.';
    }

    if (control.hasError('maxlength')) {
      return `Use no more than ${field.max} characters.`;
    }

    if (control.hasError('url')) {
      return 'Enter a valid HTTP/HTTPS URL or a variable token.';
    }

    return 'Check this field.';
  }

  remember(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.caret.set(input.id, {
      start: input.selectionStart ?? input.value.length,
      end: input.selectionEnd ?? input.value.length,
    });
  }

  openPicker(
    key: string,
    kind: 'variable' | 'emoji',
    event: MouseEvent,
  ): void {
    if (
      this.picker()?.key === key &&
      this.picker()?.kind === kind
    ) {
      this.closePicker();
      return;
    }

    const button = (event.target as HTMLElement).closest('button');

    if (!button) {
      return;
    }

    this.trigger = button;

    const rect = button.getBoundingClientRect();
    const height = kind === 'variable' ? 280 : 145;

    const fitsBelow = rect.bottom + height + 8 <= window.innerHeight;
    const viewportTop = fitsBelow
      ? rect.bottom + 13
      : Math.max(12, rect.top - height - 8);

    const panelLeft = Math.max(
      12,
      Math.min(rect.right - 150, window.innerWidth - 254),
    );

    const buttonCentreX = rect.left + rect.width / 2;
    const arrowLeft = Math.min(230, Math.max(12, buttonCentreX - panelLeft));

    this.picker.set({
      key,
      kind,
      left: window.scrollX + panelLeft,
      top: window.scrollY + viewportTop,
      above: !fitsBelow,
      arrowLeft,
    });

    this.query.set('');
    this.category.set('Standard');

    setTimeout(() => {
      const panel = this.pickerPanel?.nativeElement;
      if (panel) {
        panel.querySelector<HTMLElement>('input,button')?.focus({ preventScroll: true });
        const current = this.picker();
        if (current?.above) {
          const actualHeight = panel.getBoundingClientRect().height;
          const buttonRect = button.getBoundingClientRect();
          this.picker.set({
            ...current,
            top: window.scrollY + Math.max(12, buttonRect.top - actualHeight - 8),
          });
        }
      }
    });
  }

  closePicker(): void {
    this.picker.set(null);
    this.trigger?.focus({ preventScroll: true });
  }

  insert(text: string): void {
    const picker = this.picker();

    if (!picker) {
      return;
    }

    const control = this.textControl(picker.key);

    const field = this.sections
      .flatMap(section => section.fields)
      .find(item => item.key === picker.key);

    if (!field) {
      return;
    }

    const position = this.caret.get(picker.key) ?? {
      start: control.value.length,
      end: control.value.length,
    };

    const nextValue =
      control.value.slice(0, position.start) +
      text +
      control.value.slice(position.end);

    if (nextValue.length > field.max) {
      this.notice.set(
        `This field allows up to ${field.max} characters.`,
      );
      return;
    }

    control.setValue(nextValue);
    control.markAsDirty();

    this.picker.set(null);
    this.notice.set('');

    const input = this.composerForm?.nativeElement
      .querySelector<HTMLInputElement>(`#${picker.key}`);

    const nextPosition = position.start + text.length;

    input?.focus({ preventScroll: true });
    input?.setSelectionRange(nextPosition, nextPosition);

    this.caret.set(picker.key, {
      start: nextPosition,
      end: nextPosition,
    });
  }

  reset(): void {
    this.form.reset({ latitude: 0, longitude: 0 });
    this.picker.set(null);
    this.previewRows.set(null);
    this.caret.clear();
    this.notice.set('Your message draft has been reset.');
  }

  submit(): void {
    this.picker.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.notice.set('Check the highlighted fields.');

      setTimeout(() => {
        this.composerForm?.nativeElement
          .querySelector<HTMLInputElement>(
            'input[aria-invalid="true"]',
          )
          ?.focus();
      });

      return;
    }

    this.notice.set('');

    const rows = this.sections
      .flatMap(section => section.fields)
      .map(field => ({
        label: field.label,
        value: this.textControl(field.key).value,
      }));

    this.previewRows.set([
      ...rows,
      {
        label: 'Location Latitude',
        value: this.form.controls.latitude.value,
      },
      {
        label: 'Location Longitude',
        value: this.form.controls.longitude.value,
      },
    ]);

    setTimeout(() => {
      this.previewPanel?.nativeElement
        .querySelector<HTMLButtonElement>('button')
        ?.focus();
    });
  }

  closePreview(): void {
    this.previewRows.set(null);

    this.composerForm?.nativeElement
      .querySelector<HTMLButtonElement>('[type="submit"]')
      ?.focus();
  }

  private trapFocus(event: KeyboardEvent, panel: HTMLElement): void {
    const elements = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled])',
      ),
    );

    const first = elements[0];
    const last = elements[elements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first?.focus();
    }
  }

  @HostListener('document:click', ['$event'])
  outsideClick(event: MouseEvent): void {
    const target = event.target as Node;

    if (
      this.picker() &&
      !this.pickerPanel?.nativeElement.contains(target) &&
      !this.trigger?.contains(target)
    ) {
      this.picker.set(null);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.picker.set(null);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.previewRows()) {
        this.closePreview();
      } else if (this.picker()) {
        this.closePicker();
      }

      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    if (this.previewRows() && this.previewPanel) {
      this.trapFocus(event, this.previewPanel.nativeElement);
    } else if (this.picker() && this.pickerPanel) {
      this.trapFocus(event, this.pickerPanel.nativeElement);
    }
  }
}