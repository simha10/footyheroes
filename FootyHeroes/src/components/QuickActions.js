import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const QuickActions = () => {
  const navigation = useNavigation();

  const actions = [
    {
      id: 'create-match',
      title: 'Create Match',
      icon: 'add-circle-outline',
      color: '#FF6B35',
      navigate: () => navigation.navigate('CreateMatch'),
    },
    {
      id: 'nearby-matches',
      title: 'Nearby',
      icon: 'location-outline',
      color: '#09BC8A',
      navigate: () => navigation.navigate('Discover'),
    },
    {
      id: 'my-matches',
      title: 'My Matches',
      icon: 'list-outline',
      color: '#B19CD9',
      navigate: () => navigation.navigate('Matches'),
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person-outline',
      color: '#F7DC6F',
      navigate: () => navigation.navigate('Profile'),
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={action.navigate}
          >
            <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon} size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  scroll: {
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    color: '#666666',
  },
});

export default QuickActions;
