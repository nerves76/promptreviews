# Accessibility (a11y) Guide

Full WCAG 2.1 Level AA guidelines for the Prompt Reviews codebase.
Referenced from CLAUDE.md — see the checklist there for the quick version.

## Buttons & Interactive Elements

### Icon-Only Buttons - ALWAYS add `aria-label`
```tsx
// ✅ CORRECT
<button onClick={onDelete} aria-label="Delete item" title="Delete">
  <Icon name="FaTrash" className="w-4 h-4" />
</button>

// ❌ WRONG - Screen readers can't announce purpose
<button onClick={onDelete} title="Delete">
  <Icon name="FaTrash" className="w-4 h-4" />
</button>
```

### Clickable Divs - MUST have keyboard support
If you use `onClick` on a non-button element, you MUST add `role="button"`, `tabIndex={0}`, and `onKeyDown` for Enter/Space. **Better approach:** Use `<button>` instead of `<div>` when possible.

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  className="cursor-pointer ..."
>
  Clickable content
</div>
```

## Dialog/Modal Accessibility
- **ALWAYS add `aria-label`** to Dialog components
- Use `Dialog.Title` for the modal heading
- Close button must have `aria-label="Close"` or `aria-label="Close modal"`

```tsx
<Dialog open={isOpen} onClose={onClose} aria-label="Confirm deletion">
  <Dialog.Title>Delete item?</Dialog.Title>
  ...
</Dialog>
```

## Form Inputs
Every input MUST have an associated label:
```tsx
// Option 1: Explicit label
<label htmlFor="email-input">Email</label>
<input id="email-input" type="email" ... />

// Option 2: aria-label
<input type="search" aria-label="Search contacts" placeholder="Search..." />

// Option 3: Wrap in label
<label>Email <input type="email" ... /></label>
```

## Images
- **Informative:** Descriptive alt text
- **Decorative:** `alt=""` or `aria-hidden="true"`
- **Logos:** Include business name: `alt={`${businessName} logo`}`

## Link Text
Never use vague text like "Click here". Links should describe their destination.

## Focus States
Standard pattern: `focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-2`

## Color Contrast (WCAG AA - 4.5:1 ratio)
| Use Case | Correct | Wrong |
|----------|---------|-------|
| Muted text | `text-gray-500` | `text-gray-400` |
| Placeholder | `text-gray-500` | `text-gray-400` |
| Body text | `text-gray-600` | `text-gray-400` |
| On gradients | `text-white/70`+ | `text-white/50` |
