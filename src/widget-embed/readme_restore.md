# Restore Instructions

If the split of the widget components gets stuck or you need to revert to the original single-file setup, follow these steps:

1. **Backup the current state** (optional):
   - Copy the current `index.tsx` to a temporary file (e.g., `index.current.tsx`).

2. **Restore the backup**:
   - Copy `index.backup.tsx` to `index.tsx`:
     ```bash
     cp src/widget-embed/index.backup.tsx src/widget-embed/index.tsx
     ```

3. **Remove the new widget files** (optional):
   - Delete the new widget files if you no longer need them:
     ```bash
     rm src/widget-embed/SingleWidget.tsx
     rm src/widget-embed/MultiWidget.tsx
     rm src/widget-embed/PhotoWidget.tsx
     ```

4. **Verify the restore**:
   - Check that `index.tsx` now contains the original, single-file implementation of all widgets.

5. **Commit the changes** (if needed):
   - Commit the restored `index.tsx` to your repository. 