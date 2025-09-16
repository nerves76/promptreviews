import React from "react";

export default function WpHeader() {
  return (
    <header
      className="site-header header-main-layout-1 ast-primary-menu-enabled ast-logo-title-inline ast-hide-custom-menu-mobile ast-builder-menu-toggle-icon ast-mobile-header-inline"
      id="masthead"
      itemType="https://schema.org/WPHeader"
      itemScope
      itemID="#masthead"
    >
      <div id="ast-desktop-header" data-toggle-type="dropdown">
        <div className="ast-main-header-wrap main-header-bar-wrap ">
          <div
            className="ast-primary-header-bar ast-primary-header main-header-bar site-header-focus-item"
            data-section="section-primary-header-builder"
          >
            <div
              className="site-primary-header-wrap ast-builder-grid-row-container site-header-focus-item ast-container"
              data-section="section-primary-header-builder"
            >
              <div className="ast-builder-grid-row ast-builder-grid-row-has-sides ast-builder-grid-row-no-center">
                <div className="site-header-primary-section-left site-header-section ast-flex site-header-section-left">
                  <div
                    className="ast-builder-layout-element ast-flex site-header-focus-item"
                    data-section="title_tagline"
                  >
                    <div
                      className="site-branding ast-site-identity"
                      itemType="https://schema.org/Organization"
                      itemScope
                    >
                      <span className="site-logo-img">
                        <a
                          href="https://promptreviews.app/"
                          className="custom-logo-link"
                          rel="home"
                          aria-current="page"
                        >
                          <img
                            width="136"
                            height="49"
                            src="https://promptreviews.app/wp-content/uploads/2025/05/cropped-Prompt-Reviews-4-136x49.png"
                            className="custom-logo"
                            alt="prompt reviews logo, app for getting more local reviews"
                            decoding="async"
                            srcSet="https://promptreviews.app/wp-content/uploads/2025/05/cropped-Prompt-Reviews-4-136x49.png 136w, https://promptreviews.app/wp-content/uploads/2025/05/cropped-Prompt-Reviews-4-300x108.png 300w, https://promptreviews.app/wp-content/uploads/2025/05/cropped-Prompt-Reviews-4.png 465w"
                            sizes="(max-width: 136px) 100vw, 136px"
                          />
                        </a>
                      </span>
                      <div className="ast-site-title-wrap">
                        <span className="site-title" itemProp="name">
                          <a
                            href="https://promptreviews.app/"
                            rel="home"
                            itemProp="url"
                          >
                            {/* Site Title (if any) */}
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="site-header-primary-section-right site-header-section ast-flex ast-grid-right-section">
                  <div
                    className="ast-builder-menu-1 ast-builder-menu ast-flex ast-builder-menu-1-focus-item ast-builder-layout-element site-header-focus-item"
                    data-section="section-hb-menu-1"
                  >
                    <div className="ast-main-header-bar-alignment">
                      <div className="main-header-bar-navigation">
                        <nav
                          className="site-navigation ast-flex-grow-1 navigation-accessibility site-header-focus-item"
                          id="primary-site-navigation-desktop"
                          aria-label="Primary Site Navigation"
                          itemType="https://schema.org/SiteNavigationElement"
                          itemScope
                        >
                          <div className="main-navigation ast-inline-flex">
                            <ul
                              id="ast-hf-menu-1"
                              className="main-header-menu ast-menu-shadow ast-nav-menu ast-flex  submenu-with-border stack-on-mobile"
                            >
                              <li
                                id="menu-item-387"
                                className="menu-item menu-item-type-post_type menu-item-object-page menu-item-387"
                              >
                                <a
                                  href="https://promptreviews.app/about/"
                                  className="menu-link"
                                >
                                  About
                                </a>
                              </li>
                              <li
                                id="menu-item-386"
                                className="menu-item menu-item-type-post_type menu-item-object-page menu-item-386"
                              >
                                <a
                                  href="https://promptreviews.app/features-overview/"
                                  className="menu-link"
                                >
                                  Features
                                </a>
                              </li>
                              <li
                                id="menu-item-388"
                                className="menu-item menu-item-type-post_type menu-item-object-page menu-item-388"
                              >
                                <a
                                  href="https://promptreviews.app/pricing/"
                                  className="menu-link"
                                >
                                  Pricing
                                </a>
                              </li>
                              <li
                                id="menu-item-389"
                                className="menu-item menu-item-type-post_type menu-item-object-page menu-item-389"
                              >
                                <a
                                  href="https://promptreviews.app/contact/"
                                  className="menu-link"
                                >
                                  Contact
                                </a>
                              </li>
                            </ul>
                          </div>
                        </nav>
                      </div>
                    </div>
                  </div>
                  <div
                    className="ast-builder-layout-element ast-flex site-header-focus-item ast-header-button-1"
                    data-section="section-hb-button-1"
                  >
                    <div className="ast-builder-button-wrap ast-builder-button-size-default">
                      <a
                        className="ast-custom-button-link"
                        href="https://app.promptreviews.app/sign-up"
                        target="_self"
                        role="button"
                        aria-label="Start free trial"
                      >
                        <div className="ast-custom-button">
                          Start free trial
                        </div>
                      </a>
                      <a
                        className="menu-link"
                        href="https://app.promptreviews.app/sign-up"
                        target="_self"
                      >
                        Start free trial
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Header */}
      <div
        id="ast-mobile-header"
        className="ast-mobile-header-wrap "
        data-type="dropdown"
      >
        <div className="ast-main-header-wrap main-header-bar-wrap">
          <div
            className="ast-primary-header-bar ast-primary-header main-header-bar site-primary-header-wrap site-header-focus-item ast-builder-grid-row-layout-default ast-builder-grid-row-tablet-layout-default ast-builder-grid-row-mobile-layout-default"
            data-section="section-primary-header-builder"
          >
            <div className="ast-builder-grid-row ast-builder-grid-row-has-sides ast-builder-grid-row-no-center">
              <div className="site-header-primary-section-left site-header-section ast-flex site-header-section-left">
                <div
                  className="ast-builder-layout-element ast-flex site-header-focus-item"
                  data-section="title_tagline"
                >
                  <div
                    className="site-branding ast-site-identity"
                    itemType="https://schema.org/Organization"
                    itemScope
                  >
                    <span className="site-logo-img">
                      <a
                        href="https://promptreviews.app/"
                        className="custom-logo-link"
                        rel="home"
                        aria-current="page"
                      >
                        <img
                          width="136"
                          height="49"
                          src="https://promptreviews.app/wp-content/uploads/2025/05/cropped-Prompt-Reviews-4-136x49.png"
                          className="custom-logo"
                          alt="prompt reviews logo, app for getting more local reviews"
                          decoding="async"
                          srcSet="https://promptreviews.app/wp-content/uploads/2025/05/cropped-Prompt-Reviews-4-136x49.png 136w, https://promptreviews.app/wp-content/uploads/2025/05/cropped-Prompt-Reviews-4-300x108.png 300w, https://promptreviews.app/wp-content/uploads/2025/05/cropped-Prompt-Reviews-4.png 465w"
                          sizes="(max-width: 136px) 100vw, 136px"
                        />
                      </a>
                    </span>
                    <div className="ast-site-title-wrap">
                      <span className="site-title" itemProp="name">
                        <a
                          href="https://promptreviews.app/"
                          rel="home"
                          itemProp="url"
                        >
                          {/* Site Title (if any) */}
                        </a>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="site-header-primary-section-right site-header-section ast-flex ast-grid-right-section">
                <div
                  className="ast-builder-layout-element ast-flex site-header-focus-item"
                  data-section="section-header-mobile-trigger"
                >
                  <div className="ast-button-wrap">
                    <button
                      type="button"
                      className="menu-toggle main-header-menu-toggle ast-mobile-menu-trigger-minimal"
                      aria-expanded="false"
                    >
                      <span className="screen-reader-text">Main Menu</span>
                      <span className="mobile-menu-toggle-icon">
                        <span
                          aria-hidden="true"
                          className="ahfb-svg-iconset ast-inline-flex svg-baseline"
                        >
                          {/* Hamburger Icon SVG */}
                          <svg
                            className="ast-mobile-svg ast-menu-svg"
                            fill="currentColor"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <path d="M3 13h18c0.552 0 1-0.448 1-1s-0.448-1-1-1h-18c-0.552 0-1 0.448-1 1s0.448 1 1 1zM3 7h18c0.552 0 1-0.448 1-1s-0.448-1-1-1h-18c-0.552 0-1 0.448-1 1s0.448 1 1 1zM3 19h18c0.552 0 1-0.448 1-1s-0.448-1-1-1h-18c-0.552 0-1 0.448-1 1s0.448 1 1 1z"></path>
                          </svg>
                        </span>
                        <span
                          aria-hidden="true"
                          className="ahfb-svg-iconset ast-inline-flex svg-baseline"
                        >
                          {/* Close Icon SVG */}
                          <svg
                            className="ast-mobile-svg ast-close-svg"
                            fill="currentColor"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5.293 6.707l5.293 5.293-5.293 5.293c-0.391 0.391-0.391 1.024 0 1.414s1.024 0.391 1.414 0l5.293-5.293 5.293 5.293c0.391 0.391 1.024 0.391 1.414 0s0.391-1.024 0-1.414l-5.293-5.293 5.293-5.293c0.391-0.391 0.391-1.024 0-1.414s-1.024-0.391-1.414 0l-5.293 5.293-5.293-5.293c-0.391-0.391-1.024-0.391-1.414 0s-0.391 1.024 0 1.414z"></path>
                          </svg>
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="ast-mobile-header-content content-align-flex-start ">
            <div
              className="ast-builder-menu-mobile ast-builder-menu ast-builder-menu-mobile-focus-item ast-builder-layout-element site-header-focus-item"
              data-section="section-header-mobile-menu"
            >
              <div className="ast-main-header-bar-alignment">
                <div className="main-header-bar-navigation">
                  <nav
                    className="site-navigation ast-flex-grow-1 navigation-accessibility"
                    id="ast-mobile-site-navigation"
                    aria-label="Site Navigation"
                    itemType="https://schema.org/SiteNavigationElement"
                    itemScope
                  >
                    <div id="ast-hf-mobile-menu" className="main-navigation">
                      <ul className="main-header-menu ast-nav-menu ast-flex  submenu-with-border astra-menu-animation-fade  stack-on-mobile">
                        <li className="page_item page-item-20 menu-item">
                          <a
                            href="https://promptreviews.app/about/"
                            className="menu-link"
                          >
                            About
                          </a>
                        </li>
                        <li className="page_item page-item-17 menu-item">
                          <a
                            href="https://promptreviews.app/contact/"
                            className="menu-link"
                          >
                            Contact
                          </a>
                        </li>
                        <li className="page_item page-item-18 menu-item">
                          <a
                            href="https://promptreviews.app/faq/"
                            className="menu-link"
                          >
                            FAQ
                          </a>
                        </li>
                        <li className="page_item page-item-366 menu-item">
                          <a
                            href="https://promptreviews.app/features-overview/"
                            className="menu-link"
                          >
                            Features
                          </a>
                        </li>
                        <li className="page_item page-item-21 current-menu-item menu-item current-menu-item">
                          <a
                            href="https://promptreviews.app/"
                            className="menu-link"
                          >
                            Home
                          </a>
                        </li>
                        <li className="page_item page-item-19 menu-item">
                          <a
                            href="https://promptreviews.app/pricing/"
                            className="menu-link"
                          >
                            Pricing
                          </a>
                        </li>
                      </ul>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
