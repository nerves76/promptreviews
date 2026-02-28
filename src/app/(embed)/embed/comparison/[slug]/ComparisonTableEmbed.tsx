"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ComparisonData, FormattedCompetitor, FeatureValue } from './fetchComparisonData';

// --- Icon map (matches widget-embed.js) ---
const ICON_MAP: Record<string, string> = {
  FaStar: '\u2B50',
  FaComments: '\uD83D\uDCAC',
  FaMapMarker: '\uD83D\uDCCD',
  FaCoins: '\uD83D\uDCB0',
  FaChartLine: '\uD83D\uDCCA',
  FaCog: '\u2699\uFE0F',
  FaUser: '\uD83D\uDC64',
  FaUsers: '\uD83D\uDC65',
  FaEnvelope: '\u2709\uFE0F',
  FaPhone: '\uD83D\uDCDE',
  FaGlobe: '\uD83C\uDF10',
  FaSearch: '\uD83D\uDD0D',
  FaRocket: '\uD83D\uDE80',
  FaLightbulb: '\uD83D\uDCA1',
  FaShieldAlt: '\uD83D\uDEE1\uFE0F',
  FaCalendarAlt: '\uD83D\uDCC5',
  FaBell: '\uD83D\uDD14',
  FaImage: '\uD83D\uDDBC\uFE0F',
  FaLink: '\uD83D\uDD17',
};

// --- Prompt Reviews SVG logo path ---
const PR_LOGO_PATH = "M 82.375 7.867188 C 75.75 11.171875 67.027344 24.929688 59.957031 43.238281 C 55.550781 54.644531 56.246094 56.117188 69.203125 62.855469 C 76.160156 66.476562 76.519531 67.210938 70.445312 65.410156 C 63.566406 63.367188 59.089844 60.738281 46.339844 51.253906 C 31.546875 40.246094 29.222656 39.117188 22.179688 39.515625 C -2.902344 40.933594 -2.007812 84.523438 23.425781 100.242188 C 26.636719 102.226562 27.363281 107.472656 24.546875 108.367188 C 16.679688 110.863281 16.078125 146.238281 23.832031 150.417969 L 26.625 151.925781 L 27.109375 161.332031 C 28.25 183.464844 35.175781 193.601562 52.15625 197.996094 C 59.113281 199.796875 166.875 199.796875 173.832031 197.996094 C 190.46875 193.6875 197.679688 183.132812 198.886719 161.308594 L 199.363281 152.65625 L 202.039062 151.214844 C 206.609375 148.753906 206.9375 147.308594 206.917969 129.660156 C 206.898438 112.15625 206.804688 111.800781 201.671875 109.21875 C 197.058594 106.902344 197.972656 103.710938 204.875 98.042969 C 225.203125 81.359375 228.429688 51.421875 211.003906 41.171875 C 203.277344 36.625 195.855469 39 179.648438 51.207031 C 168.914062 59.289062 159.210938 64.585938 153.53125 65.464844 C 150.714844 65.898438 151.011719 65.632812 156.652344 62.699219 C 169.683594 55.917969 170.105469 55.113281 166.320312 44.316406 C 154.664062 11.066406 143.5 1.761719 123.367188 8.519531 C 113.101562 11.964844 112.375 11.96875 102.792969 8.605469 C 93.066406 5.195312 88.101562 5.015625 82.375 7.867188 M 85.371094 49.585938 C 69.445312 50.890625 67.394531 52.152344 76.160156 55.265625 C 99.246094 63.464844 140.515625 62.109375 155.457031 52.667969 C 159.820312 49.910156 108.796875 47.667969 85.371094 49.585938 M 44.234375 79.988281 C 41.246094 81.902344 37.332031 87.59375 36 91.960938 C 34.726562 96.136719 34.972656 164.753906 36.285156 171.132812 C 38.050781 179.726562 44.109375 186.835938 52.015625 189.59375 C 58.28125 191.777344 167.707031 191.777344 173.972656 189.59375 C 189 184.351562 190.730469 177.890625 190.40625 128.257812 C 190.140625 87.800781 190.175781 88.035156 183.085938 81.5 C 178.941406 77.679688 178.410156 77.675781 171.09375 81.421875 L 165.269531 84.402344 L 168.542969 84.957031 C 180.753906 87.019531 181.609375 90.527344 181 136.019531 C 180.332031 185.933594 187.40625 181.234375 112.992188 181.234375 C 38.015625 181.234375 45.40625 186.398438 44.933594 133.695312 C 44.546875 90.324219 45.074219 88.113281 56.402344 85.394531 L 60.363281 84.445312 L 54.070312 81.40625 C 46.734375 77.855469 47.410156 77.953125 44.234375 79.988281 M 76.710938 106.621094 C 63.355469 115.625 71.667969 142.847656 85.699219 136.054688 C 98.148438 130.03125 95.476562 104.867188 82.390625 104.867188 C 80.488281 104.867188 78.316406 105.539062 76.710938 106.621094 M 138.453125 106.835938 C 128.171875 115.484375 131.820312 136.808594 143.613281 136.96875 C 155.996094 137.140625 160.914062 114.828125 150.332031 106.5 C 147.265625 104.089844 141.523438 104.25 138.453125 106.835938 M 88.59375 148.679688 C 86.675781 150.597656 87.574219 153.722656 91.203125 157.757812 C 103.015625 170.898438 130.242188 168.609375 138.003906 153.828125 C 141.296875 147.550781 135.140625 145.519531 129.988281 151.179688 C 121.070312 160.976562 105.605469 161.347656 96.601562 151.976562 C 92.566406 147.777344 90.390625 146.882812 88.59375 148.679688";

