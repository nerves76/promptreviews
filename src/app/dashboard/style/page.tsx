"use client";
import * as React from "react";
import PageCard from "@/app/components/PageCard";
import { FaPalette } from "react-icons/fa";

export default function StylePage() {
  return (
    <PageCard icon={<FaPalette size={36} className="text-slate-blue" />}> 
      <div className="p-8">
        <div className="text-3xl font-bold text-red-600 mb-8">THIS IS A TEST</div>
        Style Modal Works!
      </div>
    </PageCard>
  );
}
