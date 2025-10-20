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

export interface FloorPlan {
  units: 'feet' | 'meters';
  rooms: Room[];
  paths?: Path[];
}