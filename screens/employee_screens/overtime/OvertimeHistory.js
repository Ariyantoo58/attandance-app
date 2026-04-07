import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    ScrollView,
    Dimensions
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMyOvertime } from '../../../auth/dataSlice';
import { apiService } from '../../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const OvertimeHistory = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const overtimes = useSelector(state => state.data.employeeData.overtime);
    const loading = useSelector(state => state.data.employeeData.loading);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('All');

    const loadOvertimes = useCallback(async () => {
        setRefreshing(true);
        await dispatch(fetchMyOvertime());
        setRefreshing(false);
    }, [dispatch]);

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchMyOvertime());
        }, [dispatch])
    );

    const onRefresh = () => {
        loadOvertimes();
    };

    const statusConfig = {
        APPROVED: { bg: '#F0FFF4', color: '#38A169', label: 'DISETUJUI', icon: 'checkmark-circle-outline' },
        REJECTED: { bg: '#FFF5F5', color: '#E53E3E', label: 'DITOLAK', icon: 'close-circle-outline' },
        COMPLETED: { bg: '#EBF8FF', color: '#3182CE', label: 'SELESAI', icon: 'checkmark-done-outline' },
        PENDING: { bg: '#FFFBEB', color: '#D69E2E', label: 'PENDING', icon: 'time-outline' },
        DEFAULT: { bg: '#F7FAFC', color: '#718096', label: 'UNKNOWN', icon: 'help-circle-outline' }
    };

    const getStatusConfig = (status) => {
        const normalized = status?.toUpperCase() || 'DEFAULT';
        return statusConfig[normalized] || statusConfig.DEFAULT;
    };

    const ongoingOvertime = overtimes.filter(o => o.status === 'APPROVED' && o.actualStart && !o.actualEnd);
    
    // Sort overtimes by date (newest first)
    const sortedOvertimes = [...overtimes].sort((a, b) => new Date(b.date) - new Date(a.date));

    const filteredData = sortedOvertimes.filter(item =>
        filter === 'All' ? true : item.status === filter
    );

    const renderItem = ({ item }) => {
        const config = getStatusConfig(item.status);
        return (
            <View style={styles.requestCard}>
                <View style={[styles.statusIndicator, { backgroundColor: config.color }]} />
                <View style={styles.cardMain}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleArea}>
                            <Text style={styles.requestTitle} numberOfLines={1}>Lembur #{item.id.substring(0, 8).toUpperCase()}</Text>
                            <View style={styles.dateBadge}>
                                <Feather name="calendar" size={12} color="#64748B" />
                                <Text style={styles.dateText}>
                                    {moment(item.date).format('DD MMM YYYY')}
                                </Text>
                            </View>
                            <View style={[styles.dateBadge, { marginTop: 4 }]}>
                                <Feather name="clock" size={12} color="#64748B" />
                                <Text style={styles.dateText}>
                                    Jadwal: {moment(item.startTime).format('HH:mm')} - {moment(item.endTime).format('HH:mm')}
                                </Text>
                            </View>
                            {item.actualStart && (
                                <View style={[styles.dateBadge, { marginTop: 4 }]}>
                                    <Feather name="play-circle" size={12} color="#2563EB" />
                                    <Text style={[styles.dateText, { color: '#2563EB' }]}>
                                        Mulai: {moment(item.actualStart).format('HH:mm')} {item.actualEnd ? ` - Selesai: ${moment(item.actualEnd).format('HH:mm')}` : ''}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                                <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                            </View>
                            {item.actualStart && !item.actualEnd && (
                                <View style={styles.attendanceMarker}>
                                    <Text style={styles.markerText}>SUDAH MASUK</Text>
                                </View>
                            )}
                            {item.actualEnd && (
                                <View style={[styles.attendanceMarker, { backgroundColor: '#ECFDF5' }]}>
                                    <Text style={[styles.markerText, { color: '#10B981' }]}>SELESAI</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    
                    {item.reason && (
                        <Text style={styles.description} numberOfLines={2}>
                            {item.reason}
                        </Text>
                    )}

                    <View style={styles.cardFooter}>
                        <View style={styles.footerInfo}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#94A3B8" />
                            <Text style={styles.footerText}>Diajukan pada {moment(item.createdAt).format('DD MMM YYYY')}</Text>
                        </View>
                        {item.compensation > 0 && (
                            <Text style={styles.compensationText}>Rp {item.compensation.toLocaleString('id-ID')}</Text>
                        )}
                    </View>

                    {item.status === 'APPROVED' && !item.actualStart && (
                        <TouchableOpacity 
                            style={[styles.overtimeClockBtn, { backgroundColor: '#2563EB' }]}
                            onPress={() => navigation.navigate('FaceRecognition', { mode: 'attendance' })}
                        >
                            <MaterialCommunityIcons name="face-recognition" size={20} color="white" />
                            <Text style={styles.overtimeClockBtnText}>Absen Masuk Lembur</Text>
                        </TouchableOpacity>
                    )}

                    {item.status === 'APPROVED' && item.actualStart && (
                        <TouchableOpacity 
                            style={[styles.overtimeClockBtn, { backgroundColor: '#F59E0B' }]}
                            onPress={() => navigation.navigate('FaceRecognition', { mode: 'attendance' })}
                        >
                            <MaterialCommunityIcons name="face-recognition" size={20} color="white" />
                            <Text style={styles.overtimeClockBtnText}>Absen Pulang Lembur</Text>
                        </TouchableOpacity>
                    )}

                    {item.status === 'COMPLETED' && (
                        <View style={[styles.overtimeClockBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }]}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            <Text style={[styles.overtimeClockBtnText, { color: '#64748B' }]}>Lembur Selesai</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity 
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
                        style={styles.backSmallBtn}
                    >
                        <Ionicons name="menu" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.headerTitle}>Riwayat Lembur</Text>
                        <Text style={styles.headerSubtitle}>Pantau pengajuan lembur Anda</Text>
                    </View>
                </View>
                <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => navigation.navigate("OvertimeRequest")}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={26} color="white" />
                </TouchableOpacity>
            </View>

            {ongoingOvertime.length > 0 && (
                <View style={styles.ongoingCard}>
                    <View style={styles.ongoingInfo}>
                        <View style={styles.ongoingLeft}>
                            <View style={styles.ongoingBadge}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.ongoingBadgeText}>LEMBUR SEDANG BERJALAN</Text>
                            </View>
                            <Text style={styles.ongoingTime}>Mulai: {moment(ongoingOvertime[0].actualStart).format('HH:mm')}</Text>
                        </View>
                        <TouchableOpacity 
                            style={[styles.completeBtn, { backgroundColor: '#F59E0B' }]}
                            onPress={() => navigation.navigate('FaceRecognition', { mode: 'attendance' })}
                        >
                            <Text style={styles.completeBtnText}>Absen Pulang</Text>
                            <Ionicons name="arrow-forward" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['All', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'].map(status => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilter(status)}
                            style={[
                                styles.filterCard,
                                filter === status && styles.filterCardActive
                            ]}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.filterText,
                                filter === status && styles.filterTextActive
                            ]}>
                                {status === 'All' ? 'Semua' : 
                                 status === 'PENDING' ? 'Pending' : 
                                 status === 'APPROVED' ? 'Disetujui' : 
                                 status === 'REJECTED' ? 'Ditolak' : 'Selesai'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredData}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyArea}>
                        <View style={styles.emptyCircle}>
                            <Ionicons name="time" size={40} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>Belum Ada Lembur</Text>
                        <Text style={styles.emptyDesc}>Klik tombol + di atas untuk membuat pengajuan baru.</Text>
                    </View>
                }
                ListFooterComponent={<View style={{ height: 100 }} />}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingVertical: 15,
        backgroundColor: 'white',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    backSmallBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 1, fontWeight: '500' },
    addButton: { 
        width: 48, 
        height: 48, 
        borderRadius: 16, 
        backgroundColor: '#2563EB', 
        alignItems: 'center', 
        justifyContent: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    filterSection: { marginVertical: 15 },
    filterScroll: { paddingHorizontal: 20, paddingVertical: 5 },
    filterCard: { 
        paddingHorizontal: 18, 
        paddingVertical: 10, 
        backgroundColor: 'white', 
        borderRadius: 14, 
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterCardActive: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
    filterText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    filterTextActive: { color: 'white' },
    listContent: { paddingHorizontal: 20 },
    requestCard: { 
        backgroundColor: 'white', 
        borderRadius: 24, 
        marginBottom: 16, 
        flexDirection: 'row', 
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.4)',
    },
    statusIndicator: { width: 6 },
    cardMain: { flex: 1, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    titleArea: { flex: 1, marginRight: 10 },
    requestTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    dateBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    dateText: { fontSize: 11, color: '#64748B', marginLeft: 6, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    description: { fontSize: 12, color: '#64748B', marginTop: 12, lineHeight: 18, fontWeight: '400' },
    cardFooter: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerInfo: { flexDirection: 'row', alignItems: 'center' },
    footerText: { fontSize: 10, color: '#94A3B8', marginLeft: 6, fontWeight: '500' },
    compensationText: { fontSize: 13, fontWeight: '900', color: '#10B981' },
    overtimeClockBtn: {
        marginTop: 15,
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
    },
    overtimeClockBtnText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 14,
    },
    emptyArea: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
    emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
    ongoingCard: {
        margin: 20,
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 16,
        marginBottom: 0,
    },
    ongoingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ongoingLeft: {
        flex: 1,
    },
    ongoingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginRight: 8,
    },
    ongoingBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '900',
    },
    ongoingTime: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '500',
    },
    completeBtn: {
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    completeBtnText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 13,
    },
    attendanceMarker: {
        marginTop: 6,
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    markerText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#2563EB',
    },
});

export default OvertimeHistory;
