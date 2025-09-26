import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CreateMatchScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    format: '',
    skillLevel: '',
    registrationFee: '0',
    additionalInfo: '',
  });
  const [errors, setErrors] = useState({});

  const handleNext = () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.format) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    navigation.navigate('MatchLocation', { matchData: formData });
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const showFormatPicker = () => {
    Alert.alert(
      'Select Match Format',
      'Choose the number of players per team:',
      [
        { text: '5v5', onPress: () => updateField('format', '5v5') },
        { text: '7v7', onPress: () => updateField('format', '7v7') },
        { text: '11v11', onPress: () => updateField('format', '11v11') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const showSkillPicker = () => {
    Alert.alert(
      'Select Skill Level',
      'Choose the organizer\'s skill level:',
      [
        { text: 'Beginner', onPress: () => updateField('skillLevel', 'Beginner') },
        { text: 'Intermediate', onPress: () => updateField('skillLevel', 'Intermediate') },
        { text: 'Advanced', onPress: () => updateField('skillLevel', 'Advanced') },
        { text: 'Semi-Pro', onPress: () => updateField('skillLevel', 'Semi-Pro') },
        { text: 'Professional', onPress: () => updateField('skillLevel', 'Professional') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.label}>Match Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter match title"
            value={formData.title}
            onChangeText={(text) => updateField('title', text)}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter match description"
            value={formData.description}
            onChangeText={(text) => updateField('description', text)}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Format *</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={showFormatPicker}
          >
            <Text style={styles.dropdownText}>
              {formData.format || 'Select Format'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666666" />
          </TouchableOpacity>

          <Text style={styles.label}>Skill Level</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={showSkillPicker}
          >
            <Text style={styles.dropdownText}>
              {formData.skillLevel || 'Select Skill Level'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666666" />
          </TouchableOpacity>

          <Text style={styles.label}>Registration Fee</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.registrationFee}
            onChangeText={(text) => updateField('registrationFee', text)}
            keyboardType="number"
          />

          <Text style={styles.label}>Additional Information</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any other information for players (Optional)"
            value={formData.additionalInfo}
            onChangeText={(text) => updateField('additionalInfo', text)}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next: Set Location</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333333',
  },
  nextButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default CreateMatchScreen;