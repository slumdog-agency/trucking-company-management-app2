export type Schema = {
  dispatchers: {
    dispatcher_id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    created_at?: string;
    updated_at?: string;
  };
  drivers: {
    id?: number;
    count: number;
    percentage: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    dispatcher_id?: number;
    dispatcher?: string;
    truck?: string;
    trailer?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    category?: string;
    created_at?: string;
    updated_at?: string;
  };
  routes: {
    id: number;
    driverId: number;
    date: string;
    pickupZip: string;
    pickupCity: string;
    pickupState: string;
    pickupCounty: string;
    deliveryZip: string;
    deliveryCity: string;
    deliveryState: string;
    deliveryCounty: string;
    mileage: number;
    rate: number;
    soldFor: number;
    status: string;
    statusColor: string;
    customerLoadNumber: string;
    divisionId: number | null;
    comments: string;
    previousRouteIds: string;
    lastEditedBy: string;
    lastEditedAt: string;
  };
  divisions: {
    id: number;
    companyName: string;
    mc: string;
    dot: string;
    address: string;
    phoneNumber: string;
    createdAt: string;
    updatedAt: string;
  };
  routeAudits: {
    id: number;
    routeId: number;
    userName: string;
    changedFields: string;
    oldValues: string;
    newValues: string;
    createdAt: string;
  };
  routeStatuses: {
    name: string;
    color: string;
  };
};

export type NewRoute = Omit<Schema["routes"], "id">; 