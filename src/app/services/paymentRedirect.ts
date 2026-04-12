import axios from 'axios';
import { baseUrl } from 'src/app/services/api/const';
import { ACCESS_TOKEN } from 'src/constants/storage';

/**
 * Same redirect POST as PaymentPage (course, sessions, etc.) — keep one path
 * so CAAF and other flows stay aligned.
 */
export async function paymentRedirectWithTimeout(
  provider: string,
  payload: Record<string, unknown>,
): Promise<{ url?: string; redirectUrl?: string }> {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const response = await axios.post(`${baseUrl}/payments/redirect/${provider}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000,
  });
  return response.data;
}
