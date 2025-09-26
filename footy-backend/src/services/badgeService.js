const User = require('../models/User');

class BadgeService {
  constructor() {
    // Define all available badges
    this.badges = {
      // Scoring badges
      firstGoal: { name: 'First Goal', icon: '🥅', description: 'Score your first goal', type: 'milestone' },
      scorer: { name: 'Scorer', icon: '🏈', description: 'Score 10 goals', type: 'scoring' },
      striker: { name: 'Striker', icon: '⚽', description: 'Score 20 goals', type: 'scoring' },
      goalMachine: { name: 'Goal Machine', icon: '🔥', description: 'Score 50 goals', type: 'scoring' },
      legend: { name: 'Legend', icon: '👑', description: 'Score 100 goals', type: 'scoring' },

      // Playmaking badges
      firstAssist: { name: 'First Assist', icon: '🤝', description: 'Get your first assist', type: 'milestone' },
      creator: { name: 'Creator', icon: '🎨', description: 'Get 15 assists', type: 'playmaking' },
      playmaker: { name: 'Playmaker', icon: '🎯', description: 'Get 30 assists', type: 'playmaking' },
      mastermind: { name: 'Mastermind', icon: '🧠', description: 'Get 50 assists', type: 'playmaking' },

      // Achievement badges
      firstMVP: { name: 'First MVP', icon: '🏆', description: 'Win your first MVP award', type: 'milestone' },
      starPlayer: { name: 'Star Player', icon: '⭐', description: 'Win 5 MVP awards', type: 'achievement' },
      champion: { name: 'Champion', icon: '👑', description: 'Win 10 MVP awards', type: 'achievement' },

      // Experience badges
      rookie: { name: 'Rookie', icon: '🔰', description: 'Play your first match', type: 'milestone' },
      active: { name: 'Active', icon: '💪', description: 'Play 20 matches', type: 'experience' },
      regular: { name: 'Regular', icon: '🥇', description: 'Play 50 matches', type: 'experience' },
      veteran: { name: 'Veteran', icon: '🎖️', description: 'Play 100 matches', type: 'experience' },
      legend_experience: { name: 'Legend', icon: '🏛️', description: 'Play 200 matches', type: 'experience' },

      // Fair play badges
      fairPlayer: { name: 'Fair Player', icon: '🤝', description: 'Maintain 4.5+ reputation for 10+ matches', type: 'conduct' },
      gentleman: { name: 'Gentleman', icon: '🎩', description: 'No cards in 20+ matches', type: 'conduct' },
      roleModel: { name: 'Role Model', icon: '✨', description: 'Maintain 4.8+ reputation for 25+ matches', type: 'conduct' },

      // Consistency badges
      consistentScorer: { name: 'Consistent Scorer', icon: '📈', description: 'Average 1+ goal per match (10+ matches)', type: 'consistency' },
      reliable: { name: 'Reliable', icon: '🎯', description: 'Play 90%+ of joined matches', type: 'consistency' },
      clutch: { name: 'Clutch Player', icon: '⚡', description: 'Score winning goals in 5+ matches', type: 'consistency' },

      // Special badges
      hattrick: { name: 'Hat-trick Hero', icon: '🎩', description: 'Score a hat-trick', type: 'special' },
      comeback: { name: 'Comeback King', icon: '🔄', description: 'Part of 5+ comeback victories', type: 'special' },
      ironMan: { name: 'Iron Man', icon: '🦾', description: 'Play 50 matches without missing one', type: 'special' },
      earlyBird: { name: 'Early Bird', icon: '🐦', description: 'One of the first 100 players', type: 'special' }
    };
  }

