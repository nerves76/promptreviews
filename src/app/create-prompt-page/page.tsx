import { Suspense } from 'react';
import CreatePromptPageClient from './CreatePromptPageClient';

export default function CreatePromptPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatePromptPageClient />
    </Suspense>
  );
}