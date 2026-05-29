'use client';

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <>
      <Header />
      <main className="main-content">
        <div className="page-header" style={{ background: '#f5f5f5', padding: '60px 0' }}>
          <div className="tf-container">
            <h1 className="page-title" style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>
              Terms of Service
            </h1>
            <p style={{ fontSize: '16px', color: '#666' }}>Last updated: May 29, 2026</p>
          </div>
        </div>

        <div className="tf-container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', lineHeight: '1.8' }}>
            
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>1. Acceptance of Terms</h2>
              <p>
                By accessing and using KAJobs platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on KAJobs for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul style={{ marginLeft: '20px', marginTop: '15px' }}>
                <li style={{ marginBottom: '10px' }}>Modifying or copying the materials</li>
                <li style={{ marginBottom: '10px' }}>Using the materials for any commercial purpose or for any public display</li>
                <li style={{ marginBottom: '10px' }}>Attempting to decompile or reverse engineer any software contained on KAJobs</li>
                <li style={{ marginBottom: '10px' }}>Removing any copyright or other proprietary notations from the materials</li>
                <li style={{ marginBottom: '10px' }}>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>3. Disclaimer</h2>
              <p>
                The materials on KAJobs are provided on an 'as is' basis. KAJobs makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>4. Limitations</h2>
              <p>
                In no event shall KAJobs or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on KAJobs.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>5. Accuracy of Materials</h2>
              <p>
                The materials appearing on KAJobs could include technical, typographical, or photographic errors. KAJobs does not warrant that any of the materials on the website are accurate, complete, or current. KAJobs may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>6. Links</h2>
              <p>
                KAJobs has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by KAJobs of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>7. Modifications</h2>
              <p>
                KAJobs may revise these terms of service for the website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>8. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts located in India.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>9. User Responsibilities</h2>
              <p>
                Users are responsible for maintaining the confidentiality of their account information and passwords, and are fully responsible for all activities that occur under their accounts. Users agree to notify KAJobs immediately of any unauthorized use of their accounts.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>10. Job Posting and Applications</h2>
              <p>
                All job postings and applications on KAJobs must be truthful and accurate. Employers are responsible for verifying candidate information. KAJobs is not liable for any disputes between employers and candidates.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>11. Contact Us</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div style={{ marginTop: '15px' }}>
                <p><strong>Email:</strong> support@kajobs.com</p>
                <p><strong>Phone:</strong> +91-123-456-7890</p>
                <p><strong>Address:</strong> 123 Business Park, Tech City, India</p>
              </div>
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
