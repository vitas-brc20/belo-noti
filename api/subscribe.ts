const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { fcmToken, biasName, biasTone, notificationTime, notification_interval } = req.body;

  if (!fcmToken) {
    return res.status(400).json({ error: 'Missing fcmToken.' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/subscriptions`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal', // Don't return the inserted data
        },
        body: JSON.stringify({
          fcm_token: fcmToken, // Store the FCM token directly
          bias_name: biasName,
          bias_tone: biasTone,
          notification_time: notificationTime,
          notification_interval: notification_interval,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error saving subscription:', errorData);
      throw new Error(errorData.message || 'Failed to save subscription.');
    }

    return res.status(201).json({ message: 'Subscription saved successfully.' });

  } catch (e) {
    console.error('Unexpected error:', e);
    return res.status(500).json({ error: e.message || 'An unexpected error occurred.' });
  }
}
