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
                            <li><Link href="https://www.facebook.com/hr.kamalini" target="_blank" rel="noopener noreferrer"><i className="icon-facebook"></i></Link></li>
                            <li><Link href="https://in.linkedin.com/company/kamalini-associates" target="_blank" rel="noopener noreferrer"><i className="icon-linkedin2"></i></Link></li>
                            <li><Link href="https://x.com/XKAJOBS" target="_blank" rel="noopener noreferrer"><i className="icon-twitter"></i></Link></li>
                            <li><Link href="https://www.instagram.com/hrkamalini/" target="_blank" rel="noopener noreferrer"><i className="icon-instagram1"></i></Link></li>
                            <li><Link href="https://www.youtube.com/@kamaliniassociates?si=WJei-90SPECg6Y8U" target="_blank" rel="noopener noreferrer"><i className="icon-youtube"></i></Link></li>
                            <li><Link href="https://wa.me/message/6XMKT3X6OCO4N1" target="_blank" rel="noopener noreferrer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{display:'block'}}>
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                            </Link></li>
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
                            <h6><Link href="tel:916370662699">+91 6370662699</Link></h6>
                            </div>
                        </div>
                        <p>Job Searching Just Got Easy. Use KAJobs to run a hiring site and earn money in the process!</p>
                        <div className="ft-icon"> <i className="icon-map-pin"></i>Sector A Zone A Nearby CIPET campus 2 Mancheswar Industrial Estate, BBSR</div>
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
                            <li> <Link href="/employers">Employers</Link> </li>
                        </ul>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4 col-6">
                        <div className="footer-cl-4">
                        <h6 className="ft-title">
                            For Employers
                        </h6>
                        <ul className="navigation-menu-footer">
                            <li> <Link href="https://employer.kajobs.in/dashboard/jobs">Post New Job</Link> </li>
                            <li> <Link href="https://employer.kajobs.in/register">Company Registration</Link> </li>
                            <li> <Link href="https://employer.kajobs.in/login">Login</Link> </li>
                            <li> <Link href="https://employer.kajobs.in/dashboard/profile">Profile</Link> </li>
                        </ul>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4 col-6">
                        <div className="footer-cl-5">
                        <h6 className="ft-title">
                            Download App
                        </h6>
                        <ul className="ft-download">
                            <li> <Link href="https://play.google.com/store/apps/details?id=com.kamaliniapp.india"><img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play Store" /></Link></li>
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