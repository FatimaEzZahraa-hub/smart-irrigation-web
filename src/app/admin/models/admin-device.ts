export interface AdminDevice {
  id: string;
  userId: string;
  name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  mode: string;
  active: boolean;
  lastConnection: string | null;
  createdAt: string;
  updatedAt: string;
}
