
import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced client for Strava API operations with better error handling
 */
export class StravaApiClient {
  /**
   * Gets bikes from Strava with enhanced error handling
   */
  static async getBikes(accessToken: string) {
    if (!accessToken) {
      throw new Error('Access token is required to fetch bikes from Strava');
    }

    try {
      console.log("Calling get-strava-gear function with token:", accessToken.substring(0, 5) + "...");
      
      const { data, error, status } = await supabase.functions.invoke('get-strava-gear', {
        body: { access_token: accessToken }
      });
      
      if (error) {
        console.error("Error in get-strava-gear edge function:", error);
        error.status = status || 500;
        throw error;
      }
      
      if (!data) {
        console.error("No data returned from get-strava-gear");
        throw new Error("No data returned from Strava API");
      }
      
      if (data.need_refresh) {
        console.log("Token needs refresh according to response");
        const refreshError = new Error("Token de Strava expirado. Por favor, reconecta tu cuenta de Strava.");
        refreshError.status = 401;
        throw refreshError;
      }
      
      if (!data.gear || !Array.isArray(data.gear)) {
        console.error("Incorrect data format:", data);
        throw new Error("Incorrect data format received from Strava API");
      }
      
      console.log(`Found ${data.gear.length} bikes from Strava`);
      return data.gear || [];
    } catch (err: any) {
      console.error("Error in StravaApiClient.getBikes:", err);
      
      // Enhance error object with status if not present
      if (!err.status) {
        err.status = err.message?.includes('expired') ? 401 : 500;
      }
      
      throw err;
    }
  }

  /**
   * Refreshes an expired Strava token
   */
  static async refreshToken(email: string) {
    if (!email) {
      throw new Error('Email is required to refresh token');
    }
    
    try {
      console.log("Refreshing Strava token for:", email);
      
      const { data, error, status } = await supabase.functions.invoke('refresh-strava-token', {
        body: { email }
      });
      
      if (error) {
        console.error("Error in refresh-strava-token function:", error);
        error.status = status || 500;
        throw error;
      }
      
      if (!data || !data.access_token) {
        throw new Error("No valid token received during refresh");
      }
      
      console.log("Strava token refreshed successfully");
      return data;
    } catch (err: any) {
      console.error("Error in StravaApiClient.refreshToken:", err);
      
      if (!err.status) {
        err.status = 500;
      }
      
      throw err;
    }
  }
}
