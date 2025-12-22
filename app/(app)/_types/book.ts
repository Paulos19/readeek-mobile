// app/(app)/_types/book.ts

// Define apenas os papéis que existem no model User do Prisma (conforme o schema)
export type UserRole = 'ADMIN' | 'USER';

export interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  role: UserRole;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  filePath: string;
  description: string | null;
  
  // Metadados de Leitura (Sincronização)
  progress: number;
  currentLocation: string | null;
  
  // Metadados de Download (Estado Local)
  isDownloaded: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  
  // Metadados Sociais (Loja/Comunidade)
  downloadsCount?: number;
  owner?: UserProfile;
}