variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID where the Worker is deployed."
}

variable "worker_name" {
  type        = string
  description = "Name of the Worker script. Changing it forces replacement."
}

variable "worker_script_path" {
  type        = string
  description = "Path to the Worker source file (read with file())."
}

variable "compatibility_date" {
  type        = string
  description = "Worker compatibility date. Pin once and bump deliberately."
}

variable "d1_database_id" {
  type        = string
  description = "ID of the D1 database to bind as DB."
}

variable "plain_text_vars" {
  type        = map(string)
  description = "Plain-text environment variables exposed to the Worker."
  default     = {}
}

variable "secret_vars" {
  type        = map(string)
  description = "Secret-text environment variables exposed to the Worker. Values land in tfstate, keep state private."
  default     = {}
  sensitive   = true
}
