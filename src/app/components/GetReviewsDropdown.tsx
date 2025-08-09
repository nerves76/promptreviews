/**
 * GetReviewsDropdown Component
 * 
 * Dropdown menu for review collection related pages including:
 * - Prompt Pages (creating review collection pages)
 * - Contacts (managing customer contact lists) 
 * - Review Management (managing and viewing collected reviews)
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { createPortal } from "react-dom";

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
  const [isSpinning, setIsSpinning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!hasBusiness) {
      e.preventDefault();
      router.push("/dashboard/create-business");
    } else {
      onNavigate();
    }
  };

  const handleDropdownToggle = () => {
    setIsSpinning(true);
    setIsOpen(!isOpen);
    
    // Stop spinning after animation completes
    setTimeout(() => {
      setIsSpinning(false);
    }, 300);
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const menuItems = [
    {
      href: "/prompt-pages",
      label: "Prompt Pages",
      icon: "FaFileAlt",
      description: "Create review collection pages"
    },
    {
      href: "/dashboard/contacts", 
      label: "Contacts",
      icon: "FaUsers",
      description: "Upload and manage contacts"
    },
    {
      href: "/dashboard/reviews",
      label: "Review management", 
      icon: "FaStar",
      description: "View and manage collected reviews"
    }
  ];

  return (
    <div className="relative">
      {/* Dropdown Trigger Button */}
      <button
        ref={triggerRef}
        onClick={handleDropdownToggle}
        className={`${
          isActive("/prompt-pages") || isActive("/dashboard/contacts") || isActive("/dashboard/reviews")
            ? "border-white text-white"
            : "border-transparent text-white hover:border-white/30 hover:text-white/90"
        } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16 group`}
        disabled={businessLoading}
      >
        <span className="mr-1">Get reviews</span>
        <Icon 
          name="FaStar" 
          className={`w-4 h-4 transition-transform duration-300 ${
            isSpinning ? 'animate-spin' : ''
          }`}
          size={16} 
        />
      </button>

      {/* Dropdown Menu - Rendered in Portal */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[2147483647]"
          style={{
            top: triggerRef.current ? triggerRef.current.getBoundingClientRect().bottom + 4 : 0,
            left: triggerRef.current ? triggerRef.current.getBoundingClientRect().left : 0,
            width: '256px'
          }}
        >
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={hasBusiness ? item.href : "#"}
              onClick={(e) => handleLinkClick(e, item.href)}
              className={`${
                isActive(item.href)
                  ? "bg-slate-blue/10 text-slate-blue"
                  : "text-gray-700 hover:bg-slate-blue/10 hover:text-slate-blue"
              } flex items-center px-4 py-3 transition-colors duration-200 ${
                !hasBusiness ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title={!hasBusiness ? "Create your business profile first" : ""}
            >
              <Icon name={item.icon as any} className="w-5 h-5 mr-3" size={20} />
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-gray-500">{item.description}</div>
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