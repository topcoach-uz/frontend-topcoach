import type { YouthLeadersDraft } from './types';

export function validateFormStep(step: number, d: YouthLeadersDraft): string | null {
  const p = d.personal;
  const id = d.idInfo;
  const c = d.contact;
  const a = d.arrival;

  switch (step) {
    case 0:
      if (!p.familyName.trim()) return 'Family name is required.';
      if (!p.givenName.trim()) return 'Given name is required.';
      if (!p.email.trim()) return 'Email is required.';
      if (!p.mobile.trim()) return 'Phone number is required.';
      if (!p.dateOfBirth) return 'Date of birth is required.';
      if (!p.nationality.trim()) return 'Nationality is required.';
      if (!p.dietary) return 'Dietary habit is required.';
      if (!p.organization.trim()) return 'Organization is required.';
      if (!p.position.trim()) return 'Position is required.';
      if (!p.idPhotoFileName) return 'ID photo is required.';
      return null;
    case 1:
      if (!id.passportNumber.trim()) return 'Passport number is required.';
      if (!id.passportExpiry) return 'Passport expiration date is required.';
      if (!id.passportScanFileName) return 'Passport scan is required.';
      if (!id.needsVisa) return 'Please indicate if you need a Chinese visa.';
      if (id.needsVisa === 'yes' && !id.visaApplicationPlace.trim()) {
        return 'Please enter where you will apply for the visa.';
      }
      return null;
    case 2:
      if (!d.thematicClusterId) return 'Please select a thematic cluster.';
      return null;
    case 3:
      if (!c.shortBio.trim()) return 'Short bio is required.';
      if (!c.resumeFileName) return 'Resume upload is required.';
      return null;
    case 4:
      if (!a.arrivalAirport.trim()) return 'Arrival airport is required.';
      if (!a.arrivalDate) return 'Arrival date is required.';
      if (!a.arrivalTime) return 'Arrival time is required.';
      return null;
    default:
      return null;
  }
}
