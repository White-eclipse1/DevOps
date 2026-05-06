variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID."
}

variable "project_name" {
  type        = string
  description = "Cloudflare Pages project name."
}

variable "github_owner" {
  type        = string
  description = "GitHub organization or username."
}

variable "github_repo" {
  type        = string
  description = "GitHub repository name."
}

variable "production_branch" {
  type        = string
  description = "Production branch for the Pages project."
}

variable "build_command" {
  type        = string
  description = "Build command for Cloudflare Pages."
}

variable "destination_dir" {
  type        = string
  description = "Output directory produced by the build."
}

variable "root_dir" {
  type        = string
  description = "Root directory where Cloudflare Pages should run the build."
}

variable "environment_variables" {
  type        = map(string)
  description = "Environment variables to inject into Pages preview and production deployments."
  default     = {}
}

variable "d1_databases" {
  type        = map(string)
  description = "D1 database bindings for Pages Functions."
  default     = {}
}
