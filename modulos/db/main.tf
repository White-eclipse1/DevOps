terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
  }
}

resource "cloudflare_d1_database" "database" {
  account_id = var.cloudflare_account_id
  name       = var.database_name
}

output "database_id" {
  description = "ID of the managed D1 database."
  value       = cloudflare_d1_database.database.id
}
