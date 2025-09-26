import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNearbyMatches } from '../../redux/slices/matchSlice';
import MatchCard from '../../components/MatchCard';

const DiscoverScreen = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    format: '',
    skillLevel: '',
    isPublic: null,
  });
  
  const { nearbyMatches, loading } = useSelector(state => state.matches);
  const { user } = useSelector(state => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNearbyMatches();
  }, []);

  const loadNearbyMatches = async () => {
    try {
      if (user?.location?.coordinates) {
        await dispatch(fetchNearbyMatches({
          latitude: user.location.coordinates[1],
          longitude: user.location.coordinates[0],
          ...filters
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load nearby matches');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNearbyMatches();
    setRefreshing(false);
  };

  const formatOptions = ['5v5', '7v7', '11v11'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional'];

  const applyFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Note: A real app would dispatch a new action here
  };

  const clearFilters = () => {
    setFilters({ format: '', skillLevel: '', isPublic: null });
    loadNearbyMatches();
  };

  // Apply filters to matches (client-side filtering as an example)
  const getFilteredMatches = () => {
    let matches = nearbyMatches || [];
    
    // Format filter
    if (filters.format) {
      matches = matches.filter(m => m.format === filters.format);
    }
    
    // Skill level filter
    if (filters.skillLevel) {
      matches = matches.filter(m => m.skillLevel === filters.skillLevel);
    }
    
    return matches;
  };

  const filteredMatches = getFilteredMatches();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover Matches</Text>
        <Text style={styles.subtitle}>Find and join matches near you</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search matches..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filters</Text>
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Format:</Text>
          {formatOptions.map((format) => (
            <TouchableOpacity
              key={format}
              style={[
                styles.filterChip,
                filters.format === format ? styles.selectedFilterChip : null,
              ]}
              onPress={() => applyFilter('format', format)}
            >
              <Text
                style={[
                  styles.filterText,
                  filters.format === format ? styles.selectedFilterText : null,
                ]}
              >
                {format}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Skill:</Text>
          {skillLevels.slice(0, 3).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterChip,
                filters.skillLevel === level ? styles.selectedFilterChip : null,
              ]}
              onPress={() => applyFilter('skillLevel', level)}
            >
              <Text
                style={[
                  styles.filterText,
                  filters.skillLevel === level ? styles.selectedFilterText : null,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={clearFilters} style={styles.clearFilters}>
          <Text style={styles.clearFiltersText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Matches List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          renderItem={({ item }) => <MatchCard match={item} />}
          keyExtractor={(item, index) => `${item._id || index}`}
          horizontal={false}
          numColumns={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            filteredMatches.length === 0 ? styles.emptyListContent : styles.listContent
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>No nearby matches found</Text>
              <Text style={styles.emptySubText}>
                Try expanding your search area or create a new match
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    position: 'relative',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 14,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { position: 'absolute', left: 58, top: 12 },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  filtersTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#333',
  },
  filterChip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#F5F5F5',
  },
  selectedFilterChip: { backgroundColor: '#FF6B35' },
  filterText: {
    fontSize: 12,
    color: '#999',
  },
  selectedFilterText: { color: '#FFFFFF', fontWeight: 'bold' },
  clearFilters: { marginTop: 4 },
  clearFiltersText: { color: '#FF6B35', fontSize: 14 },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    minHeight: 200,
  },
  listContent: { paddingVertical: 8, paddingHorizontal: 20 },
  emptyListContent: { justifyContent: 'center', flex: 1 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 48,
  },
  emptyText: {
    marginTop: 12, fontSize: 16, fontWeight: '500', color: '#666', textAlign: 'center',
  },
  emptySubText: { fontSize: 14, color: '#999', marginTop: 8 },
});
