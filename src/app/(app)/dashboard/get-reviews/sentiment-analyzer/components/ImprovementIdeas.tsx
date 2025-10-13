"use client";

import React from "react";
import { ImprovementIdea } from "../types";

interface ImprovementIdeasProps {
  ideas: ImprovementIdea[];
}

export default function ImprovementIdeas({ ideas }: ImprovementIdeasProps) {
  if (!ideas || ideas.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-5">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Improvement Ideas
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Actionable suggestions based on customer feedback
      </p>

      <div className="space-y-3">
        {ideas.map((idea, index) => (
          <div
            key={idea.title}
            className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-4 hover:shadow-md transition-shadow"
          >
            {/* Header with number badge */}
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  {idea.title}
                </h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-2 ml-10">
              {idea.description}
            </p>

            {/* Source Themes */}
            <div className="ml-10 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">
                Based on:
              </span>
              {idea.sourceThemes.map((theme) => (
                <span
                  key={theme}
                  className="inline-block px-2 py-0.5 bg-white border border-indigo-200 rounded text-xs text-indigo-700 font-medium"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
