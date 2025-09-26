const logger = require('./logger');

class NotificationService {
  constructor() {
    this.subscribers = new Map(); // user socket connections
  }

  // Subscribe user to notifications
  subscribe(userId, socketId) {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId).add(socketId);
    logger.info(`User ${userId} subscribed to notifications`);
  }

  // Unsubscribe user
  unsubscribe(userId, socketId) {
    if (this.subscribers.has(userId)) {
      this.subscribers.get(userId).delete(socketId);
      if (this.subscribers.get(userId).size === 0) {
        this.subscribers.delete(userId);
      }
    }
  }

  // Send notification to specific user
  sendToUser(userId, notification, socketIO) {
    try {
      const userSockets = this.subscribers.get(userId);
      if (userSockets && userSockets.size > 0) {
        const socketIds = Array.from(userSockets);
        
        socketIds.forEach(socketId => {
          socketIO.to(socketId).emit('notification:new', {
            ...notification,
            timestamp: new Date().toISOString()
          });
        });
        
        logger.info(`Notification sent to user ${userId}: ${notification.title}`);
      }
    } catch (error) {
      logger.error('Failed to send notification', { userId, error: error.message });
    }
  }

  // Send batch notifications
  sendBatch(notifications, socketIO) {
    try {
      notifications.forEach(({ userId, notification }) => {
        this.sendToUser(userId, notification, socketIO);
      });
    } catch (error) {
      logger.error('Failed to send batch notifications', { error: error.message });
    }
  }

  // Send to all users
  sendToAll(notification, socketIO) {
    try {
      socketIO.emit('notification:global', {
        ...notification,
        timestamp: new Date().toISOString()
      });
      logger.info(`Global notification sent: ${notification.title}`);
    } catch (error) {
      logger.error('Failed to send global notification', { error: error.message });
    }
  }

  // Match-related notification generators
  generateMatchNotifications(type, matchData) {
    const notifications = {
      matchCreated: (match) => ({
        title: 'New Match Created',
        message: `${match.title} has been created`,
        type: 'match_created',
        data: { matchId: match._id }
      }),

      matchJoined: (match, player) => ({
        title: 'Player Joined Match',
        message: `${player.name} joined ${match.title}`,
        type: 'player_joined',
        data: { matchId: match._id, playerId: player._id }
      }),

      matchLeft: (match, player) => ({
        title: 'Player Left Match',
        message: `${player.name} left ${match.title}`,
        type: 'player_left',
        data: { matchId: match._id, playerId: player._id }
      }),

      matchStarting: (match) => ({
        title: 'Match Starting Soon',
        message: `${match.title} starts in 15 minutes`,
        type: 'match_starting',
        data: { matchId: match._id }
      }),

      matchEnded: (match) => ({
        title: 'Match Ended',
        message: `${match.title} has ended`,
        type: 'match_ended',
        data: { matchId: match._id }
      }),

      scoreUpdate: (match, score) => ({
        title: 'Score Update',
        message: `${match.title}: ${score.teamA} - ${score.teamB}`,
        type: 'score_updated',
        data: { matchId: match._id, score }
      })
    };

    return notifications[type] ? notifications[type](matchData) : null;
  }

  // Rating notification
  generateRatingNotification(ratingData) {
    return {
      title: 'New Rating Received',
      message: `You received a ${ratingData.rating}/5 rating`,
      type: 'rating_received',
      data: { 
        matchId: ratingData.matchId,
        raterId: ratingData.raterId,
        rating: ratingData.rating
      }
    };
  }

  // Badge notification
  generateBadgeNotification(badgeData) {
    return {
      title: 'New Badge Earned!',
      message: `Congratulations! You earned the ${badgeData.name} badge`,
      type: 'badge_earned',
      data: { 
        badgeId: badgeData._id,
        badgeName: badgeData.name
      }
    };
  }

  // Player request notification
  generateRequestNotification(requestData) {
    return {
      title: 'New Player Request',
      message: `Players needed for ${requestData.position} in ${requestData.matchTitle}`,
      type: 'player_request',
      data: {
        matchId: requestData.matchId,
        position: requestData.position,
        requesterId: requestData.requesterId
      }
    };
  }
}

module.exports = new NotificationService();
