/**
 * YourBusinessDropdown Component
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import DropdownPortal from "./DropdownPortal";

interface YourBusinessDropdownProps {
  hasBusiness: boolean;
  businessLoading: boolean;
  businessProfileCompleted: boolean;
  businessProfileLoaded: boolean;
  onNavigate: () => void;
}

const YourBusinessDropdown: React.FC<YourBusinessDropdownProps> = ({
  hasBusiness,
  businessLoading,
  businessProfileCompleted,
  businessProfileLoaded,
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
    const dropdownWidth = dropdownRef.current?.offsetWidth ?? 280;
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

  // Close dropdown on route change or unmount
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => {
      setIsOpen(false);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const handleButtonClick = () => {
    if (!hasBusiness) {
      router.push("/dashboard/create-business");
      return;
    }
    setIsOpen(!isOpen);
  };

  const menuItems = [
    { href: "/dashboard/business-profile", label: "Business Profile", icon: "FaStore", description: "Edit your business details" },
    { href: "/dashboard/keywords", label: "Keywords", icon: "FaKey", description: "Manage and research keywords" },
    { href: "/dashboard/local-ranking-grids", label: "Local Ranking Grids", icon: "FaMapMarker", description: "Track your local search rankings" },
    { href: "/dashboard/rank-tracking", label: "Rank Tracking", icon: "FaChartLine", description: "Track your Google organic rankings" },
  ];

  // Check if any menu item is active
  const isAnyActive = menuItems.some(item =>
    pathname === item.href || pathname.startsWith(item.href + '/')
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className={`${
          isAnyActive
            ? "border-white text-white"
            : hasBusiness
              ? "border-transparent text-white hover:border-white/30 hover:text-white/90"
              : "border-transparent text-white/50 cursor-not-allowed"
        } inline-flex items-center px-1 pt-1 border-b-4 text-base font-medium transition-colors duration-200 h-16 text-left relative`}
        disabled={businessLoading}
      >
        <span className="mr-1 text-left">Your business</span>
        {hasBusiness && (
          <Icon
            name="FaChevronDown"
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            size={12}
          />
        )}
        {hasBusiness && businessProfileLoaded && !businessProfileCompleted && (
          <span className="absolute -top-1 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
            Start here!
          </span>
        )}
      </button>

      {/* Render dropdown in portal */}
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
        {menuItems.map((item) => {
          const isBusinessProfile = item.href === "/dashboard/business-profile";
          const showStartHere = isBusinessProfile && businessProfileLoaded && !businessProfileCompleted;

          return (
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
                  : showStartHere
                    ? "bg-yellow-400/10 text-white hover:bg-yellow-400/20"
                    : "text-white hover:bg-white/10"
              } flex items-center px-4 py-3 transition-colors duration-200 relative`}
            >
              <Icon name={item.icon as any} className="w-5 h-5 mr-3 text-white" size={20} />
              <div className="flex-1">
                <div className="font-medium text-white flex items-center gap-2">
                  {item.label}
                  {showStartHere && (
                    <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                      Start here!
                    </span>
                  )}
                </div>
                <div className="text-sm text-white/80">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </DropdownPortal>
    </div>
  );
};

export default YourBusinessDropdown;
