export type UserRole = 'ADMIN' | 'USER';

export interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  role: UserRole;
}

export interface Book {
  updatedAt: any;
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  filePath: string;
  description: string | null;

  // --- CORREÇÃO: Campo obrigatório que vem da API ---
  userId: string; 
  // --------------------------------------------------

  // Metadados de Leitura
  progress: number;
  currentLocation: string | null;
  
  // Metadados de Download (Estado Local)
  isDownloaded: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  
  // Metadados Sociais
  downloadsCount?: number;
  owner?: UserProfile;
}