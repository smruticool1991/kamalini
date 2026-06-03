'use client';
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
// Direct import — pre-bundled so no chunk-load delay on mobile after sign-in
import ProfileCompleteModal from "@/components/profileComplete/ProfileCompleteModal";


Header.propTypes = {};

/**
 * @param {{ clname?: string, handleMobile?: () => void }} props
 */
function Header({ clname = "", handleMobile }) {
  const [scroll, setScroll] = useState(0);
  const [user, setUser] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropRef = useRef(null);

  const prevUserRef = useRef(undefined); // undefined = auth not yet checked (page load)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // null      = was explicitly signed out
      // undefined = first check on page load (auth state being restored)
      const wasSignedOut = prevUserRef.current === null;
      prevUserRef.current = u ?? null;
      setUser(u);

      if (u) {
        const dismissed = sessionStorage.getItem("profileModalDismissed");
        if (dismissed) return;

        // ✅ Fast local cache — avoids flash for returning users who finished profile
        const cachedComplete = localStorage.getItem(`pc_${u.uid}`) === '1';
        if (cachedComplete) return;

        if (wasSignedOut) {
          // Genuine new sign-in — show modal instantly, no Firestore wait
          setShowProfileModal(true);
        }

        // Firestore verification runs in background
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          const profileComplete = snap.exists() && snap.data()?.profileComplete === true;
          if (profileComplete) {
            // Cache so future sign-ins skip the modal with zero flash
            localStorage.setItem(`pc_${u.uid}`, '1');
            setShowProfileModal(false);
          } else if (!wasSignedOut) {
            // Page reload + profile incomplete — show modal now
            setShowProfileModal(true);
          }
          // wasSignedOut + incomplete: modal already open, do nothing
        } catch (e) {
          console.error("Error checking profile:", e);
          setShowProfileModal(true);
        }
      } else {
        prevUserRef.current = null;
        setShowProfileModal(false);
        // Clear session dismissal on sign-out (localStorage cache is kept — profile completion is permanent)
        sessionStorage.removeItem("profileModalDismissed");
      }
    });
    return () => unsub();
  }, []);



  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => { await signOut(auth); setDropOpen(false); };
  const handleGoogleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch(e) { console.error(e); } };
  const getInitial = (name) => (name || "U")[0].toUpperCase();

  useEffect(() => {
    document.addEventListener("scroll", () => {
      const scrollCheck = window.scrollY > 100;
      if (scrollCheck !== scroll) {
        setScroll(scrollCheck);
      }
    });
  }, []);

  return (
    <>
      {/* Profile Completion Modal — shown after login when profile is incomplete */}
      {showProfileModal && user && (
        <ProfileCompleteModal
          userEmail={user.email || ""}
          userName={user.displayName || ""}
          onComplete={() => {
            // Cache completion permanently so future sign-ins never flash the modal
            if (user) localStorage.setItem(`pc_${user.uid}`, '1');
            setShowProfileModal(false);
          }}
          onDismiss={() => {
            // Remember dismissal for this browser session only
            sessionStorage.setItem("profileModalDismissed", "1");
            setShowProfileModal(false);
          }}
        />
      )}

      <header
        id="header"
        className={`header header-default style-absolute header-fixed ${
          scroll ? "is-fixed is-small" : ""
        }`}
      >
        <div className="tf-container ct2">
          <div className="row">
            <div className="col-md-12">
              <div className="sticky-area-wrap">
                <div className="header-ct-left">
                  <div id="logo" className="logo">
                    <Link href="/">
                      <img
                        className="site-logo"
                        id="trans-logo"
                        src="/logo.png"
                        alt="Image"
                      />
                      <img
                        className="logo-none"
                        id="trans-logo"
                        src="/logo.png"
                        alt="Image"
                      />
                    </Link>
                  </div>
                </div>
                <div className="header-ct-center">
                  <div className="nav-wrap">
                    <nav id="main-nav" className="main-nav">
                      <ul id="menu-primary-menu" className="menu">
                        <li
                          // className={`menu-item menu-item-has-children ${clname}`}
                        >
                          <Link href="/">Home</Link>
                        </li>
                        <li className="menu-item">
                          <Link href="/find-jobs">Find jobs</Link>
                        </li>
                        <li className="menu-item">
                          <Link href="/employers">Employers</Link>
                        </li>
                        <li className="menu-item sub4"><Link href="/training">Training</Link></li>
                        <li className="menu-item sub5"><Link href="/education">Education</Link></li>
                        <li className="menu-item sub5"><Link href="/blog">Blog</Link></li>
                      </ul>
                    </nav>
                  </div>
                </div>
                <div className="header-ct-right">
                  {/* Profile avatar & dropdown — shown only when logged in */}
                  {user && (
                    <div className="header-customize-item account" ref={dropRef} style={{ position: "relative", cursor: "pointer" }}>
                      <div onClick={() => setDropOpen(!dropOpen)} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid #14a077" }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#14a077,#0f7a5a)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>
                            {getInitial(user.displayName)}
                          </div>
                        )}
                        <div className="name" style={{ maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {user.displayName?.split(" ")[0] || "Profile"}
                        </div>
                      </div>
                      {dropOpen && (
                        <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, background: "#fff", borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.15)", minWidth: 220, zIndex: 9999, border: "1px solid #f0f0f0", overflow: "hidden" }}>
                          <div style={{ padding: "16px 18px", borderBottom: "1px solid #f5f5f5", background: "linear-gradient(135deg,#f0faf6,#e8f4ff)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: 42, height: 42, borderRadius: "50%", border: "2px solid #14a077" }} /> : <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#14a077", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>{getInitial(user.displayName)}</div>}
                              <div><div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{user.displayName}</div><div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{user.email}</div></div>
                            </div>
                          </div>
                          {[{ href: "/profile", icon: "icon-user", label: "My Profile" }, { href: "/profile#applications", icon: "icon-briefcase", label: "My Applications" }, { href: "/find-jobs", icon: "icon-search", label: "Browse Jobs" }].map(item => (
                            <Link key={item.href} href={item.href} onClick={() => setDropOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", color: "#333", textDecoration: "none", fontSize: 14 }} onMouseEnter={e => e.currentTarget.style.background="#f8f9fa"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                              <i className={item.icon} style={{ color: "#14a077", width: 18 }} />{item.label}
                            </Link>
                          ))}
                          <div style={{ borderTop: "1px solid #f0f0f0", margin: "4px 0" }} />
                          <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", width: "100%", background: "none", border: "none", cursor: "pointer", color: "#e74c3c", fontSize: 14 }} onMouseEnter={e => e.currentTarget.style.background="#fff5f5"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <i className="icon-log-out" style={{ width: 18 }} />Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Candidate Registration — only shown when NOT logged in */}
                  {!user && (
                    <div className="header-customize-item button candidate-reg-btn">
                      <button onClick={handleGoogleLogin}>
                        Candidate Registration
                      </button>
                    </div>
                  )}
                  <div className="header-customize-item button">
                    <Link href="/find-jobs">Find Jobs</Link>
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
    </>
  );
}

export default Header;
