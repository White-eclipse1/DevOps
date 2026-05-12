variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token for the Cloudflare provider."
  sensitive   = true
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID."
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID for the custom domain."
  default     = ""
}

variable "pages_project_name" {
  type        = string
  description = "Name of the Cloudflare Pages project."
  default     = "paaginaludos-devops"
}

variable "pages_domain" {
  type        = string
  description = "Custom domain for Cloudflare Pages."
  default     = ""
}

variable "github_owner" {
  type        = string
  description = "GitHub organization or username that owns the repository connected to Pages."
  default     = "White-eclipse1"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository name connected to Pages."
  default     = "DevOps"
}

variable "production_branch" {
  type        = string
  description = "Production branch for Cloudflare Pages."
  default     = "main"
}

variable "build_command" {
  type        = string
  description = "Build command for Cloudflare Pages. Leave empty for static sites without build step."
  default     = "npm run build"
}

variable "destination_dir" {
  type        = string
  description = "Output directory produced by the build."
  default     = "dist"
}

variable "root_dir" {
  type        = string
  description = "Root directory where Cloudflare Pages should run the build."
  default     = "frontend"
}

variable "pages_environment_variables" {
  type        = map(string)
  description = "Environment variables to inject into Pages preview and production deployments."
  default     = {}
}

variable "create_d1_database" {
  type        = bool
  description = "Whether Terraform should create and manage a D1 database."
  default     = false
}

variable "database_name" {
  type        = string
  description = "Name of the D1 database to create when create_d1_database is true."
  default     = "paaginaludos-db"
}

variable "d1_binding_name" {
  type        = string
  description = "Binding name exposed inside Pages Functions for the managed D1 database."
  default     = "DB"
}

variable "existing_d1_databases" {
  type        = map(string)
  description = "Existing D1 bindings to attach to Pages, where the key is the binding name and the value is the database ID."
  default     = {
    "DB" = "d4cbf7ca-26a9-481e-8589-5089c2e24fdd"
  }
}

variable "deployments_enabled" {
  type        = bool
  description = "Whether automatic deployments from the repository are enabled."
  default     = true
}

variable "production_deployment_enabled" {
  type        = bool
  description = "Whether production deployments are enabled."
  default     = true
}

variable "pr_comments_enabled" {
  type        = bool
  description = "Whether Cloudflare Pages should comment on pull requests."
  default     = true
}

variable "preview_deployment_setting" {
  type        = string
  description = "Preview deployment setting for Cloudflare Pages. Valid values: all, none, custom."
  default     = "all"
}

variable "preview_branch_includes" {
  type        = list(string)
  description = "Branches included in preview deployments."
  default     = ["*"]
}

variable "preview_branch_excludes" {
  type        = list(string)
  description = "Branches excluded from preview deployments."
  default     = []
}

variable "worker_name" {
  type        = string
  description = "Name of the Cloudflare Worker script."
  default     = "paaginaludos-api"
}

variable "worker_script_path" {
  type        = string
  description = "Path (relative to the root module) to the Worker source file."
  default     = "./workers/src/worker.js"
}

variable "worker_compatibility_date" {
  type        = string
  description = "Worker compatibility date."
  default     = "2026-01-01"
}

variable "worker_vars" {
  type        = map(string)
  description = "Plain-text environment variables for the Worker."
  default     = {}
}

variable "worker_secrets" {
  type        = map(string)
  description = "Secret environment variables for the Worker."
  default     = {}
  sensitive   = true
}
