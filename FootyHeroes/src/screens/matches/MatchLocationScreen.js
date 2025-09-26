import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const MatchLocationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { matchData } = route.params || {};

  console.log("received matchData:", matchData);

  const handleLocationSelect = (location) => {
    Alert.alert('Location', `${location} selected. Map integration coming soon.`);
  };

  const handleNextWithMockLocation = () => {
    const mockLocation = {
      address: 'Sample Stadium',
      coordinates: [55.8064946, -4.1004898]
    };
    navigation.navigate('MatchConfirmation', { 
      matchData: { ...matchData, location: mockLocation }
    });
  };

  const mockLocations = [
    { text: 'Find on Map', style: 'default', onPress: handleLocationSelect },
    { text: 'Giants Stadium', style: 'default', onPress: handleLocationSelect },
    { text: 'Stadium Name', style: 'default', onPress: handleLocationSelect },
    { text: 'Cancel', style: 'cancel' }
  ];

  const handleLocationPicker = () => {
    Alert.alert(
      'Set Location',
      'Location options or integrate a real map component here: ',
      mockLocations,
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.editWrap}>
        <Text style={styles.title}>Match Location</Text>
        <TouchableOpacity style={styles.loc} onPress={handleLocationPicker}>
          <View style={styles.locInner}>
            <View>
              <Text style={styles.locTitle}>Location Name</Text>
              <Text style={styles.locDesc}>Set the location for your match</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C2C2C2" />
          </View>
          <View style={styles.divider} />
        </TouchableOpacity>
        <Text></Text>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNextWithMockLocation}>
          <Text style={styles.nextBtnText}>Next: Review</Text>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" style={{ transform: [{ rotate: '180deg' }], marginLeft:10 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  editWrap: { padding: 24, flex: 1, display:'flex', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: 'bold' , marginBottom:8 },
  loc: { borderRadius:8, backgroundColor: "#FFF", marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locTotal: { padding:16 },
  locInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', padding:16 },
  locTitle: { fontWeight: 'bold', color: '#333', marginBottom:4 },
  locDesc: { color: '#666' },
  divider: { height:1, marginHorizontal:16, backgroundColor:"#F5F5F5" },
  nextBtnB: { borderRadius:8, padding:12, marginTop:8 },
  nextBtn: { backgroundColor: '#FF6B35', borderRadius: 12, flexDirection:'row', alignSelf:'flex-end', alignItems:'center', justifyContent: 'center'},
  nextBtnText: { color: '#FFFFFF', fontWeight: 'bold', paddingVertical:12, paddingHorizontal:16 },
  iconFlip: { transform: [{ rotate: '180deg' }], marginLeft: 4 },
});
