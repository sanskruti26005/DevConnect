
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  location?: string;
  skills: string[];
  profileImage?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
}
