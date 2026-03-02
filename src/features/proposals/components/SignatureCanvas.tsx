'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string | null) => void;
  borderColor?: string;
  textColor?: string;
}

export function SignatureCanvas({ onSignatureChange, borderColor = '#d1d5db', textColor = '#6b7280' }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const firstDrawRef = useRef(false);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    return ctx;
  }, []);

  // Set canvas size on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(2, 2);
    }
  }, []);

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    firstDrawRef.current = true;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = getContext();
    if (!ctx) return;
    const pos = getPosition(e);

    if (firstDrawRef.current) {
      // Defer path start to first move event to avoid spurious line
      // caused by layout shift between mousedown/touchstart and first move
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      firstDrawRef.current = false;
      return;
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (!hasDrawn) setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      onSignatureChange(canvas.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    onSignatureChange(null);
  };

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg cursor-crosshair touch-none"
          style={{
            height: '150px',
            border: `2px solid ${borderColor}`,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawn && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ color: textColor }}
          >
            <span className="text-sm opacity-60">Draw your signature here</span>
          </div>
        )}
      </div>
      {hasDrawn && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Clear signature
        </button>
      )}
    </div>
  );
}
