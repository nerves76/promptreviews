"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import SectionWrapper from "./SectionWrapper";
import {
  HeroSection,
  IntroSection,
  BenefitsSection,
  BodyContentSection,
  CTASection,
  FAQSection,
  FooterSection,
} from "./sections";
import { copyFullOutline } from "../utils/clipboard";
import { exportOutlineAsCsv } from "../utils/csvExport";
import type { PageOutline, SEOMetadata, SectionKey, CompetitorUrl } from "../types";

interface OutlinePreviewProps {
  outline: PageOutline;
  outlineId: string;
  seo: SEOMetadata;
  keyword: string;
  onRegenerate: (sectionKey: SectionKey) => Promise<void>;
  regeneratingSection: SectionKey | null;
  competitorUrls?: CompetitorUrl[];
}

export default function OutlinePreview({
  outline,
  outlineId,
  seo,
  keyword,
  onRegenerate,
  regeneratingSection,
  competitorUrls,
}: OutlinePreviewProps) {
  const [allCopied, setAllCopied] = useState(false);

  const handleCopyAll = async () => {
    const text = copyFullOutline(outline);
    await navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div>
      {/* Copy all + Download CSV — always visible */}
      <div className="flex justify-start gap-2 mb-2">
        <button
          type="button"
          onClick={handleCopyAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] bg-white/90 border border-white/60 text-gray-700 hover:bg-white/90 transition-colors whitespace-nowrap shadow-sm"
          aria-label="Copy all outline content"
        >
          <Icon name={allCopied ? "FaCheck" : "FaCopy"} size={10} />
          {allCopied ? "Copied all" : "Copy all content"}
        </button>
        <button
          type="button"
          onClick={() => exportOutlineAsCsv(outline, seo, keyword)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] bg-white/90 border border-white/60 text-gray-700 hover:bg-white/90 transition-colors whitespace-nowrap shadow-sm"
          aria-label="Download outline as CSV"
        >
          <Icon name="FaSave" size={10} />
          Download CSV
        </button>
      </div>

      {/* Hero — outside overflow-hidden so action buttons aren't clipped */}
      <SectionWrapper
        sectionKey="hero"
        label="Hero"
        showLabel={false}
        seoAnnotation="Your H1 should contain your primary keyword and clearly describe the page topic."
        outline={outline}
        outlineId={outlineId}
        onRegenerate={onRegenerate}
        isRegenerating={regeneratingSection === "hero"}
      >
        <div className="rounded-t-2xl border border-white/20 border-b-0 shadow-sm overflow-hidden">
          <HeroSection data={outline.hero} />
        </div>
      </SectionWrapper>

      {/* Page preview container — continues from hero */}
      <div className="rounded-b-2xl border border-white/20 border-t-0 shadow-sm">

        {/* Content area — constrained width for readability */}
        <div className="max-w-[680px] mx-auto px-6 sm:px-10 py-8">
          <SectionWrapper
            sectionKey="intro"
            label="Introduction"
            seoAnnotation="The opening paragraph should include your keyword within the first 100 words."
            helpTooltip="The opening paragraph should hook readers and include your keyword naturally within the first 100 words."
            helpLabel="Learn about intro content"
            outline={outline}
            outlineId={outlineId}
            onRegenerate={onRegenerate}
            isRegenerating={regeneratingSection === "intro"}
          >
            <IntroSection data={outline.intro} />
          </SectionWrapper>

          <SectionWrapper
            sectionKey="benefits"
            label="Key benefits"
            seoAnnotation="Benefit-focused content demonstrates expertise (E-E-A-T)."
            helpTooltip="Benefit-focused content demonstrates expertise and builds trust (E-E-A-T), which Google rewards in rankings."
            helpLabel="Learn about E-E-A-T signals"
            outline={outline}
            outlineId={outlineId}
            onRegenerate={onRegenerate}
            isRegenerating={regeneratingSection === "benefits"}
          >
            <BenefitsSection data={outline.benefits} />
          </SectionWrapper>

          <SectionWrapper
            sectionKey="bodySections"
            label="Body content"
            seoAnnotation="H2 subheadings help search engines understand content structure."
            helpTooltip="Each section is written to stand alone — this helps AI systems like Google's SGE extract and cite your content."
            helpLabel="Learn about standalone content"
            outline={outline}
            outlineId={outlineId}
            onRegenerate={onRegenerate}
            isRegenerating={regeneratingSection === "bodySections"}
          >
            <BodyContentSection data={outline.bodySections} />
          </SectionWrapper>

          <SectionWrapper
            sectionKey="cta"
            label="Call to action"
            helpTooltip="A clear call-to-action converts visitors. Include action words and make the next step obvious."
            helpLabel="Learn about CTAs"
            outline={outline}
            outlineId={outlineId}
            onRegenerate={onRegenerate}
            isRegenerating={regeneratingSection === "cta"}
          >
            <CTASection data={outline.cta} />
          </SectionWrapper>

          <SectionWrapper
            sectionKey="faq"
            label="Frequently asked questions"
            seoAnnotation="FAQ sections can trigger rich snippets in Google search results."
            helpTooltip="FAQ sections can trigger rich snippets in Google search results, increasing visibility and click-through rates."
            helpLabel="Learn about FAQ rich snippets"
            outline={outline}
            outlineId={outlineId}
            onRegenerate={onRegenerate}
            isRegenerating={regeneratingSection === "faq"}
          >
            <FAQSection data={outline.faq} />
          </SectionWrapper>

          <SectionWrapper
            sectionKey="footer"
            label="Footer"
            showLabel={false}
            outline={outline}
            outlineId={outlineId}
            onRegenerate={onRegenerate}
            isRegenerating={regeneratingSection === "footer"}
          >
            <FooterSection data={outline.footer} />
          </SectionWrapper>
        </div>
      </div>

      {/* Competitor URLs */}
      {competitorUrls && competitorUrls.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/20 bg-white/90 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            <Icon name="FaSearch" size={12} className="inline mr-1.5 text-gray-500" />
            Top {competitorUrls.length} organic result{competitorUrls.length !== 1 ? "s" : ""} for &ldquo;{keyword}&rdquo;
          </h3>
          <ol className="space-y-2 list-decimal list-inside">
            {competitorUrls.map((comp) => (
              <li key={comp.url} className="text-sm text-gray-600">
                <a
                  href={comp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-blue hover:underline"
                >
                  {comp.title || comp.url}
                </a>
                <span className="text-gray-500 ml-1.5">
                  — ~{comp.wordCount.toLocaleString()} words
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
