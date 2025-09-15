'use server';

import { revalidatePath } from 'next/cache';

export async function revalidatePromptPage(slug: string) {
  // Revalidate the public prompt page
  revalidatePath(`/r/${slug}`);

  // Also revalidate the dashboard pages
  revalidatePath(`/dashboard/edit-prompt-page/${slug}`);
  revalidatePath('/dashboard/edit-prompt-page/universal');
  revalidatePath('/prompt-pages');
}