'use client';

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

/**
 * @param {{ clname?: string }} props
 */
function Header4({ clname = "" }) {
  const [user, setUser] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [scroll, setScroll] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dropRef = useRef(null);

  const handleMobile = () => {
    setIsMobileOpen((prev) => {
      const next = !prev;
      const menu = document.querySelector(".menu-mobile-popup");
      next ? menu?.classList.add("modal-menu--open") : menu?.classList.remove("modal-menu--open");
      return next;
    });
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setDropOpen(false);
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  const getInitial = (name) => (name || "U")[0].toUpperCase();

  return (
    <>
      {/* ── Mobile slide-out menu ── */}
      <div className="menu-mobile-popup">
        <div className="modal-menu__backdrop" onClick={handleMobile} />
        <div className="widget-filter">
          <div className="mobile-header">
            <div id="logo" className="logo">
              <Link href="/"><img className="site-logo" src="/logo.png" alt="KA Jobs" style={{ height: '40px', width: 'auto' }} /></Link>
            </div>
            <span className="title-button-group" onClick={handleMobile} role="button" tabIndex={0} style={{ cursor: 'pointer' }}>
              <i className="icon-close" />
            </span>
          </div>
          <div className="nav-wrap" style={{ padding: '16px 0' }}>
            <nav className="main-nav mobile">
              <ul className="menu" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {[
                  { href: '/', label: 'Home' },
                  { href: '/find-jobs', label: 'Find Jobs' },
                  { href: '/employers', label: 'Employers' },
                  { href: '/training', label: 'Training' },
                  { href: '/education', label: 'Education' },
                  { href: '/tests', label: 'Tests' },
                  { href: '/blog', label: 'Blog' },
                ].map(({ href, label }, i, arr) => (
                  <li key={href} className="menu-item" style={{ borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    <Link href={href} onClick={handleMobile}
                      style={{ display: 'block', padding: '14px 20px', fontWeight: 600, color: '#1a1a2e', textDecoration: 'none', fontSize: 15 }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <Link href="/find-jobs" onClick={handleMobile}
              style={{ display: 'block', textAlign: 'center', padding: '14px', background: 'linear-gradient(135deg, #14a077, #0f7a5a)', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 14px rgba(20,160,119,0.35)' }}>
              Find Jobs
            </Link>
          </div>
          <div className="mobile-footer" style={{ marginTop: 8 }}>
            <ul className="list-social d-flex aln-center" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li><Link href="#"><i className="icon-facebook" /></Link></li>
              <li><Link href="#"><i className="icon-linkedin2" /></Link></li>
              <li><Link href="#"><i className="icon-twitter" /></Link></li>
              <li><Link href="#"><i className="icon-instagram1" /></Link></li>
            </ul>
          </div>
        </div>
      </div>

      <header id="header" className="header header-default">
      <div className="tf-container ct2">
        <div className="row">
          <div className="col-md-12">
            <div className="sticky-area-wrap">
              {/* Logo */}
              <div className="header-ct-left">
                <div id="logo" className="logo">
                  <Link href="/">
                    <img className="site-logo" id="trans-logo" src="/logo.png" alt="Logo" />
                  </Link>
                </div>
              </div>

              {/* Nav */}
              <div className="header-ct-center">
                <div className="nav-wrap">
                  <nav id="main-nav" className="main-nav">
                    <ul id="menu-primary-menu" className={`menu ${clname}`}>
                      <li className="menu-item sub1"><Link href="/">Home</Link></li>
                      <li className="menu-item sub2"><Link href="/find-jobs">Find Jobs</Link></li>
                      <li className="menu-item sub3"><Link href="/employers">Employers</Link></li>
                      <li className="menu-item sub4"><Link href="/training">Training</Link></li>
                      <li className="menu-item sub5"><Link href="/education">Education</Link></li>
                      <li className="menu-item sub5"><Link href="/blog">Blog</Link></li>
                      <li className="menu-item sub6"><Link href="/tests">Tests</Link></li>
                    </ul>
                  </nav>
                </div>
              </div>

              {/* Right actions */}
              <div className="header-ct-right">
                {/* Bell */}
                {/* <div className="header-customize-item bell">
                  <span className="icon-bell"></span>
                  <div className="sub-notification">
                    <div className="sub-notification-heading">
                      <div className="sub-notification-title">Notifications</div>
                    </div>
                    <div className="sub-notification-content">
                      <div className="sub-notification-item icon-plus">
                        <div className="time">Just now</div>
                        <div className="content">Welcome to Job Board! <span className="name">Browse jobs</span> to get started.</div>
                      </div>
                    </div>
                    <div className="sub-notification-button"><Link href="#">Read All</Link></div>
                  </div>
                </div> */}

                {/* Profile / Login */}
                {user ? (
                  <div className="header-customize-item account" ref={dropRef} style={{ position: "relative", cursor: "pointer" }}>
                    <div
                      onClick={() => setDropOpen(!dropOpen)}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #14a077" }}
                        />
                      ) : (
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "linear-gradient(135deg,#14a077,#0f7a5a)",
                          color: "#fff", display: "flex", alignItems: "center",
                          justifyContent: "center", fontWeight: 700, fontSize: 15,
                        }}>
                          {getInitial(user.displayName)}
                        </div>
                      )}
                      <div className="name" style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.displayName?.split(" ")[0] || "Profile"}
                      </div>
                      <i className={`icon-chevron-down`} style={{ fontSize: 12, transition: "transform 0.2s", transform: dropOpen ? "rotate(180deg)" : "none" }} />
                    </div>

                    {/* Dropdown */}
                    {dropOpen && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 12px)", right: 0,
                        background: "#fff", borderRadius: 14,
                        boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                        minWidth: 220, zIndex: 9999,
                        border: "1px solid #f0f0f0",
                        overflow: "hidden",
                      }}>
                        {/* User info */}
                        <div style={{ padding: "16px 18px", borderBottom: "1px solid #f5f5f5", background: "linear-gradient(135deg,#f0faf6,#e8f4ff)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="" style={{ width: 42, height: 42, borderRadius: "50%", border: "2px solid #14a077" }} />
                            ) : (
                              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#14a077", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>
                                {getInitial(user.displayName)}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{user.displayName}</div>
                              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{user.email}</div>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        {[
                          { href: "/profile", icon: "icon-user", label: "My Profile" },
                          { href: "/profile#applications", icon: "icon-briefcase", label: "My Applications" },
                          { href: "/find-jobs", icon: "icon-search", label: "Browse Jobs" },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setDropOpen(false)}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "12px 18px", color: "#333", textDecoration: "none",
                              fontSize: 14, transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            <i className={item.icon} style={{ color: "#14a077", width: 18 }} />
                            {item.label}
                          </Link>
                        ))}

                        <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0" }} />
                        <button
                          onClick={handleSignOut}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "12px 18px", width: "100%", background: "none",
                            border: "none", cursor: "pointer", color: "#e74c3c", fontSize: 14,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#fff5f5"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <i className="icon-log-out" style={{ width: 18 }} />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="header-customize-item account" style={{ cursor: "pointer" }} onClick={handleGoogleLogin}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "#f0f0f0", display: "flex", alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <i className="icon-user" style={{ color: "#888", fontSize: 18 }} />
                    </div>
                    <div className="name">Sign In</div>
                  </div>
                )}

                <div className="header-customize-item button">
                  <Link href="/find-jobs">Find Jobs</Link>
                </div>
              </div>

              {/* Mobile toggle */}
              <div className="nav-filter" onClick={handleMobile}>
                <div className="nav-mobile"><span></span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}

export default Header4;
