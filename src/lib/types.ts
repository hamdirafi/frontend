import type { Role } from "./api";

export type ActiveSession = { id: number; opens_at: string };

export type EventItem = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  created_by: number;
  creator?: { id: number; name: string };
  active_session?: ActiveSession | null;
  attendances_count?: number;
};

export type AttendanceRow = {
  id: number;
  scanned_at: string;
  method: string;
  note: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    identity_number: string | null;
  };
};

export type QrToken = {
  token: string;
  window_seconds: number;
  expires_in: number;
};

export type HistoryRow = {
  id: number;
  scanned_at: string;
  method: string;
  event: {
    id: number;
    title: string;
    location: string | null;
    starts_at: string;
    ends_at: string;
  };
};

export type UserRow = {
  id: number;
  name: string;
  email: string;
  role: Role;
  identity_number: string | null;
};