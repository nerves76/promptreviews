'use client';
import React from 'react';
import PromptPageForm from '@/app/components/PromptPageForm';
import { FaGlobe } from 'react-icons/fa';

export default function UniversalEditPromptPage() {
  // You may want to fetch initialData, businessProfile, etc. here as needed
  return (
    <>
      {/* Floating Icon */}
      <div className="absolute -top-6 -left-6 z-10 bg-white rounded-full shadow p-3 flex items-center justify-center w-16 h-16">
        <FaGlobe className="w-9 h-9 text-slate-blue" />
      </div>
      <PromptPageForm
        mode="edit"
        initialData={{}}
        onSave={() => {}}
        pageTitle="Edit Universal Prompt Page"
        supabase={null}
        businessProfile={null}
        isUniversal={true}
      />
    </>
  );
} 