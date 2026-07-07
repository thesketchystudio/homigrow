// features/homepage/EarlyAccess.tsx
// "Coming soon" waitlist signup form (name, email, phone, interest).

"use client";

import { useState } from "react";

export default function EarlyAccess() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.interest) {
      newErrors.interest = "Please select your interest";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // TODO: wire to a real waitlist-signup endpoint once one exists.
    // Simulated success for now — no backend endpoint is available yet.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitted(true);

    setTimeout(() => {
      setFormData({ name: "", email: "", phone: "", interest: "" });
      setSubmitted(false);
      setErrors({});
      setIsSubmitting(false);
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <section
      style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        paddingTop: "clamp(60px, 10vw, 120px)",
        paddingBottom: "clamp(60px, 10vw, 120px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-50%",
          right: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(146, 245, 116, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 clamp(20px, 5vw, 150px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "clamp(40px, 8vw, 80px)",
            alignItems: "center",
          }}
          className="early-access-grid"
        >
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "6px 16px",
                background: "rgba(146, 245, 116, 0.15)",
                borderRadius: "100px",
                marginBottom: "24px",
              }}
            >
              <span
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#92f574",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Coming Soon
              </span>
            </div>

            <h2
              style={{
                fontFamily: "Space Grotesk",
                fontSize: "clamp(28px, 6vw, 48px)",
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: "1.2",
                marginBottom: "clamp(16px, 3vw, 24px)",
              }}
            >
              Be Among the First to Experience the Future of Real Estate
            </h2>

            <p
              style={{
                fontFamily: "Plus Jakarta Sans",
                fontSize: "clamp(16px, 2.5vw, 18px)",
                color: "rgba(255, 255, 255, 0.7)",
                lineHeight: "1.6",
                marginBottom: "clamp(24px, 4vw, 32px)",
              }}
            >
              We&apos;re building something special — a platform that makes finding your dream property effortless. Join our early access list and get exclusive benefits when we launch.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { icon: "✨", text: "Priority access to new listings" },
                { icon: "🎯", text: "Personalized property recommendations" },
                { icon: "💰", text: "Exclusive launch discounts and offers" },
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      background: "rgba(146, 245, 116, 0.1)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    style={{
                      fontFamily: "Plus Jakarta Sans",
                      fontSize: "16px",
                      color: "#ffffff",
                      fontWeight: 500,
                    }}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "48px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    background: "#92f574",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    fontSize: "40px",
                  }}
                >
                  ✓
                </div>
                <h3
                  style={{
                    fontFamily: "Space Grotesk",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    marginBottom: "12px",
                  }}
                >
                  You&apos;re on the list!
                </h3>
                <p
                  style={{
                    fontFamily: "Plus Jakarta Sans",
                    fontSize: "16px",
                    color: "#666",
                  }}
                >
                  We&apos;ll notify you as soon as we launch.
                </p>
              </div>
            ) : (
              <>
                <h3
                  style={{
                    fontFamily: "Space Grotesk",
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    marginBottom: "8px",
                  }}
                >
                  Get Early Access
                </h3>
                <p
                  style={{
                    fontFamily: "Plus Jakarta Sans",
                    fontSize: "14px",
                    color: "#666",
                    marginBottom: "32px",
                  }}
                >
                  Fill in your details and we&apos;ll keep you updated
                </p>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div>
                      <label
                        htmlFor="name"
                        style={{
                          display: "block",
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#1a1a1a",
                          marginBottom: "8px",
                        }}
                      >
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          border: errors.name ? "2px solid #ff4444" : "1px solid #e0e0e0",
                          borderRadius: "8px",
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: "15px",
                          outline: "none",
                          transition: "all 0.2s",
                        }}
                        onFocus={(e) => {
                          if (!errors.name) {
                            e.target.style.borderColor = "#92f574";
                          }
                        }}
                        onBlur={(e) => {
                          if (!errors.name) {
                            e.target.style.borderColor = "#e0e0e0";
                          }
                        }}
                      />
                      {errors.name && (
                        <span
                          style={{
                            display: "block",
                            marginTop: "6px",
                            fontFamily: "Plus Jakarta Sans",
                            fontSize: "13px",
                            color: "#ff4444",
                          }}
                        >
                          {errors.name}
                        </span>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        style={{
                          display: "block",
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#1a1a1a",
                          marginBottom: "8px",
                        }}
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          border: errors.email ? "2px solid #ff4444" : "1px solid #e0e0e0",
                          borderRadius: "8px",
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: "15px",
                          outline: "none",
                          transition: "all 0.2s",
                        }}
                        onFocus={(e) => {
                          if (!errors.email) {
                            e.target.style.borderColor = "#92f574";
                          }
                        }}
                        onBlur={(e) => {
                          if (!errors.email) {
                            e.target.style.borderColor = "#e0e0e0";
                          }
                        }}
                      />
                      {errors.email && (
                        <span
                          style={{
                            display: "block",
                            marginTop: "6px",
                            fontFamily: "Plus Jakarta Sans",
                            fontSize: "13px",
                            color: "#ff4444",
                          }}
                        >
                          {errors.email}
                        </span>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        style={{
                          display: "block",
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#1a1a1a",
                          marginBottom: "8px",
                        }}
                      >
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          border: errors.phone ? "2px solid #ff4444" : "1px solid #e0e0e0",
                          borderRadius: "8px",
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: "15px",
                          outline: "none",
                          transition: "all 0.2s",
                        }}
                        onFocus={(e) => {
                          if (!errors.phone) {
                            e.target.style.borderColor = "#92f574";
                          }
                        }}
                        onBlur={(e) => {
                          if (!errors.phone) {
                            e.target.style.borderColor = "#e0e0e0";
                          }
                        }}
                      />
                      {errors.phone && (
                        <span
                          style={{
                            display: "block",
                            marginTop: "6px",
                            fontFamily: "Plus Jakarta Sans",
                            fontSize: "13px",
                            color: "#ff4444",
                          }}
                        >
                          {errors.phone}
                        </span>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="interest"
                        style={{
                          display: "block",
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#1a1a1a",
                          marginBottom: "8px",
                        }}
                      >
                        I&apos;m interested in *
                      </label>
                      <select
                        id="interest"
                        name="interest"
                        value={formData.interest}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          border: errors.interest ? "2px solid #ff4444" : "1px solid #e0e0e0",
                          borderRadius: "8px",
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: "15px",
                          outline: "none",
                          transition: "all 0.2s",
                          background: "#ffffff",
                          cursor: "pointer",
                        }}
                        onFocus={(e) => {
                          if (!errors.interest) {
                            e.target.style.borderColor = "#92f574";
                          }
                        }}
                        onBlur={(e) => {
                          if (!errors.interest) {
                            e.target.style.borderColor = "#e0e0e0";
                          }
                        }}
                      >
                        <option value="">Select your interest</option>
                        <option value="buying">Buying a property</option>
                        <option value="renting">Renting a property</option>
                        <option value="selling">Selling my property</option>
                        <option value="investing">Investment opportunities</option>
                      </select>
                      {errors.interest && (
                        <span
                          style={{
                            display: "block",
                            marginTop: "6px",
                            fontFamily: "Plus Jakarta Sans",
                            fontSize: "13px",
                            color: "#ff4444",
                          }}
                        >
                          {errors.interest}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: "100%",
                        padding: "16px",
                        background: "#92f574",
                        border: "none",
                        borderRadius: "8px",
                        fontFamily: "Plus Jakarta Sans",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#1a1a1a",
                        cursor: "pointer",
                        marginTop: "8px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#7de05f";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(146, 245, 116, 0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#92f574";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {isSubmitting ? "Submitting..." : "JOIN THE WAITLIST"}
                    </button>
                  </div>
                </form>

                <p
                  style={{
                    fontFamily: "Plus Jakarta Sans",
                    fontSize: "12px",
                    color: "#999",
                    marginTop: "20px",
                    textAlign: "center",
                  }}
                >
                  We respect your privacy. Your information is secure.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .early-access-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
