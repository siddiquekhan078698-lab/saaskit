const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ApifyClient } = require('apify-client');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize Apify Client
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Plan Limits (Could be stored in DB, but hardcoding per requirements)
const PLAN_LIMITS = {
  free: 3,
  pro: 10,
  startup: 20
};

// Plan IDs from Environment
const PRO_PLAN_ID = process.env.POLAR_PRO_PLAN_ID;
const STARTUP_PLAN_ID = process.env.POLAR_STARTUP_PLAN_ID;

app.post('/api/download', async (req, res) => {
  try {
    const { videoUrl, userId } = req.body;

    if (!videoUrl || !userId) {
      return res.status(400).json({ error: 'videoUrl and userId are required' });
    }

    // 1. Get user's active subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error("Error fetching subscription:", subError);
      return res.status(500).json({ error: 'Failed to verify subscription' });
    }

    // Determine limit
    let currentLimit = PLAN_LIMITS.free;
    if (subscription) {
      if (subscription.plan_id === PRO_PLAN_ID) {
        currentLimit = PLAN_LIMITS.pro;
      } else if (subscription.plan_id === STARTUP_PLAN_ID) {
        currentLimit = PLAN_LIMITS.startup;
      }
    }

    // 2. Count downloads in the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('user_videos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (countError) {
      console.error("Error counting downloads:", countError);
      return res.status(500).json({ error: 'Failed to check usage limits' });
    }

    if (count >= currentLimit) {
      return res.status(429).json({ 
        error: `Monthly limit reached. Your plan allows ${currentLimit} downloads per month. You have downloaded ${count}.` 
      });
    }

    // 3. Call Apify Actor
    console.log(`Starting Apify run for URL: ${videoUrl}`);
    const run = await apifyClient.actor('xPJfblyAEnBXEWByE').call({
      videoUrls: [videoUrl]
    });

    // Fetch results
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
    
    if (!items || items.length === 0 || items[0].code !== 0) {
      console.error("Apify error or no results:", items);
      return res.status(500).json({ error: 'Failed to process video via Apify' });
    }

    const result = items[0];
    const finalVideoUrl = result.data.hdplay || result.data.play;

    if (!finalVideoUrl) {
      return res.status(500).json({ error: 'Could not extract video URL from Apify result' });
    }

    // 4. Save to Database
    const { error: insertError } = await supabase
      .from('user_videos')
      .insert({
        user_id: userId,
        input_url: videoUrl,
        video_url: finalVideoUrl,
        raw_data: result
      });

    if (insertError) {
      console.error("Error saving to database:", insertError);
      // Still return the video url to the user since it succeeded, but log the error
    }

    res.json({
      success: true,
      videoUrl: finalVideoUrl,
      remaining: currentLimit - (count + 1)
    });

  } catch (error) {
    console.error("Download endpoint error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
