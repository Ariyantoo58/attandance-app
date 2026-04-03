import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Switch, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';

const AddNewEmployee = () => {
    const navigation = useNavigation();
    const [employeeName, setEmployeeName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('EMPLOYEE');
    const [loading, setLoading] = useState(false);

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
                employeeNumber: `EMP${Math.floor(1000 + Math.random() * 9000)}` 
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
        <ScrollView className="bg-white flex-1">
            <View style={styles.header} className="bg-gray-700 px-5">
                <Ionicons onPress={() => navigation.goBack()} name="arrow-back-circle-outline" size={34} color="white" />
                <Text style={styles.headerText} className="text-white">
                     Add New User
                </Text>
            </View>
            
            <View className="px-5 pt-4">
                <Text className="text-gray-500 mb-4">Step 1: Create login account for employee</Text>
                
                <Text style={styles.label}>Full Name :</Text>
                <TextInput
                    style={styles.input}
                    value={employeeName}
                    onChangeText={setEmployeeName}
                    placeholder="Enter full name"
                />

                <Text style={styles.label}>Email Address :</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="e.g. employee@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Username :</Text>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="e.g. ari.oke"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Password :</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min. 6 chars"
                    secureTextEntry
                />

                <Text style={styles.label}>System Role :</Text>
                <View style={styles.pickerContainer}>
                    <RNPickerSelect
                        onValueChange={(value) => setRole(value)}
                        items={roles}
                        placeholder={{ label: 'Select Role...', value: null }}
                        value={role}
                        style={pickerSelectStyles}
                    />
                </View>

                {loading ? (
                    <View className="bg-gray-700 rounded-lg p-4 mt-8">
                        <ActivityIndicator size="small" color="#fff" />
                    </View>
                ) : (
                    <TouchableOpacity className="p-4 mt-8 rounded-lg bg-gray-700 shadow-md" onPress={handleSubmit}>
                        <Text className="text-center text-white text-[16px] font-medium">Save & Continue</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        paddingTop: 35,
        paddingBottom: 10
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 45,
    },
    label: {
        marginTop: 8,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 5,
        marginVertical: 5,
        borderRadius: 10,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginVertical: 5,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        marginVertical: 5,
        borderRadius: 10,
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        color: 'black',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 8,
        color: 'black',
        paddingRight: 30,
    },
});

export default AddNewEmployee;