  // Check and award badges to a player
  async checkAndAwardBadges(userId, context = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const newBadges = [];
      const currentBadges = user.badges || [];

      // Check each badge criteria
      for (const [badgeKey, badgeInfo] of Object.entries(this.badges)) {
        // Skip if user already has this badge
        if (currentBadges.find(badge => badge.key === badgeKey)) {
          continue;
        }

        // Check if user qualifies for this badge
        if (await this.checkBadgeCriteria(user, badgeKey, badgeInfo, context)) {
          const newBadge = {
            key: badgeKey,
            ...badgeInfo,
            earnedAt: new Date()
          };
          newBadges.push(newBadge);
        }
      }

      // Award new badges
      if (newBadges.length > 0) {
        user.badges = [...currentBadges, ...newBadges];
        await user.save();
      }

      return {
        success: true,
        message: newBadges.length > 0 ? 'New badges awarded!' : 'No new badges earned',
        data: {
          newBadges,
          totalBadges: user.badges.length
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Check if user meets criteria for a specific badge
  async checkBadgeCriteria(user, badgeKey, badgeInfo, context = {}) {
    switch (badgeKey) {
      // Scoring badges
      case 'firstGoal':
        return user.goals >= 1;
      case 'scorer':
        return user.goals >= 10;
      case 'striker':
        return user.goals >= 20;
      case 'goalMachine':
        return user.goals >= 50;
      case 'legend':
        return user.goals >= 100;

      // Playmaking badges
      case 'firstAssist':
        return user.assists >= 1;
      case 'creator':
        return user.assists >= 15;
      case 'playmaker':
        return user.assists >= 30;
      case 'mastermind':
        return user.assists >= 50;

      // Achievement badges
      case 'firstMVP':
        return user.mvpAwards >= 1;
      case 'starPlayer':
        return user.mvpAwards >= 5;
      case 'champion':
        return user.mvpAwards >= 10;

      // Experience badges
      case 'rookie':
        return user.matchesPlayed >= 1;
      case 'active':
        return user.matchesPlayed >= 20;
      case 'regular':
        return user.matchesPlayed >= 50;
      case 'veteran':
        return user.matchesPlayed >= 100;
      case 'legend_experience':
        return user.matchesPlayed >= 200;

      // Fair play badges
      case 'fairPlayer':
        return user.reputationScore >= 4.5 && user.matchesPlayed >= 10;
      case 'gentleman':
        return (user.yellowCards === 0 && user.redCards === 0) && user.matchesPlayed >= 20;
      case 'roleModel':
        return user.reputationScore >= 4.8 && user.matchesPlayed >= 25;

      // Consistency badges
      case 'consistentScorer':
        return user.matchesPlayed >= 10 && (user.goals / user.matchesPlayed) >= 1;
      case 'reliable':
        // This would need additional tracking of joined vs played matches
        return user.matchesPlayed >= 20; // Simplified for now
      case 'clutch':
        // This would need additional tracking of winning goals
        return context.winningGoals >= 5;

      // Special badges
      case 'hattrick':
        return context.hattrick === true;
      case 'comeback':
        return context.comebackWins >= 5;
      case 'ironMan':
        // This would need additional tracking of consecutive matches
        return user.matchesPlayed >= 50; // Simplified for now
      case 'earlyBird':
        return user.createdAt <= new Date('2024-12-31'); // Adjust date as needed

      default:
        return false;
    }
  }

  // Get all available badges
  getAllBadges() {
    return {
      success: true,
      message: 'All badges retrieved successfully',
      data: {
        badges: this.badges,
        totalBadges: Object.keys(this.badges).length
      }
    };
  }

  // Get badges by category
  getBadgesByCategory(category) {
    const categoryBadges = Object.entries(this.badges)
      .filter(([key, badge]) => badge.type === category)
      .reduce((acc, [key, badge]) => {
        acc[key] = badge;
        return acc;
      }, {});

    return {
      success: true,
      message: `${category} badges retrieved successfully`,
      data: {
        category,
        badges: categoryBadges,
        count: Object.keys(categoryBadges).length
      }
    };
  }

  // Get user's badges with progress
  async getUserBadgesWithProgress(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const userBadges = user.badges || [];
      const badgesWithProgress = [];

      for (const [badgeKey, badgeInfo] of Object.entries(this.badges)) {
        const userBadge = userBadges.find(badge => badge.key === badgeKey);
        const progress = this.calculateBadgeProgress(user, badgeKey);

        badgesWithProgress.push({
          key: badgeKey,
          ...badgeInfo,
          earned: !!userBadge,
          earnedAt: userBadge?.earnedAt || null,
          progress: progress
        });
      }

      return {
        success: true,
        message: 'User badges with progress retrieved successfully',
        data: {
          userId,
          badges: badgesWithProgress,
          earnedCount: userBadges.length,
          totalCount: Object.keys(this.badges).length,
          completionPercentage: ((userBadges.length / Object.keys(this.badges).length) * 100).toFixed(1)
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Calculate progress towards a badge
  calculateBadgeProgress(user, badgeKey) {
    switch (badgeKey) {
      case 'firstGoal':
        return Math.min(100, (user.goals / 1) * 100);
      case 'scorer':
        return Math.min(100, (user.goals / 10) * 100);
      case 'striker':
        return Math.min(100, (user.goals / 20) * 100);
      case 'goalMachine':
        return Math.min(100, (user.goals / 50) * 100);
      case 'legend':
        return Math.min(100, (user.goals / 100) * 100);

      case 'firstAssist':
        return Math.min(100, (user.assists / 1) * 100);
      case 'creator':
        return Math.min(100, (user.assists / 15) * 100);
      case 'playmaker':
        return Math.min(100, (user.assists / 30) * 100);
      case 'mastermind':
        return Math.min(100, (user.assists / 50) * 100);

      case 'firstMVP':
        return Math.min(100, (user.mvpAwards / 1) * 100);
      case 'starPlayer':
        return Math.min(100, (user.mvpAwards / 5) * 100);
      case 'champion':
        return Math.min(100, (user.mvpAwards / 10) * 100);

      case 'rookie':
        return Math.min(100, (user.matchesPlayed / 1) * 100);
      case 'active':
        return Math.min(100, (user.matchesPlayed / 20) * 100);
      case 'regular':
        return Math.min(100, (user.matchesPlayed / 50) * 100);
      case 'veteran':
        return Math.min(100, (user.matchesPlayed / 100) * 100);
      case 'legend_experience':
        return Math.min(100, (user.matchesPlayed / 200) * 100);

      case 'fairPlayer':
        if (user.matchesPlayed < 10) {
          return (user.matchesPlayed / 10) * 50 + Math.min(50, (user.reputationScore / 4.5) * 50);
        }
        return user.reputationScore >= 4.5 ? 100 : (user.reputationScore / 4.5) * 100;

      case 'consistentScorer':
        if (user.matchesPlayed < 10) {
          return (user.matchesPlayed / 10) * 100;
        }
        const ratio = user.goals / user.matchesPlayed;
        return Math.min(100, (ratio / 1) * 100);

      default:
        return 0;
    }
  }

  // Award a specific badge manually (admin function)
  async awardBadgeManually(userId, badgeKey, adminId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!this.badges[badgeKey]) {
        throw new Error('Invalid badge key');
      }

      const currentBadges = user.badges || [];
      
      // Check if user already has this badge
      if (currentBadges.find(badge => badge.key === badgeKey)) {
        throw new Error('User already has this badge');
      }

      const newBadge = {
        key: badgeKey,
        ...this.badges[badgeKey],
        earnedAt: new Date(),
        awardedBy: adminId,
        manualAward: true
      };

      user.badges = [...currentBadges, newBadge];
      await user.save();

      return {
        success: true,
        message: 'Badge awarded successfully',
        data: {
          badge: newBadge,
          totalBadges: user.badges.length
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Remove a badge (admin function)
  async removeBadge(userId, badgeKey, adminId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const currentBadges = user.badges || [];
      const badgeIndex = currentBadges.findIndex(badge => badge.key === badgeKey);

      if (badgeIndex === -1) {
        throw new Error('User does not have this badge');
      }

      user.badges = currentBadges.filter(badge => badge.key !== badgeKey);
      await user.save();

      return {
        success: true,
        message: 'Badge removed successfully',
        data: {
          removedBadge: badgeKey,
          totalBadges: user.badges.length
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = new BadgeService();