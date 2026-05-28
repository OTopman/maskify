# Security Best Practices

- Keep `MASKIFY_SECRET` in environment variables, never in source control.
- Enable strict validation for external input paths.
- Set bounded input length limits for public-facing endpoints.
- Treat masked output as potentially sensitive and log minimally.
- Use **Full Redaction Mode** (`redact: true`) for highly sensitive fields to avoid leaking the original character length through asterisk counts.
