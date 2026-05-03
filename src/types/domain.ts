export type Stop = {
  id: string;
  address: string;
  label?: string;
  lng: number;
  lat: number;
  note?: string;
  phone?: string;
  visited: boolean;
};

export type Route = {
  id: string;
  name: string;
  stops: Stop[];
  optimizedOrder?: string[];
  createdAt: number;
  updatedAt: number;
};

export type Template = {
  id: string;
  name: string;
  stops: Omit<Stop, 'visited'>[];
  createdAt: number;
};
