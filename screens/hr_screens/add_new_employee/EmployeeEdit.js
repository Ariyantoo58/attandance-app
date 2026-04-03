import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Platform, Switch, Image, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../../../auth/authSlice';

const EmployeeEdit = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { employee } = route.params;

    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const loggedInEmployeeId = user?.user?.employeeId || user?.user?.employee?.id;

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
                // If editing self, update the Redux state to reflect changes instantly (e.g. in Drawer)
                if (employee.id === loggedInEmployeeId) {
                    dispatch(updateUserProfile({
                        name: employeeName,
                        avatarUrl: avatarUrl,
                        designation: designation,
                        gender: gender,
                    }));
                }

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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6', paddingTop: 40 }}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
                    <AntDesign name="left" size={18} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Edit Employee</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formCard}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        value={employeeName}
                        onChangeText={setEmployeeName}
                        placeholder="Enter full name"
                    />

                    <Text style={styles.label}>Select Avatar</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarPicker}>
                        {[
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611722.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611746.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611734.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611740.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611728.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611765.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611768.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611753.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611759.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611771.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611777.jpg'
                        ].map((url, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setAvatarUrl(url)}
                                style={[
                                    styles.avatarOption,
                                    avatarUrl === url && styles.avatarSelected
                                ]}
                            >
                                <Image source={{ uri: url }} style={styles.avatarImage} resizeMode="cover" />
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
                            <Ionicons name="person" size={24} color="#a0aec0" />
                            <Text style={{ fontSize: 10, color: '#4a5568', textAlign: 'center', marginTop: 2 }}>Initials</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <Text style={styles.label}>Employee Number</Text>
                    <TextInput
                        style={styles.input}
                        value={employeeNumber}
                        onChangeText={setEmployeeNumber}
                        placeholder="e.g. EMP1001"
                    />

                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.pickerWrapper}>
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

                    <Text style={styles.label}>Department</Text>
                    <View style={styles.pickerWrapper}>
                        <RNPickerSelect
                            onValueChange={(value) => setSelectedDepartment(value)}
                            items={departments}
                            placeholder={{ label: 'Select Department...', value: null }}
                            value={selectedDepartment}
                            style={pickerSelectStyles}
                        />
                    </View>

                    <Text style={styles.label}>Position</Text>
                    <View style={styles.pickerWrapper}>
                        <RNPickerSelect
                            onValueChange={(value) => setSelectedPosition(value)}
                            items={positions}
                            placeholder={{ label: 'Select Position...', value: null }}
                            value={selectedPosition}
                            style={pickerSelectStyles}
                        />
                    </View>

                    <Text style={styles.label}>Designation Title</Text>
                    <TextInput
                        style={styles.input}
                        value={designation}
                        onChangeText={setDesignation}
                    />

                    <Text style={styles.label}>Salary</Text>
                    <TextInput
                        style={styles.input}
                        value={salary}
                        onChangeText={setSalary}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Join Date</Text>
                    <TouchableOpacity onPress={() => setShowJoinPicker(true)} style={styles.dateButton}>
                        <Text style={styles.dateText}>{joinDate.toLocaleDateString()}</Text>
                        <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    {showJoinPicker && (
                        <DateTimePicker
                            value={joinDate}
                            mode="date"
                            display="default"
                            onChange={onJoinDateChange}
                        />
                    )}

                    <Text style={styles.label}>Date of Birth</Text>
                    <TouchableOpacity onPress={() => setShowBirthPicker(true)} style={styles.dateButton}>
                        <Text style={styles.dateText}>{birthDay.toLocaleDateString()}</Text>
                        <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    {showBirthPicker && (
                        <DateTimePicker
                            value={birthDay}
                            mode="date"
                            display="default"
                            onChange={onBirthDateChange}
                        />
                    )}

                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        value={number}
                        onChangeText={setNumber}
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>Address</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        value={address}
                        onChangeText={setAddress}
                        multiline
                    />

                    <Text style={styles.label}>Education & Experience</Text>
                    <TextInput style={styles.input} value={study} onChangeText={setStudy} placeholder="Study" />
                    <TextInput style={styles.input} value={experience} onChangeText={setExperience} placeholder="Experience" />
                    <TextInput style={styles.input} value={achievement} onChangeText={setAchievement} placeholder="Achievement" />
                    <TextInput style={styles.input} value={marks10} onChangeText={setMarks10} placeholder="10th Marks" />
                    <TextInput style={styles.input} value={marks12} onChangeText={setMarks12} placeholder="12th Marks" />
                    <TextInput style={styles.input} value={graduationMarks} onChangeText={setGraduationMarks} placeholder="Graduation Marks" />

                    <View style={styles.statusRow}>
                        <Text style={styles.label}>Status Active</Text>
                        <Switch
                            value={activeEmployee}
                            onValueChange={setActiveEmployee}
                            trackColor={{ true: '#3fc2896c', false: '#eee' }}
                            thumbColor={activeEmployee ? '#3FC28A' : '#f4f3f4'}
                        />
                    </View>

                    {faceStatus.registered && (
                        <View style={styles.faceDataCard}>
                            <View>
                                <Text style={styles.faceDataTitle}>Face Data Detected</Text>
                                <Text style={styles.faceDataSub}>Employee has verification access</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={handleResetFace}
                            >
                                <Text style={styles.resetButtonText}>Reset Face</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.updateButton}
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.updateButtonText}>Update Details</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerBackButton: {
        padding: 5,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    formCard: {
        padding: 20,
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        width: '100%',
        backgroundColor: '#F9FAFB',
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 5
    },
    avatarPicker: {
        marginBottom: 10,
    },
    avatarOption: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 15,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
        backgroundColor: '#f3f4f6'
    },
    avatarSelected: {
        borderColor: '#3B82F6',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 35,
    },
    checkBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: 'white',
        borderRadius: 10,
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        backgroundColor: '#F9FAFB',
        marginBottom: 5
    },
    dateButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        backgroundColor: '#F9FAFB',
        marginBottom: 5
    },
    dateText: {
        fontSize: 16,
        color: '#1F2937'
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    faceDataCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FEF2F2',
        padding: 15,
        borderRadius: 12,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#FEE2E2'
    },
    faceDataTitle: {
        fontWeight: 'bold',
        color: '#991B1B',
        fontSize: 14
    },
    faceDataSub: {
        fontSize: 12,
        color: '#B91C1C',
        marginTop: 2
    },
    resetButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8
    },
    resetButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13
    },
    updateButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 15,
        borderRadius: 12,
        marginTop: 30,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    updateButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
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
