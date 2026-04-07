import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import { apiService } from '../../../services/api';

const PerformanceManagement = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const [showInfo, setShowInfo] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchKpiSummary();
        }, [month, year])
    );

    const fetchKpiSummary = async () => {
        setLoading(true);
        try {
            const response = await apiService.getKpiSummary(month, year);
            setEmployees(response);
        } catch (error) {
            console.error('Error fetching KPI summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#10B981';
        if (score >= 60) return '#F59E0B';
        return '#EF4444';
    };

    const filteredEmployees = employees.filter(emp => 
        emp.employee.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderEmployeeItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.employeeCard}
            onPress={() => navigation.navigate('KpiDetailReview', { 
                employee: item.employee,
                initialStats: item.stats,
                month,
                year
            })}
        >
            <View style={styles.cardHeader}>
                <Image source={{ uri: item.employee.avatarUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{item.employee.name}</Text>
                    <Text style={styles.designation}>{item.employee.designation}</Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.stats.overallScore) + '20' }]}>
                    <Text style={[styles.scoreText, { color: getScoreColor(item.stats.overallScore) }]}>
                        {item.stats.overallScore.toFixed(0)}
                    </Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Tasks</Text>
                    <Text style={styles.statValue}>{item.stats.taskScore.toFixed(0)}%</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Attendance</Text>
                    <Text style={styles.statValue}>{item.stats.attendanceScore.toFixed(0)}%</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Status</Text>
                    <View style={[styles.statusTag, { backgroundColor: item.reviewStatus === 'FINAL' ? '#D1FAE5' : '#FEE2E2' }]}>
                        <Text style={[styles.statusText, { color: item.reviewStatus === 'FINAL' ? '#065F46' : '#991B1B' }]}>
                            {item.reviewStatus}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
                    style={styles.backButton}
                >
                    <Ionicons name="menu" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Performance Management</Text>
                <TouchableOpacity onPress={() => navigation.navigate('GlobalKpiSettings')} style={styles.backButton}>
                    <Ionicons name="settings-outline" size={24} color="#2563EB" />
                </TouchableOpacity>
            </View>

            {/* Dismissible Info Card */}
            {!loading && showInfo && (
                <View style={styles.calcInfoCard}>
                    <View style={styles.calcInfoHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="bulb-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
                            <Text style={styles.calcInfoTitle}>Rumus Perhitungan KPI</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowInfo(false)}>
                            <Ionicons name="close-circle" size={22} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.calcItem}>
                        <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                        <Text style={styles.calcText}><Text style={{ fontWeight: '700' }}>Tasks (40%):</Text> Bobot tugas & rating kualitas.</Text>
                    </View>
                    <View style={styles.calcItem}>
                        <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.calcText}><Text style={{ fontWeight: '700' }}>Attendance (20%):</Text> Kehadiran per 20 hari.</Text>
                    </View>
                    <View style={styles.calcItem}>
                        <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                        <Text style={styles.calcText}><Text style={{ fontWeight: '700' }}>Behavior (40%):</Text> Rata-rata kriteria global.</Text>
                    </View>
                </View>
            )}

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.filterRow}>
                <Text style={styles.periodText}>Period: {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
                <TouchableOpacity onPress={() => {/* Show month picker */}}>
                    <Text style={styles.changeBtn}>Change</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={filteredEmployees}
                    keyExtractor={item => item.employee.id}
                    renderItem={renderEmployeeItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="account-search-outline" size={64} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No employees found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white' },
    backButton: { padding: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
    headerTitle: { fontSize: 17, fontWeight: '900', color: '#1E293B' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 16, paddingHorizontal: 16, borderRadius: 16, height: 50, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    searchIcon: { marginRight: 12 },
    searchInput: { flex: 1, fontSize: 15, color: '#1E293B' },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
    periodText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    changeBtn: { color: '#2563EB', fontWeight: '700' },
    listContent: { padding: 16 },
    employeeCard: { backgroundColor: 'white', borderRadius: 24, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F1F5F9' },
    infoContainer: { flex: 1, marginLeft: 12 },
    name: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    designation: { fontSize: 13, color: '#64748B', marginTop: 2 },
    scoreBadge: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    scoreText: { fontSize: 18, fontWeight: '800' },
    statsRow: { flexDirection: 'row', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    statBox: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
    statValue: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 4 },
    statDivider: { width: 1, height: '100%', backgroundColor: '#F1F5F9' },
    statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
    statusText: { fontSize: 10, fontWeight: '700' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#94A3B8', fontWeight: '600' },
    calcInfoCard: { backgroundColor: 'white', margin: 16, marginBottom: 0, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
    calcInfoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    calcInfoTitle: { fontSize: 13, fontWeight: '800', color: '#1E293B', textTransform: 'uppercase' },
    calcItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    dot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, marginRight: 10 },
    calcText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },
});

export default PerformanceManagement;
