export interface Community {
  id: string;
  name: string;
  description: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  _count?: {
    members: number;
    posts: number;
  };
  members?: { user: { image: string | null } }[];
}

export interface CommunityPost {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    comments: number;
    reactions: number;
  };
}