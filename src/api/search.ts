import { apiClient } from './client';
import type { CommunityAuthor, CommunityPostKind } from './community';
import type { CommunityReactionType } from '../constants/communityReactions';

export type SearchTab = 'all' | 'people' | 'posts' | 'books' | 'videos' | 'audios';

export type SearchScope = 'all' | 'books' | 'videos' | 'audios';

export interface SearchPerson {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface SearchPost {
  id: string;
  body: string;
  kind: CommunityPostKind | string;
  tags: string[];
  author: CommunityAuthor;
  createdAt?: string;
}

export interface SearchBook {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  coverUrl?: string | null;
  authorName?: string | null;
}

export interface SearchVideo {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  categoryName?: string | null;
}

export interface SearchAudio {
  id: string;
  kind: 'AUDIOBOOK' | 'PODCAST';
  title: string;
  slug: string;
  subtitle?: string | null;
  coverUrl?: string | null;
}

export interface SearchResults {
  people: SearchPerson[];
  posts: SearchPost[];
  books: SearchBook[];
  videos: SearchVideo[];
  audios: SearchAudio[];
}

export interface SearchCounts {
  people: number;
  posts: number;
  books: number;
  videos: number;
  audios: number;
}

export const searchApi = {
  search: (params: { q: string; tab?: SearchTab; scope?: SearchScope }) =>
    apiClient.get<{ data: SearchResults; meta: { counts: SearchCounts; tab: SearchTab; scope?: SearchScope; q: string } }>(
      '/search',
      { params },
    ),
};
