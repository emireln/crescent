export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ProjectScript {
  id: string;
  project_id: string;
  name: string;
  command: string;
}

export interface ProjectPort {
  id: string;
  project_id: string;
  port: number;
  description: string;
}

export interface GitInfo {
  is_repo: boolean;
  branch: string | null;
  dirty: boolean;
  modified_count: number;
  last_commit: string | null;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
  tech_stack: string[];
  primary_tech: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  is_favorite: boolean;
  is_pinned: boolean;
  notes: string;
  readme_cache: string | null;
  last_modified: number;
  size_bytes: number;
  git_branch: string | null;
  git_dirty: boolean;
  exists_on_disk: boolean;
  tags: Tag[];
  scripts: ProjectScript[];
  ports: ProjectPort[];
  created_at: number;
  updated_at: number;
}

export interface DiscoveredProject {
  name: string;
  path: string;
  primary_tech: string;
  tech_stack: string[];
  last_modified: number;
  size_bytes: number;
  git: GitInfo;
  has_readme: boolean;
  is_existing: boolean;
}

export interface ScanOptions {
  root_path: string;
  max_depth: number;
  ignore_patterns: string[];
}

export interface CreateProjectInput {
  name: string;
  path: string;
  description?: string;
  tech_stack: string[];
  primary_tech: string;
  status?: string;
  is_favorite?: boolean;
  is_pinned?: boolean;
  notes?: string;
  tag_ids?: string[];
  ports?: number[];
  scripts?: [string, string][];
}

export interface UpdateProjectInput {
  id: string;
  name: string;
  path: string;
  description: string;
  tech_stack: string[];
  primary_tech: string;
  status: string;
  is_favorite: boolean;
  is_pinned: boolean;
  notes: string;
  tag_ids: string[];
}

export interface AppSettings {
  default_editor: string;
  custom_editor_path: string;
  default_terminal: string;
  custom_terminal_path: string;
  scan_depth: string;
  scan_ignore: string;
}

export interface ScriptExecutionResult {
  success: boolean;
  exit_code: number | null;
  stdout: string;
  stderr: string;
}

export type ViewMode = 'grid' | 'list';
export type FilterCategory = 'all' | 'favorites' | 'active' | 'on_hold' | 'completed' | 'archived' | 'missing' | 'dirty';
export type SortOption = 'last_modified' | 'name' | 'size' | 'status';