// --- Scale icon (features column header) ---
const SCALE_ICON_PATH = "M12 2C11.45 2 11 2.45 11 3V4.29L5.71 6.59C5.28 6.78 5 7.2 5 7.67L5 8L2 14C2 15.66 3.34 17 5 17C6.66 17 8 15.66 8 14L5 8L11 5.5V19H7V21H17V19H13V5.5L19 8L16 14C16 15.66 17.34 17 19 17C20.66 17 22 15.66 22 14L19 8V7.67C19 7.2 18.72 6.78 18.29 6.59L13 4.29V3C13 2.45 12.55 2 12 2ZM5 9.33L6.77 13H3.23L5 9.33ZM19 9.33L20.77 13H17.23L19 9.33Z";

interface Props {
  data: ComparisonData;
}

function FeatureValueIndicator({ feature, featureType }: { feature: FeatureValue; featureType: string }) {
  if (feature.isLimited) {
    return <span className="pr-limited">Limited</span>;
  }
  if (featureType === 'text' && feature.value) {
    return <span className="pr-text-value">{String(feature.value)}</span>;
  }
  if (featureType === 'number' && feature.value !== null) {
    return <span className="pr-text-value">{feature.value}</span>;
  }
  if (feature.hasFeature) {
    return <span className="pr-check" aria-label="Yes">{'\u2713'}</span>;
  }
  return <span className="pr-x" aria-label="No">{'\u2717'}</span>;
}

