import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

const MatchDetailScreen = () => {
  const route = useRoute();
  const match = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity><Ionicons name="share-outline" size={24} /></TouchableOpacity>
        <View style={styles.tsts}>  <Text style={styles.tsts}> Match Details </Text></View>
        <TouchableOpacity>  <Text>   </Text>  </TouchableOpacity>
      </View>
      <View style={styles.summary}>
      </View>
      <Text style={{bottom:20}}> </Text>
      <TouchableOpacity style={styles.leave}
        onPress={ () => Alert.alert("Leave", "Are you sure?") }
      >
      </TouchableOpacity>
   </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row',justifyContent: 'space-between', alignItems:'center',padding: 18,borderBottomColor: 'black', borderBottomWidth:1},
  tsts: { fontSize:20, fontWeight:'bold' },
  summary: { flex:1 },
  leave: { backgroundColor:'#C04A3A', borderRadius:8, paddingVertical:12,marginHorizontal: 28 },
});

export default MatchDetailScreen;
