import { db } from '../../firebase/admin';
import { logger } from '../../core/logger';
import { CustomError } from '../../core/errorHandler';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'mileage' | 'maintenance' | 'social' | 'achievement';
  requirements: {
    type: 'total_mileage' | 'bike_count' | 'service_count' | 'component_count' | 'service_cost' | 'days_active';
    value: number;
  }[];
  isUnlocked?: boolean;
  unlockedAt?: number;
  progress?: number;
}

export interface UserBadge {
  badgeId: string;
  unlockedAt: number;
  progress: number;
}

export interface BadgeProgress {
  badgeId: string;
  current: number;
  target: number;
  percentage: number;
}

// Frontend-to-backend badge ID aliases (to tolerate legacy/app IDs)
const BADGE_ID_ALIASES: Record<string, string> = {
  // mileage
  first_steps: 'first_ride',
  first_bike: 'first_ride',
  km_100: 'century',
  hundred_km: 'century',
  km_500: 'half_marathon',
  km_1000: 'marathon',
  thousand_km: 'marathon',
  km_2000: 'ultra_marathon',
  distance_master: 'ultra_marathon',
  // ownership/maintenance/component
  bike_owner: 'bike_collector',
  bike_collector: 'bike_collector',
  maintenance_master: 'maintenance_master',
  maintenance_expert: 'maintenance_master',
  component_master: 'component_expert',
  big_spender: 'big_spender',
  dedicated_rider: 'dedicated_rider'
};

function normalizeBadgeId(requestedId: string): string {
  const lower = (requestedId || '').toLowerCase();
  return BADGE_ID_ALIASES[lower] || lower;
}

// Badge definitions
export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'first_ride',
    name: 'First Ride',
    description: 'Complete your first ride',
    icon: '🚴',
    rarity: 'common',
    category: 'mileage',
    requirements: [{ type: 'total_mileage', value: 1 }]
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Ride 100 kilometers',
    icon: '💯',
    rarity: 'common',
    category: 'mileage',
    requirements: [{ type: 'total_mileage', value: 100 }]
  },
  {
    id: 'half_marathon',
    name: 'Half Marathon',
    description: 'Ride 500 kilometers',
    icon: '🏃',
    rarity: 'rare',
    category: 'mileage',
    requirements: [{ type: 'total_mileage', value: 500 }]
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Ride 1000 kilometers',
    icon: '🏅',
    rarity: 'rare',
    category: 'mileage',
    requirements: [{ type: 'total_mileage', value: 1000 }]
  },
  {
    id: 'ultra_marathon',
    name: 'Ultra Marathon',
    description: 'Ride 2000 kilometers',
  icon: 'trophy',
    rarity: 'epic',
    category: 'mileage',
    requirements: [{ type: 'total_mileage', value: 2000 }]
  },
  {
    id: 'bike_collector',
    name: 'Bike Collector',
    description: 'Own 3 bikes',
    icon: 'bike',
    rarity: 'common',
    category: 'achievement',
    requirements: [{ type: 'bike_count', value: 3 }]
  },
  {
    id: 'maintenance_master',
    name: 'Maintenance Master',
    description: 'Log 10 service records',
    icon: 'wrench',
    rarity: 'rare',
    category: 'maintenance',
    requirements: [{ type: 'service_count', value: 10 }]
  },
  {
    id: 'component_expert',
    name: 'Component Expert',
    description: 'Track 5 components',
    icon: '⚙️',
    rarity: 'common',
    category: 'achievement',
    requirements: [{ type: 'component_count', value: 5 }]
  },
  {
    id: 'big_spender',
    name: 'Big Spender',
    description: 'Spend $500 on maintenance',
    icon: '💰',
    rarity: 'epic',
    category: 'maintenance',
    requirements: [{ type: 'service_cost', value: 500 }]
  },
  {
    id: 'dedicated_rider',
    name: 'Dedicated Rider',
    description: 'Active for 30 days',
    icon: '📅',
    rarity: 'rare',
    category: 'achievement',
    requirements: [{ type: 'days_active', value: 30 }]
  }
];

