'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Collapse } from "react-collapse";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
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

  const [toggle, setToggle] = useState({
    key: "",
    status: false,
  });
  const [isShowMobile, setShowMobile] = useState(false);

  const handleToggle = (key: string) => {
    if (toggle.key === key) {
      setToggle({
        key: "",
        status: false,
      });
    } else {
      setToggle({
        status: true,
        key,
      });
    }
  };

  const handleMobile = () => {
    const getMobile = document.querySelector(".menu-mobile-popup");
    setShowMobile(!isShowMobile);
    !isShowMobile
      ? getMobile?.classList.add("modal-menu--open")
      : getMobile?.classList.remove("modal-menu--open");
  };

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

      <div className="menu-mobile-popup">
        <div className="modal-menu__backdrop" onClick={handleMobile}></div>
        <div className="widget-filter">
          {/* ── Logo ── */}
          <div className="mobile-header">
            <div id="logo" className="logo">
              <Link href="/">
                <img className="site-logo" src="/logo.png" alt="KA Jobs" style={{ height: '40px', width: 'auto' }} />
              </Link>
            </div>
            <span className="title-button-group" onClick={handleMobile} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
              <i className="icon-close"></i>
            </span>
          </div>

          {/* ── Nav — matches desktop Header exactly ── */}
          <div className="nav-wrap" style={{ padding: '16px 0' }}>
            <nav className="main-nav mobile">
              <ul id="menu-primary-menu" className="menu" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <li className="menu-item" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <Link href="/" className="iteam-menu" onClick={handleMobile}
                    style={{ display: 'block', padding: '14px 20px', fontWeight: 600, color: '#1a1a2e', textDecoration: 'none', fontSize: 15 }}>
                    Home
                  </Link>
                </li>
                <li className="menu-item" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <Link href="/find-jobs" className="iteam-menu" onClick={handleMobile}
                    style={{ display: 'block', padding: '14px 20px', fontWeight: 600, color: '#1a1a2e', textDecoration: 'none', fontSize: 15 }}>
                    Find Jobs
                  </Link>
                </li>
                <li className="menu-item" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <Link href="/employers" className="iteam-menu" onClick={handleMobile}
                    style={{ display: 'block', padding: '14px 20px', fontWeight: 600, color: '#1a1a2e', textDecoration: 'none', fontSize: 15 }}>
                    Employers
                  </Link>
                </li>
                <li className="menu-item" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <Link href="/training" className="iteam-menu" onClick={handleMobile}
                    style={{ display: 'block', padding: '14px 20px', fontWeight: 600, color: '#1a1a2e', textDecoration: 'none', fontSize: 15 }}>
                    Training
                  </Link>
                </li>
                <li className="menu-item" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <Link href="/education" className="iteam-menu" onClick={handleMobile}
                    style={{ display: 'block', padding: '14px 20px', fontWeight: 600, color: '#1a1a2e', textDecoration: 'none', fontSize: 15 }}>
                    Education
                  </Link>
                </li>
                <li className="menu-item">
                  <Link href="/blog" className="iteam-menu" onClick={handleMobile}
                    style={{ display: 'block', padding: '14px 20px', fontWeight: 600, color: '#1a1a2e', textDecoration: 'none', fontSize: 15 }}>
                    Blog
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* ── CTA Button ── */}
          <div style={{ padding: '16px 20px' }}>
            <Link href="/find-jobs" onClick={handleMobile}
              style={{
                display: 'block', textAlign: 'center', padding: '14px',
                background: 'linear-gradient(135deg, #14a077, #0f7a5a)',
                color: '#fff', borderRadius: 10, fontWeight: 700,
                fontSize: 15, textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(20,160,119,0.35)',
              }}>
              Find Jobs
            </Link>
          </div>

          {/* ── Footer info ── */}
          <div className="mobile-footer" style={{ marginTop: 8 }}>
            <div className="wd-social d-flex aln-center">
              <ul className="list-social d-flex aln-center">
                <li><Link href="#"><i className="icon-facebook"></i></Link></li>
                <li><Link href="#"><i className="icon-linkedin2"></i></Link></li>
                <li><Link href="#"><i className="icon-twitter"></i></Link></li>
                <li><Link href="#"><i className="icon-instagram1"></i></Link></li>
              </ul>
            </div>
          </div>

        </div>
      </div>


      <Header clname="act1" handleMobile={handleMobile} />
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
