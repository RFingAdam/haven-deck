# Themes

Each folder here is a look the kiosk can load. The built-in set is `haven`
(default), `tactical-hud`, `clean-dark`, and `neon`.

To add your own:

1. Copy `haven/theme.json` to `themes/my-look/theme.json`.
2. Set `id` to `my-look` (lowercase letters, numbers, and hyphens only) and
   change the color, font, and radius variables.
3. Add `{ "id": "my-look", "label": "My Look" }` to `themes/index.json`.
4. Restart the dev server or rebuild. The new look shows up in Setup.

A pack can set `"theme": "my-look"` in `layout.json`, and `config.json` can
set the same field. A choice saved in Setup on this device wins over both.
See the main README for the full list of variables.
