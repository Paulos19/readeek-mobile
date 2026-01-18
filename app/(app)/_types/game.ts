export type GameOrientation = 'PORTRAIT' | 'LANDSCAPE';

export interface Game {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  
  // Adicionado para suportar o código do jogo
  // É opcional (?) pois na listagem geral (feed) esse campo não deve vir para economizar dados
  htmlContent?: string; 

  orientation: GameOrientation;
  price: number;
  plays: number;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    image: string | null;
  };
  isOwned: boolean;
  createdAt: string;
}