import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    Image, 
    StyleSheet, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator,
    TextInput,
    Platform,
    StatusBar
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchHrDashboard } from '@/auth/dataSlice';
import { apiService } from '../../../services/api';
import { 
    AntDesign, 
    Feather, 
    MaterialCommunityIcons, 
    Ionicons 
} from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EmployeeList = () => {
    const navigation = useNavigation();
    const { allEmployees: data, loading } = useSelector(state => state.data.hrDashboard);
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredEmployees = useMemo(() => {
        if (!searchQuery) return data;
        return data.filter(emp => 
            emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.employeeNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data, searchQuery]);

    const loadEmployees = () => {
        dispatch(fetchHrDashboard());
    };

    const handleDelete = (item) => {
        Alert.alert(
            'Konfirmasi Hapus',
            `Apakah Anda yakin ingin menghapus data ${item.name}? Data ini tidak dapat dikembalikan.`,
            [
                { text: 'Batal', style: 'cancel' },
                { 
                    text: 'Hapus Karyawan', 
                    onPress: () => deleteEmployee(item), 
                    style: 'destructive' 
                }
            ]
        );
    };

    const deleteEmployee = async (itemToDelete) => {
        try {
            await apiService.removeEmployee(itemToDelete.id);
            Alert.alert("Berhasil", "Data karyawan telah dihapus.");
            loadEmployees();
        } catch (error) {
            Alert.alert("Gagal", "Tidak dapat menghapus data karyawan.");
        }
    };

    const renderAvatar = (item) => {
        if (item.avatarUrl) {
            return <Image source={{ uri: item.avatarUrl }} style={styles.image} />;
        }
        
        const initials = item.name 
            ? item.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : '?';
            
        return (
            <View style={[styles.image, styles.initialsContainer]}>
                <Text style={styles.initialsText}>{initials}</Text>
            </View>
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.6}
            onPress={() => navigation.navigate("EmployeeDetails", { employee: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    {renderAvatar(item)}
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.roleText}>{item.designation || 'Staff Member'}</Text>
                    <View style={styles.idRow}>
                        <Ionicons name="id-card-outline" size={12} color="#94A3B8" />
                        <Text style={styles.idValue}>{item.employeeNumber || 'NO-ID'}</Text>
                    </View>
                </View>
                <View style={styles.actionColumn}>
                    <TouchableOpacity 
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate("EmployeeEdit", { employee: item })}
                    >
                        <Feather name="edit-2" size={16} color="#475569" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionBtn, { marginTop: 8 }]}
                        onPress={() => handleDelete(item)}
                    >
                        <Feather name="trash-2" size={16} color="#F87171" />
                    </TouchableOpacity>
                </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <View style={[styles.dot, { backgroundColor: item.isOnline ? '#22C55E' : '#CBD5E1' }]} />
                    <Text style={styles.footerText}>{item.department?.name || 'Main Office'}</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#94A3B8" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Daftar Karyawan</Text>
                    <TouchableOpacity 
                        style={[styles.navBtn, styles.addBtn]}
                        onPress={() => navigation.navigate("AddNewEmployee")}
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.searchWrapper}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color="#64748B" />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Cari karyawan atau jabatan..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </SafeAreaView>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text style={styles.loadingText}>Memuat data karyawan...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredEmployees}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContent}>
                            <Image 
                                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486744.png' }} 
                                style={styles.emptyImage}
                            />
                            <Text style={styles.emptyTitle}>Tidak ada hasil</Text>
                            <Text style={styles.emptySub}>Coba kata kunci yang berbeda</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: 'white',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtn: {
        backgroundColor: '#1E293B',
    },
    searchWrapper: {
        paddingHorizontal: 20,
        marginTop: 5,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        color: '#1E293B',
        fontSize: 14,
        paddingHorizontal: 10,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: 12,
    },
    image: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
    },
    initialsContainer: {
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initialsText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    roleText: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 4,
    },
    idRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    idValue: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        marginLeft: 4,
    },
    actionColumn: {
        alignItems: 'center',
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    divider: {
        height: 1,
        backgroundColor: '#F8FAFC',
        marginVertical: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    footerText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    loadingText: {
        marginTop: 12,
        color: '#94A3B8',
        fontSize: 13,
    },
    emptyContent: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyImage: {
        width: 80,
        height: 80,
        opacity: 0.2,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#64748B',
        marginTop: 15,
    },
    emptySub: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
    }
});

export default EmployeeList;
