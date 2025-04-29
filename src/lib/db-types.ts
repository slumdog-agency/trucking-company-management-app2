export type Schema = {
  drivers: {
    id?: number;
    count: number;
    percentage: number;
    first_name: string;
    last_name: string;
    dispatcher_id?: number | null;
    truck?: string | null;
    trailer?: string | null;
    phone?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    email?: string | null;
    category?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  
  routes: {
    id?: number;
    driver_id: number;
    date: string;
    pickup_zip: string;
    pickup_county?: string | null;
    pickup_city?: string | null;
    pickup_state?: string | null;
    delivery_zip: string;
    delivery_county?: string | null;
    delivery_city?: string | null;
    delivery_state?: string | null;
    mileage?: number | null;
    rate: number;
    sold_for?: number | null;
    division_id?: number | null;
    status?: string | null;
    status_color?: string | null;
    customer_load_number?: string | null;
    status_start_date?: string | null;
    status_end_date?: string | null;
    previous_route_ids?: string | null;
    last_edited_by?: string | null;
    last_edited_at?: string | null;
    comments?: string | null;
    last_comment_by?: string | null;
    last_comment_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };

  route_audits: {
    id?: number;
    route_id: number;
    status: string;
    comment?: string | null;
    user_id?: number | null;
    user_name?: string | null;
    changed_fields: string;
    old_values?: string | null;
    new_values?: string | null;
    created_at?: string;
    updated_at?: string;
  };

  route_comments: {
    id?: number;
    route_id: number;
    text: string;
    by: string;
    created_at?: string;
  };

  dispatchers: {
    id?: number;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    created_at?: string;
    updated_at?: string;
  };

  trucks: {
    id?: number;
    number: string;
    category: string;
    make?: string | null;
    model?: string | null;
    year?: number | null;
    vin?: string | null;
    license_plate?: string | null;
    created_at?: string;
    updated_at?: string;
  };

  trailers: {
    id?: number;
    number: string;
    category: string;
    type?: string | null;
    length?: string | null;
    vin?: string | null;
    license_plate?: string | null;
    created_at?: string;
    updated_at?: string;
  };

  divisions: {
    id?: number;
    name: string;
    description?: string | null;
    mc?: string | null;
    dot?: string | null;
    address?: string | null;
    phone_number?: string | null;
    created_at?: string;
    updated_at?: string;
  };

  zip_codes: {
    id?: number;
    zip_code: string;
    city: string;
    state: string;
    county?: string | null;
    lat?: number | null;
    lng?: number | null;
    created_at?: string;
    updated_at?: string;
  };
  
  user_permissions: {
    id?: number;
    user_id: number;
    section: string;
    can_read: boolean;
    can_write: boolean;
    created_at?: string;
    updated_at?: string;
  };
  
  route_statuses: {
    id?: number;
    name: string;
    description?: string | null;
    color: string;
    is_default?: boolean;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
  };

  users: {
    id?: number;
    name: string;
    email: string;
    phone?: string | null;
    extension?: string | null;
    group: string;
    permissions: string;
    is_active: boolean;
    created_at?: string;
    deactivated_at?: string | null;
    updated_at?: string | null;
  };
}