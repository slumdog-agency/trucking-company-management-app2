export type Schema = {
  drivers: {
    id?: number;
    count: number;
    percentage: number;
    firstName: string;
    lastName: string;
    dispatcher: string;
    dispatcherId?: number | null;
    truck?: string | null;
    trailer?: string | null;
    phone?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    email?: string | null;
    category?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  
  routes: {
    id?: number;
    driverId: number;
    date: string;
    pickupZip: string;
    pickupCounty?: string | null;
    pickupCity?: string | null;
    pickupState?: string | null;
    deliveryZip: string;
    deliveryCounty?: string | null;
    deliveryCity?: string | null;
    deliveryState?: string | null;
    mileage?: number | null;
    rate: number;
    soldFor?: number | null;
    divisionId?: number | null;
    status?: string | null;
    statusColor?: string | null;
    customerLoadNumber?: string | null;
    statusStartDate?: string | null;
    statusEndDate?: string | null;
    previousRouteIds?: string | null;
    lastEditedBy?: string | null;
    lastEditedAt?: string | null;
    comments?: string | null;
    lastCommentBy?: string | null;
    lastCommentAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };

  routeAudits: {
    id?: number;
    routeId: number;
    userId?: number | null;
    userName?: string | null;
    changedFields: string;
    oldValues?: string | null;
    newValues?: string | null;
    createdAt?: string;
  };

  dispatchers: {
    id?: number;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };

  trucks: {
    id?: number;
    number: string;
    category: string;
    make?: string | null;
    model?: string | null;
    year?: number | null;
    vin?: string | null;
    licensePlate?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };

  trailers: {
    id?: number;
    number: string;
    category: string;
    type?: string | null;
    length?: string | null;
    vin?: string | null;
    licensePlate?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };

  divisions: {
    id?: number;
    companyName: string;
    mc?: string | null;
    dot?: string | null;
    address?: string | null;
    phoneNumber?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };

  zipCodes: {
    id?: number;
    zipCode: string;
    city: string;
    state: string;
    county?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  
  userPermissions: {
    id?: number;
    userId: string;
    section: string;
    canRead: boolean;
    canWrite: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  
  routeStatuses: {
    id?: number;
    name: string;
    color: string;
    isDefault?: boolean;
    sortOrder?: number;
    createdAt?: string;
    updatedAt?: string;
  };
}