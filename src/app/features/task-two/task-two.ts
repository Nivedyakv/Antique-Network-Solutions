import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, TimeoutError, finalize } from 'rxjs';

import { Breadcrumb, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb';
import { ContactApiService } from './contact-api.service';
import { Contact, ContactPayload } from './contact.model';
import { integer, localToday, nonBlank, validDate } from './contact.validators';

@Component({
  selector: 'app-task-two',
  standalone: true,
  imports: [ReactiveFormsModule, Breadcrumb, RouterLink],
  templateUrl: './task-two.html',
  styleUrl: './task-two.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTwo {
  private readonly api = inject(ContactApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('editor')
  editor?: ElementRef<HTMLElement>;

  @ViewChild('deleteDialog')
  deleteDialog?: ElementRef<HTMLDialogElement>;

  @ViewChild('discardDialog')
  discardDialog?: ElementRef<HTMLDialogElement>;

  private detailRequest?: Subscription;

  readonly breadcrumbs: readonly BreadcrumbItem[] = [
    { label: 'Home', route: '/' },
    { label: 'Contact Management' },
  ];
  readonly today = localToday();
  readonly contacts = signal<Contact[]>([]);
  readonly loading = signal(false);
  readonly loadingDetail = signal(false);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly loadError = signal('');
  readonly deleteError = signal('');
  readonly notice = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  readonly mode = signal<'create' | 'edit' | 'view'>('create');
  readonly selectedId = signal<string | null>(null);
  readonly deleteTarget = signal<Contact | null>(null);
  readonly pendingAction = signal<(() => void) | null>(null);
  readonly search = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly page = signal(1);
  readonly pageSize = 4;

  readonly mutationPending = computed(() => this.saving() || this.deletingId() !== null);
  readonly busy = computed(() => this.loading() || this.loadingDetail() || this.mutationPending());

  readonly filtered = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.statusFilter();

    return this.contacts().filter((contact) =>
      (status === 'all' || contact.status === (status === 'active')) &&
      `${contact.first_name} ${contact.last_name} ${contact.emailId} ${contact.mobilenumber}`
        .toLowerCase()
        .includes(query),
    );
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  readonly currentPage = computed(() => Math.min(this.page(), this.pageCount()));
  readonly visibleContacts = computed(() =>
    this.filtered().slice(
      (this.currentPage() - 1) * this.pageSize,
      this.currentPage() * this.pageSize,
    ),
  );
  readonly activeCount = computed(() => this.contacts().filter((contact) => contact.status).length);

  readonly textFields = [
    {
      key: 'first_name',
      label: 'First name',
      type: 'text',
      autocomplete: 'given-name',
      max: 50,
      placeholder: 'First name',
    },
    {
      key: 'last_name',
      label: 'Last name',
      type: 'text',
      autocomplete: 'family-name',
      max: 50,
      placeholder: 'Last name',
    },
    {
      key: 'emailId',
      label: 'Email address',
      type: 'email',
      autocomplete: 'email',
      max: 254,
      placeholder: 'name@example.com',
    },
    {
      key: 'mobilenumber',
      label: 'Mobile number',
      type: 'tel',
      autocomplete: 'tel-national',
      max: 10,
      placeholder: '10-digit mobile number',
    },
    {
      key: 'pan_no',
      label: 'PAN number',
      type: 'text',
      autocomplete: 'off',
      max: 10,
      placeholder: 'ABCDE1234F',
    },
    {
      key: 'adhaar_no',
      label: 'Aadhaar number',
      type: 'text',
      autocomplete: 'off',
      max: 12,
      placeholder: '12-digit Aadhaar number',
    },
  ];

  readonly form = this.fb.group({
    createdAt: this.fb.nonNullable.control(this.today, [Validators.required, validDate]),
    first_name: this.fb.nonNullable.control('', [nonBlank, Validators.maxLength(50)]),
    last_name: this.fb.nonNullable.control('', [nonBlank, Validators.maxLength(50)]),
    emailId: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(254),
    ]),
    age: this.fb.control<number | null>(null, [
      Validators.required,
      integer,
      Validators.min(1),
      Validators.max(120),
    ]),
    gender: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^(Male|Female|Other)$/),
    ]),
    mobilenumber: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^[6-9]\d{9}$/),
    ]),
    pan_no: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^[A-Z]{5}\d{4}[A-Z]$/i),
    ]),
    adhaar_no: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.pattern(/^[2-9]\d{11}$/),
    ]),
    status: this.fb.nonNullable.control(true),
  });

  constructor() {
    this.loadContacts();
  }

  /**
   * Loads the list of contacts from the API.
   */
  loadContacts(): void {
    if (this.busy()) {
      return;
    }

    this.loading.set(true);
    this.loadError.set('');

    this.api
      .getAll()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (contacts) => this.contacts.set(contacts),
        error: (error) => this.loadError.set(this.errorText(error)),
      });
  }

  /**
   * Sets the search query for filtering contacts.
   * @param value The search query string.
   */
  setSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  /**
   * Sets the status filter for displaying contacts.
   * @param value The status filter value ('all', 'active', or 'inactive').
   */
  setStatus(value: string): void {
    if (value === 'all' || value === 'active' || value === 'inactive') {
      this.statusFilter.set(value);
      this.page.set(1);
    }
  }

  /**
   * Navigates to the specified page number for paginated contact display.
   * @param value The page number to navigate to.
   */
  newContact(): void {
    if (this.mutationPending()) {
      return;
    }

    const proceed = () => {
      this.detailRequest?.unsubscribe();
      this.loadingDetail.set(false);
      this.mode.set('create');
      this.selectedId.set(null);
      this.form.reset({ createdAt: localToday(), age: null, gender: '', status: true });
    };

    if (this.allowDiscard(proceed)) {
      proceed();
    }
  }

  /**
   * Opens the contact editor in either 'edit' or 'view' mode for the specified contact.
   * @param contact The contact to edit or view.
   * @param mode The mode to open the editor in ('edit' or 'view').
   */
  openContact(contact: Contact, mode: 'edit' | 'view'): void {
    if (this.loading() || this.mutationPending()) {
      return;
    }

    const proceed = () => {
      this.detailRequest?.unsubscribe();
      this.loadingDetail.set(true);
      this.notice.set(null);

      this.detailRequest = this.api
        .getById(contact.id)
        .pipe(
          finalize(() => this.loadingDetail.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (record) => {
            this.selectedId.set(record.id);
            this.mode.set(mode);
            this.form.reset({
              ...record,
              age: Number.isFinite(record.age) ? record.age : null,
              mobilenumber: Number.isFinite(record.mobilenumber) ? String(record.mobilenumber) : '',
            });
            this.editor?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
          error: (error) => this.notify('error', this.errorText(error)),
        });
    };

    if (this.allowDiscard(proceed)) {
      proceed();
    }
  }

  /**
   * Checks if the form control for the specified key has an error and has been touched.
   * @param key The form control key to check for errors.
   * @returns True if the control has an error and has been touched; otherwise, false.
   */
  showError(key: string): boolean {
    const control = this.form.get(key);
    return !!control && control.touched && control.invalid;
  }

  /**
   * Gets the error message for the form control with the specified key.
   * @param key The form control key to get the error message for.
   * @returns The error message for the form control.
   */
  fieldError(key: string): string {
    const control = this.form.get(key);

    if (!control) {
      return '';
    }

    if (control.hasError('required') || control.hasError('blank')) {
      return 'This field is required.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (control.hasError('maxlength')) {
      return `Use at most ${control.errors?.['maxlength'].requiredLength} characters.`;
    }

    if (key === 'age') {
      return 'Enter a whole number between 1 and 120.';
    }

    if (key === 'createdAt') {
      return 'Enter a valid date that is not in the future.';
    }

    if (key === 'mobilenumber') {
      return 'Enter 10 digits starting with 6, 7, 8 or 9.';
    }

    if (key === 'pan_no') {
      return 'Use 5 letters, 4 digits and 1 letter: ABCDE1234F.';
    }

    if (key === 'adhaar_no') {
      return 'Enter 12 digits starting with 2–9.';
    }

    return 'Select a valid option.';
  }

  /**
   * Saves the current form data as a new contact or updates an existing contact.
   */
  save(): void {
    if (this.busy() || this.mode() === 'view') {
      return;
    }

    const value = this.form.getRawValue();

    this.form.patchValue({
      first_name: value.first_name.trim(),
      last_name: value.last_name.trim(),
      emailId: value.emailId.trim(),
      mobilenumber: value.mobilenumber.trim(),
      pan_no: value.pan_no.trim().toUpperCase(),
      adhaar_no: value.adhaar_no.trim(),
    });

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.notify('error', 'Check the highlighted fields.');
      this.editor?.nativeElement
        .querySelector<HTMLElement>('input[aria-invalid="true"],select[aria-invalid="true"]')
        ?.focus();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: ContactPayload = {
      createdAt: raw.createdAt,
      first_name: raw.first_name,
      last_name: raw.last_name,
      emailId: raw.emailId,
      age: raw.age!,
      gender: raw.gender as ContactPayload['gender'],
      mobilenumber: Number(raw.mobilenumber),
      pan_no: raw.pan_no,
      adhaar_no: raw.adhaar_no,
      status: raw.status,
    };

    const id = this.selectedId();
    const updating = this.mode() === 'edit';

    if (updating && !id) {
      this.notify('error', 'Select a contact before updating.');
      return;
    }

    this.saving.set(true);
    this.notice.set(null);

    const request = updating ? this.api.update(id!, payload) : this.api.create(payload);

    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (record) => {
          this.contacts.update((contacts) => [
            record,
            ...contacts.filter((contact) => contact.id !== record.id),
          ]);
          this.page.set(1);
          this.notify('success', updating ? 'Contact updated successfully.' : 'Contact created successfully.');
          this.selectedId.set(null);
          this.mode.set('create');
          this.form.reset({ createdAt: localToday(), age: null, gender: '', status: true });
        },
        error: (error) => this.notify('error', this.errorText(error)),
      });
  }

  /**
   * Prompts the user to delete the specified contact.
   * @param contact The contact to delete.
   */
  askDelete(contact: Contact): void {
    if (this.busy()) {
      return;
    }

    this.deleteTarget.set(contact);
    this.deleteError.set('');
    this.deleteDialog?.nativeElement.showModal();
  }

  /**
   * Closes the delete confirmation dialog without deleting the contact.
   */
  closeDelete(): void {
    if (this.deletingId()) {
      return;
    }

    this.deleteDialog?.nativeElement.close();
    this.deleteTarget.set(null);
  }

  /**
   * Handles the cancel event of the delete confirmation dialog.
   * @param event The cancel event.
   */
  onDialogCancel(event: Event): void {
    if (this.deletingId()) {
      event.preventDefault();
    } else {
      this.deleteTarget.set(null);
    }
  }

  /**
   * Confirms the deletion of the selected contact.
   */
  confirmDelete(): void {
    const target = this.deleteTarget();

    if (!target || this.busy()) {
      return;
    }

    this.deletingId.set(target.id);
    this.deleteError.set('');

    this.api
      .delete(target.id)
      .pipe(
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.contacts.update((contacts) => contacts.filter((contact) => contact.id !== target.id));
          this.deleteDialog?.nativeElement.close();
          this.deleteTarget.set(null);

          if (this.selectedId() === target.id) {
            this.mode.set('create');
            this.selectedId.set(null);
            this.form.reset({ createdAt: localToday(), age: null, status: true });
          }

          this.notify('success', 'Contact deleted successfully.');
        },
        error: (error) => this.deleteError.set(this.errorText(error)),
      });
  }

  /**
   * Handles the window beforeunload event to warn the user about unsaved changes.
   * @param event The beforeunload event.
   */
  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(event: BeforeUnloadEvent): void {
    if (this.form.dirty && this.mode() !== 'view') {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private allowDiscard(onConfirm?: () => void): boolean {
    if (this.mode() === 'view' || !this.form.dirty) {
      return true;
    }
    if (onConfirm) {
      this.pendingAction.set(onConfirm);
    }
    this.discardDialog?.nativeElement.showModal();
    return false;
  }

  /** Closes the discard dialog without taking any action. */
  closeDiscard(): void {
    this.pendingAction.set(null);
    this.discardDialog?.nativeElement.close();
  }

  /** Confirms discard: runs the pending action and closes the dialog. */
  confirmDiscard(): void {
    const action = this.pendingAction();
    this.discardDialog?.nativeElement.close();
    this.pendingAction.set(null);
    action?.();
  }

  /** Handles the native cancel event (Escape key) on the discard dialog. */
  onDiscardDialogCancel(event: Event): void {
    event.preventDefault();
    this.closeDiscard();
  }

  private notify(type: 'success' | 'error', text: string): void {
    this.notice.set({ type, text });
  }

  private errorText(error: unknown): string {
    if (error instanceof TimeoutError) {
      return 'The request timed out. Check the contact list before retrying a save.';
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Cannot reach the API. Check your connection and the API CORS settings.';
      }

      if (error.status === 404) {
        return 'The contact or API endpoint was not found. Refresh the list.';
      }

      if (error.status === 429) {
        return 'Too many requests. Please wait and try again.';
      }

      return `The API request failed (${error.status}). Your changes have been preserved.`;
    }

    return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }
}
