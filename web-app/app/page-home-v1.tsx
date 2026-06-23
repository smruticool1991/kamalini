'use client';

import React, { useEffect } from "react";
import PopUpForm from "@/components/popup";
import Banner01 from "@/components/banner/Banner01";
import Category from "@/components/category";
import Jobs from "@/components/jobs";
import BoxIcon from "@/components/boxicon";
import Employer from "@/components/employer";
import Testimonials from "@/components/testimonials";
import Partner from "@/components/partner";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Gotop from "@/components/gotop";

// Import fake data
import dataCate from "@/assets/fakeData/dataCategory";
import dataJobs from "@/assets/fakeData/dataJobs";
import dataEm from "@/assets/fakeData/dataEmployers";
import dataTestimonials from "@/assets/fakeData/dataTestimonials";
import dataPartner from "@/assets/fakeData/dataPartner";

export default function Home() {
  useEffect(() => {
    const WOW = require("wowjs");
    window.wow = new WOW.WOW({
      live: false,
    });
    window.wow.init();
  }, []);

  useEffect(() => {
    const getPopup = document.querySelector(".wd-popup-form");
    setTimeout(() => {
      getPopup?.classList.add("modal-menu--open");
    }, 3000);
  }, []);

  return (
    <>
      <PopUpForm />

      <Header clname="act1" />
      <Banner01 />

      <Category data={dataCate} className="job-category-section" />

      <Jobs data={dataJobs} className="jobs-section-three" />

      <BoxIcon />

      <Employer data={dataEm} className="employer-section" />

      <Testimonials data={dataTestimonials} className="testimonials-section" />

      <Partner data={dataPartner} />

      <Footer />

      <Gotop />
    </>
  );
}
