
import { useEffect, useState } from 'react';
import { API_BASE } from './api';

const API_URL = `${API_BASE}/projects`;

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl: string | null;
  liveUrl: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

interface ProjectsProps {
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
}

function Projects({ activeSection, setActiveSection }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch projects when the component loads
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(API_URL, {
          credentials: 'include'
        });

        const result: ApiResponse<Project[]> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to fetch projects');
        }

        setProjects(result.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to fetch projects'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Add a new project
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');
    setMessage('');
    setSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          technologies: technologies
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          githubUrl,
          liveUrl
        })
      });

      const result: ApiResponse<Project> = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || 'Unable to add project');
      }

      setProjects((previous) => [result.data!, ...previous]);

      setTitle('');
      setDescription('');
      setTechnologies('');
      setGithubUrl('');
      setLiveUrl('');

      setMessage('Project added successfully!');
      setActiveSection('my-projects');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to add project'
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete a project
  const handleDelete = async (projectId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this project?'
    );

    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/${projectId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result: ApiResponse<unknown> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to delete project');
      }

      setProjects((previous) =>
        previous.filter((project) => project.id !== projectId)
      );

      setMessage('Project deleted successfully!');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to delete project'
      );
    }
  };

  return (
    <div className="projects-accordion">

      {/* Add New Project */}
      <div className="accordion-section">

        <button
          type="button"
          className="accordion-trigger"
          onClick={() =>
            setActiveSection(
              activeSection === 'add-project' ? null : 'add-project'
            )
          }
          aria-expanded={activeSection === 'add-project'}
        >
          <span>Add a New Project</span>
          <span className="accordion-icon">
            {activeSection === 'add-project' ? '−' : '+'}
          </span>
        </button>

        {activeSection === 'add-project' && (
          <div className="accordion-content">

            <form className="project-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Project Title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />

              <textarea
                placeholder="Project Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                required
              />

              <input
                type="text"
                placeholder="Technologies (React, Java, SQL...)"
                value={technologies}
                onChange={(event) => setTechnologies(event.target.value)}
              />

              <input
                type="url"
                placeholder="GitHub URL (optional)"
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.target.value)}
              />

              <input
                type="url"
                placeholder="Live Project URL (optional)"
                value={liveUrl}
                onChange={(event) => setLiveUrl(event.target.value)}
              />

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving ? 'Adding...' : 'Add Project'}
              </button>
            </form>

          </div>
        )}
      </div>

      {/* My Projects */}
      <div className="accordion-section">

        <button
          type="button"
          className="accordion-trigger"
          onClick={() =>
            setActiveSection(
              activeSection === 'my-projects' ? null : 'my-projects'
            )
          }
          aria-expanded={activeSection === 'my-projects'}
        >
          <span>My Projects ({projects.length})</span>
          <span className="accordion-icon">
            {activeSection === 'my-projects' ? '−' : '+'}
          </span>
        </button>

        {activeSection === 'my-projects' && (
          <div className="accordion-content">

            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            {loading ? (
              <p>Loading projects...</p>
            ) : projects.length === 0 ? (
              <p>No projects added yet.</p>
            ) : (
              <div className="project-list">
                {projects.map((project) => (
                  <div className="project-item" key={project.id}>
                    <h3>{project.title}</h3>

                    <p>{project.description}</p>

                    <p>
                      <strong>Technologies:</strong>{' '}
                      {project.technologies.join(', ') || 'Not specified'}
                    </p>

                    {project.githubUrl && (
                      <p>
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          GitHub Repository
                        </a>
                      </p>
                    )}

                    {project.liveUrl && (
                      <p>
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Live Project
                        </a>
                      </p>
                    )}

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(project.id)}
                    >
                      Delete Project
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}

export default Projects;
