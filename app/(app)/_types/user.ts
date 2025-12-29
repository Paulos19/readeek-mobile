// app/(app)/_types/user.ts

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  about?: string | null;
  credits?: number;
  wallpaperUrl?: string | null;
  myBubbleColor?: string;
  otherBubbleColor?: string;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  image: string | null;
  about: string | null;
  role: string;
  displayedInsigniaIds: string[];
  isFollowing: boolean; // <--- CAMPO IMPORTANTE PARA O BOTÃO SEGUIR
  _count: {
    followers: number;
    following: number;
    books: number;
  };
  books: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    progress: number;
  }[];
}