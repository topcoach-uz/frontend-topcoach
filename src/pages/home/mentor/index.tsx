import EventsSection from '../_components/events';
import FavoriteUniversitiesSection from '../_components/university';
import ProfileStatusSection from './_components/profile_status';
import BookingsSection from './bookings';
import SubscriptionPlans from 'src/components/subscriptions/SubscriptionPlans';

export default function MentorHome() {
  return (
    <main>
      <ProfileStatusSection />
      <BookingsSection />
      {/* <FavoriteUniversitiesSection /> */}
      <EventsSection />
      <SubscriptionPlans />
    </main>
  );
}