'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const RESIZE_EVENT_TYPE = 'google-business-optimizer:resize';
const REQUEST_RESIZE_EVENT_TYPE = 'google-business-optimizer:request-resize';
const READY_EVENT_TYPE = 'google-business-optimizer:ready';

interface GoogleBusinessOptimizerEmbedProps {
  allowedOrigins: string[];
}

function sanitizeOrigins(origins: string[]): string[] {
  return origins
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter((origin) => origin.length > 0)
    .filter((origin) => origin.startsWith('https://') || origin.startsWith('http://'));
}

function computeDocumentHeight(container: HTMLElement | null): number {
  const body = document.body;
  const html = document.documentElement;

  const measurements = [
    body?.scrollHeight ?? 0,
    body?.offsetHeight ?? 0,
    html?.clientHeight ?? 0,
    html?.scrollHeight ?? 0,
    html?.offsetHeight ?? 0,
    container?.scrollHeight ?? 0,
    container?.offsetHeight ?? 0,
  ];

  return Math.max(...measurements);
}

export default function GoogleBusinessOptimizerEmbed({
  allowedOrigins,
}: GoogleBusinessOptimizerEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [targetOrigins, setTargetOrigins] = useState<string[]>([]);
  const allowedSetRef = useRef<Set<string>>(new Set());

  // Resolve the target origins when the component is mounted client-side
  useEffect(() => {
    const sanitized = sanitizeOrigins(allowedOrigins);
    let resolvedAllowedOrigins = new Set(sanitized);
    let resolvedTargets = sanitized;

    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const referrerOrigin = new URL(document.referrer).origin;
        if (resolvedAllowedOrigins.size === 0) {
          console.warn(
            'Google Biz Optimizer embed: EMBED_ALLOWED_ORIGINS is not configured. Falling back to document.referrer. Configure EMBED_ALLOWED_ORIGINS to lock this down.',
          );
          resolvedTargets = [referrerOrigin];
          resolvedAllowedOrigins = new Set([referrerOrigin]);
        } else if (resolvedAllowedOrigins.has(referrerOrigin)) {
          resolvedTargets = [referrerOrigin];
        }
      } catch (error) {
        console.warn('Google Biz Optimizer embed: unable to parse document.referrer', error);
      }
    }

    allowedSetRef.current = resolvedAllowedOrigins;
    setTargetOrigins(resolvedTargets);
  }, [allowedOrigins]);

  useEffect(() => {
    if (targetOrigins.length === 0) {
      return;
    }

    targetOrigins.forEach((origin) => {
      window.parent.postMessage({ type: READY_EVENT_TYPE }, origin);
    });
  }, [targetOrigins]);

  useEffect(() => {
    if (!containerRef.current || targetOrigins.length === 0) {
      return;
    }

    let lastHeight = 0;
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    let pendingForce = false;

    const sendHeight = (force = false) => {
      if (!containerRef.current) return;
      const height = computeDocumentHeight(containerRef.current);
      if (!force && Math.abs(height - lastHeight) < 4) {
        return;
      }
      lastHeight = height;
      targetOrigins.forEach((origin) => {
        window.parent.postMessage({ type: RESIZE_EVENT_TYPE, height }, origin);
      });
    };

    const scheduleHeight = (force = false) => {
      if (throttleTimeout) {
        pendingForce = pendingForce || force;
        return;
      }

      pendingForce = force;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        const forceNext = pendingForce;
        pendingForce = false;
        sendHeight(forceNext);
      }, 180);
    };

    const handleMessage = (event: MessageEvent) => {
      if (allowedSetRef.current.size > 0 && !allowedSetRef.current.has(event.origin)) {
        return;
      }

      if (event.data?.type === REQUEST_RESIZE_EVENT_TYPE) {
        sendHeight(true);
      }
    };

    const handleLoad = () => sendHeight(true);

    window.addEventListener('message', handleMessage);
    window.addEventListener('load', handleLoad);

    let resizeCleanup: (() => void) | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        scheduleHeight(false);
      });

      observer.observe(containerRef.current);
      resizeCleanup = () => observer.disconnect();
    } else {
      console.warn('Google Biz Optimizer embed: ResizeObserver not supported, falling back to window resize events.');
      const fallbackResizeHandler = () => scheduleHeight(false);
      window.addEventListener('resize', fallbackResizeHandler);
      resizeCleanup = () => window.removeEventListener('resize', fallbackResizeHandler);
      scheduleHeight(true);
    }

    const initialTimers = [0, 150, 500, 1200].map((delay) =>
      setTimeout(() => sendHeight(true), delay),
    );

    return () => {
      resizeCleanup?.();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('load', handleLoad);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      initialTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [targetOrigins]);

  const metrics = useMemo(
    () => [
      { label: 'Visibility Score', value: '82', change: '+6% vs last month' },
      { label: 'Review Response Rate', value: '92%', change: 'Respond within 12 hrs' },
      { label: 'Profile Completeness', value: '78%', change: 'Add services + Q&A' },
      { label: 'Search Appearances', value: '12.4k', change: '+1.8k last 30 days' },
    ],
    [],
  );

  const opportunityItems = useMemo(
    () => [
      {
        title: 'Reply to 8 unanswered reviews',
        impact: '+15% conversion lift',
        detail: 'Keep responses under 24 hours to stay in Google’s top performers cohort.',
      },
      {
        title: 'Add 5 seasonal photos',
        impact: '+9% discovery searches',
        detail: 'Fresh photography boosts engagement and unlocks new keyword clusters.',
      },
      {
        title: 'Publish a March promo post',
        impact: '+12% directions requests',
        detail: 'Campaign posts keep you visible in the “Updates” carousel for 7 days.',
      },
    ],
    [],
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800"
    >
      <header className="bg-[#3341b8] text-white px-6 py-10 shadow-lg">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 text-center sm:text-left">
          <p className="text-sm uppercase tracking-[0.25rem] text-indigo-200">Google Biz Optimizer™</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">See how your profile could perform at its best</h1>
          <p className="max-w-2xl text-indigo-100">
            Explore a live dashboard with sample data. When you’re ready, connect your own Google Business
            Profile for a tailored optimization plan.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <button className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#3341b8] shadow-md transition hover:bg-slate-100">
              Analyze my business →
            </button>
            <button className="rounded-full border border-white/70 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Download sample report
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
        <section className="grid gap-6 sm:grid-cols-2">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {metric.label}
              </p>
              <p className="mt-4 text-3xl font-bold text-slate-900">{metric.value}</p>
              <p className="mt-2 text-sm text-slate-500">{metric.change}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">This week’s quick wins</h2>
          <p className="mt-2 text-sm text-slate-500">
            These high-impact optimizations are prioritized for local search visibility. Upgrade to sync your
            real results in seconds.
          </p>
          <ul className="mt-6 space-y-5">
            {opportunityItems.map((item) => (
              <li key={item.title} className="flex flex-col gap-1 rounded-xl border border-slate-200/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-base font-medium text-slate-900">{item.title}</p>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-[#3341b8]">
                    {item.impact}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-[#3341b8] px-8 py-10 text-white">
          <h2 className="text-2xl font-semibold">Ready to see your real data?</h2>
          <p className="mt-2 max-w-2xl text-indigo-100">
            Connect your Google Business Profile to unlock live insights, automated monitoring, and a
            weekly action plan tuned to your location.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#3341b8] shadow hover:bg-slate-100">
              Start free analysis
            </button>
            <button className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10">
              View sample checklist
            </button>
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-indigo-200">
            No credit card required · Secure Google OAuth · GDPR compliant
          </p>
        </section>
      </main>
    </div>
  );
}
