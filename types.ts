export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  start: Point;
  end: Point;
}

export interface Door {
  wallIndex: number; // Index of the wall it belongs to in the room's walls array
  position: number; // A value from 0 to 1 representing position along the wall
  width: number;
  type?: 'standard' | 'bay';
}

export interface Window {
  wallIndex: number; // Index of the wall it belongs to in the room's walls array
  position: number; // A value from 0 to 1 representing position along the wall
  width: number;
}

export interface Room {
  name: string;
  polygon: Point[];
  doors?: Door[];
  windows?: Window[];
}

export interface Path {
  name: string;
  points: Point[];
  color?: string;
}

export interface Structure {
  name: string;
  type: 'hoist' | 'lift' | 'large_equipment' | 'skylight' | 'stairs' | 'other';
  polygon: Point[]; // Footprint of the structure
}

export interface FloorPlan {
  units: 'feet' | 'meters';
  rooms: Room[];
  paths?: Path[];
  structures?: Structure[];
}