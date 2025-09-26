import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchMatches, fetchNearbyMatches } from '../../redux/slices/matchSlice';
import { useNavigation } from '@react-navigation/native';
import MatchCard from '../../components/MatchCard';
import QuickActions from '../../components/QuickActions';

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const { matches, nearbyMatches, loading } = useSelector(state => state.matches);
  const { user } = useSelector(state => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      await Promise.all([
        dispatch(fetchMatches({ status: 'open' })),
        dispatch(fetchNearbyMatches({ 
          latitude: user?.location?.coordinates?.[1] || 0, 
          longitude: user?.location?.coordinates?.[0] || 0 
        }))
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to load matches');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const recentMatches = matches?.slice(0, 5) || [];
  const nearbyMatchesData = nearbyMatches?.slice(0, 3) || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.fullName || 'Player'}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={32} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <QuickActions />
        </View>

        {/* Recent Matches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Matches</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Matches')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#FF6B35" style={styles.loading} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {recentMatches.map((match) => (
                <MatchCard key={match._id} match={match} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Nearby Matches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Matches</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
              <Text style={styles.seeAllText}>Explore</Text>
            </TouchableOpacity>
          </View>
          
          {nearbyMatchesData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No nearby matches found</Text>
              <Text style={styles.emptySubText}>Create a match to get started!</Text>
            </View>
          ) : (
            nearbyMatchesData.map((match) => (
              <MatchCard key={match._id} match={match} />
            ))
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.stats?.matchesPlayed || 0}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.stats?.goals || 0}</Text>
              <Text style={styles.statLabel}>Goals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.stats?.assists || 0}</Text>
              <Text style={styles.statLabel}>Assists</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.stats?.mvpAwards || 0}</Text>
              <Text style={styles.statLabel}>MVP Awards</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateMatch')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  profileButton: {
    padding: 8,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  loading: {
    padding: 32,
  },
  horizontalScroll: {
    paddingRight: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6B35',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default HomeScreen;
