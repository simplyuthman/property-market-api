import React from "react";
import { fetchFromApi } from "@/lib/api-client";

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  category: "sale" | "rent";
  bedrooms: number;
  bathrooms: number;
  city: string;
  address: string;
  createdAt: string;
  agent: Agent;
  viewingCount: number;
}

interface Viewing {
  id: string;
  visitorName: string;
  visitorEmail: string;
  scheduledAt: string;
  status: "scheduled" | "completed" | "cancelled";
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  let listing: ListingDetail | null = null;
  let viewings: Viewing[] = [];
  let error: string | null = null;

  try {
    const [listingRes, viewingsRes] = await Promise.all([
      fetchFromApi<ListingDetail>(`/api/v1/listings/${id}`),
      fetchFromApi<Viewing[]>(`/api/v1/listings/${id}/viewings`, { limit: 10 }),
    ]);
    listing = listingRes.data;
    viewings = viewingsRes.data;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load listing details";
  }

  if (error || !listing) {
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
          ← Back to all listings
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
            Listing Not Found
          </h2>
          <p className="type-body-medium" style={{ margin: 0 }}>
            {error || "The requested listing could not be found."}
          </p>
        </div>
      </div>
    );
  }

  const formatPrice = (cents: number, cat: "sale" | "rent") => {
    const dollars = cents / 100;
    return cat === "rent" ? `$${dollars.toLocaleString()} / mo` : `$${dollars.toLocaleString()}`;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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
        ← Back to all listings
      </a>

      {/* Main Listing Card */}
      <div
        style={{
          backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
          borderRadius: "16px",
          border: "1px solid var(--color-surface-container-highest, #e2e4e9)",
          boxShadow: "var(--elevation-shadow-level-1)",
          overflow: "hidden",
          marginBottom: "var(--spacing-2xl)",
        }}
      >
        <div style={{ padding: "var(--spacing-2xl)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "var(--spacing-base)",
              flexWrap: "wrap",
              gap: "var(--spacing-sm)",
            }}
          >
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
              className="type-body-small"
              style={{ color: "var(--color-on-surface-variant, #4b4c4e)" }}
            >
              Listed on {formatDate(listing.createdAt)}
            </span>
          </div>

          <h1
            className="type-headline-large"
            style={{
              margin: "0 0 var(--spacing-sm) 0",
              color: "var(--color-on-surface, #16181d)",
            }}
          >
            {listing.title}
          </h1>

          <p
            className="type-body-large"
            style={{
              color: "var(--color-on-surface-variant, #4b4c4e)",
              margin: "0 0 var(--spacing-xl) 0",
            }}
          >
            📍 {listing.address}, {listing.city}
          </p>

          <p
            className="type-display-small"
            style={{
              color: "var(--color-primary, #004ed4)",
              margin: "0 0 var(--spacing-2xl) 0",
            }}
          >
            {formatPrice(listing.price, listing.category)}
          </p>

          {/* Key Specs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "var(--spacing-base)",
              padding: "var(--spacing-xl)",
              backgroundColor: "var(--color-surface-container-low, #f9fafb)",
              borderRadius: "12px",
              border: "1px solid var(--color-surface-container-highest, #e2e4e9)",
              marginBottom: "var(--spacing-2xl)",
            }}
          >
            <div>
              <span
                className="type-label-small"
                style={{
                  color: "var(--color-on-surface-variant, #4b4c4e)",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Bedrooms
              </span>
              <p
                className="type-title-large"
                style={{
                  margin: "var(--spacing-xs) 0 0 0",
                  color: "var(--color-on-surface, #16181d)",
                }}
              >
                {listing.bedrooms} Beds
              </p>
            </div>
            <div>
              <span
                className="type-label-small"
                style={{
                  color: "var(--color-on-surface-variant, #4b4c4e)",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Bathrooms
              </span>
              <p
                className="type-title-large"
                style={{
                  margin: "var(--spacing-xs) 0 0 0",
                  color: "var(--color-on-surface, #16181d)",
                }}
              >
                {listing.bathrooms} Baths
              </p>
            </div>
            <div>
              <span
                className="type-label-small"
                style={{
                  color: "var(--color-on-surface-variant, #4b4c4e)",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                City
              </span>
              <p
                className="type-title-large"
                style={{
                  margin: "var(--spacing-xs) 0 0 0",
                  color: "var(--color-on-surface, #16181d)",
                }}
              >
                {listing.city}
              </p>
            </div>
            <div>
              <span
                className="type-label-small"
                style={{
                  color: "var(--color-on-surface-variant, #4b4c4e)",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Active Viewings
              </span>
              <p
                className="type-title-large"
                style={{
                  margin: "var(--spacing-xs) 0 0 0",
                  color: "var(--color-primary, #004ed4)",
                }}
              >
                {listing.viewingCount} Scheduled
              </p>
            </div>
          </div>

          <div>
            <h3
              className="type-title-large"
              style={{
                marginBottom: "var(--spacing-sm)",
                color: "var(--color-on-surface, #16181d)",
              }}
            >
              Description
            </h3>
            <p
              className="type-body-large"
              style={{
                lineHeight: 1.7,
                color: "var(--color-on-surface-variant, #4b4c4e)",
                margin: 0,
              }}
            >
              {listing.description}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--spacing-xl)" }}>
        {/* Agent Info Card */}
        <div
          style={{
            backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
            padding: "var(--spacing-xl)",
            borderRadius: "16px",
            border: "1px solid var(--color-surface-container-highest, #e2e4e9)",
            boxShadow: "var(--elevation-shadow-level-1)",
          }}
        >
          <span
            className="type-label-small"
            style={{
              color: "var(--color-primary, #004ed4)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
            }}
          >
            Listing Agent
          </span>
          <h2
            className="type-title-large"
            style={{
              margin: "var(--spacing-xs) 0 var(--spacing-base) 0",
              color: "var(--color-on-surface, #16181d)",
            }}
          >
            {listing.agent.name}
          </h2>
          <div
            className="type-body-medium"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-sm)",
              color: "var(--color-on-surface-variant, #4b4c4e)",
              marginBottom: "var(--spacing-xl)",
            }}
          >
            <div>✉️ <strong>Email:</strong> {listing.agent.email}</div>
            <div>📞 <strong>Phone:</strong> {listing.agent.phone}</div>
          </div>
          <a
            href={`/agents/${listing.agent.id}`}
            className="type-label-large"
            style={{
              display: "inline-block",
              width: "100%",
              textAlign: "center",
              backgroundColor: "var(--color-surface-container-high, #e2e4e9)",
              color: "var(--color-on-surface, #16181d)",
              padding: "var(--spacing-sm) var(--spacing-base)",
              borderRadius: "8px",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            View Agent Profile & All Listings →
          </a>
        </div>

        {/* Scheduled Viewings Card */}
        <div
          style={{
            backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
            padding: "var(--spacing-xl)",
            borderRadius: "16px",
            border: "1px solid var(--color-surface-container-highest, #e2e4e9)",
            boxShadow: "var(--elevation-shadow-level-1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-base)" }}>
            <h3
              className="type-title-medium"
              style={{
                margin: 0,
                color: "var(--color-on-surface, #16181d)",
              }}
            >
              Recent Viewings ({viewings.length})
            </h3>
            <span
              className="type-label-small"
              style={{ color: "var(--color-on-surface-variant, #4b4c4e)" }}
            >
              Masked Domain Only
            </span>
          </div>

          {viewings.length === 0 ? (
            <p
              className="type-body-medium"
              style={{ color: "var(--color-on-surface-variant, #4b4c4e)", margin: 0 }}
            >
              No viewings currently scheduled for this property.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
              {viewings.slice(0, 4).map((v) => (
                <div
                  key={v.id}
                  style={{
                    padding: "var(--spacing-sm) var(--spacing-md)",
                    backgroundColor: "var(--color-surface-container-low, #f9fafb)",
                    borderRadius: "8px",
                    border: "1px solid var(--color-surface-container-highest, #e2e4e9)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--spacing-xs)" }}>
                    <span className="type-label-large" style={{ color: "var(--color-on-surface, #16181d)" }}>
                      {v.visitorName}
                    </span>
                    <span
                      className="type-label-small"
                      style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor:
                          v.status === "scheduled"
                            ? "var(--color-primary-container, #ccdfff)"
                            : v.status === "completed"
                            ? "var(--color-surface-container-high, #e2e4e9)"
                            : "var(--color-error-container, #fdd2ce)",
                        color:
                          v.status === "scheduled"
                            ? "var(--color-on-primary-container, #003899)"
                            : v.status === "completed"
                            ? "var(--color-on-surface-variant, #4b4c4e)"
                            : "var(--color-on-error-container, #ad1406)",
                      }}
                    >
                      {v.status}
                    </span>
                  </div>
                  <div className="type-body-small" style={{ color: "var(--color-on-surface-variant, #4b4c4e)" }}>
                    {v.visitorEmail} • {formatDate(v.scheduledAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
