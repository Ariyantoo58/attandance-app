import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';

const ProfileDetails = () => {
    const navigation = useNavigation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const employeeId = useSelector(state => state.auth.user?.user?.employeeId);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const loadProfile = async () => {
                if (!employeeId) return;
                try {
                    setLoading(true);
                    const data = await apiService.getEmployeeProfile(employeeId);
                    if (isActive && data) {
                        setProfile(data);
                    }
                } catch (error) {
                    console.error('Failed to load profile:', error);
                } finally {
                    if (isActive) {
                        setLoading(false);
                    }
                }
            };
            loadProfile();
            return () => { isActive = false; };
        }, [employeeId])
    );

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!profile) return null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6', paddingTop: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <AntDesign name="left" size={18} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Profile Details</Text>
                <TouchableOpacity onPress={() => navigation.navigate("ProfileSetting")} style={styles.editHeaderButton}>
                    <AntDesign name="edit" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.container} className="-mt-2">
                <View style={styles.profileHeader}>
                    {profile.avatarUrl ? (
                         <Image source={{ uri: profile.avatarUrl }} style={styles.profileImage} />
                    ) : (
                        <View style={[styles.profileImage, styles.initialsContainer]}>
                            <Text style={styles.initialsText}>
                                {profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??'}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.profileDesignation}>{profile.position?.title || profile.designation || 'No Role'}</Text>
                </View>
                <View style={styles.profileDetails}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <ProfileDetail label="Gender" value={profile.gender || '-'} />
                    <ProfileDetail label="Date of Birth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '-'} />
                    <ProfileDetail label="Mobile No" value={profile.phoneNumber || '-'} />
                    <ProfileDetail label="Address" value={profile.address || '-'} />
                </View>

                <View style={[styles.profileDetails, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>Employment Details</Text>
                    <ProfileDetail label="Employee No" value={profile.employeeNumber || '-'} />
                    <ProfileDetail label="Department" value={profile.department?.name || profile.departmentName || '-'} />
                    <ProfileDetail label="Join Date" value={profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : '-'} />
                    <ProfileDetail label="Salary" value={profile.salary?.toLocaleString() || '-'} />
                </View>

                <View style={[styles.profileDetails, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>Education & Experience</Text>
                    <ProfileDetail label="Highest Study" value={profile.study || '-'} />
                    <ProfileDetail label="Experience" value={profile.experience || '-'} />
                    <ProfileDetail label="Achievement" value={profile.achievement || '-'} />
                    <ProfileDetail label="10th Marks" value={profile.marks10 || '-'} />
                    <ProfileDetail label="12th Marks" value={profile.marks12 || '-'} />
                    <ProfileDetail label="Graduation" value={profile.graduationMarks || '-'} />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const ProfileDetail = ({ label, value }) => (
    <View style={styles.detailContainer}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const styles = {
    container: {
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    backButton: {
        padding: 5,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        // width: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    editHeaderButton: {
        padding: 5,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    profileImage: {
        width: 128,
        height: 128,
        borderRadius: 64,
        marginBottom: 12,
    },
    initialsContainer: {
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        color: 'white',
        fontSize: 48,
        fontWeight: 'bold',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    profileDesignation: {
        fontSize: 16,
        color: '#6B7280',
    },
    profileDetails: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 8,
    },
    detailContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
    },
    detailValue: {
        fontSize: 16,
        color: '#6B7280',
    },
};

export default ProfileDetails;
