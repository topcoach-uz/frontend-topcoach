import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from 'src/app/store';
import { ACCESS_TOKEN } from 'src/constants/storage';
import { hostName } from 'src/app/services/api/const';
import {
  communityFeedApi,
  type CommunityPost,
  type ListPostsResponse,
} from 'src/app/services/communityFeedApi';

/**
 * Singleton community-socket manager. Mirrors the pattern used by
 * `src/lib/socket/socket.ts` for the chat namespace: one Socket per
 * tab, shared across React renders. This avoids the React 18 StrictMode
 * mount-unmount-mount cycle that races the WebSocket handshake and
 * surfaces as
 *   "WebSocket is closed before the connection is established"
 * in dev tools every time the feed view mounts.
 *
 * Subscribers register via {@link onEvent} and unregister in their effect
 * cleanup. The underlying Socket stays open even when no view is mounted —
 * cheap, and gives instant data when the user navigates back.
 */
class CommunitySocketManager {
  private socket: Socket | null = null;
  private newPostListeners = new Set<(count: number) => void>();
  private newPostCount = 0;

  private dispatch: ((action: unknown) => unknown) | null = null;

  setDispatch(dispatch: (action: unknown) => unknown) {
    this.dispatch = dispatch;
  }

  ensureConnected(): Socket | null {
    if (this.socket?.connected) return this.socket;
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) return null;

    if (this.socket) return this.socket; // already connecting

    const sock = io(`${hostName}/community`, {
      auth: { token },
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    this.socket = sock;
    this.attachListeners(sock);
    return sock;
  }

  private attachListeners(sock: Socket) {
    const dispatch = () => this.dispatch;

    sock.on('post.created', () => {
      this.newPostCount += 1;
      this.notifyNewPostListeners();
    });

    sock.on('post.like.changed', (payload: { postId: string; likeCount: number }) => {
      const d = dispatch();
      if (!d) return;
      d(
        communityFeedApi.util.updateQueryData(
          'listPosts',
          undefined as never,
          (draft: ListPostsResponse) => {
            const found = draft.items.find((p: CommunityPost) => p.id === payload.postId);
            if (found) found.likeCount = payload.likeCount;
          },
        ),
      );
    });

    const invalidate = (tags: Array<{ type: 'Post' | 'Comments'; id: string }>) => {
      const d = dispatch();
      if (!d) return;
      d(communityFeedApi.util.invalidateTags(tags));
    };

    sock.on('post.updated', () => invalidate([{ type: 'Post', id: 'LIST' }]));
    sock.on('post.hidden', () => invalidate([{ type: 'Post', id: 'LIST' }]));
    sock.on('post.deleted', () => invalidate([{ type: 'Post', id: 'LIST' }]));
    sock.on('post.pinned', () => invalidate([{ type: 'Post', id: 'LIST' }]));
    sock.on('post.unpinned', () => invalidate([{ type: 'Post', id: 'LIST' }]));

    sock.on('comment.created', (payload: { postId: string }) => {
      invalidate([
        { type: 'Comments', id: payload.postId },
        { type: 'Post', id: payload.postId },
      ]);
    });
    sock.on('comment.deleted', (payload: { postId?: string }) => {
      if (payload?.postId) invalidate([{ type: 'Comments', id: payload.postId }]);
    });
  }

  subscribeNewPost(cb: (count: number) => void): () => void {
    this.newPostListeners.add(cb);
    cb(this.newPostCount);
    return () => { this.newPostListeners.delete(cb); };
  }

  resetNewPostCount() {
    this.newPostCount = 0;
    this.notifyNewPostListeners();
  }

  private notifyNewPostListeners() {
    this.newPostListeners.forEach((cb) => cb(this.newPostCount));
  }

  joinPost(postId: string) {
    this.ensureConnected()?.emit('join_post', { postId });
  }
  leavePost(postId: string) {
    this.ensureConnected()?.emit('leave_post', { postId });
  }
}

const communitySocketManager = new CommunitySocketManager();

/**
 * Thin React hook that mounts the singleton socket on first use and
 * exposes the "new post" counter as state. Safe under React 18 StrictMode
 * since the underlying socket isn't torn down between renders.
 */
export function useCommunitySocket() {
  const dispatch = useAppDispatch();
  const [newPostCount, setNewPostCount] = useState(0);

  useEffect(() => {
    communitySocketManager.setDispatch(dispatch as unknown as (action: unknown) => unknown);
    communitySocketManager.ensureConnected();
    const unsubscribe = communitySocketManager.subscribeNewPost(setNewPostCount);
    return unsubscribe;
  }, [dispatch]);

  return {
    newPostCount,
    clearNewPostCount: () => communitySocketManager.resetNewPostCount(),
    joinPost: (postId: string) => communitySocketManager.joinPost(postId),
    leavePost: (postId: string) => communitySocketManager.leavePost(postId),
  };
}
