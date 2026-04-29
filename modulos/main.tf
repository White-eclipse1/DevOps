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

