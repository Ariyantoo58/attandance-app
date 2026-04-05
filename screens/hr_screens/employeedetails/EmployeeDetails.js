import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
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
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detail Karyawan</Text>
                <TouchableOpacity 
                    onPress={() => navigation.navigate("EmployeeEdit", { employee })}
                    style={styles.editBtn}
                >
                    <Feather name="edit-3" size={20} color="#1E293B" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        {employee.avatarUrl ? (
                            <Image source={{ uri: employee.avatarUrl }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.initialsPlaceholder}>
                                <Text style={styles.initialsText}>{initials}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.profileName}>{employee.name}</Text>
                    <Text style={styles.profileDesignation}>
                        {employee.designation || employee.position?.title || 'Staff Member'}
                    </Text>
                </View>

                <View style={[styles.card, { paddingHorizontal: 0, paddingVertical: 0 }]}>
                    <DetailRow label="ID Karyawan" value={employee.employeeNumber || '-'} isFirst />
                    <DetailRow label="Departemen" value={employee.department?.name || '-'} />
                    <DetailRow label="Gender" value={employee.gender || '-'} />
                    <DetailRow label="No. Telepon" value={employee.phoneNumber || '-'} />
                    <DetailRow label="Alamat" value={employee.address || '-'} />
                    <DetailRow label="Gaji Pokok" value={employee.salary ? `Rp ${employee.salary.toLocaleString('id-ID')}` : '-'} />
                    <DetailRow label="Tgl Lahir" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('id-ID') : '-'} />
                    <DetailRow label="Tgl Bergabung" value={employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('id-ID') : '-'} isLast />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionHeader}>Pendidikan & Pengalaman</Text>
                    <DetailItem label="Studi Terakhir" value={employee.study} />
                    <DetailItem label="Pengalaman Kerjas" value={employee.experience} />
                    <DetailItem label="Pencapaian" value={employee.achievement} />
                    <View style={styles.marksGrid}>
                        <DetailItem label="Nilai SMA" value={employee.marks12} style={{ flex: 1 }} />
                        <DetailItem label="IPK" value={employee.graduationMarks} style={{ flex: 1 }} />
                    </View>
                </View>
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const DetailRow = ({ label, value, isFirst, isLast }) => (
    <View style={[
        styles.detailRow, 
        isFirst && { borderTopWidth: 0 },
        isLast && { borderBottomWidth: 0 }
    ]}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
);

const DetailItem = ({ label, value, style }) => (
    <View style={[styles.detailItem, style]}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemValue}>{value || '-'}</Text>
    </View>
);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 56,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    editBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingTop: 20,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        padding: 4,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        backgroundColor: 'white',
        marginBottom: 16,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    initialsPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
    },
    profileDesignation: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    detailLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
        marginLeft: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 20,
    },
    detailItem: {
        marginBottom: 16,
    },
    itemLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    itemValue: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
    },
    marksGrid: {
        flexDirection: 'row',
        gap: 16,
    },
});

export default EmployeeDetails;
