'use client';

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LOCATIONS = [
  "All Locations",
  // Metros
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad",
  // Tier 2
  "Noida", "Gurgaon", "Jaipur", "Lucknow", "Chandigarh",
  "Bhopal", "Indore", "Nagpur", "Coimbatore", "Surat",
  "Kochi", "Visakhapatnam", "Vadodara", "Agra", "Nashik",
  "Thiruvananthapuram", "Patna", "Ranchi", "Bhubaneswar",
  "Mysuru", "Mangalore", "Madurai", "Tiruchirappalli",
  "Dehradun", "Amritsar", "Ludhiana", "Guwahati", "Raipur",
  "Jodhpur", "Udaipur", "Varanasi", "Allahabad", "Meerut",
  // Special
  "Remote", "Pan India",
];

const POPULAR_SEARCHES = [
  { label: "Designer", keyword: "Designer" },
  { label: "Developer", keyword: "Developer" },
  { label: "Tester", keyword: "Tester" },
  { label: "Marketing", keyword: "Marketing" },
  { label: "Manager", keyword: "Manager" },
];

function FormContent() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [locOpen, setLocOpen] = useState(false);
  const [locSearch, setLocSearch] = useState("");

  const filteredLocs = LOCATIONS.filter((l) =>
    l.toLowerCase().includes(locSearch.toLowerCase())
  );

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (location && location !== "All Locations") params.set("location", location);
    const qs = params.toString();
    router.push(`/find-jobs${qs ? `?${qs}` : ""}`);
  };

  const handlePopularClick = (kw) => {
    const params = new URLSearchParams();
    params.set("keyword", kw);
    router.push(`/find-jobs?${params.toString()}`);
  };

  const selectLocation = (loc) => {
    setLocation(loc);
    setLocOpen(false);
    setLocSearch("");
  };

  return (
    <div className="content">
      <div className="heading">
        <h2 className="text-white">Find the job that fits your life</h2>
        <p className="text-white">
          Search thousands of jobs across top companies. Filter by role,
          location, experience and more — all in one place.
        </p>
      </div>

      <div className="form-sl">
        <form onSubmit={handleSearch}>
          <div className="row-group-search home1">
            {/* Keyword Input */}
            <div className="form-group-1">
              <input
                type="text"
                className="input-filter-search"
                placeholder="Job title, keywords or company"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            {/* Location dropdown */}
            <div
              className="form-group-2"
              style={{ position: "relative" }}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setLocOpen(false);
                  setLocSearch("");
                }
              }}
            >
              <span className="icon-map-pin"></span>
              <div
                onClick={() => { setLocOpen(!locOpen); setLocSearch(""); }}
                style={{
                  cursor: "pointer",
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  height: "100%",
                  minWidth: 140,
                  userSelect: "none",
                  color: location === "All Locations" ? "#999" : "#333",
                  fontSize: 14,
                }}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setLocOpen(!locOpen)}
              >
                {location}
                <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5, transition: "transform 0.2s", transform: locOpen ? "rotate(180deg)" : "none", paddingLeft: 8 }}>▼</span>
              </div>

              {locOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
                  width: 240,
                  zIndex: 999,
                  border: "1px solid #f0f0f0",
                  overflow: "hidden",
                }}>
                  {/* Typeahead search */}
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid #f0f0f0" }}>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search city..."
                      value={locSearch}
                      onChange={(e) => setLocSearch(e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        width: "100%", border: "1px solid #e0e0e0", borderRadius: 8,
                        padding: "7px 10px", fontSize: 13, outline: "none",
                        background: "#f8f9fa", boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Scrollable city list */}
                  <div style={{ maxHeight: 240, overflowY: "auto" }}>
                    {filteredLocs.length === 0 ? (
                      <div style={{ padding: "14px 16px", fontSize: 13, color: "#999" }}>No cities found</div>
                    ) : (
                      filteredLocs.map((loc) => (
                        <div
                          key={loc}
                          onMouseDown={(e) => { e.preventDefault(); selectLocation(loc); }}
                          style={{
                            padding: "10px 16px",
                            fontSize: 14,
                            cursor: "pointer",
                            color: location === loc ? "#14a077" : "#333",
                            fontWeight: location === loc ? 600 : 400,
                            background: location === loc ? "#f0faf6" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => { if (location !== loc) e.currentTarget.style.background = "#f8f9fa"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = location === loc ? "#f0faf6" : "transparent"; }}
                        >
                          <span style={{ fontSize: 11, opacity: 0.45 }}>📍</span>
                          {loc}
                          {location === loc && <span style={{ marginLeft: "auto", fontSize: 12, color: "#14a077" }}>✓</span>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="form-group-4">
              <button type="submit" className="btn btn-find">Find Jobs</button>
            </div>
          </div>
        </form>
      </div>

      {/* Popular searches */}
      <ul className="list-category text-white">
        {POPULAR_SEARCHES.map((s) => (
          <li key={s.keyword}>
            <Link
              href={`/find-jobs?keyword=${encodeURIComponent(s.keyword)}`}
              onClick={(e) => { e.preventDefault(); handlePopularClick(s.keyword); }}
            >
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FormContent;
