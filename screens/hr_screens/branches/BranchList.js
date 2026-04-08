import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar,
    Dimensions,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../../services/api';

const { width } = Dimensions.get('window');

const BranchList = () => {
    const navigation = useNavigation();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBranches = async () => {
        try {
            const data = await apiService.getBranches();
            setBranches(data);
        } catch (error) {
            console.error('Failed to fetch branches:', error);
            Alert.alert('Error', 'Gagal mengambil data cabang.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBranches();
        }, [])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchBranches();
    };

    const handleDelete = (id, name) => {
        Alert.alert(
            'Hapus Cabang',
            `Apakah Anda yakin ingin menghapus cabang "${name}"?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiService.removeBranch(id);
                            fetchBranches();
                        } catch (error) {
                            Alert.alert('Error', 'Gagal menghapus cabang.');
                        }
                    }
                }
            ]
        );
    };

    const renderBranchCard = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('BranchAddEdit', { branch: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="business" size={24} color="#2563EB" />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.branchName}>{item.name}</Text>
                    <View style={styles.radiusBadge}>
                        <Text style={styles.radiusText}>{item.radius}m Radius</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#64748B" />
                    <Text style={styles.addressText} numberOfLines={1}>
                        {item.address || 'Alamat tidak diatur'}
                    </Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="people-outline" size={14} color="#64748B" />
                        <Text style={styles.statVal}>{item._count?.employees || 0} Karyawan</Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.stat}>
                        <MaterialCommunityIcons name="map-marker-radius" size={14} color="#64748B" />
                        <Text style={styles.statVal}>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.editLink}>Edit Detail Cabang</Text>
                <Ionicons name="chevron-forward" size={16} color="#2563EB" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.header}
            >
                <TouchableOpacity 
                    onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Overview')} 
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Daftar Cabang</Text>
                    <Text style={styles.subtitle}>{branches.length} Lokasi Terverifikasi</Text>
                </View>
                <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('BranchAddEdit')}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Memuat data cabang...</Text>
                </View>
            ) : (
                <FlatList
                    data={branches}
                    renderItem={renderBranchCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="business-outline" size={60} color="#CBD5E1" />
                            </View>
                            <Text style={styles.emptyTitle}>Belum Ada Cabang</Text>
                            <Text style={styles.emptyDesc}>Daftarkan lokasi kantor atau cabang Anda untuk membatasi radius absensi karyawan.</Text>
                            <TouchableOpacity 
                                style={styles.emptyBtn}
                                onPress={() => navigation.navigate('BranchAddEdit')}
                            >
                                <Text style={styles.emptyBtnText}>Tambah Cabang Pertama</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 0 : 20,
        paddingBottom: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        zIndex: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    titleContainer: {
        flex: 1,
        marginLeft: 15,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 1,
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 28,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 16,
    },
    branchName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1E293B',
    },
    radiusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 4,
    },
    radiusText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#0284C7',
    },
    cardBody: {
        marginTop: 18,
        paddingTop: 18,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    addressText: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 10,
        flex: 1,
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 14,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statVal: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginLeft: 8,
    },
    separator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 15,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 18,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    editLink: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2563EB',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyIconBox: {
        width: 120,
        height: 120,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 12,
    },
    emptyDesc: {
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 35,
    },
    emptyBtn: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 30,
        paddingVertical: 16,
        borderRadius: 20,
        elevation: 8,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    emptyBtnText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 16,
    },
    loadingText: {
        marginTop: 12,
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '700',
    }
});

export default BranchList;
