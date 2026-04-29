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

variable "d1_databases" {
  type        = map(string)
  description = "D1 database bindings for Pages Functions."
  default     = {}
}
