import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for backend operations

const FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Gemini API Key from environment variables

let firebaseServiceAccount = null;
if (FIREBASE_SERVICE_ACCOUNT_JSON_BASE64) {
  try {
    firebaseServiceAccount = JSON.parse(Buffer.from(FIREBASE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseServiceAccount),
      });
    }
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 or initialize Firebase Admin SDK:', e);
  }
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Initialize the GoogleGenerativeAI with the API key
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!admin.apps.length) {
    return res.status(500).json({ error: 'Firebase Admin SDK not initialized.' });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API Key not configured.' });
  }

  try {
    // Query Supabase for subscriptions that are due
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .lte('notification_time', new Date().toISOString());

    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw new Error(error.message);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ message: 'No subscriptions to process at this time.' });
    }

    const notificationPromises = subscriptions.map(async (sub) => {
      try {
        const { id, fcm_token, bias_name, bias_tone, notification_interval, notification_time } = sub;

        // Generate personalized message using Gemini AI
        const prompt = `"${bias_name || '당신의 최애'}"의 말투는 "${bias_tone}"입니다. 이 말투를 사용하여 "알림이 왔어요!"라는 내용의 짧고 친근한 알림 메시지를 100자 이내로 생성해주세요.`;
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const notificationBody = response.text();

        const message = {
          token: fcm_token,
          notification: {
            title: '최애의 알리미',
            body: notificationBody,
          },
          webpush: {
            fcm_options: {
              link: 'https://your-app-domain.com' // TODO: Replace with your actual app domain
            }
          }
        };

        console.log(`Sending FCM message to ${fcm_token} for ${bias_name}...`);
        await admin.messaging().send(message);
        console.log(`FCM notification sent successfully for subscription ${id}`);

        // Post-notification processing
        if (notification_interval && notification_interval > 0) {
          // Recurring notification: update to the next time
          const nextNotificationTime = dayjs(notification_time)
            .add(notification_interval, 'minute')
            .toISOString();

          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({ notification_time: nextNotificationTime })
            .eq('id', id);

          if (updateError) {
            console.error(`Failed to update next notification time for subscription ${id}:`, updateError);
          } else {
            console.log(`Updated next notification time for subscription ${id} to ${nextNotificationTime}`);
          }
        } else {
          // One-time notification: delete it
          const { error: deleteError } = await supabase
            .from('subscriptions')
            .delete()
            .eq('id', id);

          if (deleteError) {
            console.error(`Failed to delete one-time subscription ${id}:`, deleteError);
          } else {
            console.log(`Successfully deleted one-time subscription ${id}`);
          }
        }

      } catch (notificationError) {
        if (notificationError.code === 'messaging/registration-token-not-registered') {
          console.log(`FCM token for subscription ${sub.id} is not registered. Deleting subscription.`);
          await supabase.from('subscriptions').delete().eq('id', sub.id);
        } else {
          console.error(`Error processing subscription ${sub.id}:`, notificationError);
        }
      }
    });

    await Promise.all(notificationPromises);

    return res.status(200).json({ message: 'Notifications processed successfully.' });

  } catch (e) {
    console.error('Unexpected error in send-notifications:', e);
    return res.status(500).json({ error: e.message || 'An unexpected error occurred.' });
  }
}
