terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
  }
}

resource "cloudflare_workers_script" "script" {
  account_id         = var.cloudflare_account_id
  name               = var.worker_name
  # Wrangler owns the script content — deploy via backend-deploy-{dev,prod} pipeline.
  # Terraform manages bindings and infra only.
  content            = "export default { fetch: () => new Response('ok') };"
  module             = true
  compatibility_date = var.compatibility_date

  lifecycle {
    ignore_changes = [content]
  }

  d1_database_binding {
    name        = "DB"
    database_id = var.d1_database_id
  }

  dynamic "plain_text_binding" {
    for_each = var.plain_text_vars
    content {
      name = plain_text_binding.key
      text = plain_text_binding.value
    }
  }

  dynamic "secret_text_binding" {
    for_each = var.secret_vars
    content {
      name = secret_text_binding.key
      text = secret_text_binding.value
    }
  }
}

output "worker_name" {
  description = "Name of the deployed Worker script."
  value       = cloudflare_workers_script.script.name
}
