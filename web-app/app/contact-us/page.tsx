'use client';

import React, { useState } from 'react';
import Header4 from '@/components/header/Header4';
import Footer from '@/components/footer';
import Link from 'next/link';

export default function ContactUs() {
  const [isShowMobile, setShowMobile] = useState(false);

  const handleMobile = () => {
    setShowMobile(!isShowMobile);
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Here you would typically send the form data to a server
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 3000);
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
              Contact Us
            </h1>
            <p style={{ fontSize: '16px', color: '#666' }}>We would love to hear from you</p>
          </div>
        </div>

        <div className="tf-container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '60px' }}>
              {/* Contact Information */}
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>Get In Touch</h2>
                
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '10px', fontSize: '24px' }}>📍</span> Address
                  </h3>
                  <p style={{ marginLeft: '34px' }}>
                    123 Business Park<br />
                    Tech City, Mumbai<br />
                    Maharashtra 400001, India
                  </p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '10px', fontSize: '24px' }}>📞</span> Phone
                  </h3>
                  <p style={{ marginLeft: '34px' }}>
                    <strong>Support:</strong> +91-123-456-7890<br />
                    <strong>Sales:</strong> +91-123-456-7891<br />
                    <strong>HR:</strong> +91-123-456-7892
                  </p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '10px', fontSize: '24px' }}>✉️</span> Email
                  </h3>
                  <p style={{ marginLeft: '34px' }}>
                    <strong>General Inquiries:</strong> info@kajobs.com<br />
                    <strong>Support:</strong> support@kajobs.com<br />
                    <strong>Sales:</strong> sales@kajobs.com
                  </p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '10px', fontSize: '24px' }}>🕒</span> Business Hours
                  </h3>
                  <p style={{ marginLeft: '34px' }}>
                    Monday - Friday: 9:00 AM - 6:00 PM IST<br />
                    Saturday: 10:00 AM - 4:00 PM IST<br />
                    Sunday: Closed
                  </p>
                </div>

                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Follow Us</h3>
                  <div style={{ display: 'flex', gap: '15px', marginLeft: '0px' }}>
                    <a href="#" style={{ color: '#007bff', textDecoration: 'none', fontSize: '18px' }}>Facebook</a>
                    <a href="#" style={{ color: '#007bff', textDecoration: 'none', fontSize: '18px' }}>Twitter</a>
                    <a href="#" style={{ color: '#007bff', textDecoration: 'none', fontSize: '18px' }}>LinkedIn</a>
                    <a href="#" style={{ color: '#007bff', textDecoration: 'none', fontSize: '18px' }}>Instagram</a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>Send us a Message</h2>
                
                {submitted && (
                  <div style={{ 
                    backgroundColor: '#d4edda', 
                    color: '#155724', 
                    padding: '15px', 
                    borderRadius: '4px', 
                    marginBottom: '20px',
                    border: '1px solid #c3e6cb'
                  }}>
                    Thank you! Your message has been sent successfully. We will get back to you soon.
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Your name"
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                      placeholder="+91-XXXXXXXXXX"
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                      placeholder="What is this about?"
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        fontFamily: 'Arial, sans-serif',
                        resize: 'vertical'
                      }}
                      placeholder="Please tell us how we can help..."
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>

            {/* FAQ Section */}
            <section style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid #eee' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', textAlign: 'center' }}>Frequently Asked Questions</h2>
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>What is KAJobs?</h3>
                  <p>KAJobs is a modern job board platform that connects employers with qualified candidates, making the recruitment process efficient and effective.</p>
                </div>
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>How much does it cost to post a job?</h3>
                  <p>Job posting prices vary based on duration and visibility. We offer flexible plans starting from ₹999. Contact our sales team for customized packages.</p>
                </div>
                <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>How long does it take to get responses?</h3>
                  <p>Most jobs receive initial responses within 24-48 hours. The exact timeline depends on the job type and visibility level.</p>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Can I edit my job posting?</h3>
                  <p>Yes, you can edit your job posting anytime from your account dashboard. You can update the description, requirements, salary, and other details.</p>
                </div>
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
