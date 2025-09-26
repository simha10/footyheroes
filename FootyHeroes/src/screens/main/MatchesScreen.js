import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { fetchMatches } from '../../redux/slices/matchSlice';
import MatchCard from '../../components/MatchCard';

const MatchesScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [selectedTab, setSelectedTab] = useState('all');
  
  const { matches, loading } = useSelector(state => state.matches);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async (status = null) => {
    try {
      await dispatch(fetchMatches(status ? { status } : {}));
    } catch (error) {
      Alert.alert('Error', 'Failed to load matches');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const filterMatches = (status) => {
    setSelectedTab(status);
    loadMatches(status === 'all' ? null : status);
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'ongoing', label: 'Live' },
    { key: 'completed', label: 'Completed' },
  ];

  const getCategoryMatches = () => {
    return matches?.filter(match => {
      const status = match.status;
      if (selectedTab === 'all') return true;
      return status === selectedTab;
    }) || [];
  };

  const filteredMatches = getCategoryMatches();

  const handleCreateMatch = () => {
    navigation.navigate('CreateMatch');
  };

  const renderMatchItem = ({ item }) => (
    <MatchCard match={item} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="football-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>
        {matches?.length === 0
          ? 'No matches found'
          : `No ${selectedTab} matches found`
        }
      </Text>
      {selectedTab === 'all' && (
        <TouchableOpacity style={styles.emptyAction} onPress={handleCreateMatch}>
          <Text style={styles.emptyActionText}>Create First Match</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Matches</Text>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateMatch}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key ? styles.activeTab : null,
            ]}
            onPress={() => filterMatches(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.key ? styles.activeTabText : null,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Matches List */}
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          (!matches || matches.length === 0) && styles.listContentCenter,
        ]}
        data={filteredMatches}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item._id}
        horizontal={false}
        numColumns={1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScrollEndDrag={() => {
          loading ? null : (loading || setRefreshing(false));
        }}
        loading={loading}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  fab: {
    backgroundColor: '#FF6B35',
    borderRadius: 28,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  activeTab: { backgroundColor: '#FF6B35' },
  tabText: {
    color: '#666', fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF', fontWeight: 'bold',
  },
  list: { marginHorizontal: 20 },
  listContent: {
    flexGrow: 1,
    marginVertical: 8,
  },
  listContentCenter: {
    justifyContent: 'center',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyAction: { marginTop: 16 },
  emptyActionText: { color: '#FF6B35', fontWeight: 'bold' },
});
