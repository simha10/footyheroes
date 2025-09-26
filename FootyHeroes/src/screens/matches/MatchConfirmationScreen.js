import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { createMatch } from '../../redux/slices/matchSlice';

const MatchConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  const { matchData } = route.params || {};
  console.log("received matchData:", matchData);

  const mockLocation = matchData?.location || { address: 'Sample Field', coordinates: [55.8064946, -4.1004898] };

  const handlePublishMatch = async () => {
    try {
      await dispatch(createMatch({ data: matchData }));
      Alert.alert('Success', 'Your match has been created successfully.');
      // Navigate to Home as modal stack is closed and main navigation is back
      navigation.navigate('MainNavigator', { screen: 'Home' });
    } catch (err) {
      Alert.alert('Failed', err?.message || "Could not create the match yet, try again.");
    }
  };

  const formatDateTime = (x) => new Date().toISOString(); // Example helper for timestamp

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.editWrap}>
        <Text style={styles.title}>Confirm Match Details</Text>
        <Text>Here is a summary of your match details.</Text>
        <TouchableOpacity
          style={[styles.summaryBlock, { backgroundColor: '#FFF', borderRadius:8 }]}
        >
          <Text style={styles.matchTitle}>
            {matchData?.title || 'Your Match Title'}
          </Text>
          <View style={styles.infoSec}>
            <Text style={styles.info}><Ionicons name="calendar"/> {formatDateTime(matchData.matchDate)}</Text>
            <Text style={styles.info}><Ionicons name="location"/> {mockLocation.address}</Text>
          </View>
          <Text style={styles.matchDes}>{matchData?.description || ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.locationLabel, styles.createBtn]}
          onPress={handlePublishMatch}
        >
          <Text style={[styles.continueBtn, { color: '#FFFFFF', fontSize:18 }, {opacity:1}]}>
            Create & Publish Match
          </Text>
          <Ionicons name="send" size={24} color="#FFFFFF" style={styles.createIcon}/>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  editWrap: { padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  summaryBlock: { padding:16 },
  matchTitle: { fontSize: 20, fontWeight: 'bold', color: '#FF6B35' },
  infoSec: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  info: { color: '#666' },
  matchDes: { color: '#333', marginBottom: 8 },
  locationLabel: { borderRadius: 8, marginTop: 12 },
  createBtn: {
    backgroundColor: '#FF6B35',
    paddingVertical:16,
    paddingHorizontal:24,
    borderRadius: 12,
    flexDirection:'row',
    alignItems:'center',
    justifyContent: 'center',
  },
  continueBtn: { fontWeight: 'bold', textAlign: 'center', color: '#FFFFFF' },
  createIcon: { marginLeft:10 }
});

export default MatchConfirmationScreen;
