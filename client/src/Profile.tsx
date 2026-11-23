
import { useEffect, useState } from 'react';
import Projects from './Projects';

const API_URL = 'http://localhost:5000/api/profile';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  location: string | null;
  profileImage: string | null;
  skills: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

interface ProfileProps {
  onLogout: () => void;
}

function Profile({ onLogout }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Controls which dashboard section is open
  const [activeSection, setActiveSection] = useState<string | null>('profile');

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(API_URL, {
          credentials: 'include'
        });

        const result: ApiResponse<UserProfile> = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || 'Unable to fetch profile');
        }

        setProfile(result.data);
        setName(result.data.name);
        setBio(result.data.bio || '');
        setLocation(result.data.location || '');
        setSkills(result.data.skills.join(', '));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to fetch profile'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Save updated profile
  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setMessage('');
    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
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

      const result: ApiResponse<UserProfile> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || 'Unable to update profile');
      }

      setProfile(result.data);
      setName(result.data.name);
      setBio(result.data.bio || '');
      setLocation(result.data.location || '');
      setSkills(result.data.skills.join(', '));
      setIsEditing(false);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  // Toggle dashboard sections
  const toggleSection = (section: string) => {
    setActiveSection((current) =>
      current === section ? null : section
    );
  };

  if (loading) {
    return <div className="dashboard-card">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="dashboard-card">
        <p className="error-message">{error || 'Profile not found'}</p>
        <button className="primary-button" onClick={onLogout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-card profile-card">

      <h1>DevConnect</h1>
      <p className="tagline">Your Developer Dashboard</p>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {/* My Profile Section */}
      <div className="accordion-section">

        <button
          type="button"
          className="accordion-trigger"
          onClick={() => toggleSection('profile')}
          aria-expanded={activeSection === 'profile'}
        >
          <span>My Profile</span>
          <span className="accordion-icon">
            {activeSection === 'profile' ? '−' : '+'}
          </span>
        </button>

        {activeSection === 'profile' && (
          <div className="accordion-content">

            {!isEditing ? (
              <div className="profile-details">
                <h2>{profile.name}</h2>

                <p>
                  <strong>Email:</strong> {profile.email}
                </p>

                <p>
                  <strong>Bio:</strong>{' '}
                  {profile.bio || 'No bio added yet'}
                </p>

                <p>
                  <strong>Location:</strong>{' '}
                  {profile.location || 'Not specified'}
                </p>

                <p>
                  <strong>Skills:</strong>{' '}
                  {profile.skills.length > 0
                    ? profile.skills.join(', ')
                    : 'No skills added yet'}
                </p>

                <button
                  className="primary-button"
                  onClick={() => {
                    setMessage('');
                    setError('');
                    setIsEditing(true);
                  }}
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave}>
                <h2>Edit Your Profile</h2>

                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />

                <textarea
                  placeholder="Write something about yourself"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={4}
                />

                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />

                <input
                  type="text"
                  placeholder="Skills separated by commas"
                  value={skills}
                  onChange={(event) => setSkills(event.target.value)}
                />

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setName(profile.name);
                    setBio(profile.bio || '');
                    setLocation(profile.location || '');
                    setSkills(profile.skills.join(', '));
                    setIsEditing(false);
                    setError('');
                  }}
                >
                  Cancel
                </button>
              </form>
            )}

          </div>
        )}
      </div>

      {/* Project Sections */}
      <Projects
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Logout */}
      <button
        className="secondary-button logout-button"
        onClick={onLogout}
      >
        Logout
      </button>

    </div>
  );
}

export default Profile;
