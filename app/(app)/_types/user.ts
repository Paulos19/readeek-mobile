// app/(app)/_types/user.ts

export interface PublicUserProfile {
  id: string;
  name: string;
  image: string | null;
  about: string | null;
  role: string;
  displayedInsigniaIds: string[];
  isFollowing: boolean; // <--- ADICIONE ESTE CAMPO
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