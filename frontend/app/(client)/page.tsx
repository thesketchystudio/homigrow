// app/(client)/page.tsx
// Homepage: hero, listings, and the rest of the marketing sections, in
// display order. TopNavBar/Footer come from the (client) layout.

import { AgentConnectSection } from "@/features/homepage/AgentConnect";
import Areas from "@/features/homepage/Areas";
import Cities from "@/features/homepage/Cities";
import EarlyAccess from "@/features/homepage/EarlyAccess";
import { EmiCalculatorSection } from "@/features/homepage/EmiCalculator";
import Hero from "@/features/homepage/Hero";
import { HowItWorksSection } from "@/features/homepage/HowItWorks";
import Listings from "@/features/homepage/Listings";
import NewLaunches from "@/features/homepage/NewLaunches";
import { PropertyAlertsSection } from "@/features/homepage/PropertyAlerts";
import Testimonials from "@/features/homepage/Testimonials";
import Trust from "@/features/homepage/Trust";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Listings />
      <Areas />
      <NewLaunches />
      <HowItWorksSection />
      <EmiCalculatorSection />
      <Testimonials />
      <Cities />
      <AgentConnectSection />
      <PropertyAlertsSection />
      <Trust />
      <EarlyAccess />
    </>
  );
}
