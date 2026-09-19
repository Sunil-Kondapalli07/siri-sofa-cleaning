export interface ServiceVariant {
  id: number;
  service_id: number;
  name: string;
  base_price: number;
  unit_type: string;
  estimated_minutes: number;
  sort_order?: number;
}

export interface Service {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  is_active: number;
  variants: ServiceVariant[];
}

export interface CartItem {
  variant: ServiceVariant;
  quantity: number;
}

export interface AvailableSlot {
  slot: string;
  available: boolean;
  remaining: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin' | 'technician';
  is_email_verified?: boolean;
  is_mobile_verified?: boolean;
}

export interface AddressData {
  house_flat: string;
  street: string;
  area: string;
  city: string;
  pincode: string;
  instructions?: string;
  latitude?: number;
  longitude?: number;
}

export interface Booking {
  id: string;
  user_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_date: string;
  service_slot: string;
  status: 'received' | 'confirmed' | 'assigned' | 'cleaning_started' | 'completed' | 'cancelled';
  subtotal: number;
  service_charge: number;
  tax: number;
  discount: number;
  coupon_code?: string;
  total_amount: number;
  notes?: string;
  address?: AddressData;
  items?: Array<{
    service_name: string;
    variant_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  technician_name?: string;
  technician_phone?: string;
  created_at?: string;
}

export interface Technician {
  id: number;
  name: string;
  phone: string;
  rating?: number;
  total_jobs?: number;
}
