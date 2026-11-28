
import { useEffect, useState } from 'react';
import { API_BASE } from './api';

const API = `${API_BASE}/feed`;

interface FeedPost {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profileImage: string | null;
  };
}

function Feed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  const loadFeed = async () => {
    try {
      const response = await fetch(API, {
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to load feed');
      }

      setPosts(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load feed'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeFeed = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/auth/me`,
          { credentials: 'include' }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          setCurrentUserId(result.data.id);
        }
      } catch {
        // Feed remains viewable even if user details cannot be loaded.
      }

      await loadFeed();
    };

    void initializeFeed();
  }, []);

  const publishPost = async () => {
    if (!content.trim()) {
      setError('Please write something before publishing.');
      return;
    }

    setPublishing(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(API, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to publish post');
      }

      setPosts((previousPosts) => [
        result.data,
        ...previousPosts
      ]);

      setContent('');
      setMessage('Your post has been published!');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to publish post'
      );
    } finally {
      setPublishing(false);
    }
  };

  const deletePost = async (postId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this post?'
    );

    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API}/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to delete post');
      }

      setPosts((previousPosts) =>
        previousPosts.filter((post) => post.id !== postId)
      );

      setMessage('Post deleted successfully.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to delete post'
      );
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

  return (
    <section className="feed-module">
      <div className="feed-composer-card">
        <div className="feed-composer-header">
          <div>
            <h3>Share an update</h3>
            <p>What are you building or learning today?</p>
          </div>
          <span className="feed-composer-icon">✦</span>
        </div>

        <textarea
          className="feed-composer-textarea"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Share your progress, ideas or achievements..."
          maxLength={1000}
          rows={4}
        />

        <div className="feed-composer-footer">
          <span>{content.length}/1000 characters</span>
          <button
            type="button"
            onClick={publishPost}
            disabled={publishing || !content.trim()}
          >
            {publishing ? 'Publishing...' : 'Publish post →'}
          </button>
        </div>
      </div>

      {error && (
        <div className="feed-status feed-error">{error}</div>
      )}

      {message && (
        <div className="feed-status feed-success">{message}</div>
      )}

      <div className="feed-list-heading">
        <div>
          <h3>Latest updates</h3>
          <p>See what's happening in your developer community.</p>
        </div>
        <span>{posts.length} posts</span>
      </div>

      {loading ? (
        <div className="feed-empty-state">Loading community feed...</div>
      ) : posts.length === 0 ? (
        <div className="feed-empty-state">
          <span>✦</span>
          <h3>It's quiet here!</h3>
          <p>Be the first to share an update with the community.</p>
        </div>
      ) : (
        <div className="feed-post-list">
          {posts.map((post) => (
            <article className="feed-post-card" key={post.id}>
              <div className="feed-post-header">
                <div className="feed-post-avatar">
                  {post.author.profileImage ? (
                    <img
                      src={post.author.profileImage}
                      alt={post.author.name}
                    />
                  ) : (
                    post.author.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="feed-post-author">
                  <strong>{post.author.name}</strong>
                  <span>{formatDate(post.createdAt)}</span>
                </div>

                {currentUserId === post.authorId && (
                  <button
                    type="button"
                    className="feed-delete-button"
                    onClick={() => void deletePost(post.id)}
                  >
                    Delete
                  </button>
                )}
              </div>

              <p className="feed-post-content">{post.content}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Feed;
