
import { supabase } from '@/integrations/supabase/client';

export const exchangeCodeForToken = async (authCode: string, userEmail: string) => {
  // Client ID and secret configuration
  const clientId = '157332';
  const clientSecret = '38c60b9891cea2fb7053e185750c5345fab850f5';
  
  console.log("Performing code exchange for token");
  console.log("Using auth code:", authCode.substring(0, 5) + "...");
  
  // Exchange auth code for token
  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: authCode,
      grant_type: 'authorization_code'
    })
  });
  
  const responseText = await response.text();
  console.log("Raw exchange response:", responseText);
  
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Error parsing response: ${responseText}`);
  }
  
  if (!response.ok) {
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Error: ${data.errors[0].resource} - ${data.errors[0].field} - ${data.errors[0].code}`);
    } else {
      throw new Error(`Error: ${data.message || JSON.stringify(data)} (Status: ${response.status})`);
    }
  }
  
  return data;
};

export const saveStravaToken = async (userId: string, userEmail: string, data: any) => {
  // Save token to Supabase
  const { error: saveError } = await supabase.functions.invoke('save-strava-token', {
    body: {
      email: userEmail,
      strava_user_id: data.athlete?.id?.toString(),
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at
    }
  });
  
  if (saveError) {
    throw new Error(`Error saving token: ${saveError.message}`);
  }
};

export const getStravaBikes = async (accessToken: string) => {
  // Get bikes with the token
  console.log("Getting bikes with token...");
  const { data, error } = await supabase.functions.invoke('get-strava-gear', {
    body: { access_token: accessToken }
  });
  
  if (error) {
    throw new Error(`Error getting bikes: ${error.message}`);
  }
  
  return data.gear || [];
};

export const importBikesToDatabase = async (userId: string, bikes: any[]) => {
  let importedCount = 0;
  
  for (const bike of bikes) {
    const { error } = await supabase
      .from('bikes')
      .upsert({
        name: bike.name || `Bike ${bike.id}`,
        type: bike.type || 'Road',
        strava_id: bike.id,
        user_id: userId,
        total_distance: bike.distance || 0,
        image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60'
      });
      
    if (!error) {
      importedCount++;
    }
  }
  
  return importedCount;
};

export const initiateStravaAuthorization = (userEmail: string) => {
  const clientId = '157332';
  const redirectUri = encodeURIComponent(window.location.href);
  const scope = 'read,profile:read_all';
  
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${userEmail}`;
  
  console.log("Redirecting to Strava for authorization:", authUrl);
  window.location.href = authUrl;
};