function CompetitorHeader({
  competitor,
  index,
  canSwap,
  onSwap,
}: {
  competitor: FormattedCompetitor;
  index: number;
  canSwap: boolean;
  onSwap: (index: number) => void;
}) {
  const logoUrl = competitor.logo?.startsWith('/')
    ? `https://app.promptreviews.app${competitor.logo}`
    : competitor.logo;

  return (
    <th>
      <div className="pr-header-wrapper">
        <div className="pr-header-cell">
          <div className="pr-logo-wrapper pr-logo-wrapper-comp">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${competitor.name} logo`}
                className="pr-logo"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = target.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="pr-logo-placeholder"
              style={logoUrl ? { display: 'none' } : undefined}
            >
              {competitor.name.charAt(0)}
            </div>
          </div>
          <span className="pr-name pr-name-comp">{competitor.name}</span>
          {canSwap && (
            <button
              className="pr-swap-btn"
              onClick={() => onSwap(index)}
              aria-label={`Swap ${competitor.name} with another competitor`}
            >
              {'\u21BB'} Swap
            </button>
          )}
        </div>
        {competitor.description && (
          <div className="pr-hover-card">
            <p>{competitor.description}</p>
          </div>
        )}
      </div>
    </th>
  );
}

export default function ComparisonTableEmbed({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayedCompetitors, setDisplayedCompetitors] = useState<FormattedCompetitor[]>(
    data.competitors
  );
  const [swapDropdownIndex, setSwapDropdownIndex] = useState<number | null>(null);

  const canSwap = data.allCompetitors.length > data.competitors.length;

  // --- postMessage height protocol ---
  useEffect(() => {
    let lastHeight = 0;

    const sendHeight = () => {
      const container = containerRef.current;
      if (!container) return;
      const bodyHeight = document.body.scrollHeight;
      const containerHeight = container.scrollHeight;
      const height = Math.ceil(Math.max(bodyHeight, containerHeight));

      if (Math.abs(height - lastHeight) > 5) {
        lastHeight = height;
        window.parent.postMessage(
          { type: 'comparison-embed-resize', height },
          '*'
        );
      }
    };

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const debouncedSendHeight = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(sendHeight, 100);
    };

    // Send height at multiple intervals to catch all rendering stages
    setTimeout(sendHeight, 100);
    setTimeout(sendHeight, 300);
    setTimeout(sendHeight, 500);
    setTimeout(sendHeight, 1000);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(debouncedSendHeight);
      resizeObserver.observe(containerRef.current);
      resizeObserver.observe(document.body);
    }

    window.addEventListener('resize', debouncedSendHeight);

    return () => {
      window.removeEventListener('resize', debouncedSendHeight);
      clearTimeout(resizeTimeout);
      resizeObserver?.disconnect();
    };
  }, [displayedCompetitors]);

  // --- Close swap dropdown on outside click ---
  useEffect(() => {
    if (swapDropdownIndex === null) return;

    const handleClick = () => setSwapDropdownIndex(null);
    // Delay to avoid closing immediately from the same click
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [swapDropdownIndex]);

  const handleSwapClick = useCallback((index: number) => {
    setSwapDropdownIndex(prev => (prev === index ? null : index));
  }, []);

  const handleSwapSelect = useCallback((index: number, newCompetitor: FormattedCompetitor) => {
    setDisplayedCompetitors(prev => {
      const updated = [...prev];
      updated[index] = newCompetitor;
      return updated;
    });
    setSwapDropdownIndex(null);
  }, []);

  const displayedIds = new Set(displayedCompetitors.map(c => c.id));
  const availableForSwap = data.allCompetitors.filter(c => !displayedIds.has(c.id));

  const hasPricing = displayedCompetitors.some(c => c.pricing_description);
  const colCount = 2 + displayedCompetitors.length;

  return (
    <>
      <style>{EMBED_STYLES}</style>
      <div ref={containerRef} className="pr-widget">
        <div className="pr-container">
          <div className="pr-table-wrapper">
            <table className="pr-table">
              <thead>
                <tr>
                  {/* Features column header */}
                  <th className="pr-feature-header">
                    <div className="pr-header-cell">
                      <div className="pr-logo-wrapper pr-logo-wrapper-comp">
                        <svg viewBox="0 0 24 24" className="pr-logo" fill="white">
                          <path d={SCALE_ICON_PATH} />
                        </svg>
                      </div>
                      <span className="pr-name" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Features
                      </span>
                    </div>
                  </th>

                  {/* Prompt Reviews column (F-pattern: always first) */}
                  <th className="pr-highlight-header">
                    <div className="pr-header-wrapper">
                      <div className="pr-header-cell">
                        <div className="pr-logo-wrapper pr-logo-wrapper-pr">
                          <svg viewBox="0 0 225 225" className="pr-logo" fill="white">
                            <path fillRule="evenodd" d={PR_LOGO_PATH} />
                          </svg>
                        </div>
                        <span className="pr-name pr-name-pr">Prompt Reviews</span>
                      </div>
                      <div className="pr-hover-card">
                        <p>AI-powered review management platform that helps local businesses collect more 5-star reviews and build their online reputation.</p>
                      </div>
                    </div>
                  </th>

                  {/* Competitor columns */}
                  {displayedCompetitors.map((comp, i) => (
                    <CompetitorHeader
                      key={comp.id}
                      competitor={comp}
                      index={i}
                      canSwap={canSwap}
                      onSwap={handleSwapClick}
                    />
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Pricing section */}
                {hasPricing && (
                  <>
                    <tr className="pr-category-row">
                      <td colSpan={colCount}>
                        <span style={{ marginRight: 8 }}>{'\uD83D\uDCB0'}</span>Pricing
                      </td>
                    </tr>
                    <tr>
                      <td className="pr-feature-name">Plans & pricing</td>
                      <td className="pr-highlight">
                        <span className="pr-text-value">
                          {data.promptReviews.pricing_description}
                        </span>
                      </td>
                      {displayedCompetitors.map(comp => (
                        <td key={comp.id}>
                          <span className="pr-text-value">
                            {comp.pricing_description || '\u2014'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* Categories and features */}
                {data.categories.map(category => (
                  <CategorySection
                    key={category.id}
                    category={category}
                    colCount={colCount}
                    promptReviewsFeatures={data.promptReviews.features}
                    competitors={displayedCompetitors}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Swap dropdown (rendered as portal-like overlay) */}
        {swapDropdownIndex !== null && availableForSwap.length > 0 && (
          <SwapDropdown
            competitors={availableForSwap}
            index={swapDropdownIndex}
            onSelect={handleSwapSelect}
          />
        )}

        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateSchema(data)),
          }}
        />
      </div>
    </>
  );
}

function CategorySection({
  category,
  colCount,
  promptReviewsFeatures,
  competitors,
}: {
  category: ComparisonData['categories'][number];
  colCount: number;
  promptReviewsFeatures: Record<string, FeatureValue>;
  competitors: FormattedCompetitor[];
}) {
  const iconChar = category.icon ? ICON_MAP[category.icon] || '' : '';

  return (
    <>
      <tr className="pr-category-row">
        <td colSpan={colCount}>
          {iconChar && <span style={{ marginRight: 8 }}>{iconChar}</span>}
          {category.name}
        </td>
      </tr>
      {category.features.map(feature => {
        const prFeature = promptReviewsFeatures[feature.slug] || {
          hasFeature: true,
          value: null,
          isLimited: false,
          notes: null,
        };

        return (
          <tr key={feature.id}>
            <td className="pr-feature-name">
              <span className="pr-feature-label">
                {feature.benefitName || feature.name}
                {feature.description && (
                  <span className="pr-tooltip" title={feature.description}>?</span>
                )}
              </span>
            </td>
            <td className="pr-highlight">
              <FeatureValueIndicator feature={prFeature} featureType={feature.type} />
            </td>
            {competitors.map(comp => {
              const compFeature = comp.features[feature.slug] || {
                hasFeature: false,
                value: null,
                isLimited: false,
                notes: null,
              };
              return (
                <td key={comp.id}>
                  <FeatureValueIndicator feature={compFeature} featureType={feature.type} />
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}

function SwapDropdown({
  competitors,
  index,
  onSelect,
}: {
  competitors: FormattedCompetitor[];
  index: number;
  onSelect: (index: number, competitor: FormattedCompetitor) => void;
}) {
  return (
    <div
      className="pr-swap-dropdown-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pr-swap-dropdown">
        {competitors.map(comp => {
          const logoUrl = comp.logo?.startsWith('/')
            ? `https://app.promptreviews.app${comp.logo}`
            : comp.logo;
          return (
            <button
              key={comp.id}
              className="pr-swap-option"
              onClick={() => onSelect(index, comp)}
            >
              {logoUrl && (
                <img src={logoUrl} alt="" className="pr-swap-option-logo" />
              )}
              {comp.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function generateSchema(data: ComparisonData) {
  const featureList: string[] = [];
  data.categories.forEach(cat => {
    cat.features.forEach(f => {
      const prFeature = data.promptReviews.features[f.slug];
      if (prFeature?.hasFeature) {
        featureList.push(f.benefitName || f.name);
      }
    });
  });

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Prompt Reviews",
    description:
      "AI-powered review management platform that helps businesses collect, manage, and showcase customer reviews.",
    url: "https://promptreviews.app",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "17",
      highPrice: "85",
      priceCurrency: "USD",
      offerCount: "3",
    },
    featureList,
  };

  if (data.competitors.length > 0) {
    schema.isSimilarTo = data.competitors.map(comp => {
      const compSchema: Record<string, string> = {
        "@type": "SoftwareApplication",
        name: comp.name,
        applicationCategory: "BusinessApplication",
      };
      if (comp.website) compSchema.url = comp.website;
      if (comp.description) compSchema.description = comp.description;
      return compSchema;
    });
  }

  return schema;
}

// --- Embedded styles (matches widget-embed.js visual design) ---
const EMBED_STYLES = `
  .pr-widget {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    max-width: 100%;
    color: #1f2937;
    font-size: 14px;
    line-height: 1.5;
    position: relative;
  }

  .pr-widget * {
    box-sizing: border-box;
  }

  .pr-container {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  }

  .pr-table-wrapper {
    position: relative;
    z-index: 1;
    overflow-x: auto;
  }

  .pr-table {
    width: 100%;
    border-collapse: collapse;
    background: transparent;
  }

  .pr-table th,
  .pr-table td {
    padding: 16px 20px;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .pr-table th {
    background: transparent;
    font-weight: 600;
    font-size: 13px;
    color: white;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    border-right: 1px solid rgba(255, 255, 255, 0.2);
    vertical-align: top;
  }

  .pr-table th:last-child {
    border-right: none;
  }

  .pr-table th:first-child,
  .pr-table td:first-child {
    text-align: left;
    width: 30%;
    font-weight: 500;
    color: white;
  }

  .pr-header-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-height: 100px;
  }

  .pr-logo-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .pr-logo-wrapper-pr,
  .pr-logo-wrapper-comp {
    background: linear-gradient(135deg, rgba(165, 180, 252, 0.5) 0%, rgba(192, 132, 252, 0.5) 100%);
  }

  .pr-logo {
    width: 32px;
    height: 32px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  .pr-logo-placeholder {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.7);
  }

  .pr-name {
    font-size: 15px;
    font-weight: 600;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pr-name-pr,
  .pr-name-comp {
    color: white;
  }

  /* Highlight column for Prompt Reviews (F-pattern) */
  .pr-highlight {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border-left: 1px solid rgba(255, 255, 255, 0.15);
    border-right: 1px solid rgba(255, 255, 255, 0.15);
  }

  .pr-highlight-header {
    background-color: transparent !important;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
    border-right: 1px solid rgba(255, 255, 255, 0.2);
  }

  .pr-table tbody {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .pr-category-row td {
    background: rgba(0, 0, 0, 0.1);
    font-weight: 600;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: white;
    padding: 12px 16px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  }

  .pr-feature-name {
    font-weight: 500;
    font-size: 15px;
    color: white;
  }

  .pr-feature-label {
    display: inline;
  }

  .pr-tooltip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.7);
    font-size: 10px;
    font-weight: 600;
    cursor: help;
    margin-left: 5px;
    vertical-align: middle;
  }

  .pr-tooltip:hover {
    background: rgba(255, 255, 255, 0.3);
    color: white;
  }

  /* Competitor header with hover card */
  .pr-header-wrapper {
    position: relative;
  }

  .pr-hover-card {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 100%;
    margin-top: 8px;
    width: 240px;
    padding: 12px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    z-index: 100;
    pointer-events: none;
  }

  .pr-header-wrapper:hover .pr-hover-card {
    opacity: 1;
    visibility: visible;
  }

  .pr-hover-card p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: white;
    font-weight: 400;
    text-align: left;
  }

  /* Swap dropdown */
  .pr-swap-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .pr-swap-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .pr-swap-dropdown-overlay {
    position: fixed;
    z-index: 200;
  }

  .pr-swap-dropdown {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 200px;
    max-height: 300px;
    overflow-y: auto;
    background: rgba(15, 23, 42, 0.98);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    z-index: 200;
    padding: 4px;
  }

  .pr-swap-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
    color: white;
    cursor: pointer;
    transition: background 0.1s ease;
    background: none;
    border: none;
    border-radius: 8px;
    text-align: left;
  }

  .pr-swap-option:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .pr-swap-option-logo {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    object-fit: contain;
    filter: brightness(0) invert(1);
  }

  /* Feature value indicators */
  .pr-check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(34, 197, 94, 0.3);
    color: #4ade80;
    font-size: 16px;
    font-weight: bold;
  }

  .pr-x {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.3);
    color: #f87171;
    font-size: 16px;
    font-weight: bold;
  }

  .pr-limited {
    display: inline-block;
    padding: 2px 8px;
    background: #fef3c7;
    color: #92400e;
    font-size: 11px;
    font-weight: 500;
    border-radius: 4px;
  }

  .pr-text-value {
    font-size: 13px;
    color: white;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .pr-table th,
    .pr-table td {
      padding: 8px 10px;
      font-size: 12px;
    }

    .pr-table th:first-child,
    .pr-table td:first-child {
      width: 40%;
    }

    .pr-logo-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 10px;
    }

    .pr-logo {
      width: 24px;
      height: 24px;
    }

    .pr-logo-placeholder {
      font-size: 14px;
    }

    .pr-name {
      font-size: 12px;
      max-width: 70px;
    }

    .pr-check,
    .pr-x {
      width: 24px;
      height: 24px;
      font-size: 14px;
    }
  }
`;
