'use client';

import React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';

export default function CookiePolicy() {
  return (
    <>
      <Header />
      <main className="main-content">
        <div className="page-header" style={{ background: '#f5f5f5', padding: '60px 0' }}>
          <div className="tf-container">
            <h1 className="page-title" style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>
              Cookie Policy
            </h1>
            <p style={{ fontSize: '16px', color: '#666' }}>Last updated: May 29, 2026</p>
          </div>
        </div>

        <div className="tf-container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', lineHeight: '1.8' }}>
            
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>1. What Are Cookies?</h2>
              <p>
                Cookies are small pieces of text stored on your browser or device. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site. Cookies set by the website owner (in this case, KAJobs) are called "first party cookies". Cookies set by parties other than the website owner are called "third party cookies".
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>2. Why We Use Cookies</h2>
              <p>We use cookies for various purposes including:</p>
              <ul style={{ marginLeft: '20px', marginTop: '15px' }}>
                <li style={{ marginBottom: '10px' }}>To recognize you and your preferences</li>
                <li style={{ marginBottom: '10px' }}>To understand how you use our website</li>
                <li style={{ marginBottom: '10px' }}>To improve your user experience</li>
                <li style={{ marginBottom: '10px' }}>To provide you with targeted advertisements</li>
                <li style={{ marginBottom: '10px' }}>To prevent fraud and enhance security</li>
                <li style={{ marginBottom: '10px' }}>To remember your login information</li>
                <li style={{ marginBottom: '10px' }}>To analyze website performance</li>
              </ul>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>3. Types of Cookies We Use</h2>
              
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>Essential Cookies</h3>
              <p>
                These cookies are necessary for the website to function properly. Without these cookies, services you have asked for, like logging into your account, cannot be provided.
              </p>

              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>Performance Cookies</h3>
              <p>
                These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.
              </p>

              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>Functional Cookies</h3>
              <p>
                These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.
              </p>

              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>Targeting Cookies</h3>
              <p>
                These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>4. Third Party Cookies</h2>
              <p>
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements on and off the website, and so on. These third parties may collect information about your online activities across multiple websites.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>5. Managing Your Cookies</h2>
              <p>
                Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit www.allaboutcookies.org.
              </p>
              <p style={{ marginTop: '15px' }}>
                To opt out of being tracked by analytics cookies, you can use browser add-ons or plugins designed for this purpose.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>6. Cookie Consent</h2>
              <p>
                When you first visit KAJobs, we ask for your consent to use cookies. You can choose to accept all cookies, reject non-essential cookies, or customize your preferences. You can change your cookie preferences at any time through your browser settings or through our preference center.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>7. Specific Cookies We Use</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Cookie Name</th>
                    <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Type</th>
                    <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>kajobs_session</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>Essential</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>Maintains user session</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>kajobs_auth</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>Essential</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>Authentication token</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>_ga</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>Performance</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>Google Analytics tracking</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>kajobs_preferences</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>Functional</td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>User preferences and settings</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>8. Changes to This Cookie Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the date at the top.
              </p>
            </section>

            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px', marginTop: '30px' }}>9. Contact Us</h2>
              <p>If you have any questions about our use of cookies, please contact us at:</p>
              <div style={{ marginTop: '15px' }}>
                <p><strong>Email:</strong> cookies@kajobs.com</p>
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
