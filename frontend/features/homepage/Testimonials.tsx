// features/homepage/Testimonials.tsx
// Resident/client testimonial quotes: one large featured quote plus two
// smaller quotes side by side.

const imgAnitaDesai = "/homepage/anita-desai.png";
const imgTestimonial2 = "/homepage/testimonial-2.png";

const sg = "'Space Grotesk', sans-serif";
const pj = "'Plus Jakarta Sans', sans-serif";

const testimonials = [
  {
    quote:
      "Homigrow didn't just find me a house; they understood exactly what I was looking for. The search experience is unmatched in the Indian market.",
    author: "Anita Desai",
    role: "Art Curator",
    img: imgAnitaDesai,
    stars: 5,
  },
  {
    quote:
      "The curated approach made my home search so efficient. Every property I visited was exactly as described — no surprises, no wasted visits.",
    author: "Sarah Mitchell",
    role: "Principal Architect",
    img: imgTestimonial2,
    stars: 5,
  },
  {
    quote:
      "From valuation to registration in 12 days. I've bought 4 properties in Bengaluru. This was by far the most seamless experience I've had.",
    author: "Kiran Rao",
    role: "Startup Founder",
    img: null,
    stars: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 11.7044 12.6797" fill="#FACC15">
          <path d="M5.852 1L7.27 4.47l3.73.34-2.77 2.47.82 3.64L5.852 9.09l-3.2 1.85.82-3.64L.7 4.81l3.73-.34L5.852 1z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section style={{ background: "#232323" }}>
      <div className="section-inner">
        <div style={{ marginBottom: "clamp(36px, 6vw, 64px)", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <span
            style={{
              fontFamily: sg,
              fontWeight: 400,
              fontSize: 14,
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              color: "#fefeff",
              opacity: 0.5,
            }}
          >
            The Community
          </span>
          <h2
            style={{
              fontFamily: sg,
              fontWeight: 700,
              fontSize: 36,
              lineHeight: "44px",
              color: "#f8f9fa",
              margin: 0,
              textAlign: "center",
            }}
          >
            Resident Experiences
          </h2>
        </div>

        <div
          style={{
            marginBottom: 16,
            padding: "clamp(24px, 4vw, 48px) clamp(24px, 5vw, 56px)",
            background: "#fefeff",
            borderRadius: 20,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -10,
              left: 40,
              fontFamily: sg,
              fontWeight: 700,
              fontSize: 160,
              lineHeight: 1,
              color: "rgba(198,198,205,0.15)",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            &ldquo;
          </span>

          <div className="testimonial-feature">
            <p
              style={{
                fontFamily: pj,
                fontWeight: 300,
                fontSize: 22,
                lineHeight: "34px",
                color: "#1a1a1a",
                margin: 0,
                position: "relative",
                zIndex: 1,
              }}
            >
              &ldquo;{testimonials[0].quote}&rdquo;
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", flexShrink: 0 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {testimonials[0].img && (
                  <img src={testimonials[0].img} alt={testimonials[0].author} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </div>
              <div style={{ textAlign: "center" }}>
                <Stars count={testimonials[0].stars} />
                <p
                  style={{
                    fontFamily: sg,
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#1a1a1a",
                    margin: "6px 0 2px",
                  }}
                >
                  {testimonials[0].author}
                </p>
                <p
                  style={{
                    fontFamily: pj,
                    fontWeight: 400,
                    fontSize: 12,
                    color: "rgba(26,26,26,0.6)",
                    margin: 0,
                  }}
                >
                  {testimonials[0].role}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 16 }}>
          {testimonials.slice(1).map((t) => (
            <div
              key={t.author}
              style={{
                background: "#fefeff",
                borderRadius: 16,
                padding: "40px 40px",
                border: "none",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              <Stars count={t.stars} />
              <p
                style={{
                  fontFamily: pj,
                  fontWeight: 300,
                  fontSize: 18,
                  lineHeight: "28px",
                  color: "#1a1a1a",
                  margin: 0,
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {t.img ? (
                  <div style={{ width: 48, height: 48, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                    <img src={t.img} alt={t.author} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "#575e70",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontFamily: sg, fontWeight: 700, fontSize: 16, color: "#fefeff" }}>
                      {t.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                )}
                <div>
                  <p style={{ fontFamily: sg, fontWeight: 700, fontSize: 15, color: "#1a1a1a", margin: "0 0 2px 0" }}>{t.author}</p>
                  <p style={{ fontFamily: pj, fontWeight: 400, fontSize: 12, color: "rgba(26,26,26,0.6)", margin: 0 }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
