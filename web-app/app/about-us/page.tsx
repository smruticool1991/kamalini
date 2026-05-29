'use client';

import React, { useState } from 'react';
import Header4 from '@/components/header/Header4';
import Footer from '@/components/footer';
import Link from 'next/link';

export default function AboutUs() {
  const [isShowMobile, setShowMobile] = useState(false);

  const handleMobile = () => {
    setShowMobile(!isShowMobile);
  };
  return (
    <>
      <div style={{ backgroundColor: '#f8f9fa' }}>
        <Header4 handleMobile={handleMobile} />
      </div>
      <main className="main-content">
        <div className="page-header" style={{ background: '#f5f5f5', padding: '60px 0' }}>
          <div className="tf-container">
            <h1 className="page-title" style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>
              About KAJobs
            </h1>
            <p style={{ fontSize: '16px', color: '#666' }}>Connecting Talent with Opportunity</p>
          </div>
        </div>

        <div className="tf-container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', lineHeight: '1.8' }}>
            
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Our Story</h2>
              <p>
                KAJobs was founded with a simple yet powerful mission: to revolutionize the way employers and job seekers connect. We recognized that the traditional hiring process was broken, time-consuming, and inefficient. Employers struggled to find the right talent, while job seekers found it difficult to discover opportunities that matched their skills and aspirations.
              </p>
              <p style={{ marginTop: '15px' }}>
                Today, KAJobs stands as a leading job board platform, trusted by over 100,000 recruiters and millions of job seekers across India and beyond. We are committed to making hiring simple, efficient, and rewarding for everyone.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Our Mission</h2>
              <p>
                To empower organizations and individuals to achieve their career goals through innovative recruitment solutions. We believe that everyone deserves the opportunity to find work that matches their talents, and every employer deserves access to the best talent available.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Our Vision</h2>
              <p>
                To be the most trusted and innovative job board platform in Asia, transforming the future of work through technology, transparency, and human connection.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Our Values</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginTop: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Integrity</h3>
                  <p>We operate with transparency and honesty in all our dealings with candidates, employers, and partners.</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Innovation</h3>
                  <p>We continuously innovate to provide cutting-edge solutions that simplify the recruitment process.</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Inclusion</h3>
                  <p>We believe in creating diverse and inclusive opportunities for all, regardless of background.</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Excellence</h3>
                  <p>We are committed to delivering excellence in every service and interaction with our users.</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Empowerment</h3>
                  <p>We empower job seekers and employers to achieve their goals through our platform and resources.</p>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Community</h3>
                  <p>We foster a supportive community where professionals can grow, learn, and succeed together.</p>
                </div>
              </div>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Why Choose KAJobs?</h2>
              <ul style={{ marginLeft: '20px', marginTop: '15px' }}>
                <li style={{ marginBottom: '15px' }}>
                  <strong>Advanced AI Matching:</strong> Our intelligent matching algorithm connects the right candidates with the right jobs, saving time for both parties.
                </li>
                <li style={{ marginBottom: '15px' }}>
                  <strong>Wide Reach:</strong> Access to thousands of active job seekers across various industries and skill levels.
                </li>
                <li style={{ marginBottom: '15px' }}>
                  <strong>User-Friendly Platform:</strong> Our intuitive interface makes posting jobs and applying for positions seamless and efficient.
                </li>
                <li style={{ marginBottom: '15px' }}>
                  <strong>Affordable Solutions:</strong> Competitive pricing for all business sizes, from startups to large enterprises.
                </li>
                <li style={{ marginBottom: '15px' }}>
                  <strong>24/7 Customer Support:</strong> Our dedicated support team is always available to help you succeed.
                </li>
                <li style={{ marginBottom: '15px' }}>
                  <strong>Analytics & Insights:</strong> Detailed reports and insights to help optimize your recruitment strategy.
                </li>
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Our Impact</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', marginTop: '20px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#007bff', marginBottom: '10px' }}>100K+</div>
                  <p>Recruiters Using KAJobs</p>
                </div>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#007bff', marginBottom: '10px' }}>5M+</div>
                  <p>Job Seekers on Platform</p>
                </div>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#007bff', marginBottom: '10px' }}>50K+</div>
                  <p>Jobs Posted Monthly</p>
                </div>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#007bff', marginBottom: '10px' }}>98%</div>
                  <p>Customer Satisfaction</p>
                </div>
              </div>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>Get in Touch</h2>
              <p>
                Have questions? Want to learn more about how KAJobs can help your business? 
                <Link href="/contact-us" style={{ color: '#007bff', textDecoration: 'none', marginLeft: '5px' }}>
                  Contact us today
                </Link>
              </p>
            </section>

            <div style={{ 
              marginTop: '60px', 
              padding: '20px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p>
                <Link href="/" style={{ color: '#007bff', textDecoration: 'none' }}>
                  ← Back to Home
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
