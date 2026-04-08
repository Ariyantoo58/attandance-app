import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert, 
    TextInput, 
    Modal, 
    StatusBar, 
    Platform,
    RefreshControl
} from 'react-native';
import { AntDesign, MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import { apiService } from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';
import { useDispatch } from 'react-redux';
import { fetchHrDashboard } from '@/auth/dataSlice';

const OvertimeManagement = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const [overtimes, setOvertimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [actionType, setActionType] = useState(''); // 'APPROVE' or 'REJECT'
    const [processing, setProcessing] = useState(false);

    const { socket } = useSocket();

    const fetchPendingOvertimes = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const data = await apiService.getAllPendingOvertime();
            setOvertimes(data);
        } catch (error) {
            console.error('Fetch pending overtime error:', error);
            if (!silent) Alert.alert('Error', 'Failed to load overtime requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial load and focus-based refresh
    useFocusEffect(
        useCallback(() => {
            fetchPendingOvertimes(overtimes.length > 0);
        }, [overtimes.length])
    );

    // Socket real-time updates
    useEffect(() => {
        if (socket) {
            const handleUpdate = () => {
                console.log('Overtime update detected via socket, refreshing list...');
                fetchPendingOvertimes(true);
                dispatch(fetchHrDashboard());
            };

            socket.on('overtime:requested', handleUpdate);
            socket.on('overtime:changed', handleUpdate);

            return () => {
                socket.off('overtime:requested', handleUpdate);
                socket.off('overtime:changed', handleUpdate);
            };
        }
    }, [socket, dispatch]);

    const handleAction = (item, type) => {
        setSelectedItem(item);
        setActionType(type);
        setShowNoteModal(true);
    };

    const submitAction = async () => {
        if (!selectedItem) return;
        
        setProcessing(true);
        try {
            const status = actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED';
            await apiService.approveOvertime(selectedItem.id, status, adminNote);
            Alert.alert('Success', `Overtime request has been ${status.toLowerCase()}`);
            setShowNoteModal(false);
            setAdminNote('');
            fetchPendingOvertimes();
            dispatch(fetchHrDashboard());
        } catch (error) {
            console.error('Action error:', error);
            Alert.alert('Error', 'Failed to update overtime request');
        } finally {
            setProcessing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPendingOvertimes(true);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <AntDesign name="left" size={20} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Overtime Management</Text>
                <TouchableOpacity onPress={() => fetchPendingOvertimes(true)} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={20} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.introSection}>
                    <Text style={styles.introTitle}>Pending Requests</Text>
                    <Text style={styles.introSubtitle}>Review and manage employee overtime applications</Text>
                </View>

                {loading && overtimes.length === 0 ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Fetching overtime requests...</Text>
                    </View>
                ) : overtimes.length > 0 ? (
                    overtimes.map((item) => (
                        <View style={styles.requestCard} key={item.id}>
                            <View style={styles.cardHeader}>
                                <Image
                                    source={{ uri: item.employee?.avatarUrl || 'https://img.freepik.com/free-photo/front-view-man-posing_23-2148364843.jpg' }}
                                    style={styles.avatar}
                                />
                                <View style={styles.headerText}>
                                    <Text style={styles.employeeName}>{item.employee?.name}</Text>
                                    <View style={styles.dateRow}>
                                        <Feather name="calendar" size={12} color="#64748B" />
                                        <Text style={styles.dateText}>{moment(item.date).format('ddd, DD MMM YYYY')}</Text>
                                    </View>
                                </View>
                                <View style={styles.badgeLabel}>
                                    <Text style={styles.badgeLabelText}>PENDING</Text>
                                </View>
                            </View>

                            <View style={styles.contentSection}>
                                <View style={styles.infoGrid}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>START TIME</Text>
                                        <View style={styles.timeRow}>
                                            <Ionicons name="time-outline" size={14} color="#3B82F6" />
                                            <Text style={styles.infoValue}>{moment(item.startTime).format('HH:mm')}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>END TIME</Text>
                                        <View style={styles.timeRow}>
                                            <Ionicons name="time-outline" size={14} color="#3B82F6" />
                                            <Text style={styles.infoValue}>{moment(item.endTime).format('HH:mm')}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>DURATION</Text>
                                        <Text style={styles.durationValue}>{item.duration?.toFixed(1) || '0'} hrs</Text>
                                    </View>
                                </View>

                                <View style={styles.reasonBox}>
                                    <View style={styles.reasonHeader}>
                                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#3B82F6" />
                                        <Text style={styles.reasonLabel}>Reason</Text>
                                    </View>
                                    <Text style={styles.reasonText}>{item.reason || "No reason provided."}</Text>
                                </View>
                            </View>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.rejectBtn]} 
                                    onPress={() => handleAction(item, 'REJECT')}
                                >
                                    <Text style={styles.rejectBtnText}>Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.actionBtn, styles.approveBtn]} 
                                    onPress={() => handleAction(item, 'APPROVE')}
                                >
                                    <Text style={styles.approveBtnText}>Approve</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.centerBox}>
                        <View style={styles.emptyCircle}>
                            <Feather name="check-circle" size={40} color="#CBD5E0" />
                        </View>
                        <Text style={styles.emptyTitle}>All Caught Up!</Text>
                        <Text style={styles.emptySubtitle}>No pending overtime requests to review.</Text>
                    </View>
                )}
                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Note Modal */}
            <Modal
                visible={showNoteModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBody}>
                        <Text style={styles.modalHeaderTitle}>
                            {actionType === 'APPROVE' ? 'Approve Overtime' : 'Reject Overtime'}
                        </Text>
                        <Text style={styles.modalSubtitle}>Add a note for the employee (optional)</Text>
                        
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Reason for approval/rejection..."
                            multiline
                            placeholderTextColor="#94A3B8"
                            value={adminNote}
                            onChangeText={setAdminNote}
                        />
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalCancel} 
                                onPress={() => setShowNoteModal(false)}
                                disabled={processing}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[
                                    styles.modalSubmit,
                                    { backgroundColor: actionType === 'APPROVE' ? '#10B981' : '#EF4444' }
                                ]} 
                                onPress={submitAction}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>Confirm Action</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    refreshButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20 },
    introSection: { marginBottom: 25 },
    introTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
    introSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
    requestCard: { 
        backgroundColor: 'white', 
        borderRadius: 24, 
        padding: 16, 
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9'
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9' },
    headerText: { marginLeft: 12, flex: 1 },
    employeeName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    dateText: { fontSize: 12, color: '#64748B', marginLeft: 4, fontWeight: '600' },
    badgeLabel: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeLabelText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#D97706',
    },
    contentSection: { marginBottom: 16 },
    infoGrid: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        backgroundColor: '#F8FAFC', 
        borderRadius: 16, 
        padding: 12, 
        marginBottom: 12 
    },
    infoItem: { flex: 1, alignItems: 'center' },
    infoLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', marginBottom: 4 },
    timeRow: { flexDirection: 'row', alignItems: 'center' },
    infoValue: { fontSize: 13, fontWeight: '800', color: '#1E293B', marginLeft: 4 },
    durationValue: { fontSize: 13, fontWeight: '800', color: '#3B82F6' },
    reasonBox: { backgroundColor: '#F0F9FF', borderRadius: 16, padding: 12 },
    reasonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    reasonLabel: { fontSize: 11, fontWeight: '800', color: '#3B82F6', marginLeft: 6, textTransform: 'uppercase' },
    reasonText: { fontSize: 13, color: '#1E293B', lineHeight: 20, fontWeight: '500' },
    buttonRow: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    approveBtn: { backgroundColor: '#10B981' },
    rejectBtn: { backgroundColor: '#F1F5F9' },
    approveBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
    rejectBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 14 },
    centerBox: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    loadingText: { marginTop: 12, color: '#64748B', fontWeight: '600' },
    emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
    emptySubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 25 },
    modalBody: { backgroundColor: 'white', borderRadius: 28, padding: 25, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    modalHeaderTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
    modalSubtitle: { fontSize: 13, color: '#64748B', marginTop: 6, marginBottom: 20, fontWeight: '500' },
    noteInput: { height: 120, backgroundColor: '#F8FAFC', borderRadius: 18, padding: 16, fontSize: 14, color: '#1E293B', textAlignVertical: 'top', borderWidth: 1, borderColor: '#F1F5F9' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25, gap: 12 },
    modalCancel: { paddingHorizontal: 20, justifyContent: 'center' },
    modalCancelText: { color: '#64748B', fontWeight: '700' },
    modalSubmit: { paddingHorizontal: 22, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    modalSubmitText: { color: 'white', fontWeight: '800' },
});

export default OvertimeManagement;
