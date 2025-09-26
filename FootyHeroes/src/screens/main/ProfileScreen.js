import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/slices/authSlice';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await dispatch(logoutUser());
  };

  const statusOptions = ['Online', 'Away', 'Busy'];
  const handleStatusChange = () => {
    Alert.alert(
      'Status',
      statusOptions.map(status => ({ 
        text: status, 
        onPress: () => Alert.alert('Status changed', `Status set to ${status}`)
      }))
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Feature coming soon!');
  };

  const menuItems = [
    { title: 'Edit Profile', icon: 'person', onPress: handleEditProfile },
    { title: 'Settings', icon: 'settings', onPress: () => Alert.alert('Settings', 'Feature coming soon!') },
    { title: 'Help', icon: 'help-circle', onPress: () => Alert.alert('Help', 'Contact support') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={styles.statusBadge}
              onPress={handleStatusChange}
            >
              <View style={styles.statusIndicator} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user?.fullName || 'Guest'}</Text>
          <Text style={styles.email}>{user?.email || 'Not logged in'}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.stats?.reputationScore || 0}</Text>
            <Text style={styles.statLabel}>Reputation</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.stats?.matchesPlayed || 0}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.stats?.goals || 0}</Text>
            <Text style={styles.statLabel}>Goals</Text>
          </View>
        </View>

        {/* Menu Items */}
        <ScrollView contentContainerStyle={styles.menuContent} showsVerticalScrollIndicator={false}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <Ionicons name={item.icon} size={22} color="#666" />
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={22} color="#ccc" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="power" size={22} color="#C04A3A" />
            <Text style={[styles.menuText, { color: '#C04A3A' }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={22} color="#ccc" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Text style={styles.modalMessage}>Do you really want to logout?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={confirmLogout}
              >
                <Text style={styles.modalTextDelete}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 0 },
  content: { flex: 1, padding: 16 },
  header: { alignItems: 'center', marginBottom: 20, padding: 0 },
  avatarContainer: { position: 'relative' },
  statusBadge: {
    borderColor: '#FFF',
    borderWidth: 2,
    borderRadius: 40,
    padding: 0,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#51FF0D',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: '#333',
  },
  email: { fontSize: 16, color: '#666' },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statCard: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, color: '#FF6B35' },
  statLabel: { fontSize: 12, color: '#666' },
  menuContent: { padding: 0 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 6,
  },
  menuText: { marginLeft: 12, flex: 1, fontSize: 16 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalMessage: { fontSize: 16, marginBottom: 16 },
  modalButtons: { flexDirection: 'row' },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  modalButtonCancel: { backgroundColor: '#666' },
  modalButtonDelete: { backgroundColor: '#C04A3A' },
  modalTextCancel: { color: '#FFF', fontWeight: 'bold' },
  modalTextDelete: { color: '#FFF', fontWeight: 'bold' },
});

export default ProfileScreen;
