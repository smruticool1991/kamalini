import React from "react";
import PropTypes from "prop-types";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Link from "next/link";
import { partnerData } from "../../data/partners";

Partner.propTypes = {};

/**
 * @param {{ data?: any[] }} props
 */
function Partner({ data: propData } = {}) {
  const data = (propData && propData.length > 0) ? propData : partnerData;
  return (
    <section>
      <div className="wd-partner">
        <div className="tf-container">
          <h1 className="title-partner">
            Over 100,000 recruiters use KAJobs to modernize their hiring
          </h1>

          <Swiper
            modules={[Autoplay]}
            spaceBetween={-30}
            slidesPerView={6}
            autoplay={{
              delay: 1,
              disableOnInteraction: true,
            }}
            className="partner-type-6"
            loop={true}
            speed={3000}
            breakpoints={{
              320: {
                slidesPerView: 2,
                spaceBetween: -15,
              },
              500: {
                slidesPerView: 3,
                spaceBetween: -20,
              },
              800: {
                slidesPerView: 4,
                spaceBetween: -25,
              },
              1200: {
                slidesPerView: 5,
                spaceBetween: -28,
              },
              1600: {
                slidesPerView: 6,
                spaceBetween: -30,
              },
            }}
          >
            {data.map((item) => (
              <SwiperSlide key={item.id} style={{ height: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Link href="#" className="logo-partner" style={{ height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={item.img} alt={item.alt} style={{ maxHeight: "80px", maxWidth: "100px", objectFit: "contain" }} />
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
