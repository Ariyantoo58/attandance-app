import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert, 
    Dimensions,
    Modal,
    TextInput,
    RefreshControl
} from 'react-native';
import { AntDesign, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllReimbursements } from '../../../auth/dataSlice';
import moment from 'moment';
import { API_BASE_URL } from '../../../config';

const { width, height } = Dimensions.get('window');

const ReimbursementManagement = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { allReimbursements, loading } = useSelector(state => state.data.hrDashboard);
    
    // UI States
    const [filter, setFilter] = useState('PENDING');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNote, setAdminNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        dispatch(fetchAllReimbursements());
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchAllReimbursements());
        setRefreshing(false);
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedRequest) return;
        
        try {
            setIsUpdating(true);
            await apiService.updateReimbursementStatus(selectedRequest.id, status, adminNote);
            Alert.alert('Berhasil', `Klaim telah ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`);
            setActionModalVisible(false);
            setAdminNote('');
            loadData();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Gagal memperbarui status');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredRequests = allReimbursements.filter(req => req.status === filter);

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'TRANSPORT': return 'car';
            case 'FOOD': return 'utensils';
            case 'MEDICAL': return 'briefcase-medical';
            case 'OFFICE': return 'building';
            default: return 'file-invoice-dollar';
        }
    };

    const renderCard = (item) => {
        return (
            <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.employeeInfo}>
                        <Image 
                            source={{ uri: item.employee?.avatarUrl || 'https://via.placeholder.com/150' }} 
                            style={styles.avatar} 
                        />
                        <View style={styles.employeeDetails}>
                            <Text style={styles.employeeName}>{item.employee?.name}</Text>
                            <Text style={styles.employeeDept}>{item.employee?.department || 'Staff'}</Text>
                        </View>
                    </View>
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateText}>{moment(item.date).format('DD MMM')}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.titleRow}>
                        <View style={styles.categoryIconBox}>
                            <FontAwesome5 name={getCategoryIcon(item.category)} size={14} color="#3B82F6" />
                        </View>
                        <Text style={styles.claimTitle} numberOfLines={1}>{item.title}</Text>
                    </View>
                    
                    <Text style={styles.amountText}>Rp {item.amount.toLocaleString()}</Text>
                    
                    {item.description ? (
                        <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                </View>

                <View style={styles.cardFooter}>
                    {item.receiptUrl && (
                        <TouchableOpacity 
                            style={styles.viewReceiptBtn}
                            onPress={() => {
                                setImageError(false);
                                setImageLoading(true);
                                setSelectedImage(`${API_BASE_URL}${item.receiptUrl}`);
                            }}
                        >

                            <Ionicons name="image-outline" size={16} color="#2563EB" />
                            <Text style={styles.viewReceiptText}>Lihat Nota</Text>
                        </TouchableOpacity>
                    )}
                    
                    {item.status === 'PENDING' ? (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity 
                                style={[styles.actionBtn, styles.rejectBtn]}
                                onPress={() => {
                                    setSelectedRequest(item);
                                    setActionModalVisible(true);
                                }}
                            >
                                <Text style={styles.rejectBtnText}>Proses</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[styles.statusTag, { backgroundColor: item.status === 'APPROVED' ? '#ECFDF5' : '#FEF2F2' }]}>
                            <Text style={[styles.statusTagText, { color: item.status === 'APPROVED' ? '#059669' : '#DC2626' }]}>
                                {item.status}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.menuBtn} 
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                >
                    <Ionicons name="menu" size={26} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manajemen Klaim</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['PENDING', 'APPROVED', 'REJECTED'].map(f => (
                        <TouchableOpacity 
                            key={f}
                            onPress={() => setFilter(f)}
                            style={[styles.filterTab, filter === f && styles.filterTabActive]}
                        >
                            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                                {f}
                            </Text>
                            {filter === f && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView 
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 50 }} />
                ) : filteredRequests.length > 0 ? (
                    filteredRequests.map(renderCard)
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="file-document-outline" size={80} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>Kosong</Text>
                        <Text style={styles.emptySubtitle}>Tidak ada pengajuan klaim {filter.toLowerCase()}.</Text>
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Modal */}
            <Modal visible={actionModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBody}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Proses Pengajuan</Text>
                            <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {selectedRequest && (
                            <View style={styles.modalSummary}>
                                <Text style={styles.summaryName}>{selectedRequest.employee?.name}</Text>
                                <Text style={styles.summaryAmount}>Rp {selectedRequest.amount.toLocaleString()}</Text>
                                <Text style={styles.summaryTitle}>{selectedRequest.title}</Text>
                            </View>
                        )}

                        <Text style={styles.inputLabel}>Catatan Admin (Opsional)</Text>
                        <TextInput 
                            style={styles.noteInput}
                            multiline
                            placeholder="Alasan persetujuan atau penolakan..."
                            value={adminNote}
                            onChangeText={setAdminNote}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalRejectBtn]}
                                onPress={() => handleUpdateStatus('REJECTED')}
                                disabled={isUpdating}
                            >
                                <Text style={styles.modalRejectText}>TOLAK</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalApproveBtn]}
                                onPress={() => handleUpdateStatus('APPROVED')}
                                disabled={isUpdating}
                            >
                                {isUpdating ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.modalApproveText}>SETUJUI</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Image Preview Modal */}
            <Modal visible={!!selectedImage} transparent animationType="fade">
                <View style={styles.imageModalOverlay}>
                    <TouchableOpacity 
                        style={styles.closeImageBtn} 
                        onPress={() => {
                            setSelectedImage(null);
                            setImageError(false);
                        }}
                    >
                        <Ionicons name="close" size={32} color="white" />
                    </TouchableOpacity>
                    
                    {imageLoading && (
                        <View style={styles.imageLoader}>
                            <ActivityIndicator size="large" color="white" />
                        </View>
                    )}

                    {imageError ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
                            <Text style={styles.errorText}>Gagal memuat gambar</Text>
                            <Text style={styles.errorSubtext}>{selectedImage}</Text>
                        </View>
                    ) : (
                        <Image 
                            source={{ uri: selectedImage }} 
                            style={styles.fullImage} 
                            resizeMode="contain" 
                            onLoadStart={() => setImageLoading(true)}
                            onLoadEnd={() => setImageLoading(false)}
                            onError={(e) => {
                                console.log("Image load error:", e.nativeEvent.error);
                                setImageError(true);
                                setImageLoading(false);
                            }}
                        />
                    )}
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
        paddingTop: 50, 
        paddingBottom: 20,
        backgroundColor: 'white'
    },
    menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    
    filterSection: { backgroundColor: 'white', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05 },
    filterScroll: { paddingHorizontal: 20, gap: 15 },
    filterTab: { paddingBottom: 12, paddingHorizontal: 5, position: 'relative' },
    filterTabText: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
    filterTabTextActive: { color: '#2563EB' },
    activeIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#2563EB', borderRadius: 3 },
    
    content: { flex: 1, padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 24, padding: 18, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.04 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    employeeInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F1F5F9' },
    employeeDetails: { marginLeft: 12 },
    employeeName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    employeeDept: { fontSize: 11, color: '#64748B', fontWeight: '600' },
    dateBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    dateText: { fontSize: 11, fontWeight: '700', color: '#475569' },
    
    cardBody: { marginBottom: 15 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    categoryIconBox: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    claimTitle: { fontSize: 14, color: '#475569', fontWeight: '500', flex: 1 },
    amountText: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
    descriptionText: { fontSize: 12, color: '#64748B', marginTop: 5, lineHeight: 18 },
    
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    viewReceiptBtn: { flexDirection: 'row', alignItems: 'center' },
    viewReceiptText: { fontSize: 12, fontWeight: '800', color: '#2563EB', marginLeft: 6 },
    actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    rejectBtn: { backgroundColor: '#1E293B' },
    rejectBtnText: { color: 'white', fontSize: 11, fontWeight: '800' },
    statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusTagText: { fontSize: 11, fontWeight: '800' },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginTop: 15 },
    emptySubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 5 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBody: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
    modalSummary: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 20, marginBottom: 20 },
    summaryName: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 5 },
    summaryAmount: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
    summaryTitle: { fontSize: 14, color: '#475569', marginTop: 5 },
    inputLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 8, marginLeft: 5 },
    noteInput: { backgroundColor: '#F1F5F9', borderRadius: 16, height: 100, padding: 15, textAlignVertical: 'top', marginBottom: 25 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    modalRejectBtn: { backgroundColor: 'white', borderWidth: 1.5, borderColor: '#EF4444' },
    modalRejectText: { color: '#EF4444', fontWeight: '900', fontSize: 14 },
    modalApproveBtn: { backgroundColor: '#10B981' },
    modalApproveText: { color: 'white', fontWeight: '900', fontSize: 14 },

    imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '100%', height: '80%' },
    closeImageBtn: { position: 'absolute', top: 50, right: 25, zIndex: 10 },
    imageLoader: { position: 'absolute', zIndex: 5 },
    errorContainer: { alignItems: 'center', padding: 20 },
    errorText: { color: 'white', fontSize: 16, fontWeight: '800', marginTop: 15 },
    errorSubtext: { color: '#94A3B8', fontSize: 12, marginTop: 10, textAlign: 'center' }
});

export default ReimbursementManagement;

