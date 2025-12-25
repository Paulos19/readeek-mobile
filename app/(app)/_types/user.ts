// app/(app)/_types/user.ts (crie este arquivo se não existir)

export interface PublicBook {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  progress: number;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  image: string | null;
  about: string | null;
  role: string;
  displayedInsigniaIds: string[];
  _count: {
    followers: number;
    following: number;
    books: number;
  };
  books: PublicBook[];
}