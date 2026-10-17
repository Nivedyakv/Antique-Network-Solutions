import { TestBed } from '@angular/core/testing';
import {
  HttpErrorResponse,
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ContactApiService } from './contact-api.service';
import { Contact, ContactPayload } from './contact.model';

describe('ContactApiService', () => {
  let service: ContactApiService;
  let http: HttpTestingController;

  const url =
    'https://65c0cfa6dc74300bce8cc64d.mockapi.io/Contact/profile';

  const payload: ContactPayload = {
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

  const contact: Contact = {
    id: '1',
    ...payload,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ContactApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ContactApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should fetch all contacts using GET', () => {
      const next = jasmine.createSpy('next');

      service.getAll().subscribe(next);

      const request = http.expectOne(url);

      expect(request.request.method).toBe('GET');

      request.flush([contact]);

      expect(next).toHaveBeenCalledOnceWith([contact]);
    });

    it('should accept an empty contact list', () => {
      const next = jasmine.createSpy('next');

      service.getAll().subscribe(next);

      http.expectOne(url).flush([]);

      expect(next).toHaveBeenCalledOnceWith([]);
    });

    it('should reject a response that is not an array', () => {
      const next = jasmine.createSpy('next');
      const error = jasmine.createSpy('error');

      service.getAll().subscribe({ next, error });

      http.expectOne(url).flush({ contacts: [] });

      expect(next).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.calls.mostRecent().args[0].message)
        .toBe('The API returned an invalid contact list.');
    });

    it('should reject a list containing an invalid contact', () => {
      const error = jasmine.createSpy('error');

      service.getAll().subscribe({ error });

      http.expectOne(url).flush([null]);

      expect(error).toHaveBeenCalledTimes(1);
      expect(error.calls.mostRecent().args[0].message)
        .toBe('The API returned an invalid contact.');
    });
  });

  describe('getById', () => {
    it('should fetch the requested contact using GET', () => {
      const next = jasmine.createSpy('next');

      service.getById('1').subscribe(next);

      const request = http.expectOne(`${url}/1`);

      expect(request.request.method).toBe('GET');

      request.flush(contact);

      expect(next).toHaveBeenCalledOnceWith(contact);
    });

    it('should encode the ID when constructing the URL', () => {
      const id = 'customer/one?active=true';
      const next = jasmine.createSpy('next');

      service.getById(id).subscribe(next);

      const request = http.expectOne(
        `${url}/${encodeURIComponent(id)}`,
      );

      expect(request.request.method).toBe('GET');
      expect(request.request.url).toBe(
        `${url}/customer%2Fone%3Factive%3Dtrue`,
      );

      const response: Contact = {
        ...contact,
        id,
      };

      request.flush(response);

      expect(next).toHaveBeenCalledOnceWith(response);
    });

    it('should reject a null contact response', () => {
      const error = jasmine.createSpy('error');

      service.getById('1').subscribe({ error });

      http.expectOne(`${url}/1`).flush(null);

      expect(error).toHaveBeenCalledTimes(1);
      expect(error.calls.mostRecent().args[0].message)
        .toBe('The API returned an invalid contact.');
    });

    it('should reject a contact without an ID', () => {
      const error = jasmine.createSpy('error');

      service.getById('1').subscribe({ error });

      http.expectOne(`${url}/1`).flush(payload);

      expect(error).toHaveBeenCalledTimes(1);
      expect(error.calls.mostRecent().args[0].message)
        .toBe('The API response is missing a contact ID.');
    });

    it('should reject a contact with a blank ID', () => {
      const error = jasmine.createSpy('error');

      service.getById('1').subscribe({ error });

      http.expectOne(`${url}/1`).flush({
        ...contact,
        id: '   ',
      });

      expect(error).toHaveBeenCalledTimes(1);
      expect(error.calls.mostRecent().args[0].message)
        .toBe('The API response is missing a contact ID.');
    });
  });

  describe('create', () => {
    it('should send the payload using POST and return the record', () => {
      const next = jasmine.createSpy('next');

      service.create(payload).subscribe(next);

      const request = http.expectOne(url);

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(payload);

      request.flush(contact);

      expect(next).toHaveBeenCalledOnceWith(contact);
    });

    it('should report an invalid creation response', () => {
      const error = jasmine.createSpy('error');

      service.create(payload).subscribe({ error });

      http.expectOne(url).flush({ success: true });

      expect(error).toHaveBeenCalledTimes(1);
      expect(error.calls.mostRecent().args[0].message)
        .toBe('The API response is missing a contact ID.');
    });
  });

  describe('update', () => {
    it('should update the correct record using PUT', () => {
      const updatedPayload: ContactPayload = {
        ...payload,
        first_name: 'Updated',
      };

      const updatedContact: Contact = {
        id: '1',
        ...updatedPayload,
      };

      const next = jasmine.createSpy('next');

      service.update('1', updatedPayload).subscribe(next);

      const request = http.expectOne(`${url}/1`);

      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual(updatedPayload);

      request.flush(updatedContact);

      expect(next).toHaveBeenCalledOnceWith(updatedContact);
    });
  });

  describe('delete', () => {
    it('should delete the correct record and emit undefined', () => {
      const next = jasmine.createSpy('next');
      const complete = jasmine.createSpy('complete');

      service.delete('1').subscribe({ next, complete });

      const request = http.expectOne(`${url}/1`);

      expect(request.request.method).toBe('DELETE');

      request.flush(contact);

      expect(next).toHaveBeenCalledOnceWith(undefined);
      expect(complete).toHaveBeenCalledTimes(1);
    });

    it('should handle an empty successful delete response', () => {
      const next = jasmine.createSpy('next');

      service.delete('1').subscribe(next);

      const request = http.expectOne(`${url}/1`);

      expect(request.request.method).toBe('DELETE');

      request.flush(null, {
        status: 204,
        statusText: 'No Content',
      });

      expect(next).toHaveBeenCalledOnceWith(undefined);
    });
  });

  describe('Response normalization', () => {
    it('should normalize IDs, dates, numbers, and status', () => {
      const next = jasmine.createSpy('next');

      service.getById('1').subscribe(next);

      http.expectOne(`${url}/1`).flush({
        ...payload,
        id: 1,
        createdAt: '2024-01-01T12:00:00.000Z',
        age: '25',
        mobilenumber: '9876543210',
        status: 'true',
      });

      expect(next).toHaveBeenCalledOnceWith(contact);
    });

    it('should normalize string false to boolean false', () => {
      const next = jasmine.createSpy('next');

      service.getById('1').subscribe(next);

      http.expectOne(`${url}/1`).flush({
        ...contact,
        status: 'false',
      });

      expect(next).toHaveBeenCalledOnceWith({
        ...contact,
        status: false,
      });
    });

    it('should normalize missing text fields to empty strings', () => {
      const next = jasmine.createSpy('next');

      service.getById('1').subscribe(next);

      http.expectOne(`${url}/1`).flush({
        ...contact,
        first_name: null,
        last_name: null,
        emailId: null,
      });

      expect(next).toHaveBeenCalledOnceWith({
        ...contact,
        first_name: '',
        last_name: '',
        emailId: '',
      });
    });
  });

  describe('HTTP errors', () => {
    it('should propagate a server error', () => {
      const next = jasmine.createSpy('next');
      const error = jasmine.createSpy('error');

      service.getAll().subscribe({ next, error });

      http.expectOne(url).flush(
        { message: 'Server failure' },
        {
          status: 500,
          statusText: 'Internal Server Error',
        },
      );

      expect(next).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledTimes(1);

      const received =
        error.calls.mostRecent().args[0] as HttpErrorResponse;

      expect(received instanceof HttpErrorResponse).toBeTrue();
      expect(received.status).toBe(500);
    });

    it('should propagate a missing-record error', () => {
      const error = jasmine.createSpy('error');

      service.getById('999').subscribe({ error });

      http.expectOne(`${url}/999`).flush(
        { message: 'Contact not found' },
        {
          status: 404,
          statusText: 'Not Found',
        },
      );

      expect(error).toHaveBeenCalledTimes(1);

      const received =
        error.calls.mostRecent().args[0] as HttpErrorResponse;

      expect(received.status).toBe(404);
    });

    it('should propagate a network failure', () => {
      const error = jasmine.createSpy('error');

      service.getAll().subscribe({ error });

      http.expectOne(url).error(
        new ProgressEvent('error'),
      );

      expect(error).toHaveBeenCalledTimes(1);

      const received =
        error.calls.mostRecent().args[0] as HttpErrorResponse;

      expect(received.status).toBe(0);
    });

    it('should propagate a failed delete request', () => {
      const next = jasmine.createSpy('next');
      const error = jasmine.createSpy('error');

      service.delete('1').subscribe({ next, error });

      http.expectOne(`${url}/1`).flush(
        { message: 'Delete failed' },
        {
          status: 500,
          statusText: 'Internal Server Error',
        },
      );

      expect(next).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledTimes(1);

      const received =
        error.calls.mostRecent().args[0] as HttpErrorResponse;

      expect(received.status).toBe(500);
    });
  });
});