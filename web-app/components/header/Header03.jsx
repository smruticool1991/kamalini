import React, { useState } from "react";
import PropTypes from "prop-types";
import logo from "../../assets/images/logo.png";
import Link from "next/link";

Header03.propTypes = {};

function Header03({ clname = "", handleMobile }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const handleDropdown = (index) => {
    setActiveIndex(index);
  };
  return (
    <header id="header" className="header header-style2">
      <div className="tf-container">
        <div className="row">
          <div className="col-md-12">
            <div className="sticky-area-wrap">
              <div className="header-ct-left">
                <ul className="usefull-link">
                  <li>
                    <Link href="/employers_v1">For Employers</Link>
                  </li>
                  <li>
                    <Link href="/candidates_v1">For Candidates</Link>
                  </li>
                </ul>
              </div>
              <div className="header-ct-center">
                <div id="logo" className="logo">
                  <Link href="/">
                    <img className="site-logo" src={logo} alt="Image" />
                  </Link>
                </div>
                <div className="nav-wrap">
                  <nav id="main-nav" className="main-nav">
                    <ul id="menu-primary-menu" className="menu">
                      <li
                        className={`menu-item menu-item-has-children ${clname}`}
                      >
                        <Link href="#">Home </Link>
                        <div className="menu-bar">
                          <ul className="sub-menu-bar">
                            <li className="menu-item">
                              <Link href="/">Home Page 01 </Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/home_v2">Home Page 02 </Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/home_v3">Home Page 03 </Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/home_v4">Home Page 04 </Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/home_v5">Home Page 05 </Link>
                            </li>
                          </ul>

                          <ul className="sub-menu-bar">
                            <li className="menu-item">
                              <Link href="/home_v6">Home Page 06 </Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/home_v7">Home Page 07 </Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/home_v8">Home Page 08 </Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/home_v9">Home Page 09 </Link>
                            </li>
                            <li className="menu-item">
                              <Link href="/home_v10">Home Page 10 </Link>
                            </li>
                          </ul>
                        </div>
                      </li>
                      <li className="menu-item menu-item-has-children">
                        <Link href="#">Find jobs </Link>
                        <ul className="sub-menu st1">
                          <li className="nav-sub">
                            <Link href="#">
                              Jobs Listing
                              <span className="icon-keyboard_arrow_right"></span>
                            </Link>
                            <ul className="nav-sub-menu">
                              <li className="nav-menu-item">
                                <Link href="/joblist_v1">List Layout</Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/job-grid">List Sidebar</Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/job-list-sidebar">
                                  Grid Layout
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/job-grid-sidebar">
                                  Grid Sidebar
                                </Link>
                              </li>

                              <li className="nav-menu-item">
                                <Link href="/joblist_v5">
                                  List Sidebar Fullwidth
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/joblist_v6">
                                  Grid Sidebar Fullwidth
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/joblist_v7">Top Map</Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/joblist_v8">
                                  Top Map Sidebar
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/joblist_v9">
                                  Half Map - V1
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/joblist_v10">
                                  Half Map - V2
                                </Link>
                              </li>
                            </ul>
                          </li>
                          <li className="nav-sub">
                            <Link href="/jobsingle_v1">
                              Jobs Single - V1
                            </Link>
                          </li>
                          <li className="nav-sub">
                            <Link href="/jobsingle_v2">
                              Jobs Single - V2
                            </Link>
                          </li>
                        </ul>
                      </li>

                      <li className="menu-item menu-item-has-children">
                        <Link href="#">Employers</Link>
                        <ul className="sub-menu st1">
                          <li className="nav-sub">
                            <Link href="#">
                              Employers Listing
                              <span className="icon-keyboard_arrow_right"></span>
                            </Link>
                            <ul className="nav-sub-menu">
                              <li className="nav-menu-item">
                                <Link href="/employers_v1">
                                  List Layout
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/employers_v2">
                                  Grid Layout
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/employers_v3">
                                  List Sidebar
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/employers_v4">
                                  Grid Sidebar
                                </Link>
                              </li>

                              <li className="nav-menu-item">
                                <Link href="/employers_v5">
                                  Grid Fullwidth
                                </Link>
                              </li>

                              <li className="nav-menu-item">
                                <Link href="/employers_v6">Top Map</Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/employers_v7">Half Map</Link>
                              </li>
                            </ul>
                          </li>
                          <li className="nav-sub">
                            <Link href="/employersingle_v1">
                              Employers Single - V1
                            </Link>
                          </li>
                          <li className="nav-sub">
                            <Link href="/employersingle_v2">
                              Employers Single - V2
                            </Link>
                          </li>

                          <li className="nav-sub">
                            <Link href="/employerreview">
                              Employers Reviews
                            </Link>
                          </li>
                          <li className="nav-sub">
                            <Link href="/employernotfound">
                              Employers Not Found
                            </Link>
                          </li>
                          <li className="nav-sub">
                            <Link href="/employerdashboard">
                              Employer Dashboard
                            </Link>
                          </li>
                        </ul>
                      </li>
                      <li className="menu-item menu-item-has-children">
                        <Link href="#">Candidates</Link>
                        <ul className="sub-menu st1">
                          <li className="nav-sub">
                            <Link href="#">
                              Candidates Listing
                              <span className="icon-keyboard_arrow_right"></span>
                            </Link>
                            <ul className="nav-sub-menu">
                              <li className="nav-menu-item">
                                <Link href="/candidates_v1">
                                  List Layout
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/candidates_v2">
                                  Grid Layout
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/candidates_v3">
                                  List Sidebar
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/candidates_v4">Top Map</Link>
                              </li>

                              <li className="nav-menu-item">
                                <Link href="/candidates_v5">Half Map</Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/candidates_v6">
                                  No Available - V1
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/candidates_v7">
                                  No Available - V2
                                </Link>
                              </li>
                            </ul>
                          </li>
                          <li className="nav-sub">
                            <Link href="#">
                              Sample CV
                              <span className="icon-keyboard_arrow_right"></span>
                            </Link>
                            <ul className="nav-sub-menu">
                              <li className="nav-menu-item">
                                <Link href="/samplecv">Sample CV</Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/samplecvdetails">
                                  CV Details
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/samplecvslidebar">
                                  Sample CV Sidebar
                                </Link>
                              </li>
                            </ul>
                          </li>
                          <li className="nav-sub">
                            <Link href="/candidatesingle_v1">
                              Candidate Single - V1
                            </Link>
                          </li>
                          <li className="nav-sub">
                            <Link href="/candidatesingle_v2">
                              Candidate Single - V2
                            </Link>
                          </li>

                          <li className="nav-sub">
                            <Link href="/candidatedashboard">
                              Candidates Dashboard
                            </Link>
                          </li>
                        </ul>
                      </li>
                      <li className="menu-item menu-item-has-children">
                        <Link href="#">Blog</Link>
                        <ul className="sub-menu st1">
                          <li className="nav-sub">
                            <Link href="#">
                              Blog Listing
                              <span className="icon-keyboard_arrow_right"></span>
                            </Link>
                            <ul className="nav-sub-menu">
                              <li className="nav-menu-item">
                                <Link href="/blog_v1">Blog List - V1 </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/blog_v2">Blog Grid</Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/blog_v3">Blog Masonry</Link>
                              </li>
                            </ul>
                          </li>
                          <li className="nav-sub">
                            <Link href="#">
                              Blog Details
                              <span className="icon-keyboard_arrow_right"></span>
                            </Link>
                            <ul className="nav-sub-menu">
                              <li className="nav-menu-item">
                                <Link href="/blogsingle_v1">
                                  Blog Details - V1
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/blogsingle_v2">
                                  Blog Details - V2
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/blogsingle_v3">
                                  Blog Details Sidebar
                                </Link>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                      <li className="menu-item menu-item-has-children">
                        <Link href="#">Pages</Link>
                        <ul className="sub-menu st1">
                          <li className="nav-sub">
                            <Link href="#">
                              Shop
                              <span className="icon-keyboard_arrow_right"></span>{" "}
                            </Link>
                            <ul className="nav-sub-menu">
                              <li className="nav-menu-item">
                                <Link href="/shop">Shop List</Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/shopsingle">Shop Single</Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/shoppingcart">
                                  Shopping Cart
                                </Link>
                              </li>
                              <li className="nav-menu-item">
                                <Link href="/checkout">Checkout</Link>
                              </li>
                            </ul>
                          </li>
                          <li className="nav-sub">
                            <Link href="/aboutus">About Us</Link>
                          </li>
                          <li className="nav-sub">
                            <Link href="/faqs">FAQS</Link>
                          </li>
                          <li className="nav-sub">
                            <Link href="/termsofuse">Terms Of Use</Link>
                          </li>
                          <li className="nav-sub">
                            <Link href="/pricing">Pricing</Link>
                          </li>
                          <li className="nav-sub">
                            <Link href="/login">Login</Link>
                          </li>
                          <li className="nav-sub">
                            <Link href="/createaccount">
                              Create Account
                            </Link>
                          </li>
                          <li className="nav-sub">
                            <Link href="/contactus">Contact Us</Link>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
              <div className="header-ct-right">
                <div className="header-customize-item help">
                  <Link href="/termofuse">
                    <span className="icon-help-circle"></span>
                  </Link>
                </div>
                <div className="header-customize-item bell">
                  <span className="icon-bell"></span>
                  <div className="sub-notification">
                    <div className="sub-notification-heading">
                      <div className="sub-notification-title">Notification</div>
                      <span>5 New</span>
                    </div>
                    <div className="sub-notification-content">
                      <div className="sub-notification-item icon-plus">
                        <div className="time">Last day</div>
                        <div className="content">
                          Your submit job{" "}
                          <span className="name">Graphic Design</span> is
                          <span className="status">Success</span>
                        </div>
                      </div>
                      <div className="sub-notification-item icon-plus">
                        <div className="time">5 Day ago</div>
                        <div className="content">
                          A new application is submitted on your job
                          <span className="name">Graphic Design</span> by
                          <span className="name">Maverick Nguyen</span>
                        </div>
                      </div>
                      <div className="sub-notification-item icon-plus">
                        <div className="time">5 Day ago</div>
                        <div className="content">
                          A new application is submitted on your job
                          <span className="name">Graphic Design</span> by
                          <span className="name">Maverick Nguyen</span>
                        </div>
                      </div>
                      <div className="sub-notification-item icon-plus">
                        <div className="time">Last day</div>
                        <div className="content">
                          Your submit job{" "}
                          <span className="name">Graphic Design</span> is
                          <span className="status">Success</span>
                        </div>
                      </div>
                      <div className="sub-notification-item icon-plus">
                        <div className="time">5 Day ago</div>
                        <div className="content">
                          A new application is submitted on your job
                          <span className="name">Graphic Design</span> by
                          <span className="name">Maverick Nguyen</span>
                        </div>
                      </div>
                    </div>
                    <div className="sub-notification-button">
                      <Link href="#">Read All</Link>
                    </div>
                  </div>
                </div>
                <div className="header-customize-item login">
                  <Link href="/login">
                    <span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                          stroke="#121212"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                          stroke="#121212"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </Link>
                  <ul className="item-login">
                    <li>
                      <Link href="/login">Login</Link>
                    </li>
                    <li>
                      <Link href="/createaccount">register</Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="nav-filter" onClick={handleMobile}>
                <div className="nav-mobile">
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header03;
