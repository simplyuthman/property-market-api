import React from "react";
import "./tokens.css";

export const metadata = {
  title: "Property Market Consumer App",
  description: "External consumer application demonstrating HTTP consumption of the Property Market API",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          fontFamily: "var(--typography-body-medium-font-family, 'DM Sans', sans-serif)",
          margin: 0,
          padding: 0,
          backgroundColor: "var(--color-surface, #f9fafb)",
          color: "var(--color-on-surface, #16181d)",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
            borderBottom: "1px solid var(--color-surface-container-highest, #e2e4e9)",
            boxShadow: "var(--elevation-shadow-level-1)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "var(--spacing-base) var(--spacing-xl)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2xl)" }}>
              <a
                href="/listings"
                style={{
                  font: "var(--typography-title-large, 500 22px/28px 'DM Sans', sans-serif)",
                  color: "var(--color-on-surface, #16181d)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-sm)",
                }}
              >
                <span style={{ color: "var(--color-primary, #004ed4)" }}>🏢</span> PropertyMarket
              </a>
              <nav style={{ display: "flex", gap: "var(--spacing-base)" }}>
                <a
                  href="/listings"
                  style={{
                    font: "var(--typography-label-large, 500 14px/20px 'DM Sans', sans-serif)",
                    color: "var(--color-primary, #004ed4)",
                    textDecoration: "none",
                  }}
                >
                  Browse Listings
                </a>
              </nav>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
              <span
                style={{
                  font: "var(--typography-label-small, 500 11px/16px 'DM Sans', sans-serif)",
                  padding: "var(--spacing-xs) var(--spacing-sm)",
                  borderRadius: "9999px",
                  backgroundColor: "var(--color-surface-container-high, #e2e4e9)",
                  color: "var(--color-on-surface, #16181d)",
                  fontWeight: 600,
                  border: "1px solid var(--color-surface-variant, #e5e5e6)",
                }}
              >
                ● Server-Rendered (HTTP Only)
              </span>
            </div>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            maxWidth: "1200px",
            width: "100%",
            margin: "0 auto",
            padding: "var(--spacing-2xl) var(--spacing-xl)",
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>

        <footer
          style={{
            backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
            borderTop: "1px solid var(--color-surface-container-highest, #e2e4e9)",
            padding: "var(--spacing-xl)",
            textAlign: "center",
            color: "var(--color-on-surface-variant, #4b4c4e)",
          }}
        >
          <p
            className="type-body-small"
            style={{
              margin: 0,
              color: "var(--color-on-surface-variant, #4b4c4e)",
            }}
          >
            &copy; {new Date().getFullYear()} Property Market API Consumer App. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
