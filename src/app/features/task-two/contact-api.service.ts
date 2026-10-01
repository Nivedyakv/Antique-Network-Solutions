import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, timeout } from 'rxjs';
import { Contact, ContactPayload } from './contact.model';
@Injectable({ providedIn: 'root' })
export class ContactApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'https://65c0cfa6dc74300bce8cc64d.mockapi.io/Contact/profile';

  /**
   * Fetches all contacts from the API.
   * @returns An observable that emits an array of Contact objects.
   */
  getAll(): Observable<Contact[]> {
    return this.http.get<unknown>(this.url).pipe(timeout(15000), map((value: any) => {
      if (!Array.isArray(value)) throw new Error('The API returned an invalid contact list.');
      return value.map(item => this.normalize(item));
    }));
  }

  /**
   * Fetches a contact by ID from the API.
   * @param id The ID of the contact to fetch.
   * @returns An observable that emits a Contact object.
   */
  getById(id: string): Observable<Contact> {
    return this.http.get<unknown>(this.recordUrl(id)).pipe(timeout(15000), map((value: any) => this.normalize(value)));
  }

  /**
   * Creates a new contact via the API.
   * @param payload The data for the new contact.
   * @returns An observable that emits the created Contact object.
   */
  create(payload: ContactPayload): Observable<Contact> {
    return this.http.post<unknown>(this.url, payload).pipe(timeout(15000), map((value: any) => this.normalize(value)));
  }

  /**
   * Updates an existing contact via the API.
   * @param id The ID of the contact to update.
   * @param payload The updated data for the contact.
   * @returns An observable that emits the updated Contact object.
   */
  update(id: string, payload: ContactPayload): Observable<Contact> {
    return this.http.put<unknown>(this.recordUrl(id), payload).pipe(timeout(15000), map((value: any) => this.normalize(value)));
  }

  /**
   * Deletes a contact via the API.
   * @param id The ID of the contact to delete.
   * @returns An observable that completes when the deletion is successful.
   */
  delete(id: string): Observable<void> {
    return this.http.delete<unknown>(this.recordUrl(id)).pipe(timeout(15000), map(() => undefined));
  }

  /**
   * Constructs the URL for a specific contact by ID.
   * @param id The ID of the contact.
   * @returns The constructed URL for the contact.
   */
  private recordUrl(id: string): string {
    return `${this.url}/${encodeURIComponent(id)}`;
  }

  /**
   * Normalizes the API response into a Contact object.
   * @param value The raw API response.
   * @returns A normalized Contact object.
   */
  private normalize(value: unknown): Contact {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The API returned an invalid contact.');
    const row = value as Record<string, unknown>;
    const id = String(row['id'] ?? '').trim();
    if (!id) throw new Error('The API response is missing a contact ID.');
    const text = (key: string) => String(row[key] ?? '');
    return {
      id, createdAt: text('createdAt').slice(0, 10), first_name: text('first_name'), last_name: text('last_name'),
      emailId: text('emailId'), age: Number(row['age']), gender: text('gender') as ContactPayload['gender'],
      mobilenumber: Number(row['mobilenumber']), pan_no: text('pan_no'), adhaar_no: text('adhaar_no'),
      status: row['status'] === true || row['status'] === 'true',
    };
  }
}
