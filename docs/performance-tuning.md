# Performance Tuning

- Reuse initialized middleware instances instead of constructing per request.
- Prefer schema masking when field paths are known.
- Use stream masking for large payloads and file-based processing.
- Keep `autoDetect` scoped to trusted value types for lower CPU usage.
