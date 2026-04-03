import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Platform, Switch, Image, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';

const EmployeeEdit = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { employee } = route.params;

    const [employeeName, setEmployeeName] = useState(employee.name || '');
    const [designation, setDesignation] = useState(employee.designation || '');
    const [salary, setSalary] = useState(employee.salary?.toString() || '');
    const [joinDate, setJoinDate] = useState(employee.joinDate ? new Date(employee.joinDate) : new Date());
    const [birthDay, setBirthDay] = useState(employee.dateOfBirth ? new Date(employee.dateOfBirth) : new Date('2000-01-01'));
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(employee.departmentId || null);
    const [showJoinPicker, setShowJoinPicker] = useState(false);
    const [showBirthPicker, setShowBirthPicker] = useState(false);
    const [activeEmployee, setActiveEmployee] = useState(employee.status === 'ACTIVE');
    const [number, setNumber] = useState(employee.phoneNumber || '');
    const [address, setAddress] = useState(employee.address || '');
    const [employeeNumber, setEmployeeNumber] = useState(employee.employeeNumber || '');
    const [study, setStudy] = useState(employee.study || '');
    const [experience, setExperience] = useState(employee.experience || '');
    const [achievement, setAchievement] = useState(employee.achievement || '');
    const [marks10, setMarks10] = useState(employee.marks10 || '');
    const [marks12, setMarks12] = useState(employee.marks12 || '');
    const [graduationMarks, setGraduationMarks] = useState(employee.graduationMarks || '');
    const [avatarUrl, setAvatarUrl] = useState(employee.avatarUrl || '');
    const [positions, setPositions] = useState([]);
    const [selectedPosition, setSelectedPosition] = useState(employee.positionId || null);
    const [gender, setGender] = useState(employee.gender || null);
    const [loading, setLoading] = useState(false);
    const [faceStatus, setFaceStatus] = useState({ registered: false, message: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const depts = await apiService.getDepartments();
                if (Array.isArray(depts)) {
                    setDepartments(depts.map(d => ({ label: d.name, value: d.id })));
                }
            } catch (error) {
                console.error('Failed to fetch departments:', error);
            }

            try {
                const posts = await apiService.getPositions();
                if (Array.isArray(posts)) {
                    setPositions(posts.map(p => ({ label: p.title, value: p.id })));
                }
            } catch (error) {
                console.error('Failed to fetch positions:', error);
            }

            try {
                const status = await apiService.checkFaceStatus(employee.id);
                if (status) {
                    setFaceStatus(status);
                }
            } catch (error) {
                console.error('Failed to fetch face status:', error);
            }
        };
        fetchData();
    }, []);

    const handleResetFace = async () => {
        Alert.alert(
            "Clear Face Data",
            `Are you sure you want to clear face verification data for ${employeeName}?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Clear Data", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await apiService.resetFaceData(employee.id);
                            setFaceStatus({ registered: false, message: 'Data cleared' });
                            Alert.alert("Success", "Employee face data cleared successfully.");
                        } catch (error) {
                            Alert.alert("Error", "Failed to clear face data.");
                        } finally {
                            setLoading(false);
                        }
                    } 
                }
            ]
        );
    };

    const onJoinDateChange = (event, selectedDate) => {
        setShowJoinPicker(Platform.OS === 'ios');
        if (selectedDate) setJoinDate(selectedDate);
    };

    const onBirthDateChange = (event, selectedDate) => {
        setShowBirthPicker(Platform.OS === 'ios');
        if (selectedDate) setBirthDay(selectedDate);
    };

    const handleUpdate = async () => {
        if (!employeeName) {
            Alert.alert('Error', 'Name is required.');
            return;
        }
        setLoading(true);
        try {
            const updateData = {
                name: employeeName,
                salary: parseFloat(salary) || 0,
                joinDate: joinDate,
                dateOfBirth: birthDay,
                status: activeEmployee ? 'ACTIVE' : 'INACTIVE',
                phoneNumber: number,
                address: address,
                designation: designation,
                departmentId: selectedDepartment,
                positionId: selectedPosition,
                gender: gender,
                employeeNumber: employeeNumber,
                avatarUrl: avatarUrl,
                study: study,
                experience: experience,
                achievement: achievement,
                marks10: marks10,
                marks12: marks12,
                graduationMarks: graduationMarks
            };
            const response = await apiService.updateEmployeeProfile(employee.id, updateData);

            if (response && response.id) {
                Alert.alert("Success", "Employee details updated successfully");
                navigation.navigate("ManagerDrawer", { 
                    screen: "Dashboard", 
                    params: { screen: "Employees" } 
                });
            } else {
                throw new Error(response.message || 'Failed to update employee');
            }
        } catch (error) {
            console.error('Failed to update employee', error);
            Alert.alert('Error', error.message || 'Failed to update employee. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView className="bg-white flex-1">
                <View style={styles.header} className="bg-gray-700 px-5">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back-circle-outline" size={34} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerText} className="text-white">
                        Edit Employee Details
                    </Text>
                </View>

                <View className="px-5 pt-4 pb-10">
                    <Text style={styles.label}>Full Name :</Text>
                    <TextInput
                        style={styles.input}
                        value={employeeName}
                        onChangeText={setEmployeeName}
                        placeholder="Enter full name"
                    />

                    <Text style={styles.label}>Select Avatar :</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarPicker}>
                        {[
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611722.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611746.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611734.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611740.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611728.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2151114515.jpg',
                        ].map((url, index) => (
                            <TouchableOpacity 
                                key={index} 
                                onPress={() => setAvatarUrl(url)}
                                style={[
                                    styles.avatarOption,
                                    avatarUrl === url && styles.avatarSelected
                                ]}
                            >
                                <Image source={{ uri: url }} style={styles.avatarImage} />
                                {avatarUrl === url && (
                                    <View style={styles.checkBadge}>
                                        <Ionicons name="checkmark-circle" size={20} color="#3FC28A" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity 
                            onPress={() => setAvatarUrl('')}
                            style={[
                                styles.avatarOption,
                                avatarUrl === '' && styles.avatarSelected,
                                { backgroundColor: '#edf2f7', justifyContent: 'center', alignItems: 'center' }
                            ]}
                        >
                            <Text style={{ fontSize: 10, color: '#4a5568', textAlign: 'center' }}>Initials Only</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <Text style={styles.label}>Employee Number :</Text>
                    <TextInput
                        style={styles.input}
                        value={employeeNumber}
                        onChangeText={setEmployeeNumber}
                        placeholder="e.g. EMP1001"
                    />

                    <Text style={styles.label}>Gender :</Text>
                    <View style={styles.pickerContainer}>
                        <RNPickerSelect
                            onValueChange={(value) => setGender(value)}
                            items={[
                                { label: 'Male', value: 'MALE' },
                                { label: 'Female', value: 'FEMALE' },
                                { label: 'Other', value: 'OTHER' },
                            ]}
                            placeholder={{ label: 'Select Gender...', value: null }}
                            value={gender}
                            style={pickerSelectStyles}
                        />
                    </View>

                    <Text style={styles.label}>Department :</Text>
                    <View style={styles.pickerContainer}>
                        <RNPickerSelect
                            onValueChange={(value) => setSelectedDepartment(value)}
                            items={departments}
                            placeholder={{ label: 'Select Department...', value: null }}
                            value={selectedDepartment}
                            style={pickerSelectStyles}
                        />
                    </View>

                    <Text style={styles.label}>Position :</Text>
                    <View style={styles.pickerContainer}>
                        <RNPickerSelect
                            onValueChange={(value) => setSelectedPosition(value)}
                            items={positions}
                            placeholder={{ label: 'Select Position...', value: null }}
                            value={selectedPosition}
                            style={pickerSelectStyles}
                        />
                    </View>

                    <Text style={styles.label}>Designation (Title) :</Text>
                    <TextInput
                        style={styles.input}
                        value={designation}
                        onChangeText={setDesignation}
                    />

                    <Text style={styles.label}>Salary :</Text>
                    <TextInput
                        style={styles.input}
                        value={salary}
                        onChangeText={setSalary}
                        keyboardType="numeric"
                    />
                    
                    <Text style={styles.label}>Join Date :</Text>
                    <TouchableOpacity onPress={() => setShowJoinPicker(true)} style={styles.dateButton}>
                        <Text>{joinDate.toLocaleDateString()}</Text>
                        <Ionicons name="calendar-outline" size={20} color="gray" />
                    </TouchableOpacity>
                    {showJoinPicker && (
                        <DateTimePicker
                            value={joinDate}
                            mode="date"
                            display="default"
                            onChange={onJoinDateChange}
                        />
                    )}

                    <Text style={styles.label}>Date of Birth :</Text>
                    <TouchableOpacity onPress={() => setShowBirthPicker(true)} style={styles.dateButton}>
                        <Text>{birthDay.toLocaleDateString()}</Text>
                        <Ionicons name="calendar-outline" size={20} color="gray" />
                    </TouchableOpacity>
                    {showBirthPicker && (
                        <DateTimePicker
                            value={birthDay}
                            mode="date"
                            display="default"
                            onChange={onBirthDateChange}
                        />
                    )}

                    <Text style={styles.label}>Phone Number :</Text>
                    <TextInput
                        style={styles.input}
                        value={number}
                        onChangeText={setNumber}
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>Address :</Text>
                    <TextInput
                        style={styles.input}
                        value={address}
                        onChangeText={setAddress}
                        multiline
                    />

                    <Text style={styles.label}>Study :</Text>
                    <TextInput
                        style={styles.input}
                        value={study}
                        onChangeText={setStudy}
                        placeholder="e.g. Bachelor of Science"
                    />

                    <Text style={styles.label}>Experience :</Text>
                    <TextInput
                        style={styles.input}
                        value={experience}
                        onChangeText={setExperience}
                        placeholder="e.g. 5 years in HR"
                    />

                    <Text style={styles.label}>Achievements :</Text>
                    <TextInput
                        style={styles.input}
                        value={achievement}
                        onChangeText={setAchievement}
                        placeholder="e.g. Employee of the Month"
                    />

                    <Text style={styles.label}>Academic Marks (10th) :</Text>
                    <TextInput
                        style={styles.input}
                        value={marks10}
                        onChangeText={setMarks10}
                    />

                    <Text style={styles.label}>Academic Marks (12th) :</Text>
                    <TextInput
                        style={styles.input}
                        value={marks12}
                        onChangeText={setMarks12}
                    />

                    <Text style={styles.label}>Graduation Marks :</Text>
                    <TextInput
                        style={styles.input}
                        value={graduationMarks}
                        onChangeText={setGraduationMarks}
                    />

                    <View className="flex-row items-center justify-between mt-4">
                        <Text style={styles.label}>Status Active :</Text>
                        <Switch
                            value={activeEmployee}
                            onValueChange={setActiveEmployee}
                            trackColor={{ true: '#3fc2896c', false: '#ccc' }}
                            thumbColor={activeEmployee ? '#3FC28A' : '#f4f3f4'}
                        />
                    </View>

                    {faceStatus.registered && (
                        <View className="flex-row items-center justify-between mt-4 bg-red-50 p-4 rounded-lg border border-red-200 pb-4">
                            <View>
                                <Text className="font-bold text-red-800">Face Data Detected</Text>
                                <Text className="text-xs text-red-600 mt-1">Has verification access</Text>
                            </View>
                            <TouchableOpacity 
                                style={{ backgroundColor: '#EF4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }} 
                                onPress={handleResetFace}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Reset Face</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {loading ? (
                        <View className="bg-gray-700 rounded-lg p-4 mt-5">
                            <ActivityIndicator size="small" color="#fff" />
                        </View>
                    ) : (
                        <TouchableOpacity className="p-4 mt-5 rounded-lg bg-gray-700" onPress={handleUpdate}>
                            <Text className="text-center text-white text-[16px] font-medium">Update Details</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 20,
    },
    label: {
        marginTop: 12,
        fontWeight: 'bold',
        color: '#4A5568'
    },
    input: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        marginTop: 5,
        borderRadius: 10,
        backgroundColor: '#F7FAFC'
    },
    dateButton: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        marginTop: 5,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F7FAFC'
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 5,
        borderRadius: 10,
        backgroundColor: '#F7FAFC'
    },
    avatarPicker: {
        marginTop: 10,
        paddingBottom: 10,
        flexDirection: 'row'
    },
    avatarOption: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 15,
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative'
    },
    avatarSelected: {
        borderColor: '#4F8EF7'
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 35
    },
    checkBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: 'white',
        borderRadius: 10
    }
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        color: '#1A202C',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 8,
        color: '#1A202C',
        paddingRight: 30,
    },
    placeholder: {
        color: '#A0AEC0',
    }
});

export default EmployeeEdit;
