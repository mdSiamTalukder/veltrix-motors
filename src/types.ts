export type VehicleStatus = "Available" | "Reserved" | "Sold";

export type VehicleCondition = "New" | "Used";

export type Vehicle = {
  id: string;
  brand: string;
  model: string;
  category: string;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  fuel: string;
  condition: VehicleCondition;
  status: VehicleStatus;
  published: boolean;
  featured: boolean;
  image: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
};

export type InquiryStatus = "new" | "read";

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  vehicleId: string | null;
  vehicleName: string | null;
  status: InquiryStatus;
  createdAt: string;
};

export type ContactStatus = "new" | "read";

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
};
