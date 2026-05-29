import React from "react";
import Header2 from "../components/header/Header2";
import Footer from "../components/footer";
import Blog01 from "../components/blog/Blog01";
import dataBlog from "../assets/fakeData/dataBlog";
import { Link } from "react-router-dom";
import Gotop from "../components/gotop";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Collapse } from "react-collapse";
import logo from "../assets/images/logo.png";
import { useState } from "react";

Blogsingle_v1.propTypes = {};

function Blogsingle_v1(props) {
  const [toggle, setToggle] = useState({
    key: "",
    status: false,
  });
  const [isShowMobile, setShowMobile] = useState(false);

  const handleToggle = (key) => {
    if (toggle.key === key) {
      setToggle({
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
      ? getMobile.classList.add("modal-menu--open")
      : getMobile.classList.remove("modal-menu--open");
  };
  return (
    <>
      <div className="menu-mobile-popup">
        <div className="modal-menu__backdrop" onClick={handleMobile}></div>
        <div className="widget-filter">
          <div className="mobile-header">
            <div id="logo" className="logo">
              <Link to="/">
                <img className="site-logo" src={logo} alt="Image" />
              </Link>
            </div>
            <Link className="title-button-group" onClick={handleMobile}>
              <i className="icon-close"></i>
            </Link>
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
                      <li className="menu-item menu-item-has-children-mobile">
                        <Link
                          to="#"
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
                            <li className="menu-item menu-item-mobile">
                              <Link to="/">Home Page 01 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/home_v2">Home Page 02 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/home_v3">Home Page 03 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/home_v4">Home Page 04 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/home_v5">Home Page 05 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/home_v6">Home Page 06 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/home_v7">Home Page 07 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/home_v8">Home Page 08 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/home_v9">Home Page 09 </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/home_v10">Home Page 10 </Link>
                            </li>
                          </ul>
                        </Collapse>
                      </li>

                      <li className="menu-item menu-item-has-children-mobile">
                        <Link
                          to="#"
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
                              <Link to="/joblist_v1">List Layout</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/job-grid">Grid Layout</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/job-list-sidebar">List Sidebar</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/job-grid-sidebar">Grid Sidebar</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/joblist_v5">
                                List Sidebar Fullwidth
                              </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/joblist_v6">
                                Grid Sidebar Fullwidth
                              </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/joblist_v7">Top Map</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/joblist_v8">Top Map Sidebar</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/joblist_v9">Half Map - V1</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/joblist_v10">Half Map - V2</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/jobsingle_v1">Jobs Single - V1</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/jobsingle_v2">Jobs Single - V2</Link>
                            </li>
                          </ul>
                        </Collapse>
                      </li>

                      <li className="menu-item menu-item-has-children-mobile">
                        <Link
                          to="#"
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
                              <Link to="/employers_v1">List Layout</Link>
                            </li>
                            <li className="menu-item">
                              <Link to="/employers_v2">Grid Layout</Link>
                            </li>
                            <li className="menu-item">
                              <Link to="/employers_v3">List Sidebar</Link>
                            </li>
                            <li className="menu-item">
                              <Link to="/employers_v4">Grid Sidebar</Link>
                            </li>
                            <li className="menu-item">
                              <Link to="/employers_v5">Full Width</Link>
                            </li>
                            <li className="menu-item">
                              <Link to="/employers_v6">Top Map</Link>
                            </li>
                            <li className="menu-item">
                              <Link to="/employers_v7">Half Map</Link>
                            </li>
                            <li className="menu-item">
                              <Link to="/employersingle_v1">
                                Employers Single - V1
                              </Link>
                            </li>
                            <li className="menu-item">
                              <Link to="/employersingle_v2">
                                Employers Single - V2
                              </Link>
                            </li>

                            <li className="menu-item">
                              <Link to="/employerreview">
                                Employers Reviews
                              </Link>
                            </li>
                            <li className="menu-item">
                              <Link to="/employernotfound">
                                Employers Not Found
                              </Link>
                            </li>
                          </ul>
                        </Collapse>
                      </li>
                      <li className="menu-item menu-item-has-children-mobile">
                        <Link
                          to="#"
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
                              <Link to="/candidates_v1">List Layout</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/candidates_v2">Grid Layout</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/candidates_v3">List Sidebar</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/candidates_v4">Top Map</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/candidates_v5">Half Map</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/candidates_v6">No Available V1</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/candidates_v7">No Available V2</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/candidatesingle_v1">
                                Candidate Single - V1
                              </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/candidatesingle_v2">
                                Candidate Single - V2
                              </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/samplecv">Sample CV</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/samplecvslidebar">
                                Sample CV Sidebar
                              </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/samplecvdetails">CV Details</Link>
                            </li>
                          </ul>
                        </Collapse>
                      </li>
                      <li className="menu-item menu-item-has-children-mobile current-item">
                        <Link
                          to="#"
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
                              <Link to="/blog_v1">Blog List </Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/blog_v2">Blog Grid</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/blog_v3">Blog Masonry</Link>
                            </li>
                            <li className="menu-item menu-item-mobile current-item">
                              <Link to="/blogsingle_v1">Blog Details - V1</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/blogsingle_v2">Blog Details - V2</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/blogsingle_v3">
                                Blog Details Sidebar
                              </Link>
                            </li>
                          </ul>
                        </Collapse>
                      </li>
                      <li className="menu-item menu-item-has-children-mobile">
                        <Link
                          to="#"
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
                              <Link to="/aboutus">About Us</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/faqs">FAQS</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/termsofuse">Terms Of Use</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/pricing">Pricing</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/shop">Shop List</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/shoppingcart">Shopping Cart</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/shopsingle">Shop Single</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/checkout">Checkout</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/login">Login</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/createaccount">Create Account</Link>
                            </li>
                            <li className="menu-item menu-item-mobile">
                              <Link to="/contactus">Contact Us</Link>
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
                      <Link to="/jobsingle_v1">
                        <span className="icon-categorie-1"></span>Design &
                        Creative
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link to="/jobsingle_v1">
                        <span className="icon-categorie-8"></span>Digital
                        Marketing
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link to="/jobsingle_v1">
                        <span className="icon-categorie-2"></span>Development &
                        IT
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link to="/jobsingle_v1">
                        <span className="icon-categorie-3"></span>Music & Audio
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link to="/jobsingle_v1">
                        <span className="icon-categorie-4"></span>Finance &
                        Accounting
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link to="/jobsingle_v1">
                        <span className="icon-categorie-5"></span>Programming &
                        Tech
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link to="/jobsingle_v1">
                        <span className="icon-categorie-6"></span>Video &
                        Animation
                      </Link>
                    </li>
                    <li className="categories-mobile">
                      <Link to="/jobsingle_v1">
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
            <Link to="/">Upload Resume</Link>
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
                  <Link to="tel:0123456678">001-1234-88888</Link>
                </h6>
              </div>
            </div>
            <div className="wd-social d-flex aln-center">
              <ul className="list-social d-flex aln-center">
                <li>
                  <Link to="#">
                    <i className="icon-facebook"></i>
                  </Link>
                </li>
                <li>
                  <Link to="#">
                    <i className="icon-linkedin2"></i>
                  </Link>
                </li>
                <li>
                  <Link to="#">
                    <i className="icon-twitter"></i>
                  </Link>
                </li>
                <li>
                  <Link to="#">
                    <i className="icon-pinterest"></i>
                  </Link>
                </li>
                <li>
                  <Link to="#">
                    <i className="icon-instagram1"></i>
                  </Link>
                </li>
                <li>
                  <Link to="#">
                    <i className="icon-youtube"></i>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Header2 clname="actBlog4" handleMobile={handleMobile} />
      <section className="blog-detail-section">
        <div className="tf-container">
          <div className="wrap-blog-detail blog-detail blog-detail-side-bar-content">
            <div className="widget-blog-1">
              <div className="content">
                <span className="sub-title">Makerting</span>
                <h3 className="main-heading">
                  5 Rules to keep in mind when negotiating a job
                </h3>
                <ul className="meta">
                  <li className="author">
                    <span>by</span>Avitex
                  </li>
                  <li className="time">
                    <span className="icon-calendar"></span> 2 days ago
                  </li>
                </ul>
              </div>
              <div className="image">
                <img
                  src={require("../assets/images/blog/blog-detail-01.jpg")}
                  alt=""
                />
              </div>
            </div>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
              interdum sed mauris eu imperdiet. Donec congue orci nec mi luctus,
              ut faucibus mauris scelerisque. Donec orci lorem, volutpat a
              mauris nec, sodales imperdiet urna. Sed dictum enim libero.
              Interdum et malesuada fames ac ante ipsum primis in faucibus.
              Maecenas ligula libero, pharetra non dolor et, tempor bibendum
              magna. Mauris a efficitur nisi.
            </p>
            <p>
              Praesent interdum lacus ac est viverra hendrerit. Aliquam dapibus,
              ante vitae mattis gravida, purus sapien interdum magna, convallis
              volutpat est turpis pulvinar dui. Aenean eu turpis est. In hac
              habitasse platea dictumst. Integer at lobortis metus. Proin
              molestie eget massa vel gravida. Suspendisse nec ante vel augue
              consectetur mollis.
            </p>
            <div className="image-single">
              <img
                src={require("../assets/images/blog/blog-detail-02.jpg")}
                alt=""
              />
              <img
                src={require("../assets/images/blog/blog-detail-03.jpg")}
                alt=""
              />
            </div>
            <h5>How to deal with employee quitting</h5>
            <p>
              Donec eu dui condimentum, laoreet nulla vitae, venenatis ipsum.
              Donec luctus sem sit amet varius laoreet. Aliquam fermentum sit
              amet urna fringilla tincidunt. Vestibulum ullamcorper nec lacus ac
              molestie. Curabitur congue neque sed nisi auctor consequat.
              Pellentesque rhoncus tortor vitae ipsum sagittis tempor.
            </p>
            <p>
              Vestibulum et pharetra arcu. In porta lobortis turpis. Ut faucibus
              fermentum posuere. Suspendisse potenti. Mauris a metus sed est
              semper vestibulum. Mauris tortor sem, consectetur vehicula
              vulputate id, suscipit vel leo.
            </p>
            <ul className="blog-text">
              <li>
                15+ years of industry experience designing, building, and
                supporting large-scale distributed systems in production, with
                recent experience in building large scale cloud services.
              </li>
              <li>
                Deep knowledge and experience with different security areas like
                identity and access management, cryptography, network security,
                etc.
              </li>
              <li>
                Experience with database systems and database internals, such as
                query engines and optimizers are a big plus.{" "}
              </li>
              <li>Strong fundamentals in computer science skills.</li>
              <li>Expert-level development skills in Java or C++.</li>
              <li>
                Knowledge of industry standard security concepts and protocols
                like SAML, SCIM, OAuth, RBAC, cryptography is a plus.
              </li>
              <li>Advanced degree in Computer Science or related degree.</li>
              <li>Ph.D. in the related field is a plus</li>
            </ul>
            <p>
              Curabitur aliquam ac arcu in mattis. Phasellus pulvinar erat at
              aliquam hendrerit. Nam ut velit dolor. Sed fermentum tempus odio,
              ac faucibus elit scelerisque consequat. Fusce ac malesuada elit.
              Nam at aliquam libero, quis lacinia erat. In hac habitasse platea
              dictumst. Suspendisse id dolor orci. Vivamus at aliquam tellus.
              Vestibulum a augue ac purus suscipit varius non eget lectus. Nam
              lobortis mauris luctus tristique feugiat. Nulla eleifend risus sit
              amet nisi feugiat, id eleifend sapien malesuada. Phasellus
              venenatis convallis mattis. Duis vel tempor eros. Mauris semper
              sollicitudin neque, imperdiet ultrices urna maximus id.
            </p>
            <div className="tag-social">
              <div className="widget-popular-tags">
                <span className="main-title">Tag:</span>
                <ul className="widget-popular-tags-wrap">
                  <li className="widget-popular-tags-item">
                    <Link to="#">Featured</Link>
                  </li>
                  <li className="widget-popular-tags-item">
                    <Link to="#">Interview</Link>
                  </li>
                  <li className="widget-popular-tags-item">
                    <Link to="#">Career</Link>
                  </li>
                </ul>
              </div>
              <div className="wd-social d-flex aln-center">
                <span>Share this post:</span>
                <ul className="list-social d-flex aln-center">
                  <li>
                    <Link to="#">
                      <i className="icon-facebook"></i>
                    </Link>
                  </li>
                  <li>
                    <Link to="#">
                      <i className="icon-linkedin2"></i>
                    </Link>
                  </li>
                  <li>
                    <Link to="#">
                      <i className="icon-twitter"></i>
                    </Link>
                  </li>
                  <li>
                    <Link to="#">
                      <i className="icon-pinterest"></i>
                    </Link>
                  </li>
                  <li>
                    <Link to="#">
                      <i className="icon-instagram1"></i>
                    </Link>
                  </li>
                  <li>
                    <Link to="#">
                      <i className="icon-youtube"></i>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="nav-links stc">
              <div className="post-navigation previous-post">
                <div className="title-post">
                  <Link to="#" rel="prev">
                    Previous
                  </Link>
                </div>
                <p>How to choose the right customer </p>
              </div>
              <div className="post-navigation next-post">
                <div className="title-post text-end">
                  <Link to="#" rel="prev">
                    Next
                  </Link>
                </div>
                <p>Starting your traveling blog with Vasco</p>
              </div>
            </div>
            <div className="comment-list-wrap">
              <h3 className="comment-title">03 Comments</h3>
              <div className="comment-list">
                <article className="widget-comment-wrap">
                  <div className="feature-post">
                    <img
                      src={require("../assets/images/user/avatar/image-02.jpg")}
                      alt=""
                    />
                  </div>
                  <div className="content-post">
                    <div className="post-author">
                      <Link to="#">Guy Hawkins</Link>
                      <span className="icon-check"></span>
                    </div>
                    <div className="post-date">August 13, 2023</div>
                    <p>
                      Lorem ipsum dolor sit amet consectetur. Cursus nunc
                      pharetra arcu quam turpis risus amet turpis. Facilisis
                      elementum tincidunt pellentesque sed rutrum enim.
                    </p>
                    <div className="button">
                      <Link to="#">Reply</Link>
                    </div>
                  </div>
                  <div className="helpfull">
                    <Link to="#">
                      Was this helpful?<span className="icon-like1"></span>
                    </Link>
                  </div>
                </article>
                <div className="children">
                  <article className="widget-comment-wrap">
                    <div className="feature-post">
                      <img
                        src={require("../assets/images/user/avatar/image-03.jpg")}
                        alt=""
                      />
                    </div>
                    <div className="content-post">
                      <div className="post-author">
                        <Link to="#">Eleanor Pena</Link>
                        <span className="icon-check"></span>
                      </div>
                      <div className="post-date">August 13, 2023</div>
                      <p>Great choice of Acronym AF1’s 👌🏼</p>
                      <div className="button">
                        <Link to="#">Reply</Link>
                      </div>
                    </div>
                    <div className="helpfull">
                      <Link to="#">
                        Was this helpful?<span className="icon-like1"></span>
                      </Link>
                    </div>
                  </article>
                </div>
                <article className="widget-comment-wrap">
                  <div className="feature-post">
                    <img
                      src={require("../assets/images/user/avatar/image-04.jpg")}
                      alt=""
                    />
                  </div>
                  <div className="content-post">
                    <div className="post-author">
                      <Link to="#">Jerome Bell</Link>
                      <span className="icon-check"></span>
                    </div>
                    <div className="post-date">August 13, 2023</div>
                    <p>
                      Lorem ipsum dolor sit amet consectetur. Cursus nunc
                      pharetra arcu quam turpis risus amet turpis. Facilisis
                      elementum tincidunt pellentesque sed rutrum enim.
                    </p>
                    <div className="button">
                      <Link to="#">Reply</Link>
                    </div>
                  </div>
                  <div className="helpfull">
                    <Link to="#">
                      Was this helpful?<span className="icon-like1"></span>
                    </Link>
                  </div>
                </article>
              </div>
            </div>
            <form className="wd-form-rating">
              <div className="row">
                <div className="col-lg-12">
                  <div className="form-rating-heading">
                    <h3>Leave A Comment</h3>
                  </div>
                </div>
                <div className="col-lg-12">
                  <div className="form-rating-content">
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="wrap-input">
                          <label>Name</label>
                          <input type="text" placeholder="Your name" />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="wrap-input">
                          <label>Email</label>
                          <input type="text" placeholder="jobtex@mail.com" />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="wrap-checkbox">
                          <input type="checkbox" />
                          <label>
                            Save my name, email, and website in this browser for
                            the next time I comment.
                          </label>
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="wrap-notes">
                          <label>Comment</label>
                          <textarea
                            cols="30"
                            rows="10"
                            placeholder="Write comment"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-12">
                  <button className="tf-btn-submit style-2">
                    submit review
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
      <Blog01 data={dataBlog} className="inner-news-section" />
      <Footer />
      <Gotop />
    </>
  );
}

export default Blogsingle_v1;
