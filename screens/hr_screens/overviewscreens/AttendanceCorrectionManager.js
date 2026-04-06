import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Modal, StatusBar, Platform } from 'react-native';
import { AntDesign, MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';
import { useDispatch } from 'react-redux';
import { fetchHrDashboard } from '@/auth/dataSlice';

const AttendanceCorrectionManager = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [actionType, setActionType] = useState(''); // 'APPROVE' or 'REJECT'

    const { socket } = useSocket();

    const loadRequests = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const data = await apiService.getAllPendingAttendanceCorrections();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load correction requests:', error);
            if (!silent) Alert.alert('Error', 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    // Initial load and focus-based refresh
    useFocusEffect(
        useCallback(() => {
            loadRequests(requests.length > 0);
        }, [requests.length])
    );

    // Socket real-time updates
    useEffect(() => {
        if (socket) {
            const handleUpdate = () => {
                console.log('Correction update detected via socket, refreshing list...');
                loadRequests(true);
                // Also refresh main dashboard summary
                dispatch(fetchHrDashboard());
            };

            socket.on('correction:requested', handleUpdate);
            socket.on('correction:changed', handleUpdate);

            return () => {
                socket.off('correction:requested', handleUpdate);
                socket.off('correction:changed', handleUpdate);
            };
        }
    }, [socket, dispatch]);

    const handleAction = (request, type) => {
        setSelectedRequest(request);
        setActionType(type);
        setShowNoteModal(true);
    };

    const submitAction = async () => {
        if (!selectedRequest) return;
        
        setLoading(true);
        try {
            const status = actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED';
            await apiService.updateAttendanceCorrectionStatus(selectedRequest.id, status, adminNote);
            Alert.alert('Success', `Request has been ${status.toLowerCase()}`);
            setShowNoteModal(false);
            setAdminNote('');
            loadRequests();
            dispatch(fetchHrDashboard());
        } catch (error) {
            Alert.alert('Error', 'Failed to update request');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
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
                <Text style={styles.headerTitle}>Corrections</Text>
                <TouchableOpacity onPress={() => loadRequests(true)} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={20} color="#00a2e4" />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.introSection}>
                    <Text style={styles.introTitle}>Pending Requests</Text>
                    <Text style={styles.introSubtitle}>Review and approve clock-in/out adjustments</Text>
                </View>

                {loading && requests.length === 0 ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color="#00a2e4" />
                        <Text style={styles.loadingText}>Fetching corrections...</Text>
                    </View>
                ) : requests.length > 0 ? (
                    requests.map((item) => (
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
                                        <Text style={styles.dateText}>{formatDate(item.requestedDate)}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.contentSection}>
                                <View style={styles.comparisonGrid}>
                                    <View style={styles.gridHeader}>
                                        <Text style={styles.gridLabel}>FIELD</Text>
                                        <Text style={styles.gridTitle}>ORIGINAL</Text>
                                        <Text style={styles.gridTitle}>PROPOSED</Text>
                                    </View>
                                    <View style={styles.gridRow}>
                                        <Text style={styles.gridLabel}>Clock In</Text>
                                        <Text style={styles.originalVal}>{formatTime(item.oldClockIn)}</Text>
                                        <Text style={styles.proposedVal}>{formatTime(item.requestedClockIn)}</Text>
                                    </View>
                                    <View style={styles.gridRow}>
                                        <Text style={styles.gridLabel}>Clock Out</Text>
                                        <Text style={styles.originalVal}>{formatTime(item.oldClockOut)}</Text>
                                        <Text style={styles.proposedVal}>{formatTime(item.requestedClockOut)}</Text>
                                    </View>
                                </View>

                                <View style={styles.reasonBox}>
                                    <View style={styles.reasonHeader}>
                                        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#00a2e4" />
                                        <Text style={styles.reasonLabel}>Employee Reason</Text>
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
                        <Text style={styles.emptySubtitle}>No pending correction requests at the moment.</Text>
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
                            {actionType === 'APPROVE' ? 'Approve Request' : 'Reject Request'}
                        </Text>
                        <Text style={styles.modalSubtitle}>Do you want to add a note for the employee?</Text>
                        
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Add your note here..."
                            multiline
                            placeholderTextColor="#94A3B8"
                            value={adminNote}
                            onChangeText={setAdminNote}
                        />
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalCancel} 
                                onPress={() => setShowNoteModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[
                                    styles.modalSubmit,
                                    { backgroundColor: actionType === 'APPROVE' ? '#10B981' : '#EF4444' }
                                ]} 
                                onPress={submitAction}
                            >
                                <Text style={styles.modalSubmitText}>Confirm Action</Text>
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
    contentSection: { marginBottom: 16 },
    comparisonGrid: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, marginBottom: 12 },
    gridHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
    gridLabel: { flex: 1.2, fontSize: 10, fontWeight: '900', color: '#94A3B8' },
    gridTitle: { flex: 1, fontSize: 10, fontWeight: '900', color: '#94A3B8', textAlign: 'center' },
    gridRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    originalVal: { flex: 1, fontSize: 13, color: '#94A3B8', textAlign: 'center', textDecorationLine: 'line-through' },
    proposedVal: { flex: 1, fontSize: 13, fontWeight: '800', color: '#00a2e4', textAlign: 'center' },
    reasonBox: { backgroundColor: '#F0F9FF', borderRadius: 16, padding: 12 },
    reasonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    reasonLabel: { fontSize: 11, fontWeight: '800', color: '#00a2e4', marginLeft: 6, textTransform: 'uppercase' },
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

export default AttendanceCorrectionManager;
