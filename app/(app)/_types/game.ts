export type GameOrientation = 'PORTRAIT' | 'LANDSCAPE';

export interface Game {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  orientation: GameOrientation;
  price: number;
  plays: number;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
  isOwned: boolean; // Flag crítica que vem do backend
  createdAt: string;
}