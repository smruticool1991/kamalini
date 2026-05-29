import React from 'react';
import PropTypes from 'prop-types';
import Link from 'next/link';


Footer.propTypes = {
    
};

function Footer(props) {
    return (
        <footer className="footer">
                <div className="top-footer">
                <div className="tf-container">
                    <div className="row">
                    <div className="col-lg-2 col-md-4">
                        <div className="footer-logo">
                        <img src="/logo.png" alt="images" />
                        </div>
                    </div>
                    <div className="col-lg-10 col-md-8">
                        <div className="wd-social d-flex aln-center">
                        <span>Follow Us:</span>
                        <ul className="list-social d-flex aln-center">
                            <li><Link href="#"><i className="icon-facebook"></i></Link></li>
                            <li><Link href="#"><i className="icon-linkedin2"></i></Link></li>
                            <li><Link href="#"><i className="icon-twitter"></i></Link></li>
                            <li><Link href="#"><i className="icon-pinterest"></i></Link></li>
                            <li><Link href="#"><i className="icon-instagram1"></i></Link></li>
                            <li><Link href="#"><i className="icon-youtube"></i></Link></li>
                        </ul>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
                <div className="inner-footer">
                <div className="tf-container">
                    <div className="row">
                    <div className="col-lg-4 col-md-6">
                        <div className="footer-cl-1">
                        <div className="icon-infor d-flex aln-center">
                            <div className="icon">
                            <span className="icon-call-calling"><span className="path1"></span><span className="path2"></span><span
                                className="path3"></span><span className="path4"></span></span>
                            </div>
                            <div className="content">
                            <p>Need help? 24/7</p>
                            <h6><Link href="tel:0123456678">001-1234-88888</Link></h6>
                            </div>
                        </div>
                        <p>Job Searching Just Got Easy. Use KAJobs to run a hiring site and earn money in the process!</p>
                        <div className="ft-icon"> <i className="icon-map-pin"></i> 101 E 129th St, Navi Mumbai, IN 46312</div>
                        <form action="#" id="subscribe-form">
                            <input type="email" placeholder="Your email address" required="" id="subscribe-email" />
                            <button className="tf-button" type="submit" id="subscribe-button"><i
                                className="icon-paper-plane-o"></i></button>
                        </form>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-6 col-6">
                        <div className="footer-cl-2">
                        <h6 className="ft-title">
                            Quick Links
                        </h6>
                        <ul className="navigation-menu-footer">
                            <li> <Link href="/training">Training</Link> </li>
                            <li> <Link href="/education">Education</Link> </li>
                            <li> <Link href="/blog">Blog</Link> </li>
                            <li> <Link href="/about-us">About Us</Link> </li>
                            <li> <Link href="/contact-us">Contact Us</Link> </li>
                        </ul>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4 col-6">
                        <div className="footer-cl-3">
                        <h6 className="ft-title">
                            For Candidates
                        </h6>
                        <ul className="navigation-menu-footer">
                            <li> <Link href="/profile">Profile</Link> </li>
                            <li> <Link href="/profile">My Application</Link> </li>
                            <li> <Link href="/find-jobs">Find Jobs</Link> </li>
                            <li> <Link href="/employeers">Employeers</Link> </li>
                        </ul>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4 col-6">
                        <div className="footer-cl-4">
                        <h6 className="ft-title">
                            For Employers
                        </h6>
                        <ul className="navigation-menu-footer">
                            <li> <Link href="/post-new-job">Post New Job</Link> </li>
                            <li> <Link href="employers-list.html">Employer Listing</Link> </li>
                            <li> <Link href="employers-grid-sidebar.html">Employers Grid</Link> </li>
                            <li> <Link href="find-jobs-list.html">Job Packages</Link> </li>
                        </ul>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4 col-6">
                        <div className="footer-cl-5">
                        <h6 className="ft-title">
                            Download App
                        </h6>
                        <ul className="ft-download">
                            <li> <Link href="#"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play Store" /></Link></li>
                        </ul>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
                <div className="bottom">
                <div className="tf-container">
                    <div className="row">
                    <div className="col-lg-6 col-md-6">
                        <div className="bt-left">
                        <div className="copyright">©2026 KAJobs. All Rights Reserved.</div>
                        <div className="select-language">
                            <div className="dropdown" id="language">
                            <a className="btn-selector nolink input-form"><span><img src={require ('../../assets/images/review/flag.png')} alt="" /></span>
                                English</a>
                            </div>
                        </div>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-6">
                        <ul className="menu-bottom d-flex aln-center">
                            <li><Link href="/terms-of-service">Terms Of Services</Link> </li>
                            <li><Link href="/privacy-policy">Privacy Policy</Link> </li>
                            <li><Link href="/cookie-policy">Cookie Policy</Link> </li>
                        </ul>
                    </div>
                    </div>
                </div>
                </div>
            </footer>
    );
}

export default Footer;