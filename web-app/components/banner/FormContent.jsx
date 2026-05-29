'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LOCATIONS = [
  "All Locations",
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Noida",
  "Remote",
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
                if (!e.currentTarget.contains(e.relatedTarget)) setLocOpen(false);
              }}
            >
              <span className="icon-map-pin"></span>
              <div
                onClick={() => setLocOpen(!locOpen)}
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
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    opacity: 0.5,
                    transition: "transform 0.2s",
                    transform: locOpen ? "rotate(180deg)" : "none",
                    paddingLeft: 8,
                  }}
                >
                  ▼
                </span>
              </div>

              {locOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    background: "#fff",
                    borderRadius: 10,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                    minWidth: 180,
                    zIndex: 999,
                    overflow: "hidden",
                    border: "1px solid #f0f0f0",
                  }}
                >
                  {LOCATIONS.map((loc) => (
                    <div
                      key={loc}
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent blur from firing before click
                        setLocation(loc);
                        setLocOpen(false);
                      }}
                      style={{
                        padding: "10px 16px",
                        fontSize: 14,
                        cursor: "pointer",
                        color: location === loc ? "#14a077" : "#333",
                        fontWeight: location === loc ? 600 : 400,
                        background: location === loc ? "#f0faf6" : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { if (location !== loc) e.currentTarget.style.background = "#f8f9fa"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = location === loc ? "#f0faf6" : "transparent"; }}
                    >
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="form-group-4">
              <button type="submit" className="btn btn-find">
                Find Jobs
              </button>
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
