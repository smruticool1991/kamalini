'use client';

import React, { useEffect } from "react";
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

// Static data (testimonials & partners stay as-is)
import { testimonialData } from "@/data/testimonials";
import dataPartner from "@/assets/fakeData/dataPartner";


// Firebase live data
import { useFirebaseCategories, useFirebaseJobs, useFirebaseAllJobs, useFirebaseCompanies } from "@/lib/useFirebaseData";

export default function Home() {
  // ── Firebase data ────────────────────────────────────────
  const { categories: fbCategories, loading: cateLoading } = useFirebaseCategories()
  const { jobs: fbJobs, loading: jobsLoading } = useFirebaseJobs(6)
  const { jobs: allJobsForCount } = useFirebaseAllJobs()   // all approved jobs — for category counting
  const { companies: fbCompanies, loading: emLoading } = useFirebaseCompanies(12)

  // Map Firebase data to the shape expected by existing components
  const dataCate = fbCategories.map((cat, i) => {
    // Match jobs by category name (case-insensitive) OR by category document ID
    const liveCount = allJobsForCount.filter(j => {
      if (!j.category) return false
      const jc = j.category.toLowerCase()
      const catName = cat.name?.toLowerCase() ?? ''
      const catId = cat.id?.toLowerCase() ?? ''
      return jc === catName || jc === catId || catName.includes(jc) || jc.includes(catName)
    }).length
    const count = liveCount > 0 ? liveCount : (cat.jobCount ?? 0)
    return {
      id: cat.id || i,
      title: cat.name,
      unit: `${count} Job${count !== 1 ? 's' : ''} available`,
      active: i === 0 ? 'active' : '',
      categoryName: cat.name,
    }
  })

  const dataJobs = fbJobs.map((job) => ({
    id: job.id,
    img: null,           // no logo image in Firestore — handled in Jobs component
    stt: job.status,
    cate: job.company,
    title: job.title,
    map: job.location,
    time: job.createdAt
      ? new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      : 'Recently posted',
    price: job.salary ? `${job.currency || '₹'} ${job.salary}` : 'Salary not disclosed',
    apply: 'Apply Now',
    jobs1: job.experience || 'Full-time',
    jobs2: 'On-site',
  }))

  const dataEm = fbCompanies.map((company, i) => ({
    id: company.id || i,
    img: null,           // no logo — handled in Employer component
    title: company.name,
    map: company.location || 'Location not specified',
    job: `${company.industry || 'Company'}`,
  }))
  // ── End Firebase data ─────────────────────────────────────


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
      <Header clname="act1" />
      <Banner01 />

      <Category data={dataCate.slice(0, 10)} className="job-category-section" />

      <Jobs data={dataJobs} className="jobs-section-three" />

      <BoxIcon />

      <Employer data={dataEm} className="employer-section" />

      <Testimonials data={testimonialData} className="testimonials-section" />

      <Partner data={dataPartner} />

      <Footer />

      <Gotop />
    </>
  );
}
