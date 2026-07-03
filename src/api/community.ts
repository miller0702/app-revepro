import { apiClient } from './client';
import type { CommunityReactionType, ReactionCounts } from '../constants/communityReactions';

export type CommunityPostKind = 'GENERAL' | 'RECOMMENDATION' | 'QUOTE' | 'ANNOUNCEMENT';

export interface CommunityAuthor {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string | null;
  isOfficial?: boolean;
}

export interface CommunityBookRef {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
}

export interface CommunityVideoRef {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
}

export interface CommunityPodcastRef {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  authorName: string | null;
}

export interface CommunityPostImage {
  id: string;
  url: string | null;
}

export interface CommunityMention {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface CommunityPostRepostPreview {
  id: string;
  kind: string;
  body: string;
  quoteExcerpt: string | null;
  images: CommunityPostImage[];
  author: CommunityAuthor;
  book: CommunityBookRef | null;
  video: CommunityVideoRef | null;
  podcast: CommunityPodcastRef | null;
  createdAt?: string;
}

export interface CommunityPost {
  id: string;
  kind?: CommunityPostKind;
  isPinned?: boolean;
  body: string;
  chapterId: string | null;
  quoteExcerpt: string | null;
  tags: string[];
  imageIds: string[];
  images: CommunityPostImage[];
  mentionIds: string[];
  mentions: CommunityMention[];
  bookId: string | null;
  book: CommunityBookRef | null;
  videoId: string | null;
  video: CommunityVideoRef | null;
  podcastSeriesId: string | null;
  podcast: CommunityPodcastRef | null;
  repostOfId: string | null;
  repostCount: number;
  repostOf: CommunityPostRepostPreview | null;
  commentCount: number;
  reactionCounts: ReactionCounts;
  myReaction: CommunityReactionType | null;
  /** @deprecated legacy */
  likeCount?: number;
  /** @deprecated legacy */
  likedByMe?: boolean;
  author: CommunityAuthor;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityComment {
  id: string;
  body: string;
  parentId: string | null;
  author: CommunityAuthor;
  createdAt: string;
}

export interface PostReactionUser {
  type: CommunityReactionType;
  user: CommunityAuthor;
  createdAt?: string;
}

export interface MentionUserOption extends CommunityAuthor {}

export interface CommunityUserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  coverFocusX: number;
  coverFocusY: number;
  isOfficial: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing: boolean;
  isMe: boolean;
}

export const communityApi = {
  getPosts: (params?: {
    page?: number;
    limit?: number;
    tag?: string;
    since?: string;
    authorId?: string;
  }) =>
    apiClient.get<{ data: CommunityPost[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      '/community/posts',
      { params },
    ),
  getPost: (id: string) => apiClient.get<{ data: CommunityPost }>(`/community/posts/${id}`),
  createPost: (body: {
    body: string;
    kind?: CommunityPostKind;
    bookId?: string;
    videoId?: string;
    podcastSeriesId?: string;
    chapterId?: string;
    quoteExcerpt?: string;
    tags?: string[];
    imageIds?: string[];
    mentionIds?: string[];
  }) => apiClient.post<{ data: CommunityPost }>('/community/posts', body),
  uploadImage: (formData: FormData) =>
    apiClient.post<{ data: { id: string; url: string | null } }>('/community/images', formData),
  searchMentionUsers: (q: string) =>
    apiClient.get<{ data: MentionUserOption[] }>('/community/mention-users', { params: { q } }),
  followUser: (userId: string) =>
    apiClient.post<{ data: { followingId: string; following: boolean } }>(`/community/follow/${userId}`),
  unfollowUser: (userId: string) =>
    apiClient.delete<{ data: { followingId: string; following: boolean } }>(`/community/follow/${userId}`),
  getUserProfile: (userId: string) =>
    apiClient.get<{ data: CommunityUserProfile }>(`/community/users/${userId}`),
  deletePost: (id: string) => apiClient.delete(`/community/posts/${id}`),
  toggleReaction: (id: string, type: CommunityReactionType) =>
    apiClient.post<{ data: { myReaction: CommunityReactionType | null; reactionCounts: ReactionCounts } }>(
      `/community/posts/${id}/reactions`,
      { type },
    ),
  toggleLike: (id: string) =>
    apiClient.post<{ data: { myReaction: CommunityReactionType | null; reactionCounts: ReactionCounts } }>(
      `/community/posts/${id}/like`,
    ),
  getComments: (postId: string) =>
    apiClient.get<{ data: CommunityComment[] }>(`/community/posts/${postId}/comments`),
  addComment: (postId: string, body: string, parentId?: string) =>
    apiClient.post<{ data: CommunityComment }>(`/community/posts/${postId}/comments`, {
      body,
      ...(parentId ? { parentId } : {}),
    }),
  getReactions: (postId: string) =>
    apiClient.get<{ data: PostReactionUser[] }>(`/community/posts/${postId}/reactions`),
  repostPost: (postId: string, body?: string) =>
    apiClient.post<{ data: CommunityPost }>(`/community/posts/${postId}/repost`, { body }),
  getLatestAnnouncement: () =>
    apiClient.get<{
      data: {
        id: string;
        body: string;
        tags: string[];
        isPinned: boolean;
        author: CommunityAuthor;
        createdAt: string;
      } | null;
    }>('/community/announcements/latest'),
};
