import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../redux/slices/authSlice';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    preferredPosition: '',
    skillLevel: 'Beginner',
    location: {
      coordinates: [0, 0],
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Professional'];
  const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'];

  React.useEffect(() => {
    if (error) {
      Alert.alert('Registration Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRegister = async () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      const userData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        preferredPosition: formData.preferredPosition || undefined,
        skillLevel: formData.skillLevel,
        location: formData.location,
      };
      await dispatch(registerUser(userData));
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Join FootyHeroes!</Text>
          <Text style={styles.subtitle}>Create your football profile</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            value={formData.fullName}
            onChangeText={value => updateField('fullName', value)}
          />

          <TextInput
            style={styles.input}
            placeholder="Email *"
            value={formData.email}
            onChangeText={value => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.phone}
            onChangeText={value => updateField('phone', value)}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Password *"
            value={formData.password}
            onChangeText={value => updateField('password', value)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            value={formData.confirmPassword}
            onChangeText={value => updateField('confirmPassword', value)}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.skillPickerButton}
            onPress={() => Alert.alert('Skill Level', 'Choose from: ' + skillLevels.join(', '))}
          >
            <Text style={styles.pickerText}>Skill Level: {formData.skillLevel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skillPickerButton}
            onPress={() => Alert.alert('Position', 'Choose from: ' + positions.join(', '))}
          >
            <Text style={styles.pickerText}>
              Preferred Position: {formData.preferredPosition || 'Not Set'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInText}>Sign In</Text>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  form: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  skillPickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerText: {
    fontSize: 16,
    color: '#333333',
  },
  registerButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#666666',
    fontSize: 14,
  },
  signInText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
