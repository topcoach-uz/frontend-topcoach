import HomeAiSearchSection from '../_components/aiSearch';
import BannerSection from '../_components/banner';
import BookingsSection from '../_components/bookings';
import EventsSection from '../_components/events';
import FavoriteUniversitiesSection from '../_components/university';
import SubscriptionPlans from 'src/components/subscriptions/SubscriptionPlans';

function MenteeHomePage() {
  return (
    <div>
      <BannerSection />
      {/* <HomeAiSearchSection /> */}
      <BookingsSection />
      {/* <FavoriteUniversitiesSection /> */}
      <EventsSection />
      <SubscriptionPlans />
    </div>
  );
}
export default MenteeHomePage;
