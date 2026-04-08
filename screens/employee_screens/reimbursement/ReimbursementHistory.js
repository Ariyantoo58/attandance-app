import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    StyleSheet, 
    Dimensions, 
    RefreshControl,
    Image,
    Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMyReimbursements } from '../../../auth/dataSlice';
import moment from 'moment';
import { API_BASE_URL } from '../../../config';

const { width, height } = Dimensions.get('window');

const ReimbursementHistory = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const reimbursements = useSelector(state => state.data.employeeData.reimbursements);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('All');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);


    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        setLoading(true);
        await dispatch(fetchMyReimbursements());
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchMyReimbursements());
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return '#10B981';
            case 'REJECTED': return '#EF4444';
            default: return '#F59E0B';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'TRANSPORT': return 'car';
            case 'FOOD': return 'utensils';
            case 'MEDICAL': return 'briefcase-medical';
            case 'OFFICE': return 'building';
            default: return 'file-invoice-dollar';
        }
    };

    const filteredData = reimbursements.filter(item => {
        if (filter === 'All') return true;
        return item.status === filter;
    });

    const renderItem = (item) => {
        const statusColor = getStatusColor(item.status);
        
        return (
            <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.7}>
                <View style={[styles.statusSide, { backgroundColor: statusColor }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.categoryBadge}>
                            <FontAwesome5 name={getCategoryIcon(item.category)} size={12} color="#64748B" />
                            <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                        <Text style={styles.itemDate}>{moment(item.date).format('DD MMM YYYY')}</Text>
                    </View>
                    
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemAmount}>Rp {item.amount.toLocaleString()}</Text>
                    
                    {item.description ? (
                        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}

                    <View style={styles.cardFooter}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                        </View>
                        
                        {item.receiptUrl && (
                            <TouchableOpacity 
                                style={styles.receiptLink}
                                onPress={() => {
                                    setImageError(false);
                                    setImageLoading(true);
                                    setSelectedImage(`${API_BASE_URL}${item.receiptUrl}`);
                                }}
                            >

                                <Ionicons name="image-outline" size={16} color="#2563EB" />
                                <Text style={styles.receiptLinkText}>Lihat Nota</Text>
                            </TouchableOpacity>
                        )}

                        {item.status === 'PENDING' && (
                            <TouchableOpacity 
                                style={styles.editBtn}
                                onPress={() => navigation.navigate('ReimbursementRequest', { editData: item })}
                            >
                                <Ionicons name="create-outline" size={18} color="#4F8EF7" />
                                <Text style={styles.editText}>Edit</Text>
                            </TouchableOpacity>
                        )}
                    </View>


                    {item.adminNote && (
                        <View style={styles.adminNoteBox}>
                            <Text style={styles.adminNoteLabel}>Catatan Admin:</Text>
                            <Text style={styles.adminNoteText}>{item.adminNote}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />
            
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Riwayat Klaim</Text>
                    <TouchableOpacity 
                        style={styles.addBtn}
                        onPress={() => navigation.navigate('ReimbursementRequest')}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>
                
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.filterContainer}
                >
                    {['All', 'PENDING', 'APPROVED', 'REJECTED'].map(f => (
                        <TouchableOpacity 
                            key={f} 
                            style={[styles.filterTab, filter === f && styles.filterTabActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                                {f === 'All' ? 'Semua' : f}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 50 }} />
                ) : filteredData.length > 0 ? (
                    filteredData.map(renderItem)
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <MaterialCommunityIcons name="file-search-outline" size={60} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>Tidak Ada Data</Text>
                        <Text style={styles.emptySubtitle}>Data reimbursement Anda akan muncul di sini.</Text>
                        <TouchableOpacity 
                            style={styles.emptyBtn}
                            onPress={() => navigation.navigate('ReimbursementRequest')}
                        >
                            <Text style={styles.emptyBtnText}>Buat Pengajuan Baru</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    header: { backgroundColor: 'white', paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
    addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 4 },
    filterContainer: { paddingHorizontal: 20, marginTop: 5 },
    filterTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginRight: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
    filterTabActive: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
    filterTabText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    filterTabTextActive: { color: 'white' },
    
    scrollContent: { padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 24, marginBottom: 16, flexDirection: 'row', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
    statusSide: { width: 6 },
    cardContent: { flex: 1, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    categoryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    categoryText: { fontSize: 10, fontWeight: '800', color: '#64748B', marginLeft: 6, textTransform: 'uppercase' },
    itemDate: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    itemTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    itemAmount: { fontSize: 18, fontWeight: '900', color: '#2563EB', marginBottom: 8 },
    itemDesc: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 12 },
    
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    receiptLink: { flexDirection: 'row', alignItems: 'center' },
    receiptLinkText: { fontSize: 12, fontWeight: '800', color: '#2563EB', marginLeft: 5 },
    editBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: 15, padding: 5 },
    editText: { fontSize: 12, fontWeight: '800', color: '#4F8EF7', marginLeft: 4 },
    
    adminNoteBox: { marginTop: 15, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 14, borderLeftWidth: 3, borderLeftColor: '#CBD5E1' },

    adminNoteLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 4 },
    adminNoteText: { fontSize: 13, color: '#475569', lineHeight: 18 },

    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
    emptyBtn: { backgroundColor: '#1E293B', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 16 },
    emptyBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
    
    imageModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '100%', height: '80%' },
    closeImageBtn: { position: 'absolute', top: 50, right: 25, zIndex: 10 },
    imageLoader: { position: 'absolute', zIndex: 5 },
    errorContainer: { alignItems: 'center', padding: 20 },
    errorText: { color: 'white', fontSize: 16, fontWeight: '800', marginTop: 15 },
    errorSubtext: { color: '#94A3B8', fontSize: 12, marginTop: 10, textAlign: 'center' }
});


export default ReimbursementHistory;
