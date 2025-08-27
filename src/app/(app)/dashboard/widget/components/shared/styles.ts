export function injectWidgetResponsiveCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .widget-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }

    @media (max-width: 768px) {
      .widget-container {
        padding: 0 1rem;
      }
    }

    @media (max-width: 480px) {
      .widget-container {
        padding: 0 0.5rem;
      }
    }
  `;
  document.head.appendChild(style);
}

export function injectSwiperCSS(): Promise<void> {
  return new Promise((resolve) => {
    const style = document.createElement('style');
    style.textContent = `
      .swiper {
        width: 100%;
        height: 100%;
      }

      .swiper-slide {
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .swiper-button-next,
      .swiper-button-prev {
        color: currentColor;
        opacity: 0.7;
        transition: opacity 0.3s ease;
      }

      .swiper-button-next:hover,
      .swiper-button-prev:hover {
        opacity: 1;
      }

      .swiper-pagination-bullet {
        background: currentColor;
        opacity: 0.3;
      }

      .swiper-pagination-bullet-active {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
    resolve();
  });
}

export function injectSwiperNavCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .swiper-button-next,
    .swiper-button-prev {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .swiper-button-next:after,
    .swiper-button-prev:after {
      font-size: 18px;
      color: #333;
    }

    .swiper-button-disabled {
      opacity: 0.35;
      cursor: auto;
      pointer-events: none;
    }

    @media (max-width: 768px) {
      .swiper-button-next,
      .swiper-button-prev {
        width: 32px;
        height: 32px;
      }

      .swiper-button-next:after,
      .swiper-button-prev:after {
        font-size: 14px;
      }
    }
  `;
  document.head.appendChild(style);
}

export function injectWidgetNavCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .widget-nav-button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .widget-nav-button:hover {
      background: rgba(255, 255, 255, 1);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .widget-nav-button.prev {
      left: -20px;
    }

    .widget-nav-button.next {
      right: -20px;
    }

    .widget-nav-button svg {
      width: 20px;
      height: 20px;
      color: #333;
    }

    .widget-nav-button.disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .widget-nav-button {
        width: 32px;
        height: 32px;
      }

      .widget-nav-button.prev {
        left: -16px;
      }

      .widget-nav-button.next {
        right: -16px;
      }

      .widget-nav-button svg {
        width: 16px;
        height: 16px;
      }
    }
  `;
  document.head.appendChild(style);
} 