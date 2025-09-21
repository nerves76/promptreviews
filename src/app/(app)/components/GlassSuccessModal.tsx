"use client";

import { ReactNode } from "react";
import Icon from "@/components/Icon";

interface ActionButton {
  label: string;
  onClick: () => void;
  iconName?: string;
  variant?: "primary" | "secondary";
}

interface GlassSuccessModalProps {
  isOpen: boolean;
  title?: string;
  message?: ReactNode;
  detail?: ReactNode;
  onClose: () => void;
  primaryAction?: ActionButton;
  secondaryAction?: ActionButton;
  iconName?: string;
  children?: ReactNode;
  dismissOnBackdrop?: boolean;
}

const GlassSuccessModal = ({
  isOpen,
  title = "Success!",
  message,
  detail,
  onClose,
  primaryAction,
  secondaryAction,
  iconName = "FaStar",
  children,
  dismissOnBackdrop = false,
}: GlassSuccessModalProps) => {
  if (!isOpen) {
    return null;
  }

  const safePrimary = primaryAction ?? {
    label: "Great!",
    onClick: onClose,
    iconName: "FaArrowRight",
  };

  const secondary = secondaryAction;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-10">
      <div
        className="absolute inset-0 bg-slate-900/25"
        onClick={dismissOnBackdrop ? onClose : undefined}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/10 px-8 py-10 shadow-[0_25px_60px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-white/5 to-transparent" />
          <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center text-white">
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-inner">
              <Icon name={iconName} className="h-9 w-9 text-white" size={36} />
            </div>
            <h2 className="text-2xl font-semibold tracking-wide drop-shadow-[0_2px_6px_rgba(15,23,42,0.35)]">
              {title}
            </h2>
            {message && (
              <p className="mt-3 text-base font-medium text-white/90">
                {message}
              </p>
            )}
            {detail && (
              <p className="mt-3 max-w-sm text-sm text-white/70">
                {detail}
              </p>
            )}
            {children && <div className="mt-4 w-full">{children}</div>}

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              {secondary && (
                <button
                  onClick={secondary.onClick}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/20 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/30 hover:text-white sm:w-auto"
                >
                  {secondary.iconName && (
                    <Icon name={secondary.iconName} className="h-4 w-4" size={16} />
                  )}
                  {secondary.label}
                </button>
              )}
              {safePrimary && (
                <button
                  onClick={safePrimary.onClick}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-all hover:scale-[1.02] hover:bg-slate-100 sm:w-auto"
                >
                  {safePrimary.iconName && (
                    <Icon name={safePrimary.iconName} className="h-4 w-4" size={16} />
                  )}
                  {safePrimary.label}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlassSuccessModal;
