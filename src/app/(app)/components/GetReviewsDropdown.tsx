/**
 * GetReviewsDropdown Component
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import DropdownPortal from "./DropdownPortal";

// Custom [P] icon component for Prompt Pages
const PromptPagesIcon = ({ className }: { className?: string }) => (
  <span 
    className={className} 
    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold' }}
  >
    [P]
  </span>
);

interface GetReviewsDropdownProps {
  hasBusiness: boolean;
  businessLoading: boolean;
  onNavigate: () => void;
}

const GetReviewsDropdown: React.FC<GetReviewsDropdownProps> = ({
  hasBusiness,
  businessLoading,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    const buttonEl = buttonRef.current;
    if (!buttonEl) return;

    const rect = buttonEl.getBoundingClientRect();
    const dropdownWidth = dropdownRef.current?.offsetWidth ?? 280; // fall back to typical width so the clamp works pre-measure
    const viewportWidth = window.innerWidth;
    const halfWidth = dropdownWidth / 2;
    const centerX = rect.left + rect.width / 2;
    const clampedCenter = Math.max(16 + halfWidth, Math.min(centerX, viewportWidth - 16 - halfWidth));

    setDropdownPosition({
      top: rect.bottom + 8,
      left: clampedCenter
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updateDropdownPosition();
    const raf = requestAnimationFrame(updateDropdownPosition);

    const handleReposition = () => updateDropdownPosition();

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      cancelAnimationFrame(raf);
    };
  }, [isOpen, updateDropdownPosition]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on route change or unmount to prevent stuck blur overlay
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    // Clean up on unmount - CRITICAL to prevent stuck blur
    return () => {
      setIsOpen(false); // Ensure dropdown is closed when component unmounts
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const menuItems = [
    { href: "/prompt-pages", label: "Prompt Pages", icon: PromptPagesIcon, description: "Create review collection pages" },
    { href: "/dashboard/contacts", label: "Contacts", icon: "FaUsers", description: "Upload and manage contacts" },
    { href: "/dashboard/reviews", label: "Reviews", icon: "FaStar", description: "View and manage collected reviews" },
    { href: "/dashboard/widget", label: "Widgets", icon: "FaCode", description: "Embed review widgets on your website" },
    { href: "/dashboard/get-reviews/sentiment-analyzer", label: "Sentiment Analyzer", icon: "FaSentimentAnalyzer", description: "AI-powered insights from your reviews" }
  ];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="border-transparent text-white hover:border-white/30 hover:text-white/90 inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16 text-left"
        disabled={businessLoading}
      >
        <span className="mr-1 text-left">Get reviews</span>
        <Icon
          name="FaStar"
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'animate-spin' : ''}`}
          size={16}
        />
      </button>

      {/* Render dropdown in portal to escape stacking context */}
      <DropdownPortal
        isOpen={isOpen}
        mounted={mounted}
        buttonRef={buttonRef}
        ref={dropdownRef}
        className="py-2"
        width="min(320px, calc(100vw - 32px))"
        style={{
          zIndex: 2147483648,
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          transform: "translateX(-50%)"
        }}
      >
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              onNavigate();
              setIsOpen(false);
            }}
            className={`${
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? "bg-white/10 text-white"
                : "text-white hover:bg-white/10"
            } flex items-center px-4 py-3 transition-colors duration-200`}
          >
            {typeof item.icon === 'string' ? (
              <Icon name={item.icon as any} className="w-5 h-5 mr-3 text-white" size={20} />
            ) : (
              <item.icon className="w-5 h-5 mr-3 text-white" />
            )}
            <div className="flex-1">
              <div className="font-medium text-white">{item.label}</div>
              <div className="text-sm text-white/80">{item.description}</div>
            </div>
          </Link>
        ))}
      </DropdownPortal>
    </div>
  );
};

export default GetReviewsDropdown;
