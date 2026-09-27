import Hero from '../components/home/Hero.jsx';
import HowItWorks from '../components/home/HowItWorks.jsx';
import Benefits from '../components/home/Benefits.jsx';
import PopularAreas from '../components/home/PopularAreas.jsx';
import OwnerCTA from '../components/home/OwnerCTA.jsx';

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Benefits />
      <PopularAreas />
      <OwnerCTA />
    </>
  );
}
