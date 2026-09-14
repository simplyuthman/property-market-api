import React from "react";
import { fetchFromApi } from "@/lib/api-client";

interface AgentDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
  listingCount: number;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: "sale" | "rent";
  bedrooms: number;
  bathrooms: number;
  city: string;
  address: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { id } = await params;
  let agent: AgentDetail | null = null;
  let listings: Listing[] = [];
  let error: string | null = null;

  try {
    const [agentRes, listingsRes] = await Promise.all([
      fetchFromApi<AgentDetail>(`/api/v1/agents/${id}`),
      fetchFromApi<Listing[]>(`/api/v1/agents/${id}/listings`, { limit: 50 }),
    ]);
    agent = agentRes.data;
    listings = listingsRes.data;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load agent profile";
  }

  if (error || !agent) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <a
          href="/listings"
          className="type-label-large"
          style={{
            display: "inline-block",
            marginBottom: "var(--spacing-base)",
            color: "var(--color-primary, #004ed4)",
            textDecoration: "none",
          }}
        >
          ← Back to listings
        </a>
        <div
          style={{
            backgroundColor: "var(--color-error-container, #fdd2ce)",
            border: "1px solid var(--color-error, #c51707)",
            padding: "var(--spacing-xl)",
            borderRadius: "16px",
            color: "var(--color-on-error-container, #ad1406)",
          }}
        >
          <h2 className="type-headline-small" style={{ margin: "0 0 var(--spacing-sm) 0" }}>
            Agent Not Found
          </h2>
          <p className="type-body-medium" style={{ margin: 0 }}>
            {error || "The requested agent could not be found."}</p>
        </div>
      </div>
    );
  }

  const formatPrice = (cents: number, cat: "sale" | "rent") => {
    const dollars = cents / 100;
    return cat === "rent" ? `$${dollars.toLocaleString()} / mo` : `$${dollars.toLocaleString()}`;
  };

  return (
    <div>
      <a
        href="/listings"
        className="type-label-large"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--spacing-xs)",
          marginBottom: "var(--spacing-xl)",
          color: "var(--color-primary, #004ed4)",
          textDecoration: "none",
        }}
      >
        ← Back to listings
      </a>

      {/* Agent Profile Header */}
      <div
        style={{
          backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
          borderRadius: "16px",
          border: "1px solid var(--color-surface-container-highest, #e2e4e9)",
          boxShadow: "var(--elevation-shadow-level-1)",
          padding: "var(--spacing-2xl)",
          marginBottom: "var(--spacing-2xl)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--spacing-xl)",
        }}
      >
        <div>
          <span
            className="type-label-small"
            style={{
              color: "var(--color-primary, #004ed4)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
            }}
          >
            Real Estate Professional
          </span>
          <h1
            className="type-headline-large"
            style={{
              margin: "var(--spacing-xs) 0 var(--spacing-sm) 0",
              color: "var(--color-on-surface, #16181d)",
            }}
          >
            {agent.name}
          </h1>
          <p
            className="type-body-large"
            style={{
              color: "var(--color-on-surface-variant, #4b4c4e)",
              margin: "0 0 var(--spacing-base) 0",
            }}
          >
            📍 Operating in <strong>{agent.city}</strong>
          </p>

          <div
            className="type-body-medium"
            style={{
              display: "flex",
              gap: "var(--spacing-xl)",
              flexWrap: "wrap",
              color: "var(--color-on-surface-variant, #4b4c4e)",
            }}
          >
            <div>✉️ {agent.email}</div>
            <div>📞 {agent.phone}</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "var(--color-surface-container-low, #f9fafb)",
            border: "1px solid var(--color-surface-container-highest, #e2e4e9)",
            padding: "var(--spacing-xl) var(--spacing-2xl)",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <span
            className="type-label-small"
            style={{
              color: "var(--color-on-surface-variant, #4b4c4e)",
              textTransform: "uppercase",
              display: "block",
            }}
          >
            Active Portfolio
          </span>
          <p
            className="type-headline-large"
            style={{
              color: "var(--color-primary, #004ed4)",
              margin: "var(--spacing-xs) 0 0 0",
            }}
          >
            {agent.listingCount}
          </p>
          <span
            className="type-body-small"
            style={{ color: "var(--color-on-surface-variant, #4b4c4e)" }}
          >
            Properties Listed
          </span>
        </div>
      </div>

      {/* Agent's Listings Grid */}
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <h2
          className="type-headline-medium"
          style={{
            margin: "0 0 var(--spacing-xs) 0",
            color: "var(--color-on-surface, #16181d)",
          }}
        >
          Active Listings by {agent.name}
        </h2>
        <p
          className="type-body-large"
          style={{
            color: "var(--color-on-surface-variant, #4b4c4e)",
            margin: 0,
          }}
        >
          Browse all properties managed by this agent ({listings.length} shown)
        </p>
      </div>

      {listings.length === 0 ? (
        <div
          style={{
            backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
            padding: "var(--spacing-2xl)",
            borderRadius: "16px",
            textAlign: "center",
            border: "1px solid var(--color-surface-container-highest, #e2e4e9)",
          }}
        >
          <p
            className="type-body-large"
            style={{
              color: "var(--color-on-surface-variant, #4b4c4e)",
              margin: 0,
            }}
          >
            No active listings found for this agent.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "var(--spacing-xl)",
          }}
        >
          {listings.map((listing) => (
            <div
              key={listing.id}
              style={{
                backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
                borderRadius: "16px",
                border: "1px solid var(--color-surface-container-highest, #e2e4e9)",
                boxShadow: "var(--elevation-shadow-level-1)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div style={{ padding: "var(--spacing-xl)", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--spacing-sm)" }}>
                  <span
                    className="type-label-small"
                    style={{
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: "var(--spacing-xs) var(--spacing-sm)",
                      borderRadius: "6px",
                      backgroundColor:
                        listing.category === "sale"
                          ? "var(--color-primary-container, #ccdfff)"
                          : "var(--color-tertiary-container, #ccdfff)",
                      color:
                        listing.category === "sale"
                          ? "var(--color-on-primary-container, #003899)"
                          : "var(--color-on-tertiary-container, #003999)",
                    }}
                  >
                    {listing.category === "sale" ? "For Sale" : "For Rent"}
                  </span>
                  <span
                    className="type-label-medium"
                    style={{
                      color: "var(--color-on-surface-variant, #4b4c4e)",
                    }}
                  >
                    {listing.city}
                  </span>
                </div>

                <h3
                  className="type-title-medium"
                  style={{
                    margin: "0 0 var(--spacing-xs) 0",
                    color: "var(--color-on-surface, #16181d)",
                  }}
                >
                  <a
                    href={`/listings/${listing.id}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {listing.title}
                  </a>
                </h3>

                <p
                  className="type-headline-small"
                  style={{
                    color: "var(--color-primary, #004ed4)",
                    margin: "0 0 var(--spacing-sm) 0",
                  }}
                >
                  {formatPrice(listing.price, listing.category)}
                </p>

                <p
                  className="type-body-small"
                  style={{
                    color: "var(--color-on-surface-variant, #4b4c4e)",
                    margin: "0 0 var(--spacing-base) 0",
                  }}
                >
                  📍 {listing.address}
                </p>

                <div
                  className="type-body-small"
                  style={{
                    display: "flex",
                    gap: "var(--spacing-base)",
                    paddingTop: "var(--spacing-md)",
                    borderTop: "1px solid var(--color-surface-container-highest, #e2e4e9)",
                    marginTop: "auto",
                    color: "var(--color-on-surface-variant, #4b4c4e)",
                  }}
                >
                  <span>🛏️ <strong>{listing.bedrooms}</strong> Beds</span>
                  <span>🚿 <strong>{listing.bathrooms}</strong> Baths</span>
                </div>
              </div>

              <div
                style={{
                  padding: "var(--spacing-md) var(--spacing-xl)",
                  backgroundColor: "var(--color-surface-container-low, #f9fafb)",
                  borderTop: "1px solid var(--color-surface-container-highest, #e2e4e9)",
                }}
              >
                <a
                  href={`/listings/${listing.id}`}
                  className="type-label-large"
                  style={{
                    display: "block",
                    textAlign: "center",
                    color: "var(--color-primary, #004ed4)",
                    textDecoration: "none",
                  }}
                >
                  View Property Details →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
