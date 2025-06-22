import Script from 'next/script';

export default function TestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {/* Load Swiper CSS */}
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css"
            />
            {/* Load Swiper JS */}
            <Script
                src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"
                strategy="beforeInteractive"
            />
            {/* Load all widget scripts */}
            <Script
                src="/widgets/multi/widget-embed.min.js"
                strategy="beforeInteractive"
            />
            <Script
                src="/widgets/single/widget-embed.min.js"
                strategy="beforeInteractive"
            />
            <Script
                src="/widgets/photo/widget-embed.min.js"
                strategy="beforeInteractive"
            />
            {children}
        </>
    );
} 