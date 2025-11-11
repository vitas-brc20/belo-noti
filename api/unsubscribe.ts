const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { fcmToken } = req.body;

  if (!fcmToken) {
    return res.status(400).json({ error: 'Missing fcmToken.' });
  }

  try {
    // Query for the fcm_token column directly.
    const response = await fetch(
      `${supabaseUrl}/rest/v1/subscriptions?fcm_token=eq.${encodeURIComponent(fcmToken)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceRoleKey,
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error deleting subscription:', errorData);
      throw new Error(errorData.message || 'Failed to delete subscription.');
    }

    return res.status(200).json({ message: 'Subscription deleted successfully.' });

  } catch (e) {
    console.error('Unexpected error:', e);
    return res.status(500).json({ error: e.message || 'An unexpected error occurred.' });
  }
}