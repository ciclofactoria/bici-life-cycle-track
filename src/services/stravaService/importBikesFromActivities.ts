
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
    console.log('Iniciando importación de bicis desde actividades');
    console.log('Token de acceso:', accessToken.substring(0, 5) + '...');
    
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
    
    // Si no hay bicis, terminamos aquí
    if (bikesMap.size === 0) {
      console.log('No se encontraron bicicletas en las actividades');
      return 0;
    }
    
    // Importamos las bicis a la base de datos
    let importCount = 0;
    
    for (const bike of bikesMap.values()) {
      console.log(`Importando bici ${bike.name} (${bike.id})`);
      
      // Primero verificamos si ya existe esta bicicleta para este usuario
      const { data: existingBike, error: checkError } = await supabase
        .from('bikes')
        .select('id, total_distance')
        .eq('strava_id', bike.id)
        .eq('user_id', userId)
        .maybeSingle();
        
      if (checkError) {
        console.error(`❌ Error al comprobar si la bici ${bike.name} ya existe:`, checkError);
        continue;
      }
      
      let upsertError;
      
      // Array de placeholders de imágenes para bicicletas sin imagen
      const placeholderImages = [
        'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=900&q=60',
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=60',
        'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=900&q=60'
      ];
      
      // Seleccionar una imagen aleatoria del array
      const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
      
      if (existingBike) {
        // Si ya existe, verificamos si la distancia actual es mayor para actualizarla
        console.log(`La bici ${bike.name} ya existe, ID: ${existingBike.id}`);
        
        // Solo actualizamos si la nueva distancia es mayor que la existente
        if (bike.distance > (existingBike.total_distance || 0)) {
          console.log(`Actualizando distancia de ${existingBike.total_distance || 0}m a ${bike.distance}m`);
          
          const { error } = await supabase
            .from('bikes')
            .update({
              name: bike.name,
              total_distance: bike.distance,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBike.id);
            
          upsertError = error;
          
          if (!error) {
            importCount++;
          }
        } else {
          console.log(`No se actualizó la bici porque la distancia actual (${existingBike.total_distance}m) es mayor o igual que la nueva (${bike.distance}m)`);
          // Contamos como importada aunque no hayamos actualizado nada
          importCount++;
        }
      } else {
        // Si no existe, la insertamos
        console.log(`Insertando nueva bici: ${bike.name} con ${bike.distance}m`);
        
        const { error } = await supabase.from('bikes').insert({
          user_id: userId,
          strava_id: bike.id,
          name: bike.name,
          type: bike.type,
          total_distance: bike.distance,
          image: randomImage,
        });
        
        upsertError = error;
        
        if (!error) {
          importCount++;
        }
      }
      
      if (!upsertError) {
        console.log(`✅ Bici ${existingBike ? 'actualizada' : 'importada'}: ${bike.name}, usada en ${bike.activities} actividades`);
      } else {
        console.error(`❌ Error al ${existingBike ? 'actualizar' : 'importar'} bici ${bike.name}:`, upsertError);
      }
    }
    
    console.log(`Importación completada. Total de bicis importadas/actualizadas: ${importCount}`);
    return importCount;
  } catch (err) {
    console.error('Error en importBikesFromActivities:', err);
    return 0;
  }
};
