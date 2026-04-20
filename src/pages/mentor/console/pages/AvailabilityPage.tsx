import { Card } from 'antd';
import AvailabilitySettings from 'src/pages/home/mentor/bookings/_components/AvailabilitySettings';

export default function MentorConsoleAvailabilityPage() {
  return (
    <div>
      <h1 className="mc-page-title">Availability</h1>
      <p className="mc-page-lead">
        Set when students can book sessions with you. Slots are converted to each student&apos;s timezone.
      </p>

      <Card bordered={false} className="mc-panel">
        <AvailabilitySettings />
      </Card>
    </div>
  );
}
