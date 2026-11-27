
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

const API = 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

interface Developer {
  id: string;
  name: string;
  bio: string | null;
  location: string | null;
  skills: string[];
  connectionStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null;
  connectionId: string | null;
  requestSentByMe: boolean;
  _count: {
    projects: number;
    posts: number;
    endorsementsReceived: number;
  };
}

interface Connection {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  sender: {
    id: string;
    name: string;
    bio: string | null;
    location: string | null;
    skills: string[];
  };
  receiver: {
    id: string;
    name: string;
    bio: string | null;
    location: string | null;
    skills: string[];
  };
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    location: string | null;
  };
}

interface EndorsementItem {
  id: string;
  skill: string;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
  };
}

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface CommunityProps {
  currentUserId: string;
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers
    }
  });

  const result = await response.json() as ApiResponse<T>;

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Request failed');
  }

  return result;
}

function Community({
  currentUserId,
  activeSection,
  setActiveSection
}: CommunityProps) {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [endorsements, setEndorsements] = useState<
    Record<string, EndorsementItem[]>
  >({});

  const [expandedEndorsements, setExpandedEndorsements] =
    useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadCommunity = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        developerResult,
        connectionResult,
        blogResult,
        notificationResult
      ] = await Promise.all([
        apiRequest<Developer[]>('/users'),
        apiRequest<Connection[]>('/connections'),
        apiRequest<BlogPost[]>('/blogs'),
        apiRequest<NotificationItem[]>('/notifications')
      ]);

      setDevelopers(developerResult.data ?? []);
      setConnections(connectionResult.data ?? []);
      setPosts(blogResult.data ?? []);
      setNotifications(notificationResult.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load community data'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCommunity();
  }, []);

  const toggle = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const runAction = async (
    action: () => Promise<void>,
    successText: string
  ) => {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      await action();
      setMessage(successText);
      await loadCommunity();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'The action could not be completed'
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleEndorsements = async (developerId: string) => {
    if (expandedEndorsements === developerId) {
      setExpandedEndorsements(null);
      return;
    }

    setExpandedEndorsements(developerId);

    if (endorsements[developerId]) return;

    try {
      const result = await apiRequest<EndorsementItem[]>(
        `/endorsements/${developerId}`
      );

      setEndorsements((current) => ({
        ...current,
        [developerId]: result.data ?? []
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load endorsements'
      );
    }
  };

  const searchDevelopers = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await apiRequest<Developer[]>(
        `/users?search=${encodeURIComponent(search)}`
      );

      setDevelopers(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const submitBlog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction(async () => {
      const path = editingPostId
        ? `/blogs/${editingPostId}`
        : '/blogs';

      await apiRequest<BlogPost>(path, {
        method: editingPostId ? 'PUT' : 'POST',
        body: JSON.stringify({
          title: blogTitle,
          content: blogContent
        })
      });

      setBlogTitle('');
      setBlogContent('');
      setEditingPostId(null);
    }, editingPostId ? 'Blog post updated.' : 'Blog post published.');
  };

  const startEdit = (post: BlogPost) => {
    setEditingPostId(post.id);
    setBlogTitle(post.title);
    setBlogContent(post.content);
    setActiveSection('community-blogs');
  };

  const unreadCount = notifications.filter(
    (item) => !item.isRead
  ).length;

  return (
    <div className="community-sections">

      {error && (
        <p className="error-message community-message">{error}</p>
      )}

      {message && (
        <p className="success-message community-message">{message}</p>
      )}

      {/* DEVELOPERS PAGE */}
      <section className="accordion-section">
        <button
          className="accordion-trigger"
          type="button"
          onClick={() => toggle('find-developers')}
          aria-expanded={activeSection === 'find-developers'}
        >
          <span>Find Developers</span>
          <span className="accordion-icon">
            {activeSection === 'find-developers' ? '−' : '+'}
          </span>
        </button>

        {activeSection === 'find-developers' && (
          <div className="accordion-content developers-page">
            <div className="developers-heading">
              <div>
                <h2>Discover Developers</h2>
                <p>
                  Find people, share ideas and grow your developer network.
                </p>
              </div>

              <span className="developer-count">
                {developers.length} developers
              </span>
            </div>

            <form
              className="developer-search-form"
              onSubmit={searchDevelopers}
            >
              <span className="developer-search-icon">⌕</span>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, skill or location..."
                aria-label="Search developers"
              />

              <button
                className="primary-button"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {loading ? (
              <div className="developer-empty">
                Loading developers...
              </div>
            ) : developers.length === 0 ? (
              <div className="developer-empty">
                <h3>No developers found</h3>
                <p>
                  Try searching with another name, skill or location.
                </p>
              </div>
            ) : (
              <div className="developer-grid">
                {developers.map((developer) => (
                  <article
                    className="developer-card"
                    key={developer.id}
                  >
                    <div className="developer-card-top">
                      <div className="developer-avatar">
                        {developer.name.trim().charAt(0).toUpperCase()}
                      </div>

                      <div className="developer-identity">
                        <h3>{developer.name}</h3>
                        <p>
                          {developer.location || 'Location not specified'}
                        </p>
                      </div>

                      {developer.connectionStatus === 'ACCEPTED' && (
                        <span className="developer-connected">
                          Connected
                        </span>
                      )}
                    </div>

                    <p className="developer-bio">
                      {developer.bio ||
                        'Developer on DevConnect, building skills and projects.'}
                    </p>

                    <div className="developer-skills">
                      <span className="developer-label">SKILLS</span>

                      {developer.skills.length > 0 ? (
                        <div className="developer-skill-list">
                          {developer.skills.map((skill) => (
                            <span
                              className="developer-skill-tag"
                              key={skill}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="developer-no-skills">
                          No skills added yet
                        </p>
                      )}
                    </div>

                    <div className="developer-stats">
                      <div>
                        <strong>{developer._count.projects}</strong>
                        <span>Projects</span>
                      </div>

                      <div>
                        <strong>{developer._count.posts}</strong>
                        <span>Posts</span>
                      </div>

                      <div>
                        <strong>
                          {developer._count.endorsementsReceived}
                        </strong>
                        <span>Endorsements</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="developer-endorsement-link"
                      onClick={() =>
                        void toggleEndorsements(developer.id)
                      }
                    >
                      {expandedEndorsements === developer.id
                        ? 'Hide endorsements'
                        : 'View endorsements'}
                    </button>

                    {expandedEndorsements === developer.id && (
                      <div className="endorsement-list developer-endorsement-list">
                        {(endorsements[developer.id] ?? []).length === 0 ? (
                          <p>No endorsements yet.</p>
                        ) : (
                          (endorsements[developer.id] ?? []).map(
                            (item) => (
                              <p key={item.id}>
                                <strong>{item.fromUser.name}</strong>{' '}
                                endorsed{' '}
                                <strong>{item.skill}</strong>
                              </p>
                            )
                          )
                        )}
                      </div>
                    )}

                    <div className="developer-card-actions">
                      {developer.connectionStatus === null ? (
                        <button
                          className="primary-button developer-connect-button"
                          disabled={busy}
                          onClick={() =>
                            void runAction(async () => {
                              await apiRequest(
                                `/connections/${developer.id}`,
                                { method: 'POST' }
                              );
                            }, 'Connection request sent.')
                          }
                        >
                          Connect
                        </button>
                      ) : developer.connectionStatus === 'ACCEPTED' ? (
                        <span className="status-pill">Connected</span>
                      ) : developer.connectionStatus === 'PENDING' ? (
                        <span className="status-pill pending-pill">
                          {developer.requestSentByMe
                            ? 'Request sent'
                            : 'Request received'}
                        </span>
                      ) : (
                        <span className="status-pill">
                          Previously declined
                        </span>
                      )}
                    </div>

                    {developer.connectionStatus === null &&
                      developer.skills.length > 0 && (
                        <div className="endorse-row developer-endorse-control">
                          <label htmlFor={`endorse-${developer.id}`}>
                            Endorse a skill
                          </label>

                          <select
                            id={`endorse-${developer.id}`}
                            defaultValue=""
                            onChange={(event) => {
                              const skill = event.target.value;

                              if (skill) {
                                void runAction(async () => {
                                  await apiRequest(
                                    `/endorsements/${developer.id}`,
                                    {
                                      method: 'POST',
                                      body: JSON.stringify({ skill })
                                    }
                                  );
                                }, `Endorsed ${skill}.`);
                              }
                            }}
                          >
                            <option value="">Choose a skill</option>

                            {developer.skills.map((skill) => (
                              <option key={skill} value={skill}>
                                {skill}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                  </article>
                ))}
              </div>
            )}

            <p className="helper-text developer-helper">
              Showing up to 40 developers. Search matches names,
              locations and exact skill names.
            </p>
          </div>
        )}
      </section>

      {/* CONNECTIONS PAGE */}
      <section className="accordion-section">
        <button
          className="accordion-trigger"
          type="button"
          onClick={() => toggle('community-connections')}
          aria-expanded={activeSection === 'community-connections'}
        >
          <span>
            My Connections (
            {connections.filter(
              (item) => item.status === 'ACCEPTED'
            ).length}
            )
          </span>

          <span className="accordion-icon">
            {activeSection === 'community-connections' ? '−' : '+'}
          </span>
        </button>

        {activeSection === 'community-connections' && (
          <div className="accordion-content">
            {connections.length === 0 ? (
              <p>
                You don't have any connection requests yet. Find
                developers to connect.
              </p>
            ) : (
              connections.map((connection) => {
                const incoming =
                  connection.receiverId === currentUserId;

                const other = incoming
                  ? connection.sender
                  : connection.receiver;

                return (
                  <article
                    className="community-card"
                    key={connection.id}
                  >
                    <h3>{other.name}</h3>

                    <p>
                      {other.location || 'Location not specified'}
                    </p>

                    <p>
                      <strong>Status:</strong> {connection.status}
                    </p>

                    {connection.status === 'PENDING' && incoming && (
                      <div className="button-row">
                        <button
                          className="primary-button compact-button"
                          disabled={busy}
                          onClick={() =>
                            void runAction(async () => {
                              await apiRequest(
                                `/connections/${connection.id}`,
                                {
                                  method: 'PATCH',
                                  body: JSON.stringify({
                                    status: 'ACCEPTED'
                                  })
                                }
                              );
                            }, 'Connection accepted.')
                          }
                        >
                          Accept
                        </button>

                        <button
                          className="secondary-button compact-button"
                          disabled={busy}
                          onClick={() =>
                            void runAction(async () => {
                              await apiRequest(
                                `/connections/${connection.id}`,
                                {
                                  method: 'PATCH',
                                  body: JSON.stringify({
                                    status: 'REJECTED'
                                  })
                                }
                              );
                            }, 'Connection declined.')
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {connection.status === 'ACCEPTED' && (
                      <button
                        className="secondary-button compact-button"
                        disabled={busy}
                        onClick={() =>
                          void runAction(async () => {
                            await apiRequest(
                              `/connections/${connection.id}`,
                              { method: 'DELETE' }
                            );
                          }, 'Connection removed.')
                        }
                      >
                        Remove connection
                      </button>
                    )}
                  </article>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* BLOGS PAGE */}
      <section className="accordion-section">
        <button
          className="accordion-trigger"
          type="button"
          onClick={() => toggle('community-blogs')}
          aria-expanded={activeSection === 'community-blogs'}
        >
          <span>Developer Blogs ({posts.length})</span>

          <span className="accordion-icon">
            {activeSection === 'community-blogs' ? '−' : '+'}
          </span>
        </button>

        {activeSection === 'community-blogs' && (
          <div className="accordion-content blogs-page">

            <div className="blogs-heading">
              <div>
                <h2>Developer Community</h2>
                <p>
                  Ideas, experiences and lessons shared by developers.
                </p>
              </div>

              <span className="blogs-count">
                {posts.length} {posts.length === 1 ? 'article' : 'articles'}
              </span>
            </div>

            <form onSubmit={submitBlog} className="modern-blog-form">
              <div className="blog-form-heading">
                <div className="blog-write-icon">✎</div>
                <div>
                  <h3>
                    {editingPostId ? 'Edit your article' : 'Share your knowledge'}
                  </h3>
                  <p>
                    Share something you've learned or built with the community.
                  </p>
                </div>
              </div>

              <input
                className="blog-title-input"
                value={blogTitle}
                onChange={(event) => setBlogTitle(event.target.value)}
                placeholder="Give your article an interesting title..."
                required
                maxLength={120}
              />

              <textarea
                className="blog-content-input"
                value={blogContent}
                onChange={(event) => setBlogContent(event.target.value)}
                placeholder="Start writing your developer story here..."
                rows={6}
                required
              />

              <div className="blog-form-footer">
                <span className="blog-writing-hint">
                  Share your learning journey with others.
                </span>

                <div className="blog-form-buttons">
                  {editingPostId && (
                    <button
                      type="button"
                      className="blog-cancel-button"
                      onClick={() => {
                        setEditingPostId(null);
                        setBlogTitle('');
                        setBlogContent('');
                      }}
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    className="primary-button blog-publish-button"
                    type="submit"
                    disabled={busy}
                  >
                    {busy
                      ? 'Please wait...'
                      : editingPostId
                        ? 'Save Changes'
                        : 'Publish Article'}
                  </button>
                </div>
              </div>
            </form>

            <div className="blogs-feed-heading">
              <h3>Latest Articles</h3>
              <span>From the DevConnect community</span>
            </div>

            <div className="modern-blog-list">
              {posts.length === 0 ? (
                <div className="blogs-empty">
                  <div className="blogs-empty-icon">✎</div>
                  <h3>No articles yet</h3>
                  <p>
                    Be the first to share your experience with the community.
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <article className="modern-blog-card" key={post.id}>
                    <div className="modern-blog-author">
                      <div className="blog-author-avatar">
                        {post.author.name.trim().charAt(0).toUpperCase()}
                      </div>

                      <div className="blog-author-details">
                        <strong>{post.author.name}</strong>
                        <span>
                          {post.author.location || 'DevConnect member'}
                        </span>
                        <small>
                          {new Date(post.createdAt).toLocaleDateString(
                            undefined,
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }
                          )}
                        </small>
                      </div>

                      {post.authorId === currentUserId && (
                        <span className="my-blog-label">Your article</span>
                      )}
                    </div>

                    <div className="modern-blog-body">
                      <h3>{post.title}</h3>
                      <p className="modern-blog-content">{post.content}</p>
                    </div>

                    {post.authorId === currentUserId && (
                      <div className="modern-blog-actions">
                        <button
                          type="button"
                          className="blog-edit-button"
                          onClick={() => startEdit(post)}
                        >
                          ✎ Edit article
                        </button>

                        <button
                          type="button"
                          className="blog-delete-button"
                          disabled={busy}
                          onClick={() =>
                            void runAction(async () => {
                              await apiRequest(
                                `/blogs/${post.id}`,
                                { method: 'DELETE' }
                              );
                            }, 'Blog post deleted.')
                          }
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      {/* NOTIFICATIONS PAGE */}
      <section className="accordion-section">
        <button
          className="accordion-trigger"
          type="button"
          onClick={() => toggle('community-notifications')}
          aria-expanded={activeSection === 'community-notifications'}
        >
          <span>
            Notifications{' '}
            {unreadCount > 0 ? `(${unreadCount} unread)` : ''}
          </span>

          <span className="accordion-icon">
            {activeSection === 'community-notifications' ? '−' : '+'}
          </span>
        </button>

        {activeSection === 'community-notifications' && (
          <div className="accordion-content">
            {unreadCount > 0 && (
              <button
                className="secondary-button compact-button mark-read-button"
                onClick={() =>
                  void runAction(async () => {
                    await apiRequest('/notifications/read-all', {
                      method: 'PATCH'
                    });
                  }, 'Notifications marked as read.')
                }
              >
                Mark all as read
              </button>
            )}

            {notifications.length === 0 ? (
              <p>
                You're all caught up. No notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <article
                  className={`notification-item ${
                    notification.isRead ? '' : 'unread'
                  }`}
                  key={notification.id}
                >
                  <p>{notification.message}</p>

                  <span>
                    {new Date(
                      notification.createdAt
                    ).toLocaleString()}
                  </span>

                  {!notification.isRead && (
                    <button
                      className="text-button"
                      onClick={() =>
                        void runAction(async () => {
                          await apiRequest(
                            `/notifications/${notification.id}/read`,
                            { method: 'PATCH' }
                          );
                        }, 'Notification marked as read.')
                      }
                    >
                      Mark as read
                    </button>
                  )}
                </article>
              ))
            )}
          </div>
        )}
      </section>

      {loading && (
        <p className="helper-text">
          Loading community features...
        </p>
      )}
    </div>
  );
}

export default Community;
