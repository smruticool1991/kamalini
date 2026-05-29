'use client';

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <main className="main-content">
        <div className="page-header" style={{ background: '#f5f5f5', padding: '60px 0' }}>
          <div className="tf-container">
            <h1 className="page-title" style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>
              Privacy Policy
            </h1>
            <p style={{ fontSize: '16px', color: '#666' }}>Last updated: May 29, 2026</p>
          </div>
        </div>

        <div className="tf-container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', lineHeight: '1.8' }}>
            
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>1. Introduction</h2>
              <p>
                KAJobs ("we", "us", "our", or "Company") operates the KAJobs website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>2. Information Collection and Use</h2>
              <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>Types of Data Collected:</h3>
              <ul style={{ marginLeft: '20px', marginTop: '15px' }}>
                <li style={{ marginBottom: '10px' }}>
                  <strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include, but is not limited to:
                  <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                    <li>Email address</li>
                    <li>First name and last name</li>
                    <li>Phone number</li>
                    <li>Address, State, Province, ZIP/Postal code, City</li>
                    <li>Cookies and Usage Data</li>
                  </ul>
                </li>
                <li style={{ marginBottom: '10px' }}>
                  <strong>Usage Data:</strong> We may also collect information on how the Service is accessed and used ("Usage Data"). This may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages you visit, the time and date of your visit, the time spent on those pages, and other diagnostic data.
                </li>
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>3. Use of Data</h2>
              <p>KAJobs uses the collected data for various purposes:</p>
              <ul style={{ marginLeft: '20px', marginTop: '15px' }}>
                <li style={{ marginBottom: '10px' }}>To provide and maintain our Service</li>
                <li style={{ marginBottom: '10px' }}>To notify you about changes to our Service</li>
                <li style={{ marginBottom: '10px' }}>To provide customer support</li>
                <li style={{ marginBottom: '10px' }}>To gather analysis or valuable information so that we can improve our Service</li>
                <li style={{ marginBottom: '10px' }}>To monitor the usage of our Service</li>
                <li style={{ marginBottom: '10px' }}>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>4. Security of Data</h2>
              <p>
                The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>5. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>6. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us at:</p>
              <div style={{ marginTop: '15px' }}>
                <p><strong>Email:</strong> privacy@kajobs.com</p>
                <p><strong>Phone:</strong> +91-123-456-7890</p>
                <p><strong>Address:</strong> 123 Business Park, Tech City, India</p>
              </div>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul style={{ marginLeft: '20px', marginTop: '15px' }}>
                <li style={{ marginBottom: '10px' }}>Request access to your personal data</li>
                <li style={{ marginBottom: '10px' }}>Request correction of inaccurate personal data</li>
                <li style={{ marginBottom: '10px' }}>Request deletion of your personal data</li>
                <li style={{ marginBottom: '10px' }}>Object to processing of your personal data</li>
                <li style={{ marginBottom: '10px' }}>Request restriction of processing your personal data</li>
              </ul>
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
