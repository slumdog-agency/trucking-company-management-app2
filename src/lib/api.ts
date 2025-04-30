import { Schema } from '@/lib/db-types';

const API_BASE = 'http://localhost:4000/api';

// ROUTES
export async function getRoutes() {
  const res = await fetch(`${API_BASE}/routes`);
  if (!res.ok) throw new Error('Failed to fetch routes');
  return res.json();
}

export async function getRoute(id: number) {
  const res = await fetch(`${API_BASE}/routes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch route');
  return res.json();
}

export async function addRoute(data: Partial<Schema["routes"]> & { last_comment_by: string }) {
  const res = await fetch(`${API_BASE}/routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add route');
  return res.json();
}

export async function updateRoute(
  id: number, 
  data: Partial<Schema["routes"]> & { last_edited_by: string }
) {
  const res = await fetch(`${API_BASE}/routes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update route');
  return res.json();
}

export async function deleteRoute(id: number, user_name: string) {
  const res = await fetch(`${API_BASE}/routes/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name })
  });
  if (!res.ok) throw new Error('Failed to delete route');
  return res.json();
}

// DIVISIONS
export async function getDivisions() {
  const res = await fetch(`${API_BASE}/divisions`);
  if (!res.ok) throw new Error('Failed to fetch divisions');
  return res.json();
}

export async function getDivision(id: number) {
  const res = await fetch(`${API_BASE}/divisions/${id}`);
  return res.json();
}

export async function addDivision(data: Partial<Schema["divisions"]>) {
  const res = await fetch(`${API_BASE}/divisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add division');
  return res.json();
}

export async function updateDivision(id: number, data: Schema["divisions"]) {
  const res = await fetch(`${API_BASE}/divisions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteDivision(id: number) {
  const res = await fetch(`${API_BASE}/divisions/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

// DRIVERS
export async function getDrivers() {
  const res = await fetch(`${API_BASE}/drivers`);
  if (!res.ok) throw new Error('Failed to fetch drivers');
  return res.json();
}

export async function addDriver(data: Partial<Schema["drivers"]>) {
  const res = await fetch(`${API_BASE}/drivers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add driver');
  return res.json();
}

export async function updateDriver(id: number, data: Partial<Schema["drivers"]>) {
  const res = await fetch(`${API_BASE}/drivers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update driver');
  return res.json();
}

export async function deleteDriver(id: number) {
  const res = await fetch(`${API_BASE}/drivers/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete driver');
  return res.json();
}

// Dispatcher API functions
export async function getDispatchers() {
  const res = await fetch(`${API_BASE}/dispatchers`);
  if (!res.ok) throw new Error('Failed to fetch dispatchers');
  return res.json();
}

export async function addDispatcher(data: Partial<Schema["dispatchers"]>) {
  const res = await fetch(`${API_BASE}/dispatchers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add dispatcher');
  return res.json();
}

export async function updateDispatcher(id: number, data: Partial<Schema["dispatchers"]>) {
  const res = await fetch(`${API_BASE}/dispatchers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update dispatcher');
  return res.json();
}

export async function deleteDispatcher(id: number) {
  const res = await fetch(`${API_BASE}/dispatchers/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete dispatcher');
  return res.json();
}

// Route Statuses API
export async function getRouteStatuses() {
  const res = await fetch(`${API_BASE}/route-statuses`);
  if (!res.ok) throw new Error('Failed to fetch route statuses');
  return res.json();
}

export async function addRouteStatus(data: Schema["route_statuses"]) {
  const res = await fetch(`${API_BASE}/route-statuses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add route status');
  return res.json();
}

export async function updateRouteStatus(id: number, data: Partial<Schema["route_statuses"]>) {
  const res = await fetch(`${API_BASE}/route-statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update route status');
  return res.json();
}

export async function deleteRouteStatus(id: number) {
  const res = await fetch(`${API_BASE}/route-statuses/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete route status');
  return res.json();
}

// TRUCKS
export async function getTrucks() {
  const res = await fetch(`${API_BASE}/trucks`);
  if (!res.ok) throw new Error('Failed to fetch trucks');
  return res.json();
}

export async function addTruck(data: Partial<Schema["trucks"]>) {
  const res = await fetch(`${API_BASE}/trucks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add truck');
  return res.json();
}

export async function updateTruck(id: number, data: Partial<Schema["trucks"]>) {
  const res = await fetch(`${API_BASE}/trucks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update truck');
  return res.json();
}

export async function deleteTruck(id: number) {
  const res = await fetch(`${API_BASE}/trucks/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete truck');
  return res.json();
}

// TRAILERS
export async function getTrailers() {
  const res = await fetch(`${API_BASE}/trailers`);
  if (!res.ok) throw new Error('Failed to fetch trailers');
  return res.json();
}

export async function addTrailer(data: Partial<Schema["trailers"]>) {
  const res = await fetch(`${API_BASE}/trailers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add trailer');
  return res.json();
}

export async function updateTrailer(id: number, data: Partial<Schema["trailers"]>) {
  const res = await fetch(`${API_BASE}/trailers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update trailer');
  return res.json();
}

export async function deleteTrailer(id: number) {
  const res = await fetch(`${API_BASE}/trailers/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete trailer');
  return res.json();
}

// ROUTE COMMENTS
export async function addRouteComment(
  route_id: number,
  text: string,
  by: string
) {
  const res = await fetch(`${API_BASE}/routes/${route_id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, by })
  });
  if (!res.ok) throw new Error('Failed to add comment');
  return res.json();
}

// USER MANAGEMENT
export async function getUsers() {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function getUser(id: number) {
  const res = await fetch(`${API_BASE}/users/${id}`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

export async function addUser(data: Partial<Schema["users"]>) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add user');
  return res.json();
}

export async function updateUser(id: number, data: Partial<Schema["users"]>) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}

export async function deleteUser(id: number) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
}

// USER PERMISSIONS
export async function getUserPermissions() {
  const res = await fetch(`${API_BASE}/user-permissions`);
  if (!res.ok) throw new Error('Failed to fetch user permissions');
  return res.json();
}

export async function addUserPermission(data: Partial<Schema["user_permissions"]>) {
  const res = await fetch(`${API_BASE}/user-permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add user permission');
  return res.json();
}

export async function updateUserPermission(id: number, data: Partial<Schema["user_permissions"]>) {
  const res = await fetch(`${API_BASE}/user-permissions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update user permission');
  return res.json();
}

export async function deleteUserPermission(id: number) {
  const res = await fetch(`${API_BASE}/user-permissions/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete user permission');
  return res.json();
}

// ZIP Code API
export async function getZipCodeDetails(zip: string) {
  const res = await fetch(`${API_BASE}/zip-codes/${zip}`);
  if (!res.ok) throw new Error('Failed to fetch ZIP code details');
  return res.json();
}

export async function calculateMileage(pickup_zip: string, delivery_zip: string) {
  const res = await fetch(`${API_BASE}/calculate-mileage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pickup_zip, delivery_zip })
  });
  if (!res.ok) throw new Error('Failed to calculate mileage');
  return res.json();
}

// Add similar functions for trucks, trailers, dispatchers, divisions, users as needed. 