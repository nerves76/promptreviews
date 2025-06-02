import { Suspense } from 'react';
import CreatePromptPageClient from './CreatePromptPageClient';
import AppLoader from '@/app/components/AppLoader';

export default function CreatePromptPage() {
  return (
    <Suspense fallback={<div style={{ position: 'fixed', top: -190, left: 0, width: '100%', zIndex: 9999 }}><AppLoader /></div>}>
      <CreatePromptPageClient />
    </Suspense>
  );
}