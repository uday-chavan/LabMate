import { apiRequest } from "./queryClient";

export async function sendAlert(message: string): Promise<void> {
  try {
    await apiRequest('POST', '/api/alert', {
      message,
      type: 'SAFETY_ALERT',
      severity: 'HIGH',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Failed to send alert:', error);
    throw new Error('Failed to send emergency alert');
  }
}
