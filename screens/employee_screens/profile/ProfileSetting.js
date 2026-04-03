import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { apiService } from '../../../services/api';
import { updateUserProfile } from '../../../auth/authSlice';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileSetting = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const employeeId = user?.user?.employeeId;
    const userRole = user?.user?.role?.toLowerCase();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [faceStatus, setFaceStatus] = useState({ registered: false, message: '' });
    
    const [avatarUrl, setAvatarUrl] = useState('');
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [study, setStudy] = useState('');
    const [experience, setExperience] = useState('');
    const [achievement, setAchievement] = useState('');
    const [salary, setSalary] = useState('');
    const [documents, setDocuments] = useState('');
    const [marks10, setMarks10] = useState('');
    const [marks12, setMarks12] = useState('');
    const [graduationMarks, setGraduationMarks] = useState('');
    const [gender, setGender] = useState('');
    const [mobileNo, setMobileNo] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (employeeId) {
            loadProfile();
        }
    }, [employeeId]);

    const loadProfile = useCallback(async () => {
        try {
            setFetching(true);
            const [profile, status] = await Promise.all([
                apiService.getEmployeeProfile(employeeId),
                apiService.checkFaceStatus(employeeId)
            ]);
            
            setFaceStatus(status);
            
            if (profile) {
                setName(profile.name || '');
                setAvatarUrl(profile.avatarUrl || '');
                setDesignation(profile.designation || profile.position?.title || '');
                setDateOfBirth(profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '');
                setStudy(profile.study || '');
                setExperience(profile.experience || '');
                setAchievement(profile.achievement || '');
                setSalary(profile.salary?.toString() || '');
                setDocuments(profile.documents || '');
                setMarks10(profile.marks10?.toString() || '');
                setMarks12(profile.marks12?.toString() || '');
                setGraduationMarks(profile.graduationMarks?.toString() || '');
                setGender(profile.gender || '');
                setMobileNo(profile.phoneNumber || '');
                setAddress(profile.address || '');
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            Alert.alert('Error', 'Failed to load profile details.');
        } finally {
            setFetching(false);
        }
    }, [employeeId]);

    const handleSave = async () => {
        if (!name) {
            Alert.alert('Error', 'Name is required.');
            return;
        }

        try {
            setLoading(true);
            const updateData = {
                name,
                avatarUrl,
                designation,
                study,
                experience,
                achievement,
                marks10,
                marks12,
                graduationMarks,
                gender,
                phoneNumber: mobileNo,
                address,
            };
            await apiService.updateEmployeeProfile(employeeId, updateData);
            dispatch(updateUserProfile({ name, avatarUrl, designation, gender }));
            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Failed to update profile:', error);
            Alert.alert('Error', 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetFace = async () => {
        Alert.alert(
            "Hapus Data Wajah",
            "Apakah Anda yakin ingin menghapus data wajah yang terdaftar? Anda perlu mendaftar ulang untuk menggunakan absensi wajah.",
            [
                { text: "Batal", style: "cancel" },
                { 
                    text: "Hapus", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await apiService.resetFaceData(employeeId);
                            setFaceStatus({ registered: false, message: 'Data cleared' });
                            Alert.alert("Berhasil", "Data wajah berhasil dihapus.");
                        } catch (error) {
                            Alert.alert("Error", "Gagal menghapus data wajah.");
                        } finally {
                            setLoading(false);
                        }
                    } 
                }
            ]
        );
    };

    if (fetching) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ marginTop: 10, color: '#4B5563' }}>Loading Profile...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <AntDesign name="left" size={18} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 32 }} />
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Select Avatar</Text>
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
                                <Text style={{ fontSize: 10, color: '#4a5568', textAlign: 'center' }}>Initials</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            placeholder="Full Name"
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Designation</Text>
                        <TextInput
                            placeholder="Designation"
                            style={styles.input}
                            value={designation}
                            onChangeText={setDesignation}
                            editable={false} // Designation is usually locked for employees
                        />

                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            placeholder="Mobile No"
                            style={styles.input}
                            value={mobileNo}
                            onChangeText={setMobileNo}
                            keyboardType="phone-pad"
                        />

                        <Text style={styles.label}>Address</Text>
                        <TextInput
                            placeholder="Address"
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            value={address}
                            onChangeText={setAddress}
                            multiline
                        />

                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.genderContainer}>
                            <TouchableOpacity onPress={() => setGender('MALE')} style={[styles.genderOption, gender === 'MALE' && styles.genderSelected]}>
                                <Text style={[styles.genderText, gender === 'MALE' && styles.genderTextSelected]}>Male</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setGender('FEMALE')} style={[styles.genderOption, gender === 'FEMALE' && styles.genderSelected]}>
                                <Text style={[styles.genderText, gender === 'FEMALE' && styles.genderTextSelected]}>Female</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Education & Bio</Text>
                        <TextInput placeholder="Highest Study" style={styles.input} value={study} onChangeText={setStudy} />
                        <TextInput placeholder="Experience" style={styles.input} value={experience} onChangeText={setExperience} />
                        <TextInput placeholder="Achievements" style={styles.input} value={achievement} onChangeText={setAchievement} />

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save All Changes</Text>
                            )}
                        </TouchableOpacity>

                        {userRole === 'employee' && (
                            <>
                                <Text style={styles.label}>Face Recognition Status</Text>
                                <View style={styles.faceStatusContainer}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Ionicons 
                                            name={faceStatus.registered ? "shield-checkmark" : "shield-outline"} 
                                            size={24} 
                                            color={faceStatus.registered ? "#10B981" : "#6B7280"} 
                                        />
                                        <View style={{ marginLeft: 12 }}>
                                            <Text style={[styles.faceStatusText, { color: faceStatus.registered ? "#10B981" : "#111827" }]}>
                                                {faceStatus.registered ? "Terverifikasi" : "Belum Terdaftar"}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: '#6B7280' }}>
                                                {faceStatus.registered ? "Data wajah aktif" : "Silakan daftarkan wajah Anda"}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    {faceStatus.registered ? (
                                        <TouchableOpacity 
                                            onPress={handleResetFace}
                                            style={styles.resetButton}
                                        >
                                            <Text style={styles.resetButtonText}>Reset</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.registerButton}
                                            onPress={() => navigation.navigate("FaceRecognition", { 
                                                mode: 'registration', 
                                                employeeId: employeeId,
                                                employeeName: name || 'Employee' 
                                            })}
                                        >
                                            <Text style={styles.registerButtonText}>Daftar</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = {
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 5,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    formContainer: {
        padding: 20,
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
        backgroundColor: 'white',
        fontSize: 16,
        color: '#1F2937',
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
    genderContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    genderOption: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    genderSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    genderText: {
        fontWeight: '600',
        color: '#4B5563',
    },
    genderTextSelected: {
        color: '#3B82F6',
    },
    saveButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 15,
        borderRadius: 12,
        marginTop: 30,
        width: '100%',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    faceStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 5,
    },
    faceStatusText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    resetButton: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    resetButtonText: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 13,
    },
    registerButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    registerButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
    },
};

export default ProfileSetting;