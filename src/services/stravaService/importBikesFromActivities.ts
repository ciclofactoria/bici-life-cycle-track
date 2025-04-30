
import { supabase } from '@/integrations/supabase/client';
import { getAthleteActivities } from '@/integrations/supabase/strava/api';

interface BikeRecord {
  id: string; // Strava ID
  name: string;
  type: string;
  distance: number;
  activities: number;
}

/**
 * Importa bicicletas desde las actividades recientes del usuario
 * @param userId ID del usuario de Supabase
 * @param accessToken Token de acceso de Strava
 * @returns Número de bicicletas importadas
 */
export const importBikesFromActivities = async (userId: string, accessToken: string): Promise<number> => {
  try {
    // Obtenemos las últimas 100 actividades
    const activities = await getAthleteActivities(accessToken, 1, 100);
    
    if (!activities || activities.length === 0) {
      console.log('No se encontraron actividades recientes');
      return 0;
    }
    
    console.log(`📊 Analizando ${activities.length} actividades recientes`);
    
    // Recopilamos información de las bicis en las actividades
    const bikesMap = new Map<string, BikeRecord>();
    
    for (const activity of activities) {
      if (activity.gear_id && activity.type === 'Ride') {
        const bikeId = activity.gear_id;
        
        if (!bikesMap.has(bikeId)) {
          bikesMap.set(bikeId, {
            id: bikeId,
            name: activity.gear_name || `Bici ${bikeId.substring(0, 6)}`,
            type: 'Road', // Por defecto, se puede mejorar detectando el tipo
            distance: activity.distance || 0,
            activities: 1
          });
        } else {
          const bikeData = bikesMap.get(bikeId)!;
          bikeData.distance += activity.distance || 0;
          bikeData.activities += 1;
        }
      }
    }
    
    console.log(`🔍 Se encontraron ${bikesMap.size} bicicletas en las actividades`);
    
    // Importamos las bicis a la base de datos
    let importCount = 0;
    
    for (const bike of bikesMap.values()) {
      const { error } = await supabase.from('bikes').upsert({
        user_id: userId,
        strava_id: bike.id,
        name: bike.name,
        type: bike.type,
        total_distance: bike.distance,
        image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
      });
      
      if (!error) {
        importCount++;
        console.log(`✅ Bici importada: ${bike.name}, usada en ${bike.activities} actividades`);
      } else {
        console.error(`❌ Error al importar bici ${bike.name}:`, error);
      }
    }
    
    return importCount;
  } catch (err) {
    console.error('Error en importBikesFromActivities:', err);
    return 0;
  }
};
