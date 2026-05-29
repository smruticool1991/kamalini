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
import logo from "@/assets/images/logo.png";
import Image from "next/image";

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
          <div className="mobile-header">
            <div id="logo" className="logo">
              <Link href="/">
                <Image className="site-logo" src={logo} alt="Image" width={100} height={40} />
              </Link>
            </div>
            <span className="title-button-group" onClick={handleMobile} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
              <i className="icon-close"></i>
            </span>
          </div>

          <Tabs className="tf-tab">
            <TabList className="menu-tab">
              <Tab className="user-tag">Menu</Tab>
              <Tab className="user-tag">Categories</Tab>
            </TabList>

            <div className="content-tab">
              <TabPanel className="header-ct-center menu-moblie animation-tab">
                <div className="nav-wrap">
                  <nav className="main-nav mobile">
                    <ul id="menu-primary-menu" className="menu">
                      <li className="menu-item menu-item-has-children-mobile current-item">
                        <Link
                          href="#"
                          className="iteam-menu"
                          onClick={() => {
                            handleToggle("home");
                          }}
                        >
                          Home
                        </Link>
                        <Collapse isOpened={toggle.key === "home"}>
                          <ul
                            className="sub-menu-mobile"
                            style={{
                              display: `${
                                toggle.key === "home" ? "block" : "none"
                              }`,
                            }}
                          >
                            <li className="menu-item menu-item-mobile current-item">
                              <Link href="/">Home Page 01 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/home-v2">Home Page 02 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/home-v3">Home Page 03 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/home-v4">Home Page 04 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/home-v5">Home Page 05 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/home-v6">Home Page 06 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/home-v7">Home Page 07 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/home-v8">Home Page 08 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/home-v9">Home Page 09 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/home-v10">Home Page 10 </Link>
                            </li>
                          </ul>
                        </Collapse>
                      </li>

                      <li className="menu-item menu-item-has-children-mobile">
                        <Link
                          href="#"
                          className="iteam-menu"
                          onClick={() => {
                            handleToggle("job");
                          }}
                        >
                          Find jobs
                        </Link>
                        <Collapse isOpened={toggle.key === "job"}>
                          <ul
                            className="sub-menu-mobile"
                            style={{
                              display: `${
                                toggle.key === "job" ? "block" : "none"
                              }`,
                            }}
                          >
                            <li className="menu-item menu-item-mobile">
                              <Link href="/joblist-v1">List Layout</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/find-jobs">Grid Layout</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/job-list-sidebar">List Sidebar</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/job-grid-sidebar">Grid Sidebar</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/joblist-v5">
                                List Sidebar Fullwidth
                              </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/joblist-v6">
                                Grid Sidebar Fullwidth
                              </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/joblist-v7">Top Map</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/joblist-v8">Top Map Sidebar</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/joblist-v9">Half Map - V1</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/joblist-v10">Half Map - V2</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/jobsingle-v1">Jobs Single - V1</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/jobsingle-v2">Jobs Single - V2</Link>
                            </li>
                          </ul>
                        </Collapse>
                      </li>

                      <li className="menu-item menu-item-has-children-mobile">
                        <Link
                          href="#"
                          className="iteam-menu"
                          onClick={() => {
                            handleToggle("employers");
                          }}
                        >
                          Employers
                        </Link>
                        <Collapse isOpened={toggle.key === "employers"}>
                          <ul
                            className="sub-menu-mobile"
                            style={{
                              display: `${
                                toggle.key === "employers" ? "block" : "none"
                              }`,
                            }}
                          >
                            <li className="menu-item">
                              <Link href="/employers-v1">List Layout</Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/employers-v2">Grid Layout</Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/employers-v3">List Sidebar</Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/employers-v4">Grid Sidebar</Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/employers-v5">Full Width</Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/employers-v6">Top Map</Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/employers-v7">Half Map</Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/employersingle-v1">
                                Employers Single - V1
                              </Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/employersingle-v2">
                                Employers Single - V2
                              </Link>
                            </li>

                            <li className="menu-item">
                              <Link href="/employerreview">
                                Employers Reviews
                              </Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/employernotfound">
                                Employers Not Found
                              </Link>
                            </li>
                          </ul>
                        </Collapse>
                      </li>
                      <li className="menu-item menu-item-has-children-mobile">
                        <Link
                          href="#"
                          className="iteam-menu"
                          onClick={() => {
                            handleToggle("candidate");
                          }}
                        >
                          Candidates
                        </Link>
                        <Collapse isOpened={toggle.key === "candidate"}>
                          <ul
                            className="sub-menu-mobile"
                            style={{
                              display: `${
                                toggle.key === "candidate" ? "block" : "none"
                              }`,
                            }}
                          >
                            <li className="menu-item menu-item-mobile">
                              <Link href="/candidates-v1">List Layout</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/candidates-v2">Grid Layout</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/candidates-v3">List Sidebar</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/candidates-v4">Top Map</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/candidates-v5">Half Map</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/candidates-v6">No Available V1</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/candidates-v7">No Available V2</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/candidatesingle-v1">
                                Candidate Single - V1
                              </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/candidatesingle-v2">
                                Candidate Single - V2
                              </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/samplecv">Sample CV</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/samplecvslidebar">
                                Sample CV Sidebar
                              </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/samplecvdetails">CV Details</Link>
                            </li>
                          </ul>
                        </Collapse>
                      </li>
                      <li className="menu-item menu-item-has-children-mobile">
                        <Link
                          href="#"
                          className="iteam-menu"
                          onClick={() => {
                            handleToggle("blog");
                          }}
                        >
                          Blog
                        </Link>
                        <Collapse isOpened={toggle.key === "blog"}>
                          <ul
                            className="sub-menu-mobile"
                            style={{
                              display: `${
                                toggle.key === "blog" ? "block" : "none"
                              }`,
                            }}
                          >
                            <li className="menu-item menu-item-mobile">
                              <Link href="/blog-v1">Blog List </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/blog-v2">Blog Grid</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/blog-v3">Blog Masonry</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/blogsingle-v1">Blog Details - V1</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/blogsingle-v2">Blog Details - V2</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/blogsingle-v3">
                                Blog Details Sidebar
                              </Link>
                            </li>
                          </ul>
                        </Collapse>
                      </li>
                      <li className="menu-item menu-item-has-children-mobile">
                        <Link
                          href="#"
                          className="iteam-menu"
                          onClick={() => {
                            handleToggle("pages");
                          }}
                        >
                          Pages
                        </Link>
                        <Collapse isOpened={toggle.key === "pages"}>
                          <ul
                            className="sub-menu-mobile"
                            style={{
                              display: `${
                                toggle.key === "pages" ? "block" : "none"
                              }`,
                            }}
                          >
                            <li className="menu-item menu-item-mobile">
                              <Link href="/aboutus">About Us</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/faqs">FAQS</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/termsofuse">Terms Of Use</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/pricing">Pricing</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/shop">Shop List</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/shoppingcart">Shopping Cart</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/shopsingle">Shop Single</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/checkout">Checkout</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/login">Login</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/createaccount">Create Account</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link href="/contactus">Contact Us</Link>
                            </li>
                          </ul>
                        </Collapse>
                      </li>
                    </ul>
                  </nav>
                </div>
              </TabPanel>

              <TabPanel className="categories animation-tab">
                <div className="sub-categorie-mobile">
                  <ul className="pop-up">
                    <li className="categories-mobile">
                      <Link href="/jobsingle-v1">
                        <span className="icon-categorie-1"></span>Design &
                        Creative
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link href="/jobsingle-v1">
                        <span className="icon-categorie-8"></span>Digital
                        Marketing
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link href="/jobsingle-v1">
                        <span className="icon-categorie-2"></span>Development &
                        IT
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link href="/jobsingle-v1">
                        <span className="icon-categorie-3"></span>Music & Audio
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link href="/jobsingle-v1">
                        <span className="icon-categorie-4"></span>Finance &
                        Accounting
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link href="/jobsingle-v1">
                        <span className="icon-categorie-5"></span>Programming &
                        Tech
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link href="/jobsingle-v1">
                        <span className="icon-categorie-6"></span>Video &
                        Animation
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link href="/jobsingle-v1">
                        <span className="icon-categorie-7"></span>Writing &
                        translation
                      </Link>
                    </li>
                  </ul>
                </div>
              </TabPanel>
            </div>
          </Tabs>

          <div className="header-customize-item button">
            <Link href="/">Upload Resume</Link>
          </div>

          <div className="mobile-footer">
            <div className="icon-infor d-flex aln-center">
              <div className="icon">
                <span className="icon-call-calling">
                  <span className="path1"></span>
                  <span className="path2"></span>
                  <span className="path3"></span>
                  <span className="path4"></span>
                </span>
              </div>
              <div className="content">
                <p>Need help? 24/7</p>
                <h6>
                  <Link href="tel:0123456678">001-1234-88888</Link>
                </h6>
              </div>
            </div>
            <div className="wd-social d-flex aln-center">
              <ul className="list-social d-flex aln-center">
                <li>
                  <Link href="#">
                    <i className="icon-facebook"></i>
                  </Link>
                </li>
                <li>
                  <Link href="#">
                    <i className="icon-linkedin2"></i>
                  </Link>
                </li>
                <li>
                  <Link href="#">
                    <i className="icon-twitter"></i>
                  </Link>
                </li>
                <li>
                  <Link href="#">
                    <i className="icon-pinterest"></i>
                  </Link>
                </li>
                <li>
                  <Link href="#">
                    <i className="icon-instagram1"></i>
                  </Link>
                </li>
                <li>
                  <Link href="#">
                    <i className="icon-youtube"></i>
                  </Link>
                </li>
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
