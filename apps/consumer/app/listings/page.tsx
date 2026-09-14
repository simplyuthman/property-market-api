import React from "react";
import { fetchFromApi } from "@/lib/api-client";

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
  agentId: string;
  createdAt: string;
}

interface PageProps {
  searchParams: Promise<{
    category?: string;
    city?: string;
    bedrooms?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    order?: string;
    limit?: string;
    offset?: string;
  }>;
}

export default async function ListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const category = params.category;
  const city = params.city;
  const bedrooms = params.bedrooms ? parseInt(params.bedrooms, 10) : undefined;
  const minPrice = params.minPrice ? parseInt(params.minPrice, 10) : undefined;
  const maxPrice = params.maxPrice ? parseInt(params.maxPrice, 10) : undefined;
  const sort = params.sort;
  const order = params.order;
  const limit = params.limit ? parseInt(params.limit, 10) : 12;
  const offset = params.offset ? parseInt(params.offset, 10) : 0;

  let listings: Listing[] = [];
  let meta = { total: 0, limit, offset, hasMore: false };
  let error: string | null = null;

  try {
    const response = await fetchFromApi<Listing[]>("/api/v1/listings", {
      category,
      city,
      bedrooms,
      minPrice,
      maxPrice,
      sort,
      order,
      limit,
      offset,
    });
    listings = response.data;
    if (response.meta) {
      meta = response.meta;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load listings";
  }

  const formatPrice = (cents: number, cat: "sale" | "rent") => {
    const dollars = cents / 100;
    return cat === "rent"
      ? `$${dollars.toLocaleString()} / mo`
      : `$${dollars.toLocaleString()}`;
  };

  const prevOffset = Math.max(0, offset - limit);
  const nextOffset = offset + limit;

  return (
    <div>
      <div style={{ marginBottom: "var(--spacing-2xl)" }}>
        <h1
          className="type-headline-large"
          style={{
            margin: "0 0 var(--spacing-sm) 0",
            color: "var(--color-on-surface, #16181d)",
          }}
        >
          Real Estate Market Listings
        </h1>
        <p
          className="type-body-large"
          style={{
            color: "var(--color-on-surface-variant, #4b4c4e)",
            margin: 0,
          }}
        >
          Explore properties served live via the Property Market REST API ({meta.total} properties available)
        </p>
      </div>

      {/* Filter Bar */}
      <form
        method="GET"
        action="/listings"
        style={{
          backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
          padding: "var(--spacing-xl)",
          borderRadius: "12px",
          border: "1px solid var(--color-surface-container-highest, #e2e4e9)",
          boxShadow: "var(--elevation-shadow-level-1)",
          marginBottom: "var(--spacing-2xl)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--spacing-base)",
          alignItems: "end",
        }}
      >
        <div>
          <label
            className="type-label-medium"
            style={{
              display: "block",
              color: "var(--color-on-surface-variant, #4b4c4e)",
              marginBottom: "var(--spacing-xs)",
            }}
          >
            Category
          </label>
          <select
            name="category"
            defaultValue={category || ""}
            style={{
              width: "100%",
              padding: "var(--spacing-sm) var(--spacing-md)",
              borderRadius: "8px",
              border: "1px solid var(--color-surface-variant, #e5e5e6)",
              backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
              color: "var(--color-on-surface, #16181d)",
              font: "var(--typography-body-medium)",
              outline: "none",
            }}
          >
            <option value="">All Categories</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>

        <div>
          <label
            className="type-label-medium"
            style={{
              display: "block",
              color: "var(--color-on-surface-variant, #4b4c4e)",
              marginBottom: "var(--spacing-xs)",
            }}
          >
            City
          </label>
          <input
            type="text"
            name="city"
            defaultValue={city || ""}
            placeholder="e.g. Austin, Miami"
            style={{
              width: "100%",
              padding: "var(--spacing-sm) var(--spacing-md)",
              borderRadius: "8px",
              border: "1px solid var(--color-surface-variant, #e5e5e6)",
              backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
              color: "var(--color-on-surface, #16181d)",
              font: "var(--typography-body-medium)",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        <div>
          <label
            className="type-label-medium"
            style={{
              display: "block",
              color: "var(--color-on-surface-variant, #4b4c4e)",
              marginBottom: "var(--spacing-xs)",
            }}
          >
            Bedrooms
          </label>
          <select
            name="bedrooms"
            defaultValue={bedrooms || ""}
            style={{
              width: "100%",
              padding: "var(--spacing-sm) var(--spacing-md)",
              borderRadius: "8px",
              border: "1px solid var(--color-surface-variant, #e5e5e6)",
              backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
              color: "var(--color-on-surface, #16181d)",
              font: "var(--typography-body-medium)",
              outline: "none",
            }}
          >
            <option value="">Any Bedrooms</option>
            <option value="1">1+ Beds</option>
            <option value="2">2+ Beds</option>
            <option value="3">3+ Beds</option>
            <option value="4">4+ Beds</option>
          </select>
        </div>

        <div>
          <label
            className="type-label-medium"
            style={{
              display: "block",
              color: "var(--color-on-surface-variant, #4b4c4e)",
              marginBottom: "var(--spacing-xs)",
            }}
          >
            Sort By
          </label>
          <select
            name="sort"
            defaultValue={sort || "createdAt"}
            style={{
              width: "100%",
              padding: "var(--spacing-sm) var(--spacing-md)",
              borderRadius: "8px",
              border: "1px solid var(--color-surface-variant, #e5e5e6)",
              backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
              color: "var(--color-on-surface, #16181d)",
              font: "var(--typography-body-medium)",
              outline: "none",
            }}
          >
            <option value="createdAt">Newest First</option>
            <option value="price">Price</option>
            <option value="bedrooms">Bedrooms</option>
          </select>
        </div>

        <div>
          <label
            className="type-label-medium"
            style={{
              display: "block",
              color: "var(--color-on-surface-variant, #4b4c4e)",
              marginBottom: "var(--spacing-xs)",
            }}
          >
            Order
          </label>
          <select
            name="order"
            defaultValue={order || "desc"}
            style={{
              width: "100%",
              padding: "var(--spacing-sm) var(--spacing-md)",
              borderRadius: "8px",
              border: "1px solid var(--color-surface-variant, #e5e5e6)",
              backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
              color: "var(--color-on-surface, #16181d)",
              font: "var(--typography-body-medium)",
              outline: "none",
            }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          <button
            type="submit"
            style={{
              flex: 1,
              backgroundColor: "var(--color-primary, #004ed4)",
              color: "var(--color-on-primary, #ffffff)",
              font: "var(--typography-label-large)",
              padding: "var(--spacing-sm) var(--spacing-base)",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Apply Filters
          </button>
          <a
            href="/listings"
            style={{
              padding: "var(--spacing-sm) var(--spacing-md)",
              borderRadius: "8px",
              border: "1px solid var(--color-surface-variant, #e5e5e6)",
              color: "var(--color-on-surface-variant, #4b4c4e)",
              textDecoration: "none",
              font: "var(--typography-label-large)",
              textAlign: "center",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Reset
          </a>
        </div>
      </form>

      {error && (
        <div
          style={{
            backgroundColor: "var(--color-error-container, #fdd2ce)",
            border: "1px solid var(--color-error, #c51707)",
            color: "var(--color-on-error-container, #ad1406)",
            padding: "var(--spacing-base)",
            borderRadius: "10px",
            marginBottom: "var(--spacing-xl)",
          }}
        >
          <strong>API Request Error:</strong> {error}
        </div>
      )}

      {/* Listings Grid */}
      {listings.length === 0 && !error ? (
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
            No properties found matching your criteria. Try adjusting your filters.
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
                  View Details & Viewings →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {meta.total > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "var(--spacing-2xl)",
            padding: "var(--spacing-base) var(--spacing-xl)",
            backgroundColor: "var(--color-surface-container-lowest, #ffffff)",
            borderRadius: "12px",
            border: "1px solid var(--color-surface-container-highest, #e2e4e9)",
          }}
        >
          <span
            className="type-body-medium"
            style={{ color: "var(--color-on-surface-variant, #4b4c4e)" }}
          >
            Showing <strong>{offset + 1}</strong> - <strong>{Math.min(offset + listings.length, meta.total)}</strong> of <strong>{meta.total}</strong> results
          </span>

          <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
            {offset > 0 ? (
              <a
                href={`/listings?offset=${prevOffset}&limit=${limit}${category ? `&category=${category}` : ""}${city ? `&city=${city}` : ""}${bedrooms ? `&bedrooms=${bedrooms}` : ""}${sort ? `&sort=${sort}` : ""}${order ? `&order=${order}` : ""}`}
                className="type-label-large"
                style={{
                  padding: "var(--spacing-sm) var(--spacing-base)",
                  borderRadius: "8px",
                  border: "1px solid var(--color-surface-variant, #e5e5e6)",
                  color: "var(--color-on-surface, #16181d)",
                  textDecoration: "none",
                }}
              >
                ← Previous
              </a>
            ) : (
              <span
                className="type-label-large"
                style={{
                  padding: "var(--spacing-sm) var(--spacing-base)",
                  borderRadius: "8px",
                  border: "1px solid var(--color-surface-container-high, #e2e4e9)",
                  color: "var(--color-surface-variant, #e5e5e6)",
                }}
              >
                ← Previous
              </span>
            )}

            {meta.hasMore ? (
              <a
                href={`/listings?offset=${nextOffset}&limit=${limit}${category ? `&category=${category}` : ""}${city ? `&city=${city}` : ""}${bedrooms ? `&bedrooms=${bedrooms}` : ""}${sort ? `&sort=${sort}` : ""}${order ? `&order=${order}` : ""}`}
                className="type-label-large"
                style={{
                  padding: "var(--spacing-sm) var(--spacing-base)",
                  borderRadius: "8px",
                  border: "1px solid var(--color-surface-variant, #e5e5e6)",
                  color: "var(--color-on-surface, #16181d)",
                  textDecoration: "none",
                }}
              >
                Next →
              </a>
            ) : (
              <span
                className="type-label-large"
                style={{
                  padding: "var(--spacing-sm) var(--spacing-base)",
                  borderRadius: "8px",
                  border: "1px solid var(--color-surface-container-high, #e2e4e9)",
                  color: "var(--color-surface-variant, #e5e5e6)",
                }}
              >
                Next →
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
