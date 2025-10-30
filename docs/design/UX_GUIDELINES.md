## UX Guidelines

### Tokens
- Colors: defined as HSL CSS variables in `client/src/index.css` (e.g., `--background`, `--primary`, `--muted`).
- Radii: `--radius-lg`, `--radius-md`, `--radius-sm`; mapped in Tailwind via `theme.extend.borderRadius`.
- Shadows: `--shadow-*` scale for elevation; use with design system patterns.

### Base
- Focus: uses `:focus-visible` with `--ring` color and 2px outline.
- Motion: honors `prefers-reduced-motion` for animations and transitions.
- Typography: `font-sans`, `font-mono`, `font-serif` via CSS variables.

### Components (canonical)
- Buttons: `components/ui/button.tsx` (variants: default, secondary, outline, ghost, destructive; sizes: sm, default, lg, icon).
- Inputs: `components/ui/input.tsx`, `textarea.tsx`, `select.tsx` with `form.tsx` helpers for labels, descriptions, and messages.
- Feedback: `components/ui/skeleton.tsx`, `components/ui/error-banner.tsx`, `components/ui/loading-overlay.tsx`, `components/ui/alert.tsx`.
- Overlays: `components/ui/dialog.tsx`, `drawer.tsx`, `popover.tsx`, `tooltip.tsx`.
- Lists/Tables: `components/ui/table.tsx` with row hover, zebra/selection, sticky header via container.
- Navigation: `components/ui/sidebar.tsx`, top bar patterns in `client/src/App.tsx` header.
- Toasts: `components/ui/toast.tsx` + `components/ui/toaster.tsx` as single API.

### Patterns
- Loading: use `LoadingOverlay` for page/blocking, or `Skeleton` for in-place content.
- Empty: `components/EmptyState.tsx` for standard illustration + CTA + description.
- Error: `ErrorBanner` for page-level or section errors; form errors via `FormMessage`.

### Forms
- Use React Hook Form with `components/ui/form.tsx` wrappers. Keep labels associated and helper/error text in the provided slots.
- Required fields: indicate in label text. Disable submit while pending.
- Keyboard nav: ensure tab order, focus is restored after dialogs.

### Copy & i18n
- Sentence case, concise. Avoid title case in labels. Use `client/src/i18n` for strings.

### Accessibility
- Maintain color contrast; visible focus at all times. Prefer `aria-*` attributes on custom controls.

### Dos & Don’ts
- Do reuse UI primitives; don’t style raw `button`/`input` directly.
- Do use tokens; don’t hardcode colors/radii/shadows.


