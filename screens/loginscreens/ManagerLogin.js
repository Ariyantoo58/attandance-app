import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '@/auth/authSlice';

const schema = yup.object().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const ManagerLogin = ({ setRole }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const navigate = useNavigation();
  const dispatch = useDispatch();
  const loading = useSelector(state => state.auth.loading);
  const error = useSelector(state => state.auth.error);

  const onSubmit = (data) => {
    console.log(data);
    let loginDetails = {
      username: data.username,
      password: data.password,
    }
    dispatch(loginUser(loginDetails));
    setRole('manager');
    console.log(setRole);
  };

  const handleSwitchLogin = () => {
    navigate.navigate('EmployeeLogin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.circleContainerTop}>
            <View style={styles.circleLarge}></View>
            <View style={styles.circleSmall}></View>
          </View>
          <View style={styles.headerRow}>
            <TouchableOpacity 
                onPress={() => navigate.canGoBack() ? navigate.goBack() : navigate.navigate('Welcome')} 
                style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>
          <View style={styles.formContainer}>
            <Image
              source={{ uri: 'https://img.freepik.com/free-vector/boss-man-concept-illustration_114360-19846.jpg?t=st=1717261717~exp=1717265317~hmac=330da47853c0f48794a9e62f67cb42c40c8a83cbca45afa1b55f3cc577d4c093&w=740' }}
              style={styles.logo}
            />
            <View style={styles.header}>
              <Text style={styles.headerText}>Manager Login</Text>
            </View>
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <TextInput
                      style={[styles.input, errors.username && { borderColor: 'red' }]}
                      placeholder="Username"
                      placeholderTextColor="#94A3B8"
                      // keyboardType="em"

                      autoCapitalize="none"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    {errors.username && <Text className="text-red-500 -mt-4 mb-3">{errors.username.message}</Text>}
                  </>
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <View style={[styles.passwordContainer, errors.password && { borderColor: 'red' }]}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                        placeholder="Password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPassword}

                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon} 
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={24} 
                          color="#64748B" 
                        />
                      </TouchableOpacity>
                    </View>

                    {errors.password && <Text className="text-red-500 -mt-4 mb-4">{errors.password.message}</Text>}
                  </>
                )}
              />
              {error ? <Text className="py-1.5 text-center text-red-500 text-[15px] font-medium">{error}</Text> : null}
               <TouchableOpacity style={[styles.button, loading && {opacity: 0.7}]} onPress={handleSubmit(onSubmit)} disabled={loading}>
                <LinearGradient
                    colors={['#1E293B', '#0F172A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                >
                    {loading ? (
                    <ActivityIndicator color="white" />
                    ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                    )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.goSwitchButton} onPress={handleSwitchLogin}>
                <Text style={styles.goSwitchButtonText}>Switch to Employee Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 10,
    paddingTop: 50,
  },
  circleContainerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    zIndex: 10
  },
  circleContainerBottom: {
    position: 'absolute',
    bottom: 5,
    right: 0,
    width: 100,
    height: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#B0B0B0',
    position: 'absolute',
    top: 10,
    left: 10,
  },
  circleSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D3D3D3',
    position: 'absolute',
    top: 50,
    left: 70,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 320,
    height: 320,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333333',
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: 5,
  },
  input: {
    height: 50,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#F1F5F9',
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#F1F5F9',
  },

  eyeIcon: {
    padding: 10,
  },

  button: {
    height: 56,
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  forgotPasswordText: {
    color: '#1E90FF',
    textAlign: 'center',
    fontSize: 16,
  },
  goSwitchButton: {
    height: 50,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  goSwitchButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManagerLogin;