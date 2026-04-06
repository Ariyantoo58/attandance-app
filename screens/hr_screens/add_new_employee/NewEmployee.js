import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    ScrollView, 
    Alert, 
    TouchableOpacity, 
    ActivityIndicator, 
    Platform, 
    StatusBar,
    Modal,
    FlatList,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { apiService } from '../../../services/api';

const { width, height } = Dimensions.get('window');

const AddNewEmployee = () => {
    const navigation = useNavigation();

    // Account States (Mandatory Step 1)
    const [employeeName, setEmployeeName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('EMPLOYEE');
    const [ptkpStatus, setPtkpStatus] = useState('TK0');

    // UI States
    const [loading, setLoading] = useState(false);
    
    // Bottom Sheet / Modal States
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(''); // 'ptkp', 'role'
    const [pickerTitle, setPickerTitle] = useState('');

    const TAX_OPTIONS = [
        { id: 'TK0', name: 'TK/0 (Belum Menikah)' },
        { id: 'TK1', name: 'TK/1 (1 Tanggungan)' },
        { id: 'TK2', name: 'TK/2 (2 Tanggungan)' },
        { id: 'TK3', name: 'TK/3 (3 Tanggungan)' },
        { id: 'K0', name: 'K/0 (Menikah)' },
        { id: 'K1', name: 'K/1 (Menikah, 1 Tanggungan)' },
        { id: 'K2', name: 'K/2 (Menikah, 2 Tanggungan)' },
        { id: 'K3', name: 'K/3 (Menikah, 3 Tanggungan)' },
    ];

    const ROLE_OPTIONS = [
        { id: 'EMPLOYEE', name: 'Employee' },
        { id: 'MANAGER', name: 'Manager' },
        { id: 'HR', name: 'HR Staff' },
        { id: 'ADMIN', name: 'Administrator' },
    ];

    const handleSubmit = async () => {
        if (!employeeName || !username || !password || !email) {
            return Alert.alert('Eror', 'Nama Lengkap, Email, Username & Password wajib diisi.');
        }

        setLoading(true);
        try {
            const employeeData = {
                name: employeeName,
                username,
                password,
                email,
                role,
                status: 'ACTIVE',
                employeeNumber: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
                ptkpStatus,
            };

            const response = await apiService.createEmployee(employeeData);
            if (response && response.id) {
                console.log("Account created:", response);
                Alert.alert(
                    "Berhasil Terdaftar", 
                    "Akun login karyawan telah berhasil dibuat!",
                    [
                        { 
                            text: "Nanti Saja", 
                            onPress: () => {
                                navigation.navigate("ManagerDrawer", { 
                                    screen: "Dashboard", 
                                    params: { screen: "Employees" } 
                                });
                            },
                            style: "cancel"
                        },
                        { 
                            text: "Lengkapi Detail Sekarang", 
                            onPress: () => {
                                navigation.replace("EmployeeEdit", { employee: response });
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Eror', 'Gagal membuat akun karyawan. ' + (error.message || ""));
        } finally {
            setLoading(false);
        }
    };

    const openPicker = (type, title) => {
        setPickerType(type);
        setPickerTitle(title);
        setPickerVisible(true);
    };

    const handleSelect = (item) => {
        if (pickerType === 'ptkp') setPtkpStatus(item.id);
        if (pickerType === 'role') setRole(item.id);
        setPickerVisible(false);
    };

    const getSelectedLabel = (type) => {
        if (type === 'ptkp') return TAX_OPTIONS.find(t => t.id === ptkpStatus)?.name || 'Pilih Status...';
        if (type === 'role') return ROLE_OPTIONS.find(r => r.id === role)?.name || 'Pilih Role...';
        return '';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pendaftaran Akun</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.infoCard}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="person-add-outline" size={30} color="#3B82F6" />
                    </View>
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoTitle}>Langkah 1: Buat Akun</Text>
                        <Text style={styles.infoDesc}>Masukan data dasar untuk akses login karyawan baru.</Text>
                    </View>
                </View>

                {/* Account Credentials */}
                <View style={styles.mainCard}>
                    <View style={styles.field}>
                        <Text style={styles.label}>Nama Lengkap</Text>
                        <TextInput 
                            style={styles.input} 
                            value={employeeName} 
                            onChangeText={setEmployeeName} 
                            placeholder="E.g. Jhon Doe" 
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput 
                            style={styles.input} 
                            value={username} 
                            onChangeText={setUsername} 
                            placeholder="e.g. ari.oke" 
                            autoCapitalize="none" 
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Email Perusahaan</Text>
                        <TextInput 
                            style={styles.input} 
                            value={email} 
                            onChangeText={setEmail} 
                            placeholder="ari@company.com" 
                            keyboardType="email-address" 
                            autoCapitalize="none" 
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Password Awal</Text>
                        <TextInput 
                            style={styles.input} 
                            value={password} 
                            onChangeText={setPassword} 
                            placeholder="Minimal 6 karakter" 
                            secureTextEntry 
                        />
                    </View>

                    <TouchableOpacity onPress={() => openPicker('role', 'Pilih Role Sistem')} style={styles.selector}>
                        <View>
                            <Text style={styles.selectorLabel}>Role Sistem</Text>
                            <Text style={styles.selectorVal}>{getSelectedLabel('role')}</Text>
                        </View>
                        <Ionicons name="shield-checkmark-outline" size={20} color="#3B82F6" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => openPicker('ptkp', 'Status Pajak (PTKP)')} style={styles.selector}>
                        <View>
                            <Text style={styles.selectorLabel}>Status Pajak (PTKP)</Text>
                            <Text style={styles.selectorVal}>{getSelectedLabel('ptkp')}</Text>
                        </View>
                        <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    style={styles.finalBtn} 
                    onPress={handleSubmit} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.finalBtnText}>DAFTARKAN AKUN SEKARANG</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 60 }} />
            </ScrollView>

            <Modal visible={pickerVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBody}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{pickerTitle}</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={pickerType === 'ptkp' ? TAX_OPTIONS : ROLE_OPTIONS}
                            keyExtractor={(item) => (item.id).toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.optionItem} onPress={() => handleSelect(item)}>
                                    <View>
                                        <Text style={styles.optionLabel}>{item.name}</Text>
                                        {item.id === 'ADMIN' && <Text style={styles.optionSub}>Akses penuh sistem</Text>}
                                    </View>
                                    {(ptkpStatus === item.id || role === item.id) && (
                                        <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EFF6FF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 12 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    scrollContent: { padding: 20 },
    infoCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, backgroundColor: 'white', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#BFDBFE' },
    iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
    infoTextContainer: { flex: 1, marginLeft: 15 },
    infoTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    infoDesc: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 18 },
    mainCard: { backgroundColor: 'white', borderRadius: 28, padding: 25, marginBottom: 25, shadowColor: '#3B82F6', shadowOffset: { width:0, height:10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
    field: { marginBottom: 22 },
    label: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 16, height: 56, paddingHorizontal: 18, fontSize: 15, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, backgroundColor: '#F8FAFC', borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
    selectorLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
    selectorVal: { fontSize: 15, color: '#1E293B', fontWeight: '700', marginTop: 4 },
    finalBtn: { 
        backgroundColor: '#1E293B', 
        height: 60, 
        borderRadius: 20, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        shadowColor: '#1E293B', 
        shadowOffset: { width:0, height:8 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 15, 
        elevation: 8, 
        marginTop: 10 
    },
    finalBtnText: { 
        color: 'white', 
        fontSize: 16, 
        fontWeight: '900', 
        letterSpacing: 1 
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalBody: { backgroundColor: 'white', borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingBottom: 40, maxHeight: height * 0.7 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
    optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    optionLabel: { fontSize: 16, color: '#1E293B', fontWeight: '700' },
    optionSub: { fontSize: 12, color: '#64748B', marginTop: 2 }
});

export default AddNewEmployee;
