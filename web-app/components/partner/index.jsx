'use client';
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Link from "next/link";

// Self-contained partner list — no external image dependencies
const PARTNERS = [
  { id: 1,  name: "Google",    color: "#4285F4", bg: "#e8f0fe" },
  { id: 2,  name: "Microsoft", color: "#00a4ef", bg: "#e3f4ff" },
  { id: 3,  name: "Amazon",    color: "#FF9900", bg: "#fff4e0" },
  { id: 4,  name: "Apple",     color: "#555555", bg: "#f0f0f0" },
  { id: 5,  name: "Meta",      color: "#0866FF", bg: "#e7effe" },
  { id: 6,  name: "Netflix",   color: "#E50914", bg: "#fce8e9" },
  { id: 7,  name: "LinkedIn",  color: "#0A66C2", bg: "#e3eef9" },
  { id: 8,  name: "Spotify",   color: "#1DB954", bg: "#e4f7ec" },
  { id: 9,  name: "Uber",      color: "#000000", bg: "#f0f0f0" },
  { id: 10, name: "Airbnb",    color: "#FF5A5F", bg: "#ffeaea" },
];

/**
 * @param {{ data?: any[] }} props
 */
function Partner({ data: propData } = {}) {
  // Use propData only if items have a name property; otherwise fall back to PARTNERS
  const data = (propData && propData.length > 0 && propData[0].name) ? propData : PARTNERS;

  return (
    <section>
      <div className="wd-partner">
        <div className="tf-container">
          <h1 className="title-partner">
            Over 100,000 recruiters use KAJobs to modernize their hiring
          </h1>

          <Swiper
            modules={[Autoplay]}
            spaceBetween={20}
            slidesPerView={6}
            autoplay={{ delay: 1, disableOnInteraction: false }}
            className="partner-type-6"
            loop={true}
            speed={3000}
            breakpoints={{
              320: { slidesPerView: 2, spaceBetween: 12 },
              500: { slidesPerView: 3, spaceBetween: 16 },
              800: { slidesPerView: 4, spaceBetween: 20 },
              1200: { slidesPerView: 5, spaceBetween: 20 },
              1600: { slidesPerView: 6, spaceBetween: 20 },
            }}
          >
            {data.map((item) => (
              <SwiperSlide
                key={item.id}
                style={{ height: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Link
                  href="#"
                  className="logo-partner"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    background: item.bg || "#f0f4ff",
                    border: `1.5px solid ${item.color || "#ccc"}22`,
                    minWidth: "110px",
                    height: "54px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                  }}
                >
                  <span style={{
                    fontWeight: 700,
                    fontSize: "15px",
                    color: item.color || "#333",
                    letterSpacing: "-0.3px",
                    whiteSpace: "nowrap",
                  }}>
                    {item.name}
                  </span>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}

export default Partner;
