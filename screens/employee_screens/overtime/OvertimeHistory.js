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
import { apiService } from '../../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const OvertimeHistory = ({ navigation }) => {
    const [overtimes, setOvertimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('All');

    const fetchOvertimes = useCallback(async () => {
        try {
            const data = await apiService.getMyOvertime();
            setOvertimes(data);
        } catch (error) {
            console.error('Fetch overtime error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOvertimes();
    }, [fetchOvertimes]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOvertimes();
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

    const filteredData = overtimes.filter(item =>
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
                                    {moment(item.startTime).format('HH:mm')} - {moment(item.endTime).format('HH:mm')}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
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
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backSmallBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
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
    emptyArea: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
    emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
    emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});

export default OvertimeHistory;
