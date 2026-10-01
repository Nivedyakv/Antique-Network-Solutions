export interface ContactPayload {
  createdAt: string;
  first_name: string;
  last_name: string;
  emailId: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobilenumber: number;
  pan_no: string;
  adhaar_no: string;
  status: boolean;
}

export interface Contact extends ContactPayload { id: string; }
