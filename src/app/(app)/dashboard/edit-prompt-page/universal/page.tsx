"use client";
import React from "react";
import Icon from "@/components/Icon";
import PageCard from "@/app/(app)/components/PageCard";

export default function UniversalEditPromptPage() {
  return (
    <div className="p-6">
      <PageCard
        icon={<Icon name="FaHome" className="w-9 h-9 text-slate-blue" size={36} />}
      >
        <div className="flex flex-col mt-0 mb-4">
          <h1 className="text-4xl font-bold text-slate-blue mt-0 mb-2">
            Universal prompt page
          </h1>
          <p className="text-gray-600 text-base max-w-md mt-0">
            This editor is temporarily simplified on staging while we finalize the
            API merge. Please use the main Prompt Pages screen for now.
          </p>
        </div>
      </PageCard>
    </div>
  );
}

