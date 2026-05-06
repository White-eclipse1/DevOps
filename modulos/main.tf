module "db" {
  count = var.create_d1_database ? 1 : 0

  source = "./db"

  cloudflare_account_id = var.cloudflare_account_id
  database_name         = var.database_name
}

module "pages" {
  source = "./pages"

  cloudflare_account_id = var.cloudflare_account_id
  project_name          = var.pages_project_name
  github_owner          = var.github_owner
  github_repo           = var.github_repo
  production_branch     = var.production_branch
  d1_databases = merge(
    var.existing_d1_databases,
    var.create_d1_database ? {
      (var.d1_binding_name) = module.db[0].database_id
    } : {}
  )
}

module "worker" {
  source = "./workers"

  cloudflare_account_id = var.cloudflare_account_id
  worker_name           = var.worker_name
  worker_script_path    = "${path.module}/${var.worker_script_path}"
  compatibility_date    = var.worker_compatibility_date
  d1_database_id = (
    var.create_d1_database
    ? module.db[0].database_id
    : var.existing_d1_databases[var.d1_binding_name]
  )
  plain_text_vars = var.worker_vars
  secret_vars     = var.worker_secrets
}
