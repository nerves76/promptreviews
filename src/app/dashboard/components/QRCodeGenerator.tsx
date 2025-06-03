"use client";

import { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import { HexColorPicker } from "react-colorful";
import React from "react";
import PromptReviewsLogo from "./PromptReviewsLogo";
import ReactDOMServer from "react-dom/server";

export const QR_FRAME_SIZES = [
  { label: '4x6" (postcard)', width: 1200, height: 1800 },
  { label: '5x7" (greeting card)', width: 1500, height: 2100 },
  { label: '5x8"', width: 1500, height: 2400 },
  { label: '8x10"', width: 2400, height: 3000 },
  {
    label: '8.5x11" (US Letter, standard printer paper)',
    width: 2550,
    height: 3300,
  },
  { label: '11x14" (small poster)', width: 3300, height: 4200 },
];

interface QRCodeGeneratorProps {
  url: string;
  clientName: string;
  logoUrl?: string; // Optional logo for custom design
  frameSize?: { label: string; width: number; height: number };
  onDownload?: (blob: Blob) => void;
}

export default function QRCodeGenerator({
  url,
  clientName,
  frameSize = QR_FRAME_SIZES[0],
  onDownload,
}: QRCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [starColor, setStarColor] = useState("#FFD066");
  const [mainColor, setMainColor] = useState("#1A237E");
  const [showStarPicker, setShowStarPicker] = useState(false);
  const [showMainPicker, setShowMainPicker] = useState(false);
  const starSwatchRef = useRef<HTMLDivElement>(null);
  const mainSwatchRef = useRef<HTMLDivElement>(null);
  const [showStars, setShowStars] = useState(true);

  const logoHeight = Math.floor(frameSize.height * 0.065);

  const generateDesign = async () => {
    setIsGenerating(true);
    try {
      // Calculate all layout variables in order
      const headerHeight = Math.floor(frameSize.height * 0.12);
      const headerToStarsGap = Math.floor(frameSize.height * 0.1);
      const starsY =
        headerHeight + headerToStarsGap + Math.floor(frameSize.height * 0.06);
      const qrSize = Math.floor(frameSize.width * 0.45);
      const spacing = Math.floor(frameSize.height * 0.04);
      const labelHeight = Math.floor(frameSize.height * 0.035) + 10;
      // Vertically center QR code and content between stars/header and logo/label
      const contentHeight = qrSize + spacing + logoHeight;
      const availableHeight =
        frameSize.height - headerHeight - labelHeight - logoHeight - spacing;
      let startY = headerHeight + Math.floor((availableHeight - qrSize) / 2);
      const extraOffset = Math.floor(frameSize.height * 0.04);
      startY += extraOffset;
      // Create canvas
      const canvas = document.createElement("canvas");
      canvas.width = frameSize.width;
      canvas.height = frameSize.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      // Fill background
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, frameSize.width, frameSize.height);
      if (showStars) {
        // Distribute stars more evenly using a larger grid and guarantee corners
        const numCols = 4;
        const numRows = 5;
        const minStarSize = Math.floor(frameSize.height * 0.03); // ~30px
        const maxStarSize = Math.floor(frameSize.height * 0.18); // up to ~360px for large frames
        const qrMargin = 20;
        const logoAreaTop = logoHeight - 10;
        const logoAreaBottom = frameSize.height;
        const qrTop = startY - qrMargin;
        const qrBottom = startY + qrSize + qrMargin;
        const qrLeft = (frameSize.width - qrSize) / 2 - qrMargin;
        const qrRight = (frameSize.width + qrSize) / 2 + qrMargin;
        const cellWidth = frameSize.width / numCols;
        const cellHeight = (frameSize.height - labelHeight - 10) / numRows;
        const stars = [];
        // Place a star in each corner
        const corners = [
          { col: 0, row: 0 }, // top-left
          { col: numCols - 1, row: 0 }, // top-right
          { col: 0, row: numRows - 1 }, // bottom-left
          { col: numCols - 1, row: numRows - 1 }, // bottom-right
        ];
        corners.forEach(({ col, row }) => {
          let size = minStarSize + Math.random() * (maxStarSize - minStarSize);
          let x =
            col === 0
              ? size / 2 + Math.random() * (cellWidth / 2 - size / 2)
              : frameSize.width -
                size / 2 -
                Math.random() * (cellWidth / 2 - size / 2);
          let y =
            row === 0
              ? size / 2 + Math.random() * (cellHeight / 2 - size / 2)
              : frameSize.height -
                labelHeight -
                10 -
                size / 2 -
                Math.random() * (cellHeight / 2 - size / 2);
          let rotation = Math.random() * 360;
          stars.push({ x, y, size, rotation });
        });
        // Fill the rest of the grid, skipping corners
        for (let row = 0; row < numRows; row++) {
          for (let col = 0; col < numCols; col++) {
            // Skip corners
            if (
              (row === 0 && col === 0) ||
              (row === 0 && col === numCols - 1) ||
              (row === numRows - 1 && col === 0) ||
              (row === numRows - 1 && col === numCols - 1)
            ) {
              continue;
            }
            let size =
              minStarSize + Math.random() * (maxStarSize - minStarSize);
            let x,
              y,
              rotation,
              tries = 0,
              overlaps;
            do {
              x =
                col * cellWidth + size / 2 + Math.random() * (cellWidth - size);
              y =
                row * cellHeight +
                size / 2 +
                Math.random() * (cellHeight - size);
              rotation = Math.random() * 360;
              overlaps = false;
              // Avoid QR code area
              if (
                x + size / 2 > qrLeft &&
                x - size / 2 < qrRight &&
                y + size / 2 > qrTop &&
                y - size / 2 < qrBottom
              )
                overlaps = true;
              // Avoid logo area at bottom
              if (y + size / 2 > logoAreaTop && y - size / 2 < logoAreaBottom)
                overlaps = true;
              // Avoid other stars
              for (const s of stars) {
                const dist = Math.hypot(x - s.x, y - s.y);
                if (dist < (size + s.size) / 2 + 12) {
                  overlaps = true;
                  break;
                }
              }
              tries++;
            } while (overlaps && tries < 20);
            if (!overlaps) {
              stars.push({ x, y, size, rotation });
            }
          }
        }
        ctx.save();
        ctx.font = `${Math.floor(frameSize.height * 0.07)}px serif`;
        ctx.fillStyle = starColor;
        ctx.textAlign = "center";
        stars.forEach((star) => {
          ctx.save();
          ctx.translate(star.x, star.y);
          ctx.rotate((star.rotation * Math.PI) / 180);
          ctx.font = `${star.size}px serif`;
          ctx.fillText("★", 0, 0);
          ctx.restore();
        });
        ctx.restore();
      }
      // Draw header text on top of stars
      ctx.font = `bold ${Math.floor(frameSize.height * 0.06)}px Inter, Arial, sans-serif`;
      ctx.fillStyle = mainColor;
      ctx.textAlign = "center";
      ctx.fillText("Leave us a review!", frameSize.width / 2, headerHeight);
      // Draw QR code
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: qrSize,
        margin: 2,
        color: { dark: mainColor, light: "#ffffff" },
      });
      const qrImg = new window.Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve) => {
        qrImg.onload = resolve;
      });
      ctx.drawImage(
        qrImg,
        (frameSize.width - qrSize) / 2,
        startY,
        qrSize,
        qrSize,
      );
      // Draw SVG logo at the very bottom, just above the label
      // Render PromptReviewsLogo as SVG string with user-selected color and explicit width/height
      const logoWidth = logoHeight * 2;
      const logoSvgString = ReactDOMServer.renderToStaticMarkup(
        <PromptReviewsLogo color={mainColor} size={logoWidth} />,
      );
      const svg = new window.Image();
      const svgBlob = new Blob([logoSvgString], { type: "image/svg+xml" });
      const svgUrl = URL.createObjectURL(svgBlob);
      svg.src = svgUrl;
      // Add a timeout to prevent hanging if SVG fails to load
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("SVG logo image load timed out"));
        }, 4000);
        svg.onload = () => {
          clearTimeout(timeout);
          resolve(undefined);
        };
        svg.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("SVG logo image failed to load"));
        };
      });
      // Reserve at least 8% of the frame height as bottom padding
      const bottomPadding = Math.floor(frameSize.height * 0.08);
      let urlSpacing = Math.floor(frameSize.height * 0.012);
      let logoDrawHeight = logoWidth * 0.75;
      let logoY =
        frameSize.height -
        bottomPadding -
        logoDrawHeight -
        urlSpacing -
        Math.floor(frameSize.height * 0.021);
      let urlY = logoY + logoDrawHeight + urlSpacing;
      if (urlY + bottomPadding > frameSize.height) {
        logoDrawHeight = Math.max(logoDrawHeight * 0.85, 30);
        urlSpacing = Math.floor(frameSize.height * 0.008);
        logoY =
          frameSize.height -
          bottomPadding -
          logoDrawHeight -
          urlSpacing -
          Math.floor(frameSize.height * 0.021);
        urlY = logoY + logoDrawHeight + urlSpacing;
      }
      ctx.font = `${Math.floor(frameSize.height * 0.021)}px Inter, Arial, sans-serif`;
      ctx.fillStyle = mainColor;
      ctx.textAlign = "center";
      ctx.drawImage(
        svg,
        (frameSize.width - logoWidth) / 2,
        logoY,
        logoWidth,
        logoDrawHeight,
      );
      ctx.fillText("https://promptreviews.app", frameSize.width / 2, urlY);
      // Set preview
      setPreviewUrl(canvas.toDataURL("image/png"));
      // Draw to ref canvas for download
      if (canvasRef.current) {
        canvasRef.current.width = frameSize.width;
        canvasRef.current.height = frameSize.height;
        const refCtx = canvasRef.current.getContext("2d");
        if (refCtx) refCtx.drawImage(canvas, 0, 0);
      }
    } catch (err) {
      console.error("Error generating QR design:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDesign = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        if (onDownload) onDownload(blob);
        const link = document.createElement("a");
        link.download = `review-qr-${clientName.toLowerCase().replace(/\s+/g, "-")}-${frameSize.label.replace(/[^a-z0-9]/gi, "-")}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }
    }, "image/png");
  };

  useEffect(() => {
    if (previewUrl) {
      generateDesign();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameSize]);

  // Also regenerate when showStars changes
  useEffect(() => {
    if (previewUrl) {
      generateDesign();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStars]);

  // Close pickers when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        showStarPicker &&
        starSwatchRef.current &&
        !starSwatchRef.current.contains(e.target as Node)
      ) {
        setShowStarPicker(false);
      }
      if (
        showMainPicker &&
        mainSwatchRef.current &&
        !mainSwatchRef.current.contains(e.target as Node)
      ) {
        setShowMainPicker(false);
      }
    }
    if (showStarPicker || showMainPicker) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showStarPicker, showMainPicker]);

  return (
    <div className="text-center">
      {previewUrl && (
        <div className="flex flex-row gap-8 justify-center items-center mb-4">
          <div className="relative flex items-center gap-2" ref={starSwatchRef}>
            <span className="text-sm font-medium text-gray-700">
              Star Color
            </span>
            <button
              type="button"
              className="w-8 h-8 rounded-full border-2 border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-slate-blue"
              style={{ background: starColor }}
              onClick={() => setShowStarPicker((v) => !v)}
              aria-label="Pick star color"
            />
            {showStarPicker && (
              <div
                className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 bg-white p-2 rounded shadow-lg border"
                style={{ minWidth: 180 }}
              >
                <HexColorPicker color={starColor} onChange={setStarColor} />
                <div className="mt-1 text-xs text-gray-500 text-center">
                  {starColor}
                </div>
              </div>
            )}
          </div>
          <div className="relative flex items-center gap-2" ref={mainSwatchRef}>
            <span className="text-sm font-medium text-gray-700">
              Main Color
            </span>
            <button
              type="button"
              className="w-8 h-8 rounded-full border-2 border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-slate-blue"
              style={{ background: mainColor }}
              onClick={() => setShowMainPicker((v) => !v)}
              aria-label="Pick main color"
            />
            {showMainPicker && (
              <div
                className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 bg-white p-2 rounded shadow-lg border"
                style={{ minWidth: 180 }}
              >
                <HexColorPicker color={mainColor} onChange={setMainColor} />
                <div className="mt-1 text-xs text-gray-500 text-center">
                  {mainColor}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <input
              type="checkbox"
              id="show-stars"
              checked={showStars}
              onChange={(e) => setShowStars(e.target.checked)}
              className="h-4 w-4 text-slate-blue border-gray-300 rounded focus:ring-slate-blue"
            />
            <label
              htmlFor="show-stars"
              className="text-sm text-gray-700 select-none cursor-pointer"
            >
              Show stars
            </label>
          </div>
        </div>
      )}
      {!previewUrl && (
        <button
          onClick={generateDesign}
          disabled={isGenerating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isGenerating ? "Generating..." : "Preview QR Code"}
        </button>
      )}
      {previewUrl && (
        <div className="space-y-4">
          <img
            src={previewUrl}
            alt="QR Code Preview"
            className="mx-auto border rounded shadow bg-white"
            style={{ maxWidth: "100%", maxHeight: 400 }}
          />
          <button
            onClick={downloadDesign}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-blue hover:bg-slate-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-blue"
          >
            Download Free
          </button>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
