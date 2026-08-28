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

export interface GitCommitSummary {
  hash: string;
  short_hash: string;
  message: string;
  author: string;
  relative_time: string;
  timestamp: number;
}

export interface GitInfo {
  is_repo: boolean;
  branch: string | null;
  dirty: boolean;
  modified_count: number;
  last_commit: string | null;
  ahead: number;
  behind: number;
  recent_commits: GitCommitSummary[];
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  project_ids: string[];
  created_at: number;
}

export interface PortStatusInfo {
  port: number;
  is_active: boolean;
  pid: number | null;
  process_name: string | null;
}

export interface CleanableItem {
  category: string;
  relative_path: string;
  full_path: string;
  size_bytes: number;
}

export interface ProjectCleanableInfo {
  project_id: string;
  project_name: string;
  project_path: string;
  items: CleanableItem[];
  total_cleanable_bytes: number;
}

export interface CleanResult {
  success: boolean;
  bytes_freed: number;
  cleaned_count: number;
  errors: string[];
}

export interface ProjectSearchTarget {
  id: string;
  name: string;
  path: string;
}

export interface CodeSearchResult {
  project_id: string;
  project_name: string;
  file_path: string;
  relative_path: string;
  line_number: number;
  line_content: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  primary_tech: string;
  tech_stack: string[];
  command_preview: string;
}

export interface EnvFileInfo {
  has_env: boolean;
  has_example: boolean;
  has_local: boolean;
  example_keys: string[];
  env_keys: string[];
  missing_keys: string[];
  env_example_content: string | null;
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
