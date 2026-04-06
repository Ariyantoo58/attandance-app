import React, { useState, useEffect, useCallback } from 'react';
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
    Switch, 
    Image, 
    StatusBar,
    KeyboardAvoidingView,
    Modal,
    FlatList,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../../../auth/authSlice';

const { width, height } = Dimensions.get('window');

// Configure Calendar for Indonesian
LocaleConfig.locales['id'] = {
    monthNames: ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'],
    monthNamesShort: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'],
    dayNames: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
    dayNamesShort: ['Min','Sen','Sel','Rab','Kam','Jum','Sab'],
    today: 'Hari ini'
};
LocaleConfig.defaultLocale = 'id';

const EmployeeEdit = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { employee } = route.params;

    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const loggedInEmployeeId = user?.user?.employeeId || user?.user?.employee?.id;

    // Form States
    const [employeeName, setEmployeeName] = useState(employee.name || '');
    const [designation, setDesignation] = useState(employee.designation || '');
    const [salary, setSalary] = useState(employee.salary?.toString() || '');
    const [joinDate, setJoinDate] = useState(employee.joinDate ? employee.joinDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    const [birthDay, setBirthDay] = useState(employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '1995-01-01');
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(employee.departmentId || null);
    const [selectedPositionId, setSelectedPositionId] = useState(employee.positionId || null);
    const [ptkpStatus, setPtkpStatus] = useState(employee.ptkpStatus || 'TK0');
    const [gender, setGender] = useState(employee.gender || 'MALE');
    const [activeEmployee, setActiveEmployee] = useState(employee.status === 'ACTIVE');
    const [number, setNumber] = useState(employee.phoneNumber || '');
    const [address, setAddress] = useState(employee.address || '');
    const [employeeNumber, setEmployeeNumber] = useState(employee.employeeNumber || '');
    const [avatarUrl, setAvatarUrl] = useState(employee.avatarUrl || '');
    
    // Academic & Experience
    const [study, setStudy] = useState(employee.study || '');
    const [experience, setExperience] = useState(employee.experience || '');
    const [achievement, setAchievement] = useState(employee.achievement || '');
    const [marks10, setMarks10] = useState(employee.marks10?.toString() || '');
    const [marks12, setMarks12] = useState(employee.marks12?.toString() || '');
    const [graduationMarks, setGraduationMarks] = useState(employee.graduationMarks?.toString() || '');

    // UI States
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [faceStatus, setFaceStatus] = useState({ registered: false });
    
    // Bottom Sheet / Modal States
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(''); // 'dept', 'pos', 'ptkp', 'birth', 'join'
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

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setFetching(true);
                try {
                    const [depts, posts, status] = await Promise.all([
                        apiService.getDepartments(),
                        apiService.getPositions(),
                        apiService.checkFaceStatus(employee.id)
                    ]);
                    if (Array.isArray(depts)) setDepartments(depts);
                    if (Array.isArray(posts)) setPositions(posts);
                    if (status) setFaceStatus(status);
                } catch (error) {
                    console.error('Failed to fetch screen data:', error);
                } finally {
                    setFetching(false);
                }
            };
            fetchData();
        }, [employee.id])
    );

    const handleUpdate = async () => {
        if (!employeeName) return Alert.alert('Eror', 'Nama wajib diisi.');
        setLoading(true);
        try {
            const updateData = {
                name: employeeName,
                salary: parseFloat(salary) || 0,
                joinDate: new Date(joinDate),
                dateOfBirth: new Date(birthDay),
                status: activeEmployee ? 'ACTIVE' : 'INACTIVE',
                phoneNumber: number,
                address: address,
                designation: designation,
                departmentId: selectedDepartmentId,
                positionId: selectedPositionId,
                gender: gender,
                employeeNumber: employeeNumber,
                avatarUrl: avatarUrl,
                ptkpStatus: ptkpStatus,
                study,
                experience,
                achievement,
                marks10: parseFloat(marks10) || 0,
                marks12: parseFloat(marks12) || 0,
                graduationMarks: parseFloat(graduationMarks) || 0
            };
            await apiService.updateEmployeeProfile(employee.id, updateData);
            if (employee.id === loggedInEmployeeId) {
                dispatch(updateUserProfile({ id: employee.id, name: employeeName, avatarUrl, designation, gender }));
            }
            Alert.alert("Berhasil", "Data karyawan diperbarui.");
            navigation.goBack();
        } catch (error) {
            Alert.alert('Eror', 'Gagal memperbarui data.');
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
        if (pickerType === 'dept') setSelectedDepartmentId(item.id);
        if (pickerType === 'pos') setSelectedPositionId(item.id);
        if (pickerType === 'ptkp') setPtkpStatus(item.id);
        setPickerVisible(false);
    };

    const getSelectedLabel = (type) => {
        if (type === 'dept') return departments.find(d => d.id === selectedDepartmentId)?.name || 'Pilih Departemen...';
        if (type === 'pos') return positions.find(p => p.id === selectedPositionId)?.title || 'Pilih Jabatan...';
        if (type === 'ptkp') return TAX_OPTIONS.find(t => t.id === ptkpStatus)?.name || 'Pilih Status...';
        return '';
    };

    if (fetching) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Menyiapkan portal...</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manajemen Karyawan</Text>
                <TouchableOpacity onPress={handleUpdate} disabled={loading} style={styles.headerSaveBtn}>
                    {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.headerSaveText}>Simpan</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Avatar Selection */}
                <View style={styles.avatarSection}>
                    <Text style={styles.sectionLabel}>Avatar Karyawan</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarList}>
                        {[
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611722.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611746.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611734.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611740.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611728.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611765.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611768.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611753.jpg',
                            'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611759.jpg',
                        ].map((url, i) => (
                            <TouchableOpacity key={i} onPress={() => setAvatarUrl(url)} style={[styles.avatarBox, avatarUrl === url && styles.avatarActive]}>
                                <Image source={{ uri: url }} style={styles.avatarImg} />
                                {avatarUrl === url && <View style={styles.activeBadge}><Ionicons name="checkmark" size={12} color="white" /></View>}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Identity Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Identitas Utama</Text>
                    
                    <View style={styles.field}>
                        <Text style={styles.label}>Nama Lengkap</Text>
                        <TextInput style={styles.input} value={employeeName} onChangeText={setEmployeeName} placeholder="E.g. Jhon Doe" />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>ID Karyawan</Text>
                            <TextInput style={styles.input} value={employeeNumber} onChangeText={setEmployeeNumber} placeholder="EMP1001" />
                        </View>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.genderSwitch}>
                                <TouchableOpacity onPress={() => setGender('MALE')} style={[styles.genderHalf, gender === 'MALE' && styles.genderActive]}>
                                    <Text style={[styles.genderLabel, gender === 'MALE' && styles.genderLabelActive]}>Pria</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setGender('FEMALE')} style={[styles.genderHalf, gender === 'FEMALE' && styles.genderActive]}>
                                    <Text style={[styles.genderLabel, gender === 'FEMALE' && styles.genderLabelActive]}>Wanita</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => openPicker('birth', 'Pilih Tanggal Lahir')} style={styles.selector}>
                        <View>
                            <Text style={styles.selectorLabel}>Tanggal Lahir</Text>
                            <Text style={styles.selectorVal}>{birthDay}</Text>
                        </View>
                        <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>
                    
                    <View style={styles.field}>
                        <Text style={styles.label}>Nomor Telepon</Text>
                        <TextInput style={styles.input} value={number} onChangeText={setNumber} keyboardType="phone-pad" />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Alamat Lengkap</Text>
                        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={address} onChangeText={setAddress} multiline />
                    </View>
                </View>

                {/* Workplace Section */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Karir & Penempatan</Text>

                    <TouchableOpacity onPress={() => openPicker('dept', 'Pilih Departemen')} style={styles.selector}>
                        <View>
                            <Text style={styles.selectorLabel}>Departemen</Text>
                            <Text style={styles.selectorVal}>{getSelectedLabel('dept')}</Text>
                        </View>
                        <Ionicons name="business-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => openPicker('pos', 'Pilih Jabatan')} style={styles.selector}>
                        <View>
                            <Text style={styles.selectorLabel}>Jabatan (Role Id)</Text>
                            <Text style={styles.selectorVal}>{getSelectedLabel('pos')}</Text>
                        </View>
                        <Ionicons name="briefcase-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>

                    <View style={styles.field}>
                        <Text style={styles.label}>Jabatan Publik (Display)</Text>
                        <TextInput style={styles.input} value={designation} onChangeText={setDesignation} placeholder="Senior Manager" />
                    </View>

                    <TouchableOpacity onPress={() => openPicker('join', 'Tanggal Bergabung')} style={styles.selector}>
                        <View>
                            <Text style={styles.selectorLabel}>Tanggal Bergabung</Text>
                            <Text style={styles.selectorVal}>{joinDate}</Text>
                        </View>
                        <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>

                    <View style={styles.field}>
                        <Text style={styles.label}>Gaji Pokok</Text>
                        <View style={styles.salaryInput}>
                            <Text style={styles.rp}>Rp</Text>
                            <TextInput 
                                style={styles.salaryVal} 
                                value={salary?.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} 
                                onChangeText={(v) => setSalary(v.replace(/[^0-9]/g, ''))}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => openPicker('ptkp', 'Status PTKP')} style={styles.selector}>
                        <View>
                            <Text style={styles.selectorLabel}>Status Pajak (PTKP)</Text>
                            <Text style={styles.selectorVal}>{getSelectedLabel('ptkp')}</Text>
                        </View>
                        <Ionicons name="document-text-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>
                </View>

                {/* Academic & Experience Section */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Akademik & Pengalaman</Text>
                    
                    <View style={styles.field}>
                        <Text style={styles.label}>Pendidikan Terakhir</Text>
                        <TextInput style={styles.input} value={study} onChangeText={setStudy} placeholder="E.g. S1 Teknik Informatika" />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Pengalaman Kerja</Text>
                        <TextInput style={styles.input} value={experience} onChangeText={setExperience} placeholder="E.g. 5 Tahun Developer" />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Pencapaian / Skill</Text>
                        <TextInput style={styles.input} value={achievement} onChangeText={setAchievement} placeholder="E.g. Sertifikasi AWS" />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Nilai 10th</Text>
                            <TextInput style={styles.input} value={marks10} onChangeText={setMarks10} keyboardType="numeric" />
                        </View>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={styles.label}>Nilai 12th</Text>
                            <TextInput style={styles.input} value={marks12} onChangeText={setMarks12} keyboardType="numeric" />
                        </View>
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>IPK / Nilai Kelulusan</Text>
                        <TextInput style={styles.input} value={graduationMarks} onChangeText={setGraduationMarks} keyboardType="numeric" />
                    </View>
                </View>

                {/* Face Registration Status */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Keamanan Wajah</Text>
                    <View style={styles.faceStatusBox}>
                        <View style={styles.faceIconBox}>
                            <MaterialCommunityIcons 
                                name={faceStatus.registered ? "face-recognition" : "face-recognition"} 
                                size={32} 
                                color={faceStatus.registered ? "#10B981" : "#94A3B8"} 
                            />
                        </View>
                        <View style={styles.faceInfo}>
                            <Text style={[styles.faceTitle, { color: faceStatus.registered ? "#10B981" : "#1E293B" }]}>
                                {faceStatus.registered ? "Wajah Terverifikasi" : "Belum Ada Data Wajah"}
                            </Text>
                            <Text style={styles.faceDesc}>
                                {faceStatus.registered ? "Akses absensi mandiri aktif." : "Karyawan perlu melakukan scan wajah."}
                            </Text>
                        </View>
                    </View>
                    {faceStatus.registered ? (
                        <TouchableOpacity style={styles.resetFaceBtn} onPress={() => {
                            Alert.alert("Reset Wajah", "Hapus data verifikasi wajah karyawan ini?", [
                                { text: "Batal", style: "cancel" },
                                { text: "Reset", style: "destructive", onPress: async () => {
                                    await apiService.resetFaceData(employee.id);
                                    setFaceStatus({ registered: false });
                                }}
                            ]);
                        }}>
                            <Text style={styles.resetFaceText}>Reset Data Wajah</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.registerFaceBtn} onPress={() => navigation.navigate("FaceRecognition", {
                            mode: 'registration',
                            employeeId: employee.id,
                            employeeName: employeeName
                        })}>
                            <Text style={styles.registerFaceText}>Daftar Wajah Sekarang</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Status Row */}
                <View style={styles.statusRow}>
                    <View>
                        <Text style={styles.statusText}>Status Akun Karyawan</Text>
                        <Text style={styles.statusDescText}>{activeEmployee ? 'AKTIF - Bisa login & akses aplikasi' : 'NON-AKTIF - Akses dibekukan sementara'}</Text>
                    </View>
                    <Switch value={activeEmployee} onValueChange={setActiveEmployee} thumbColor="#2563EB" trackColor={{ true: '#BFDBFE' }} />
                </View>

                <TouchableOpacity style={styles.finalBtn} onPress={handleUpdate} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.finalBtnText}>SIMPAN PERUBAHAN</Text>}
                </TouchableOpacity>

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Custom Modal Picker */}
            <Modal visible={pickerVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBody}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{pickerTitle}</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        {(pickerType === 'birth' || pickerType === 'join') ? (
                            <Calendar
                                current={pickerType === 'birth' ? birthDay : joinDate}
                                onDayPress={(day) => {
                                    if (pickerType === 'birth') setBirthDay(day.dateString);
                                    else setJoinDate(day.dateString);
                                    setPickerVisible(false);
                                }}
                                theme={{
                                    todayTextColor: '#2563EB',
                                    selectedDayBackgroundColor: '#2563EB',
                                    arrowColor: '#2563EB',
                                }}
                            />
                        ) : (
                            <FlatList
                                data={pickerType === 'dept' ? departments : (pickerType === 'pos' ? positions : TAX_OPTIONS)}
                                keyExtractor={(item) => (item.id || item.value).toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.optionItem} onPress={() => handleSelect(item)}>
                                        <Text style={styles.optionLabel}>{item.name || item.title || item.label}</Text>
                                        {(selectedDepartmentId === item.id || selectedPositionId === item.id || ptkpStatus === item.id) && (
                                            <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EFF6FF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#64748B', fontWeight: 'bold' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 12 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
    headerSaveBtn: { 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        backgroundColor: '#1E293B', 
        borderRadius: 12,
        shadowColor: '#1E293B',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3
    },
    headerSaveText: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: 13 
    },
    scrollContent: { padding: 16 },
    avatarSection: { marginBottom: 24 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
    avatarList: { flexDirection: 'row' },
    avatarBox: { width: 68, height: 68, borderRadius: 20, marginRight: 15, borderWidth: 2, borderColor: 'transparent', padding: 2, backgroundColor: 'white' },
    avatarActive: { borderColor: '#3B82F6' },
    avatarImg: { width: '100%', height: '100%', borderRadius: 18 },
    activeBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#3B82F6', borderRadius: 10, padding: 2, borderWidth: 2, borderColor: 'white' },
    mainCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
    cardHeader: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
    field: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 14, height: 52, paddingHorizontal: 15, fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    row: { flexDirection: 'row' },
    genderSwitch: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, height: 52, padding: 5, flex: 1 },
    genderHalf: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
    genderActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    genderLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '700' },
    genderLabelActive: { color: '#3B82F6' },
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#F8FAFC', borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
    selectorLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
    selectorVal: { fontSize: 14, color: '#1E293B', fontWeight: '700', marginTop: 4 },
    salaryInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, height: 52, borderWidth: 1, borderColor: '#E2E8F0' },
    rp: { paddingHorizontal: 15, fontSize: 14, fontWeight: '900', color: '#64748B' },
    salaryVal: { flex: 1, fontSize: 15, fontWeight: '800', color: '#1E293B' },
    faceStatusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 18, marginBottom: 16 },
    faceIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    faceInfo: { flex: 1, marginLeft: 15 },
    faceTitle: { fontSize: 15, fontWeight: '800' },
    faceDesc: { fontSize: 12, color: '#64748B', marginTop: 3 },
    resetFaceBtn: { backgroundColor: '#FFF1F2', height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    resetFaceText: { color: '#E11D48', fontWeight: 'bold', fontSize: 14 },
    registerFaceBtn: { backgroundColor: '#EFF6FF', height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    registerFaceText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 14 },
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', borderRadius: 24, marginBottom: 24 },
    statusText: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    statusDescText: { fontSize: 12, color: '#64748B', marginTop: 4 },
    finalBtn: { 
        backgroundColor: '#1E293B', 
        height: 60, 
        borderRadius: 20, 
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBody: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: height * 0.8 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    optionLabel: { fontSize: 15, color: '#334155', fontWeight: '600' }
});

export default EmployeeEdit;
