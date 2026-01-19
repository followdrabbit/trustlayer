# Catalog Import Files

These files provide the default catalog for initial import.

Default catalog sources (package assets):
- `src/data/taxonomy.json`
- `src/data/questions.json`
- `src/data/cloud-security-taxonomy.json`
- `src/data/cloud-security-questions.json`
- `src/data/devsecops-taxonomy.json`
- `src/data/devsecops-questions.json`
- `src/data/frameworks.json`

Import method:
- Use the Admin Console import flow after installation.
- The import validates and loads the catalog into the database.
- XLSX template download is available in the Domains panel.
- The import UI provides a preview/dry-run with sample records.
- Templates include a `templateVersion` metadata field for compatibility checks.
