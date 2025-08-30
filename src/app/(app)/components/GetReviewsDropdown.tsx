/**
 * GetReviewsDropdown Component
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Icon from "@/components/Icon";

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
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const menuItems = [
    { href: "/prompt-pages", label: "Prompt Pages", icon: PromptPagesIcon, description: "Create review collection pages" },
    { href: "/dashboard/contacts", label: "Contacts", icon: "FaUsers", description: "Upload and manage contacts" },
    { href: "/dashboard/reviews", label: "Reviews", icon: "FaStar", description: "View and manage collected reviews" },
    { href: "/dashboard/widget", label: "Widgets", icon: "FaCode", description: "Embed review widgets on your website" }
  ];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="border-transparent text-white hover:border-white/30 hover:text-white/90 inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16"
        disabled={businessLoading}
      >
        <span className="mr-1">Get reviews</span>
        <Icon 
          name="FaStar" 
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'animate-spin' : ''}`} 
          size={16} 
        />
      </button>

      {/* Render dropdown in portal to escape stacking context */}
      {isOpen && mounted && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-white/85 backdrop-blur-md rounded-lg shadow-2xl border-2 border-white/30 py-2" 
          style={{ 
            top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 4 : 0,
            left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left : 0,
            width: '256px',
            zIndex: 2147483647 
          }}>
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
                  ? "bg-slate-blue/10 text-slate-blue"
                  : "text-gray-700 hover:bg-slate-blue/10 hover:text-slate-blue"
              } flex items-center px-4 py-3 transition-colors duration-200`}
            >
              {typeof item.icon === 'string' ? (
                <Icon name={item.icon as any} className="w-5 h-5 mr-3" size={20} />
              ) : (
                <item.icon className="w-5 h-5 mr-3" />
              )}
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-slate-blue">{item.description}</div>
              </div>
            </Link>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default GetReviewsDropdown;