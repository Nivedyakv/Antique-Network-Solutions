import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { TaskTwo } from './task-two';
import { ContactApiService } from './contact-api.service';
import { Contact } from './contact.model';
import { localToday } from './contact.validators';

describe('TaskTwo', () => {
  let fixture: ComponentFixture<TaskTwo>;
  let component: TaskTwo;
  let api: jasmine.SpyObj<ContactApiService>;

  const firstContact: Contact = {
    id: '1',
    createdAt: '2024-01-01',
    first_name: 'Anu',
    last_name: 'Test',
    emailId: 'anu@example.com',
    age: 25,
    gender: 'Female',
    mobilenumber: 9876543210,
    pan_no: 'ABCDE1234F',
    adhaar_no: '234567890123',
    status: true,
  };

  const secondContact: Contact = {
    ...firstContact,
    id: '2',
    first_name: 'Rahul',
    emailId: 'rahul@example.com',
    gender: 'Male',
    mobilenumber: 8765432109,
    status: false,
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<ContactApiService>(
      'ContactApiService',
      ['getAll', 'getById', 'create', 'update', 'delete'],
    );

    api.getAll.and.returnValue(
      of([{ ...firstContact }, { ...secondContact }]),
    );

    await TestBed.configureTestingModule({
      imports: [TaskTwo],
      providers: [
        provideRouter([]),
        {
          provide: ContactApiService,
          useValue: api,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskTwo);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOn(
      component.editor!.nativeElement,
      'scrollIntoView',
    ).and.stub();
  });

  function fillValidForm(): void {
    component.form.setValue({
      createdAt: firstContact.createdAt,
      first_name: firstContact.first_name,
      last_name: firstContact.last_name,
      emailId: firstContact.emailId,
      age: firstContact.age,
      gender: firstContact.gender,
      mobilenumber: String(firstContact.mobilenumber),
      pan_no: firstContact.pan_no,
      adhaar_no: firstContact.adhaar_no,
      status: firstContact.status,
    });
  }

  function openForEditing(): void {
    api.getById.and.returnValue(of({ ...firstContact }));
    component.openContact(firstContact, 'edit');
  }

  describe('Initial state', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load contacts on creation', () => {
      expect(api.getAll).toHaveBeenCalledTimes(1);
      expect(component.contacts()).toEqual([
        firstContact,
        secondContact,
      ]);
      expect(component.loading()).toBeFalse();
    });

    it('should initialize the create form without selecting gender', () => {
      expect(component.mode()).toBe('create');
      expect(component.selectedId()).toBeNull();
      expect(component.form.controls.gender.value).toBe('');
      expect(component.form.controls.status.value).toBeTrue();
      expect(component.form.controls.createdAt.value)
        .toBe(localToday());
    });

    it('should calculate the active contact count', () => {
      expect(component.activeCount()).toBe(1);
    });
  });

  describe('Loading contacts', () => {
    it('should set and clear the loading state', () => {
      const response = new Subject<Contact[]>();
      api.getAll.and.returnValue(response);

      component.loadContacts();

      expect(component.loading()).toBeTrue();

      response.next([firstContact]);
      response.complete();

      expect(component.loading()).toBeFalse();
      expect(component.contacts()).toEqual([firstContact]);
    });

    it('should preserve existing contacts when loading fails', () => {
      api.getAll.and.returnValue(
        throwError(() => new Error('Unable to load contacts')),
      );

      component.loadContacts();

      expect(component.loading()).toBeFalse();
      expect(component.loadError())
        .toBe('Unable to load contacts');
      expect(component.contacts().length).toBe(2);
    });

    it('should not reload while a mutation is pending', () => {
      component.saving.set(true);

      component.loadContacts();

      expect(api.getAll).toHaveBeenCalledTimes(1);

      component.saving.set(false);
    });
  });

  describe('Search and status filtering', () => {
    it('should search case-insensitively and trim the query', () => {
      component.setSearch(' ANU ');

      expect(component.filtered()).toEqual([firstContact]);
    });

    it('should search by email', () => {
      component.setSearch('rahul@example.com');

      expect(component.filtered()).toEqual([secondContact]);
    });

    it('should search by mobile number', () => {
      component.setSearch('9876543210');

      expect(component.filtered()).toEqual([firstContact]);
    });

    it('should reset pagination when the search changes', () => {
      component.page.set(2);

      component.setSearch('Anu');

      expect(component.page()).toBe(1);
    });

    it('should filter active contacts', () => {
      component.setStatus('active');

      expect(component.filtered()).toEqual([firstContact]);
    });

    it('should filter inactive contacts', () => {
      component.setStatus('inactive');

      expect(component.filtered()).toEqual([secondContact]);
    });

    it('should combine search and status filtering', () => {
      component.setSearch('Anu');
      component.setStatus('inactive');

      expect(component.filtered()).toEqual([]);
    });

    it('should ignore unsupported status filters', () => {
      component.setStatus('unsupported');

      expect(component.statusFilter()).toBe('all');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.contacts.set(
        Array.from({ length: 9 }, (_, index) => ({
          ...firstContact,
          id: String(index + 1),
        })),
      );
    });

    it('should show four contacts per page', () => {
      expect(component.pageCount()).toBe(3);
      expect(component.visibleContacts().length).toBe(4);
    });

    it('should show the correct records on page two', () => {
      component.page.set(2);

      expect(
        component.visibleContacts().map((contact) => contact.id),
      ).toEqual(['5', '6', '7', '8']);
    });

    it('should clamp the displayed page after the list shrinks', () => {
      component.page.set(3);
      component.contacts.set([firstContact]);

      expect(component.currentPage()).toBe(1);
      expect(component.visibleContacts()).toEqual([firstContact]);
    });
  });

  describe('Form validation', () => {
    it('should reject an incomplete form', () => {
      expect(component.form.invalid).toBeTrue();
    });

    it('should accept valid contact details', () => {
      fillValidForm();

      expect(component.form.valid).toBeTrue();
    });

    it('should require the user to select a gender', () => {
      fillValidForm();
      component.form.controls.gender.setValue('');

      expect(
        component.form.controls.gender.hasError('required'),
      ).toBeTrue();

      expect(component.form.invalid).toBeTrue();
    });

    it('should reject whitespace-only names', () => {
      component.form.controls.first_name.setValue('   ');

      expect(
        component.form.controls.first_name.hasError('blank'),
      ).toBeTrue();
    });

    it('should reject an invalid email', () => {
      component.form.controls.emailId.setValue('invalid-email');

      expect(
        component.form.controls.emailId.hasError('email'),
      ).toBeTrue();
    });

    it('should reject decimal ages', () => {
      component.form.controls.age.setValue(25.5);

      expect(
        component.form.controls.age.hasError('integer'),
      ).toBeTrue();
    });

    it('should reject invalid mobile numbers', () => {
      component.form.controls.mobilenumber.setValue('12345');

      expect(
        component.form.controls.mobilenumber.hasError('pattern'),
      ).toBeTrue();
    });

    it('should show validation errors after a field is touched', () => {
      expect(component.showError('first_name')).toBeFalse();

      component.form.controls.first_name.markAsTouched();

      expect(component.showError('first_name')).toBeTrue();
      expect(component.fieldError('first_name'))
        .toBe('This field is required.');
    });
  });

  describe('Creating contacts', () => {
    it('should prevent invalid form submission', () => {
      component.save();

      expect(api.create).not.toHaveBeenCalled();
      expect(api.update).not.toHaveBeenCalled();
      expect(component.form.controls.first_name.touched)
        .toBeTrue();
      expect(component.notice()?.type).toBe('error');
    });

    it('should normalize input before sending the payload', () => {
      fillValidForm();

      component.form.patchValue({
        first_name: '  Anu  ',
        emailId: '  anu@example.com  ',
        pan_no: 'abcde1234f',
      });

      api.create.and.returnValue(
        of({
          ...firstContact,
          id: '3',
        }),
      );

      component.save();

      expect(api.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          first_name: 'Anu',
          emailId: 'anu@example.com',
          pan_no: 'ABCDE1234F',
          mobilenumber: 9876543210,
        }),
      );
    });

    it('should add the created record and reset the form', () => {
      fillValidForm();

      const created = {
        ...firstContact,
        id: '3',
      };

      api.create.and.returnValue(of(created));

      component.save();

      expect(component.contacts()[0]).toEqual(created);
      expect(component.contacts().length).toBe(3);
      expect(component.mode()).toBe('create');
      expect(component.selectedId()).toBeNull();
      expect(component.form.controls.first_name.value).toBe('');
      expect(component.form.controls.gender.value).toBe('');
      expect(component.saving()).toBeFalse();
      expect(component.notice()?.text)
        .toBe('Contact created successfully.');
    });

    it('should preserve input after a failed save', () => {
      fillValidForm();

      api.create.and.returnValue(
        throwError(() => new Error('Save failed')),
      );

      component.save();

      expect(component.form.controls.first_name.value)
        .toBe('Anu');
      expect(component.form.controls.gender.value)
        .toBe('Female');
      expect(component.contacts().length).toBe(2);
      expect(component.saving()).toBeFalse();
      expect(component.notice()?.text).toBe('Save failed');
    });

    it('should prevent duplicate saves while a request is pending', () => {
      fillValidForm();

      const response = new Subject<Contact>();
      api.create.and.returnValue(response);

      component.save();
      component.save();

      expect(component.saving()).toBeTrue();
      expect(api.create).toHaveBeenCalledTimes(1);

      response.next({
        ...firstContact,
        id: '3',
      });
      response.complete();

      expect(component.saving()).toBeFalse();
    });
  });

  describe('Viewing and updating contacts', () => {
    it('should fetch and populate a contact for editing', () => {
      openForEditing();

      expect(api.getById).toHaveBeenCalledWith('1');
      expect(component.mode()).toBe('edit');
      expect(component.selectedId()).toBe('1');
      expect(component.form.controls.first_name.value)
        .toBe('Anu');
      expect(component.form.controls.mobilenumber.value)
        .toBe('9876543210');
      expect(component.form.controls.gender.value)
        .toBe('Female');
    });

    it('should update the selected record without duplicating it', () => {
      openForEditing();

      component.form.controls.first_name.setValue('Updated');

      const updated = {
        ...firstContact,
        first_name: 'Updated',
      };

      api.update.and.returnValue(of(updated));

      component.save();

      expect(api.update).toHaveBeenCalledWith(
        '1',
        jasmine.objectContaining({
          first_name: 'Updated',
        }),
      );

      expect(component.contacts().length).toBe(2);
      expect(
        component.contacts().find((contact) => contact.id === '1'),
      ).toEqual(updated);
      expect(component.form.controls.gender.value).toBe('');
      expect(component.notice()?.text)
        .toBe('Contact updated successfully.');
    });

    it('should prevent saving in view mode', () => {
      api.getById.and.returnValue(of(firstContact));

      component.openContact(firstContact, 'view');
      component.save();

      expect(component.mode()).toBe('view');
      expect(api.create).not.toHaveBeenCalled();
      expect(api.update).not.toHaveBeenCalled();
    });

    it('should report a failed detail request', () => {
      api.getById.and.returnValue(
        throwError(() => new Error('Unable to load contact')),
      );

      component.openContact(firstContact, 'edit');

      expect(component.loadingDetail()).toBeFalse();
      expect(component.notice()?.text)
        .toBe('Unable to load contact');
    });
  });

  describe('Deleting contacts', () => {
    it('should open the delete confirmation dialog', () => {
      component.askDelete(firstContact);

      expect(component.deleteTarget()).toEqual(firstContact);
      expect(component.deleteDialog!.nativeElement.open)
        .toBeTrue();
    });

    it('should cancel deletion without calling the API', () => {
      component.askDelete(firstContact);

      component.closeDelete();

      expect(component.deleteTarget()).toBeNull();
      expect(component.deleteDialog!.nativeElement.open)
        .toBeFalse();
      expect(api.delete).not.toHaveBeenCalled();
    });

    it('should remove the correct record after deletion succeeds', () => {
      api.delete.and.returnValue(of(undefined));

      component.askDelete(firstContact);
      component.confirmDelete();

      expect(api.delete).toHaveBeenCalledWith('1');
      expect(component.contacts()).toEqual([secondContact]);
      expect(component.deleteTarget()).toBeNull();
      expect(component.deletingId()).toBeNull();
      expect(component.notice()?.text)
        .toBe('Contact deleted successfully.');
    });

    it('should reset the editor when its selected contact is deleted', () => {
      openForEditing();
      api.delete.and.returnValue(of(undefined));

      component.askDelete(firstContact);
      component.confirmDelete();

      expect(component.mode()).toBe('create');
      expect(component.selectedId()).toBeNull();
      expect(component.form.controls.first_name.value).toBe('');
      expect(component.form.controls.gender.value).toBe('');
    });

    it('should preserve the record when deletion fails', () => {
      api.delete.and.returnValue(
        throwError(() => new Error('Delete failed')),
      );

      component.askDelete(firstContact);
      component.confirmDelete();

      expect(component.contacts()).toContain(firstContact);
      expect(component.deleteError()).toBe('Delete failed');
      expect(component.deletingId()).toBeNull();
      expect(component.deleteDialog!.nativeElement.open)
        .toBeTrue();

      component.closeDelete();
    });

    it('should prevent duplicate delete requests', () => {
      const response = new Subject<void>();
      api.delete.and.returnValue(response);

      component.askDelete(firstContact);
      component.confirmDelete();
      component.confirmDelete();

      expect(api.delete).toHaveBeenCalledTimes(1);
      expect(component.deletingId()).toBe('1');

      response.next(undefined);
      response.complete();

      expect(component.deletingId()).toBeNull();
    });
  });

  describe('New contact and unsaved changes', () => {
    it('should reset the editor for a new contact', () => {
      openForEditing();

      component.newContact();

      expect(component.mode()).toBe('create');
      expect(component.selectedId()).toBeNull();
      expect(component.form.controls.first_name.value).toBe('');
      expect(component.form.controls.gender.value).toBe('');
    });

    it('should ask before discarding dirty form values', () => {
      component.form.controls.first_name.setValue('Unsaved');
      component.form.markAsDirty();

      component.newContact();

      expect(component.discardDialog!.nativeElement.open)
        .toBeTrue();
      expect(component.pendingAction()).not.toBeNull();
      expect(component.form.controls.first_name.value)
        .toBe('Unsaved');

      component.closeDiscard();
    });

    it('should preserve changes when discard is cancelled', () => {
      component.form.controls.first_name.setValue('Unsaved');
      component.form.markAsDirty();

      component.newContact();
      component.closeDiscard();

      expect(component.form.controls.first_name.value)
        .toBe('Unsaved');
      expect(component.pendingAction()).toBeNull();
      expect(component.discardDialog!.nativeElement.open)
        .toBeFalse();
    });

    it('should execute the pending reset after confirming discard', () => {
      component.form.controls.first_name.setValue('Unsaved');
      component.form.markAsDirty();

      component.newContact();
      component.confirmDiscard();

      expect(component.form.controls.first_name.value).toBe('');
      expect(component.form.controls.gender.value).toBe('');
      expect(component.form.pristine).toBeTrue();
      expect(component.pendingAction()).toBeNull();
      expect(component.discardDialog!.nativeElement.open)
        .toBeFalse();
    });

    it('should not reset the form while saving', () => {
      component.form.controls.first_name.setValue('Keep this');
      component.saving.set(true);

      component.newContact();

      expect(component.form.controls.first_name.value)
        .toBe('Keep this');

      component.saving.set(false);
    });
  });
});