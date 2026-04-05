import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Switch, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';

import { SafeAreaView } from 'react-native-safe-area-context';

const AddNewEmployee = () => {
    const navigation = useNavigation();
    const [employeeName, setEmployeeName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('EMPLOYEE');
    const [loading, setLoading] = useState(false);
    const [ptkpStatus, setPtkpStatus] = useState('TK0');

    const TAX_OPTIONS = [
        { label: 'TK/0 (Single)', value: 'TK0' },
        { label: 'TK/1 (Single, 1 Dep)', value: 'TK1' },
        { label: 'TK/2 (Single, 2 Dep)', value: 'TK2' },
        { label: 'TK/3 (Single, 3 Dep)', value: 'TK3' },
        { label: 'K/0 (Married)', value: 'K0' },
        { label: 'K/1 (Married, 1 Dep)', value: 'K1' },
        { label: 'K/2 (Married, 2 Dep)', value: 'K2' },
        { label: 'K/3 (Married, 3 Dep)', value: 'K3' },
    ];

    const roles = [
        { label: 'Employee', value: 'EMPLOYEE' },
        { label: 'Manager', value: 'MANAGER' },
        { label: 'HR', value: 'HR' },
        { label: 'Admin', value: 'ADMIN' },
    ];

    const handleSubmit = async () => {
        if (!employeeName || !username || !password || !email) {
            Alert.alert('Error', 'Full Name, Email, Username and Password are required.');
            return;
        }
        setLoading(true);
        try {
            const employeeData = {
                name: employeeName,
                username,
                password,
                email,
                role,
                status: 'ACTIVE',
                employeeNumber: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
                ptkpStatus: ptkpStatus
            };
            const response = await apiService.createEmployee(employeeData);

            if (response && response.id) {
                console.log("Creation successful:", response);
                Alert.alert("Success", "User account has been created!", [
                    { 
                        text: "Add Details Later", 
                        onPress: () => {
                            clearFormFields();
                            navigation.navigate("ManagerDrawer", { 
                                screen: "Dashboard", 
                                params: { screen: "Employees" } 
                            });
                        },
                        style: "cancel"
                    },
                    { 
                        text: "Fill Details Now", 
                        onPress: () => {
                            clearFormFields();
                            navigation.replace("EmployeeEdit", { employee: response });
                        }
                    }
                ]);
            } else {
                console.error("Creation failed with response:", response);
                throw new Error(response.message || 'Failed to create user');
            }
        } catch (error) {
            console.error('Failed to add employee', error);
            Alert.alert('Error', error.message || 'Failed to add employee.');
        } finally {
            setLoading(false);
        }
    };

    const clearFormFields = () => {
        setEmployeeName('');
        setUsername('');
        setPassword('');
        setEmail('');
        setRole('EMPLOYEE');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <AntDesign name="left" size={20} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New User</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.formSection}>
                    <Text style={styles.sectionSubtitle}>Step 1: Create login account for employee</Text>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={employeeName}
                            onChangeText={setEmployeeName}
                            placeholder="Enter full name"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="employee@company.com"
                            placeholderTextColor="#94A3B8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="e.g. ari.oke"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Minimum 6 characters"
                            placeholderTextColor="#94A3B8"
                            secureTextEntry
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>System Role</Text>
                        <View style={styles.pickerContainer}>
                            <RNPickerSelect
                                onValueChange={(value) => setRole(value)}
                                items={roles}
                                placeholder={{ label: 'Select Role...', value: null }}
                                value={role}
                                style={pickerSelectStyles}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => <Ionicons name="chevron-down" size={16} color="#94A3B8" style={{ marginTop: Platform.OS === 'ios' ? 15 : 12, marginRight: 10 }} />}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tax Status (PTKP)</Text>
                        <View style={styles.pickerContainer}>
                            <RNPickerSelect
                                onValueChange={(value) => setPtkpStatus(value)}
                                items={TAX_OPTIONS}
                                placeholder={{ label: 'Select Tax Status...', value: null }}
                                value={ptkpStatus}
                                style={pickerSelectStyles}
                                useNativeAndroidPickerStyle={false}
                                Icon={() => <Ionicons name="chevron-down" size={16} color="#94A3B8" style={{ marginTop: Platform.OS === 'ios' ? 15 : 12, marginRight: 10 }} />}
                            />
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="small" color="#1E293B" />
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>Save & Continue</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    formSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 24,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    pickerContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    loaderContainer: {
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    submitButton: {
        backgroundColor: '#0F172A',
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

const pickerSelectStyles = {
    inputIOS: {
        fontSize: 16,
        paddingVertical: 15,
        paddingHorizontal: 15,
        color: '#0F172A',
        paddingRight: 30,
        height: 50,
        width: '100%',
    },
    inputAndroid: {
        fontSize: 15,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: '#0F172A',
        paddingRight: 30,
    },
};

export default AddNewEmployee;
