import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { apiService } from '../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const OvertimeManagement = ({ navigation }) => {
    const [overtimes, setOvertimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionType, setActionType] = useState(''); // 'APPROVE' or 'REJECT'
    const [adminNote, setAdminNote] = useState('');
    const [processing, setProcessing] = useState(false);

    const fetchPendingOvertimes = useCallback(async () => {
        try {
            const data = await apiService.getAllPendingOvertime();
            setOvertimes(data);
        } catch (error) {
            console.error('Fetch pending overtime error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingOvertimes();
    }, [fetchPendingOvertimes]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPendingOvertimes();
    };

    const handleAction = async () => {
        if (!selectedItem) return;

        setProcessing(true);
        try {
            const status = actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED';
            await apiService.approveOvertime(selectedItem.id, status, adminNote);
            
            Alert.alert('Sukses', `Pengajuan lembur telah ${status.toLowerCase()}.`);
            setModalVisible(false);
            setAdminNote('');
            fetchPendingOvertimes();
        } catch (error) {
            console.error('Approve overtime error:', error);
            Alert.alert('Error', 'Gagal memproses pengajuan lembur.');
        } finally {
            setProcessing(false);
        }
    };

    const openModal = (item, type) => {
        setSelectedItem(item);
        setActionType(type);
        setModalVisible(true);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{item.employee.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.employeeName}>{item.employee.name}</Text>
                    <Text style={styles.employeeRole}>{item.employee.designation || 'Staff'}</Text>
                </View>
                <View style={styles.dateInfo}>
                    <Text style={styles.dateText}>{moment(item.date).format('DD MMM')}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.timeInfo}>
                    <Ionicons name="time-outline" size={18} color="#718096" />
                    <Text style={styles.timeText}>
                        {moment(item.startTime).format('HH:mm')} - {moment(item.endTime).format('HH:mm')}
                    </Text>
                </View>
                <View style={styles.reasonInfo}>
                    <Text style={styles.reasonLabel}>Alasan:</Text>
                    <Text style={styles.reasonText}>{item.reason}</Text>
                </View>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => openModal(item, 'REJECT')}
                >
                    <Ionicons name="close-circle-outline" size={20} color="#F56565" />
                    <Text style={styles.rejectButtonText}>Tolak</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => openModal(item, 'APPROVE')}
                >
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                    <Text style={styles.approveButtonText}>Setujui</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2D3748" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#2D3748', '#1A202C']}
                style={styles.header}
            >
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manajemen Lembur</Text>
                <View style={styles.badgeCount}>
                    <Text style={styles.badgeText}>{overtimes.length} Pending</Text>
                </View>
            </LinearGradient>

            <FlatList
                data={overtimes}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="checkmark-done-circle-outline" size={80} color="#CBD5E0" />
                        <Text style={styles.emptyText}>Tidak ada pengajuan lembur pending</Text>
                    </View>
                }
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {actionType === 'APPROVE' ? 'Setujui Lembur' : 'Tolak Lembur'}
                        </Text>
                        <Text style={styles.modalSubtitle}>
                            {selectedItem?.employee.name} - {moment(selectedItem?.date).format('DD MMMM')}
                        </Text>
                        
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Tambahkan catatan (opsional)..."
                            multiline
                            numberOfLines={3}
                            value={adminNote}
                            onChangeText={setAdminNote}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[
                                    styles.modalButton, 
                                    actionType === 'APPROVE' ? styles.confirmApprove : styles.confirmReject
                                ]}
                                onPress={handleAction}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Konfirmasi</Text>
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
    container: {
        flex: 1,
        backgroundColor: '#F7FAFC',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
    },
    badgeCount: {
        backgroundColor: '#E53E3E',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#EDF2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    headerInfo: {
        flex: 1,
    },
    employeeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2D3748',
    },
    employeeRole: {
        fontSize: 12,
        color: '#718096',
    },
    dateInfo: {
        backgroundColor: '#F7FAFC',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4A5568',
    },
    cardBody: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timeText: {
        fontSize: 14,
        color: '#2D3748',
        fontWeight: '600',
        marginLeft: 8,
    },
    reasonInfo: {
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 8,
    },
    reasonLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#718096',
        marginBottom: 2,
    },
    reasonText: {
        fontSize: 13,
        color: '#4A5568',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        flex: 1,
    },
    rejectButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#FED7D7',
        marginRight: 10,
    },
    approveButton: {
        backgroundColor: '#38A169',
    },
    rejectButtonText: {
        color: '#E53E3E',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    approveButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 20,
        fontSize: 16,
        color: '#A0AEC0',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2D3748',
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        padding: 15,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        paddingVertical: 12,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#EDF2F7',
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#4A5568',
        fontWeight: 'bold',
    },
    confirmApprove: {
        backgroundColor: '#38A169',
    },
    confirmReject: {
        backgroundColor: '#E53E3E',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default OvertimeManagement;
