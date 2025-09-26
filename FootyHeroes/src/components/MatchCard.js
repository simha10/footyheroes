import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const cardWidth = width - 100; // Account for padding and arrow space

const MatchCard = ({ match }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('MatchDetail', { matchId: match._id });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Date TBD';
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDistance = (location) => {
    if (!location) return 'Unknown distance';
    // This would be calculated based on user's location
    return '0.5 km';
  };

  const getLocationText = (location) => {
    if (!location) return 'Location TBD';
    if (typeof location === 'string') return location;
    if (location.address) return location.address;
    return 'Location specified';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return '#FF6B35';
      case 'full':
        return '#666666';
      case 'ongoing':
        return '#FF6B35';
      case 'completed':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'full':
        return 'Full';
      case 'ongoing':
        return 'Live';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatCost = (match) => {
    if (!match.registrationFee || match.registrationFee <= 0) {
      return 'Free';
    }
    return `$${match.registrationFee}`;
  };

  return (
    <TouchableOpacity style={[styles.card, { width: cardWidth }]} onPress={handlePress}>
      <View style={styles.header}>
        <Text style={styles.format}>{match.format || 'TBD'}</Text>
        <View style={[styles.status, { backgroundColor: getStatusColor(match.status) }]}>
          <Text style={styles.statusText}>{getStatusText(match.status)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {match.title || `${match.format || 'Football'} Match`}
        </Text>

        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {getLocationText(match.location)}
          </Text>
        </View>

        <Text style={styles.datetime}>{formatDateTime(match.matchDate)}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {match.players?.length || 0}/{match.capacity || match.formatsPlayersCount}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="football-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {match.skillLevel || 'Any Level'}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="cash-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{formatCost(match)}</Text>
          </View>
        </View>

        {/* Organizer Info */}
        {match.organizer && (
          <View style={styles.organizerContainer}>
            <Text style={styles.organizerLabel}>Hosted by:</Text>
            <Text style={styles.organizerName}>
              {match.organizer.fullName || match.organizer.email || 'Unknown'}
            </Text>
          </View>
        )}

        {/* Distance */}
        <Text style={styles.distance}>
          {formatDistance(match.location)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

MatchCard.defaultProps = {};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  format: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    textTransform: 'uppercase',
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
    flex: 1,
  },
  datetime: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  organizerContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerLabel: {
    fontSize: 12,
    color: '#666666',
    marginRight: 4,
  },
  organizerName: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  distance: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
  },
});

export default MatchCard;
