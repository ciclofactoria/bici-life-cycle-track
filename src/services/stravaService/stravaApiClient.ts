
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
      
      const { data, error } = await supabase.functions.invoke('get-strava-gear', {
        body: { access_token: accessToken }
      });
      
      if (error) {
        console.error("Error in get-strava-gear edge function:", error);
        const errorWithStatus: Error & { status?: number } = new Error(error.message || "Error fetching Strava gear");
        errorWithStatus.status = error?.status as number || 500;
        throw errorWithStatus;
      }
      
      if (!data) {
        console.error("No data returned from get-strava-gear");
        const errorWithStatus: Error & { status?: number } = new Error("No data returned from Strava API");
        errorWithStatus.status = 500;
        throw errorWithStatus;
      }
      
      if (data.need_refresh) {
        console.log("Token needs refresh according to response");
        const refreshError: Error & { status?: number } = new Error("Token de Strava expirado. Por favor, reconecta tu cuenta de Strava.");
        refreshError.status = 401;
        throw refreshError;
      }
      
      if (!data.gear || !Array.isArray(data.gear)) {
        console.error("Incorrect data format:", data);
        const errorWithStatus: Error & { status?: number } = new Error("Incorrect data format received from Strava API");
        errorWithStatus.status = 500;
        throw errorWithStatus;
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
      
      const { data, error } = await supabase.functions.invoke('refresh-strava-token', {
        body: { email }
      });
      
      if (error) {
        console.error("Error in refresh-strava-token function:", error);
        const errorWithStatus: Error & { status?: number } = new Error(error.message || "Error refreshing Strava token");
        errorWithStatus.status = error?.status as number || 500;
        throw errorWithStatus;
      }
      
      if (!data || !data.access_token) {
        const errorWithStatus: Error & { status?: number } = new Error("No valid token received during refresh");
        errorWithStatus.status = 500;
        throw errorWithStatus;
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
