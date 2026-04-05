import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';

const AttendanceCorrectionManager = () => {
    const navigation = useNavigation();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [actionType, setActionType] = useState(''); // 'APPROVE' or 'REJECT'

    const { socket } = useSocket();

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('correction:requested', (data) => {
                console.log('New correction request received via socket');
                loadRequests();
            });

            return () => {
                socket.off('correction:requested');
            };
        }
    }, [socket]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await apiService.getAllPendingAttendanceCorrections();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load correction requests:', error);
            Alert.alert('Error', 'Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (request, type) => {
        setSelectedRequest(request);
        setActionType(type);
        setShowNoteModal(true);
    };

    const submitAction = async () => {
        if (!selectedRequest) return;
        
        try {
            const status = actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED';
            await apiService.updateAttendanceCorrectionStatus(selectedRequest.id, status, adminNote);
            Alert.alert('Success', `Request has been ${status.toLowerCase()}`);
            setShowNoteModal(false);
            setAdminNote('');
            loadRequests();
        } catch (error) {
            Alert.alert('Error', 'Failed to update request');
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '--:--';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <View style={styles.container} className="bg-gray-800 flex-1">
            <View className="flex-row items-center px-4 pb-5 pt-12">
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={20} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Attendance Corrections</Text>
            </View>

            <ScrollView className="bg-white flex-1 px-4 pt-4 rounded-t-3xl">
                {loading ? (
                    <ActivityIndicator size="large" color="#2D3748" style={{ marginTop: 50 }} />
                ) : requests.length > 0 ? (
                    requests.map((item) => (
                        <View style={styles.card} key={item.id}>
                            <View style={styles.cardHeader}>
                                <Image
                                    source={{ uri: item.employee?.avatarUrl || 'https://img.freepik.com/free-photo/front-view-man-posing_23-2148364843.jpg' }}
                                    style={styles.avatar}
                                />
                                <View style={styles.headerText}>
                                    <Text style={styles.employeeName}>{item.employee?.name}</Text>
                                    <Text style={styles.dateText}>{formatDate(item.requestedDate)}</Text>
                                </View>
                            </View>

                            <View style={styles.comparisonTable}>
                                <View style={styles.tableRow}>
                                    <Text style={styles.tableLabel}>Field</Text>
                                    <Text style={styles.tableHeader}>Original</Text>
                                    <Text style={styles.tableHeader}>Correction</Text>
                                </View>
                                <View style={styles.tableRow}>
                                    <Text style={styles.tableLabel}>Clock In</Text>
                                    <Text style={styles.originalValue}>{formatTime(item.oldClockIn)}</Text>
                                    <Text style={styles.correctionValue}>{formatTime(item.requestedClockIn)}</Text>
                                </View>
                                <View style={styles.tableRow}>
                                    <Text style={styles.tableLabel}>Clock Out</Text>
                                    <Text style={styles.originalValue}>{formatTime(item.oldClockOut)}</Text>
                                    <Text style={styles.correctionValue}>{formatTime(item.requestedClockOut)}</Text>
                                </View>
                            </View>

                            <View style={styles.reasonBox}>
                                <Text style={styles.reasonLabel}>Reason:</Text>
                                <Text style={styles.reasonText}>{item.reason}</Text>
                            </View>

                            <View style={styles.actionRow}>
                                <TouchableOpacity 
                                    style={styles.rejectButton} 
                                    onPress={() => handleAction(item, 'REJECT')}
                                >
                                    <MaterialIcons name="cancel" size={18} color="#E53E3E" />
                                    <Text style={styles.rejectText}> Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.approveButton} 
                                    onPress={() => handleAction(item, 'APPROVE')}
                                >
                                    <MaterialIcons name="check-circle" size={18} color="#38A169" />
                                    <Text style={styles.approveText}> Approve</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="inbox" size={50} color="#CBD5E0" />
                        <Text style={styles.emptyText}>No pending correction requests</Text>
                    </View>
                )}
                <View style={{ height: 50 }} />
            </ScrollView>

            {/* Admin Note Modal */}
            <Modal
                visible={showNoteModal}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {actionType === 'APPROVE' ? 'Approve Request' : 'Reject Request'}
                        </Text>
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Add a note (optional)..."
                            multiline
                            value={adminNote}
                            onChangeText={setAdminNote}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalCancel} 
                                onPress={() => setShowNoteModal(false)}
                            >
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[
                                    styles.modalSubmit,
                                    { backgroundColor: actionType === 'APPROVE' ? '#38A169' : '#E53E3E' }
                                ]} 
                                onPress={submitAction}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerTitle: { textAlign: 'center', width: '85%', color: 'white', fontWeight: 'bold', fontSize: 20 },
    backButton: { backgroundColor: 'white', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    headerText: { marginLeft: 12 },
    employeeName: { fontWeight: 'bold', fontSize: 16 },
    dateText: { color: '#64748B', fontSize: 13 },
    comparisonTable: { backgroundColor: 'white', borderRadius: 8, padding: 10, marginBottom: 10 },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    tableLabel: { flex: 1, color: '#64748B', fontSize: 12 },
    tableHeader: { flex: 1, fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
    originalValue: { flex: 1, textAlign: 'center', color: '#94A3B8', fontSize: 13, textDecorationLine: 'line-through' },
    correctionValue: { flex: 1, textAlign: 'center', color: '#1E293B', fontSize: 13, fontWeight: 'bold' },
    reasonBox: { padding: 10, backgroundColor: '#EFF6FF', borderRadius: 8, marginBottom: 12 },
    reasonLabel: { fontSize: 12, fontWeight: 'bold', color: '#3B82F6', marginBottom: 4 },
    reasonText: { fontSize: 13, color: '#1E293B' },
    actionRow: { flexDirection: 'row', gap: 10 },
    rejectButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, backgroundColor: '#FFF5F5', borderSize: 1, borderColor: '#FED7D7' },
    approveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, backgroundColor: '#F0FFF4', borderSize: 1, borderColor: '#C6F6D5' },
    rejectText: { color: '#E11D48', fontWeight: 'bold' },
    approveText: { color: '#059669', fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 10, color: '#94A3B8' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    noteInput: { height: 100, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, marginBottom: 20, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    modalCancel: { padding: 10 },
    modalSubmit: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
});

export default AttendanceCorrectionManager;
