import { Card } from 'antd';
import AvailabilitySettings from 'src/pages/home/mentor/bookings/_components/AvailabilitySettings';

export default function MentorConsoleAvailabilityPage() {
  return (
    <div>
      <div className="mc-page-head mc-page-head--ruled">
        <div className="mc-page-eyebrow">
          Mentor <span className="mc-page-eyebrow-accent">· Availability</span>
        </div>
        <h1 className="mc-page-title">Availability</h1>
        <p className="mc-page-lead">
          Set when students can book sessions with you. Add one or more blocks per day — slots are
          converted to each student&apos;s timezone.
        </p>
      </div>

      <Card bordered={false} className="mc-panel">
        <AvailabilitySettings />
      </Card>
    </div>
  );
}