export const badgeService = {
  /**
   * Get all available badges
   */
  getAllBadges: async (): Promise<Badge[]> => {
    logger.info('Getting all badge definitions');
    return BADGE_DEFINITIONS;
  },

  /**
   * Get user's unlocked badges
   */
  getUserBadges: async (uid: string): Promise<Badge[]> => {
    try {
      logger.info(`Getting badges for user: ${uid}`);
      
      const userBadgesRef = db.collection('user_badges').where('uid', '==', uid);
      const snapshot = await userBadgesRef.get();
      
      if (snapshot.empty) {
        logger.info(`No badges found for user: ${uid}`);
        return [];
      }
      
      const userBadges: Badge[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const badgeDef = BADGE_DEFINITIONS.find(b => b.id === data.badgeId);
        if (badgeDef) {
          userBadges.push({
            ...badgeDef,
            isUnlocked: true,
            unlockedAt: data.unlockedAt,
            progress: data.progress
          });
        }
      });
      
      logger.info(`Found ${userBadges.length} badges for user: ${uid}`);
      return userBadges;
    } catch (error) {
      logger.error('Error getting user badges:', error);
      throw new CustomError('Failed to get user badges', 500, 'DATABASE_ERROR');
    }
  },

  /**
   * Get specific user badge
   */
  getUserBadge: async (uid: string, badgeId: string): Promise<UserBadge | null> => {
    try {
      const normalizedId = normalizeBadgeId(badgeId);
      logger.info(`🏆 Getting badge ${badgeId} (normalized: ${normalizedId}) for user: ${uid}`);
      
      const badgeRef = db.collection('user_badges')
        .where('uid', '==', uid)
        .where('badgeId', '==', normalizedId);
      const snapshot = await badgeRef.get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      if (!doc) {
        return null;
      }
      const data = doc.data();
      
      return {
        badgeId: data.badgeId,
        unlockedAt: data.unlockedAt,
        progress: data.progress
      };
    } catch (error) {
      logger.error('Error getting user badge:', error);
      throw new CustomError('Failed to get user badge', 500, 'DATABASE_ERROR');
    }
  },

  /**
   * Unlock a badge for a user
   */
  unlockBadge: async (uid: string, badgeId: string): Promise<boolean> => {
    try {
      const normalizedId = normalizeBadgeId(badgeId);
      logger.info(`🏆 Unlocking badge ${badgeId} (normalized: ${normalizedId}) for user: ${uid}`);
      
      // Check if badge is already unlocked
      const existingBadge = await badgeService.getUserBadge(uid, normalizedId);
      if (existingBadge) {
        logger.info(`Badge ${normalizedId} already unlocked for user: ${uid}`);
        return true;
      }
      
      // Get badge definition
      const badgeDef = BADGE_DEFINITIONS.find(b => b.id === normalizedId);
      if (!badgeDef) {
        throw new CustomError('Badge not found', 404, 'BADGE_NOT_FOUND');
      }
      
      // Create user badge record
      const userBadge: UserBadge = {
        badgeId: normalizedId,
        unlockedAt: Date.now(),
        progress: 100
      };
      
      await db.collection('user_badges').add({
        uid,
        ...userBadge,
        createdAt: Date.now()
      });
      
      logger.info(`✅ Badge ${normalizedId} unlocked for user: ${uid}`);
      return true;
    } catch (error) {
      logger.error('Error unlocking badge:', error);
      throw new CustomError('Failed to unlock badge', 500, 'DATABASE_ERROR');
    }
  },

  /**
   * Check and unlock badges based on user stats
   */
  checkAndUnlockBadges: async (uid: string): Promise<Badge[]> => {
    try {
      logger.info(`Checking badges for user: ${uid}`);
      
      // Get user stats
      const stats = await badgeService.getUserStats(uid);
      logger.info(
        `User stats -> mileage: ${stats.totalMileage}km, bikes: ${stats.bikeCount}, services: ${stats.serviceCount}, components: ${stats.componentCount}, serviceCost: $${stats.totalServiceCost}, daysActive: ${stats.daysActive}`
      );
      
      const unlockedBadges: Badge[] = [];
      
      for (const badgeDef of BADGE_DEFINITIONS) {
        logger.info(`Evaluating badge '${badgeDef.name}' (${badgeDef.id})`);
        // Check if badge is already unlocked
        const existingBadge = await badgeService.getUserBadge(uid, badgeDef.id);
        if (existingBadge) {
          logger.info(`Already unlocked: ${badgeDef.id}`);
          continue; // Already unlocked
        }
        
        // Check if requirements are met
        const results: { type: string; need: number; have: number; ok: boolean }[] = [];
        const shouldUnlock = badgeDef.requirements.every(req => {
          switch (req.type) {
            case 'total_mileage': {
              const ok = stats.totalMileage >= req.value;
              results.push({ type: 'total_mileage', need: req.value, have: stats.totalMileage, ok });
              return ok;
            }
            case 'bike_count': {
              const ok = stats.bikeCount >= req.value;
              results.push({ type: 'bike_count', need: req.value, have: stats.bikeCount, ok });
              return ok;
            }
            case 'service_count': {
              const ok = stats.serviceCount >= req.value;
              results.push({ type: 'service_count', need: req.value, have: stats.serviceCount, ok });
              return ok;
            }
            case 'component_count': {
              const ok = stats.componentCount >= req.value;
              results.push({ type: 'component_count', need: req.value, have: stats.componentCount, ok });
              return ok;
            }
            case 'service_cost': {
              const ok = stats.totalServiceCost >= req.value;
              results.push({ type: 'service_cost', need: req.value, have: stats.totalServiceCost, ok });
              return ok;
            }
            case 'days_active': {
              const ok = stats.daysActive >= req.value;
              results.push({ type: 'days_active', need: req.value, have: stats.daysActive, ok });
              return ok;
            }
            default:
              results.push({ type: 'unknown', need: req.value, have: 0, ok: false });
              return false;
          }
        });

        // Log per-badge evaluation breakdown
        results.forEach(r =>
          logger.info(`   - ${badgeDef.id} req ${r.type}: need=${r.need}, have=${r.have} -> ${r.ok ? 'OK' : 'NO'}`)
        );
        
        if (shouldUnlock) {
          logger.info(`Unlocking badge ${badgeDef.id} for user ${uid}`);
          await badgeService.unlockBadge(uid, badgeDef.id);
          unlockedBadges.push({
            ...badgeDef,
            isUnlocked: true,
            unlockedAt: Date.now(),
            progress: 100
          });
        } else {
          logger.info(`Not yet eligible for ${badgeDef.id}`);
        }
      }
      
      logger.info(`Unlocked ${unlockedBadges.length} new badges for user: ${uid}`);
      return unlockedBadges;
    } catch (error) {
      logger.error('Error checking badges:', error);
      throw new CustomError('Failed to check badges', 500, 'DATABASE_ERROR');
    }
  },

  /**
   * Get user statistics for badge checking
   */
  getUserStats: async (uid: string) => {
    try {
      logger.info(`📊 Getting user stats for: ${uid}`);
      
      // Get bikes (primary source for mileage)
      let bikes: any[] = [];
      try {
        const bikesSnapshot = await db.collection('bikes')
          .where('ownerUid', '==', uid)
          .get();
        bikes = bikesSnapshot.docs.map(doc => doc.data());
      } catch (e) {
        logger.warn(`Failed to fetch bikes for ${uid}: ${String(e)}`);
      }
      const totalMileage = bikes.reduce((sum, bike) => sum + (bike.totalMileage || 0), 0);
      const bikeCount = bikes.length;

      // Get service logs (optional - tolerate missing index)
      let serviceLogs: any[] = [];
      try {
        const serviceLogsSnapshot = await db.collectionGroup('service-logs')
          .where('userUid', '==', uid)
          .get();
        serviceLogs = serviceLogsSnapshot.docs.map(doc => doc.data());
      } catch (e) {
        logger.warn(`Service logs query failed (likely missing index) for ${uid}: ${String(e)}`);
      }
      const serviceCount = serviceLogs.length;
      const totalServiceCost = serviceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

      // Get components (optional)
      let componentCount = 0;
      try {
        const componentsSnapshot = await db.collection('components')
          .where('ownerUid', '==', uid)
          .get();
        componentCount = componentsSnapshot.docs.length;
      } catch (e) {
        logger.warn(`Components query failed for ${uid}: ${String(e)}`);
      }

      // Calculate days active (optional)
      let daysActive = 0;
      try {
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();
        daysActive = userData?.createdAt
          ? Math.floor((Date.now() - userData.createdAt) / (1000 * 60 * 60 * 24))
          : 0;
      } catch (e) {
        logger.warn(`User doc fetch failed for ${uid}: ${String(e)}`);
      }
      
      const stats = {
        totalMileage,
        bikeCount,
        serviceCount,
        componentCount,
        totalServiceCost,
        daysActive
      };
      
      logger.info(`📊 User stats calculated: ${JSON.stringify(stats)}`);
      return stats;
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw new CustomError('Failed to get user stats', 500, 'DATABASE_ERROR');
    }
  },

  /**
   * Get badge progress for all badges
   */
  getBadgeProgress: async (uid: string): Promise<BadgeProgress[]> => {
    try {
      logger.info(`📈 Getting badge progress for user: ${uid}`);
      
      const stats = await badgeService.getUserStats(uid);
      const progress: BadgeProgress[] = [];
      
      for (const badgeDef of BADGE_DEFINITIONS) {
        const requirement = badgeDef.requirements[0]; // Use first requirement
        if (!requirement) {
          continue; // Skip badges without requirements
        }
        let current = 0;
        
        switch (requirement.type) {
          case 'total_mileage':
            current = stats.totalMileage;
            break;
          case 'bike_count':
            current = stats.bikeCount;
            break;
          case 'service_count':
            current = stats.serviceCount;
            break;
          case 'component_count':
            current = stats.componentCount;
            break;
          case 'service_cost':
            current = stats.totalServiceCost;
            break;
          case 'days_active':
            current = stats.daysActive;
            break;
        }
        
        const percentage = Math.min(100, Math.floor((current / requirement.value) * 100));
        
        progress.push({
          badgeId: badgeDef.id,
          current,
          target: requirement.value,
          percentage
        });
      }
      
      logger.info(`📈 Calculated progress for ${progress.length} badges`);
      return progress;
    } catch (error) {
      logger.error('Error getting badge progress:', error);
      throw new CustomError('Failed to get badge progress', 500, 'DATABASE_ERROR');
    }
  }
};
