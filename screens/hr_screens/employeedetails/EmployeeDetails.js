import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../../services/api';

const EmployeeDetails = ({ route }) => {
    const { employee: initialEmployee } = route.params;
    const [employee, setEmployee] = useState(initialEmployee);
    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const fetchEmployeeData = async () => {
                if (!employee?.id) return;
                try {
                    const data = await apiService.getEmployeeProfile(employee.id);
                    if (isActive && data) {
                        setEmployee({ ...employee, ...data });
                    }
                } catch (error) {
                    console.error('Error fetching updated employee details:', error);
                }
            };
            fetchEmployeeData();
            return () => { isActive = false; };
        }, [employee?.id])
    );

    const initials = employee.name 
        ? employee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) 
        : '?';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6', paddingTop: 40 }}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
                    <AntDesign name="left" size={18} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Employee Details</Text>
                <TouchableOpacity 
                    onPress={() => navigation.navigate("EmployeeEdit", { employee })}
                    style={styles.editHeaderButton}
                >
                    <AntDesign name="edit" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.profileHeaderCard}>
                    {employee.avatarUrl ? (
                        <Image source={{ uri: employee.avatarUrl }} style={styles.profileImage} />
                    ) : (
                        <View style={[styles.profileImage, styles.initialsCard]}>
                            <Text style={styles.initialsText}>{initials}</Text>
                        </View>
                    )}
                    <Text style={styles.profileName}>{employee.name}</Text>
                    <Text style={styles.profileDesignation}>
                        {employee.designation || employee.position?.title || 'No Role'}
                    </Text>
                </View>

                <View style={styles.detailsCard}>
                    <DetailRow label="Employee No" value={employee.employeeNumber || '-'} />
                    <DetailRow label="Department" value={employee.department?.name || '-'} />
                    <DetailRow label="Gender" value={employee.gender || '-'} />
                    <DetailRow label="Mobile No" value={employee.phoneNumber || '-'} />
                    <DetailRow label="Address" value={employee.address || '-'} />
                    <DetailRow label="Salary" value={employee.salary ? `Rp ${employee.salary.toLocaleString('id-ID')}` : '-'} />
                    <DetailRow label="Birth Date" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '-'} />
                    <DetailRow label="Join Date" value={employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : '-'} />
                </View>

                <View style={[styles.detailsCard, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>Academic & Experience</Text>
                    <DetailRow label="Study" value={employee.study || '-'} />
                    <DetailRow label="Experience" value={employee.experience || '-'} />
                    <DetailRow label="Achievement" value={employee.achievement || '-'} />
                    <DetailRow label="10th Marks" value={employee.marks10 || '-'} />
                    <DetailRow label="12th Marks" value={employee.marks12 || '-'} />
                    <DetailRow label="Graduation" value={employee.graduationMarks || '-'} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 24,
    },
    header: {
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16,
        paddingBottom: 10
    },
    headerBackButton: {
        padding: 5,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
        color: '#1F2937'
    },
    editHeaderButton: {
        padding: 5,
    },
    profileHeaderCard: {
        alignItems: 'center',
        marginBottom: 24,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 12,
        borderWidth: 3,
        borderColor: 'white',
    },
    initialsCard: {
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        color: 'white',
        fontSize: 40,
        fontWeight: 'bold',
    },
    profileName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    profileDesignation: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 4,
    },
    detailsCard: {
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
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4B5563',
    },
    detailValue: {
        fontSize: 15,
        color: '#1F2937',
        flex: 1,
        textAlign: 'right',
        marginLeft: 20
    },
});

export default EmployeeDetails;
