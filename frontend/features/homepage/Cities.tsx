// features/homepage/Cities.tsx
// Asymmetric mosaic grid of cities Homigrow operates in, each showing a
// listing count.

"use client";

const imgCityMumbai = "/homepage/city-mumbai.png";
const imgCityBengaluru = "/homepage/city-bengaluru.png";
const imgCityChennai = "/homepage/city-chennai.png";
const imgCityAgra = "/homepage/city-agra.png";
const imgCityHyderabad = "/homepage/city-hyderabad.png";
const imgCityAhmedabad = "/homepage/city-ahmedabad.png";

const sg = "'Space Grotesk', sans-serif";
const pj = "'Plus Jakarta Sans', sans-serif";

const cities = [
  { name: "Bengaluru", listings: "2,400+", img: imgCityBengaluru },
  { name: "Mumbai", listings: "1,840+", img: imgCityMumbai },
  { name: "Chennai", listings: "960+", img: imgCityChennai },
  { name: "Hyderabad", listings: "1,120+", img: imgCityHyderabad },
  { name: "Ahmedabad", listings: "580+", img: imgCityAhmedabad },
  { name: "Agra", listings: "340+", img: imgCityAgra },
];

function CityCard({ city, tall }: { city: (typeof cities)[number]; tall?: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        height: tall ? 400 : 189,
        cursor: "pointer",
      }}
    >
      <img
        src={city.img}
        alt={city.name}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
          transition: "transform 0.4s ease",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.04)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(26,26,26,0.22)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: sg,
            fontWeight: 700,
            fontSize: tall ? 28 : 20,
            color: "#fefeff",
            textShadow: "0px 4px 1.5px rgba(0,0,0,0.1), 0px 10px 4px rgba(0,0,0,0.04)",
          }}
        >
          {city.name}
        </span>
        <span
          style={{
            fontFamily: pj,
            fontWeight: 400,
            fontSize: 13,
            color: "rgba(254,254,255,0.75)",
          }}
        >
          {city.listings} listings
        </span>
      </div>
    </div>
  );
}

export default function Cities() {
  return (
    <section style={{ background: "#f8f9fa" }}>
      <div className="section-inner">
        <div style={{ marginBottom: 32 }}>
          <span
            style={{
              fontFamily: sg,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color: "#575e70",
              display: "block",
              marginBottom: 10,
            }}
          >
            Where We Operate
          </span>
          <h2
            style={{
              fontFamily: sg,
              fontWeight: 500,
              fontSize: 36,
              lineHeight: "44px",
              color: "#232323",
              margin: 0,
            }}
          >
            Premium properties across India
          </h2>
        </div>

        <div className="cities-grid">
          <div className="city-span-2">
            <CityCard city={cities[0]} tall />
          </div>
          <div className="city-span-2">
            <CityCard city={cities[1]} tall />
          </div>
          <div className="city-span-2s">
            <CityCard city={cities[2]} />
          </div>
          <div className="city-span-2s">
            <CityCard city={cities[3]} />
          </div>
          <div className="city-span-3">
            <CityCard city={cities[4]} />
          </div>
          <div className="city-span-3">
            <CityCard city={cities[5]} />
          </div>
        </div>
      </div>
    </section>
  );
}
