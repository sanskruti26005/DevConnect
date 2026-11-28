
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Projects from './Projects';
import Community from './Community';
import Feed from './Feed';
import { API_BASE } from './api';
const API = `${API_BASE}/profile`;

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  location: string | null;
  profileImage: string | null;
  skills: string[];
}

interface ProfileProps {
  onLogout: () => void;
}

const navigation = [
  { id: 'home', label: 'Overview', icon: '⌂' },
  { id: 'find-developers', label: 'Discover Developers', icon: '◎' },
  { id: 'community-blogs', label: 'Developer Blogs', icon: '▤' },
  { id: 'my-projects', label: 'My Projects', icon: '▦' },
  { id: 'community-connections', label: 'My Connections', icon: '♧' },
  { id: 'community-notifications', label: 'Notifications', icon: '♢' },
  { id: 'profile', label: 'My Profile', icon: '◉' }
];

function Profile({ onLogout }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>('home');
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(API, {
          credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to load profile');
        }

        const user = result.data as UserProfile;

        setProfile(user);
        setName(user.name);
        setBio(user.bio ?? '');
        setLocation(user.location ?? '');
        setSkills(user.skills.join(', '));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load profile'
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(API, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          bio,
          location,
          skills: skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean)
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to update profile');
      }

      const updatedProfile = result.data as UserProfile;

      setProfile(updatedProfile);
      setName(updatedProfile.name);
      setBio(updatedProfile.bio ?? '');
      setLocation(updatedProfile.location ?? '');
      setSkills(updatedProfile.skills.join(', '));
      setEditing(false);
      setMessage('Your profile has been updated successfully.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    if (!profile) return;

    setName(profile.name);
    setBio(profile.bio ?? '');
    setLocation(profile.location ?? '');
    setSkills(profile.skills.join(', '));
    setEditing(false);
    setError('');
  };

  const selectSection = (section: string) => {
    setActiveSection(section);
    setEditing(false);
    setError('');
    setMessage('');
  };

  const firstName = profile?.name?.trim().split(/\s+/)[0] || 'Developer';
  const initials = profile?.name?.trim().charAt(0).toUpperCase() || 'D';

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Preparing your DevConnect workspace...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <button
          className="dashboard-brand"
          type="button"
          onClick={() => selectSection('home')}
        >
          <span className="brand-mark">D</span>
          <span>
            DevConnect<span className="brand-period">.</span>
          </span>
        </button>

        <div className="topbar-right">
          <span className="topbar-greeting">
            Welcome, {firstName}
          </span>

          <button
            type="button"
            className="topbar-avatar"
            onClick={() => selectSection('profile')}
            aria-label="Open profile"
          >
            {initials}
          </button>

          <button
            type="button"
            className="topbar-logout"
            onClick={onLogout}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <div className="sidebar-profile">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-profile-info">
              <strong>{profile?.name || 'Developer'}</strong>
              <span>{profile?.location || 'Add your location'}</span>
            </div>
          </div>

          <p className="sidebar-label">WORKSPACE</p>

          <nav className="sidebar-navigation" aria-label="Main navigation">
            {navigation.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`sidebar-nav-item ${
                  activeSection === item.id ? 'active' : ''
                }`}
                onClick={() => selectSection(item.id)}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {activeSection === item.id && (
                  <span className="nav-active-indicator" />
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-tip">
              <span className="tip-icon">✦</span>
              <strong>Keep growing</strong>
              <p>
                Share your work and connect with other developers.
              </p>
              <button
                type="button"
                onClick={() => selectSection('community-blogs')}
              >
                Write an article →
              </button>
            </div>

            <button
              type="button"
              className="sidebar-signout"
              onClick={onLogout}
            >
              <span>↪</span> Sign out
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-content">
            {error && (
              <div className="dashboard-alert error-message">
                {error}
              </div>
            )}

            {message && (
              <div className="dashboard-alert success-message">
                {message}
              </div>
            )}

            {activeSection === 'home' && (
              <section className="overview-page">
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">YOUR WORKSPACE</p>
                    <h1>Good to see you, {firstName}.</h1>
                    <p className="page-subtitle">
                      Your developer journey continues here. Explore,
                      build and connect with the community.
                    </p>
                  </div>

                  <div className="heading-avatar">{initials}</div>
                </div>

                <div className="welcome-banner">
                  <div className="welcome-banner-content">
                    <span className="banner-label">
                      WELCOME TO DEVCONNECT
                    </span>
                    <h2>Build your network. Share your journey.</h2>
                    <p>
                      Showcase your projects, discover developers and
                      learn from the community.
                    </p>
                    <button
                      type="button"
                      onClick={() => selectSection('find-developers')}
                    >
                      Explore developers <span>→</span>
                    </button>
                  </div>

                  <div className="welcome-decoration" aria-hidden="true">
                    <span>{'{ }'}</span>
                    <span>&lt;/&gt;</span>
                    <span>✦</span>
                  </div>
                </div>

                <div className="section-heading">
                  <div>
                    <h2>Quick access</h2>
                    <p>Pick up where you want to continue.</p>
                  </div>
                </div>

                <div className="quick-access-grid">
                  <button
                    type="button"
                    className="quick-access-card"
                    onClick={() => selectSection('my-projects')}
                  >
                    <span className="quick-card-icon purple">▦</span>
                    <strong>My Projects</strong>
                    <span>Showcase what you've built</span>
                    <span className="quick-card-arrow">→</span>
                  </button>

                  <button
                    type="button"
                    className="quick-access-card"
                    onClick={() => selectSection('find-developers')}
                  >
                    <span className="quick-card-icon blue">◎</span>
                    <strong>Discover Developers</strong>
                    <span>Find people with shared interests</span>
                    <span className="quick-card-arrow">→</span>
                  </button>

                  <button
                    type="button"
                    className="quick-access-card"
                    onClick={() => selectSection('community-blogs')}
                  >
                    <span className="quick-card-icon orange">▤</span>
                    <strong>Developer Blogs</strong>
                    <span>Share ideas and experiences</span>
                    <span className="quick-card-arrow">→</span>
                  </button>
                </div>

                <div className="section-heading overview-profile-heading">
                  <div>
                    <h2>Your profile</h2>
                    <p>Keep your developer information up to date.</p>
                  </div>
                  <button
                    type="button"
                    className="subtle-action"
                    onClick={() => selectSection('profile')}
                  >
                    Edit profile →
                  </button>
                </div>

                <div className="overview-profile-card">
                  <div className="overview-profile-avatar">
                    {initials}
                  </div>

                  <div className="overview-profile-details">
                    <h3>{profile?.name}</h3>
                    <p>
                      {profile?.bio ||
                        'Add a short bio to introduce yourself.'}
                    </p>

                    <div className="profile-meta">
                      <span>✉ {profile?.email}</span>
                      <span>
                        ⌖ {profile?.location || 'Location not specified'}
                      </span>
                    </div>

                    <div className="overview-skills">
                      {profile?.skills?.length ? (
                        profile.skills.map((skill) => (
                          <span className="skill-chip" key={skill}>
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="muted-text">
                          No skills added yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="section-heading feed-heading">
                  <div>
                    <h2>Community feed</h2>
                    <p>
                      Share your progress and connect with developers.
                    </p>
                  </div>
                </div>

                <Feed />
              </section>
            )}

            {activeSection === 'profile' && (
              <section className="profile-page">
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">ACCOUNT</p>
                    <h1>My Profile</h1>
                    <p className="page-subtitle">
                      Manage your personal details and developer identity.
                    </p>
                  </div>
                </div>

                <div className="profile-hero-card">
                  <div className="profile-hero-avatar">{initials}</div>
                  <div className="profile-hero-info">
                    <h2>{profile?.name}</h2>
                    <p>
                      {profile?.location || 'Location not specified'}
                    </p>
                    <span className="profile-member-tag">
                      DEVCONNECT MEMBER
                    </span>
                  </div>

                  {!editing && (
                    <button
                      type="button"
                      className="primary-action"
                      onClick={() => setEditing(true)}
                    >
                      Edit profile
                    </button>
                  )}
                </div>

                <div className="profile-form-card">
                  <div className="section-heading">
                    <div>
                      <h2>Personal information</h2>
                      <p>
                        Your information helps developers get to know you.
                      </p>
                    </div>
                  </div>

                  {editing ? (
                    <form
                      className="professional-form"
                      onSubmit={saveProfile}
                    >
                      <label>
                        Full name
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          required
                        />
                      </label>

                      <label>
                        Email address
                        <input value={profile?.email || ''} disabled />
                      </label>

                      <label>
                        Location
                        <input
                          value={location}
                          onChange={(event) =>
                            setLocation(event.target.value)
                          }
                          placeholder="e.g. Chandrapur, Maharashtra"
                        />
                      </label>

                      <label>
                        About you
                        <textarea
                          value={bio}
                          onChange={(event) => setBio(event.target.value)}
                          placeholder="Tell the community a little about yourself..."
                          rows={4}
                        />
                      </label>

                      <label>
                        Skills
                        <input
                          value={skills}
                          onChange={(event) => setSkills(event.target.value)}
                          placeholder="Python, Java, React, SQL"
                        />
                        <span className="field-hint">
                          Separate each skill with a comma.
                        </span>
                      </label>

                      <div className="form-actions">
                        <button
                          type="button"
                          className="secondary-action"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="primary-action"
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="profile-information">
                      <div className="information-row">
                        <span>Full name</span>
                        <strong>{profile?.name || 'Not provided'}</strong>
                      </div>

                      <div className="information-row">
                        <span>Email address</span>
                        <strong>{profile?.email || 'Not provided'}</strong>
                      </div>

                      <div className="information-row">
                        <span>Location</span>
                        <strong>
                          {profile?.location || 'Not provided'}
                        </strong>
                      </div>

                      <div className="information-row">
                        <span>About</span>
                        <strong>{profile?.bio || 'No bio added yet'}</strong>
                      </div>

                      <div className="information-row">
                        <span>Skills</span>
                        <div className="overview-skills">
                          {profile?.skills?.length ? (
                            profile.skills.map((skill) => (
                              <span className="skill-chip" key={skill}>
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="muted-text">
                              No skills added yet
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {(activeSection === 'my-projects' ||
              activeSection === 'add-project') && (
              <section className="module-page">
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">YOUR WORK</p>
                    <h1>My Projects</h1>
                    <p className="page-subtitle">
                      Organize and showcase the things you're building.
                    </p>
                  </div>
                </div>

                <Projects
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                />
              </section>
            )}

            {(activeSection === 'find-developers' ||
              activeSection === 'community-blogs' ||
              activeSection === 'community-connections' ||
              activeSection === 'community-notifications') && (
              <section className="module-page">
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">COMMUNITY</p>
                    <h1>
                      {activeSection === 'find-developers' &&
                        'Discover Developers'}
                      {activeSection === 'community-blogs' &&
                        'Developer Blogs'}
                      {activeSection === 'community-connections' &&
                        'My Connections'}
                      {activeSection === 'community-notifications' &&
                        'Notifications'}
                    </h1>
                    <p className="page-subtitle">
                      Connect, collaborate and share knowledge with developers.
                    </p>
                  </div>
                </div>

                <Community
                  currentUserId={profile?.id || ''}
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                />
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Profile;
