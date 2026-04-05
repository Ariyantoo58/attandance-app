import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform, 
    ActivityIndicator, 
    Alert, 
    StyleSheet, 
    StatusBar,
    Modal,
    Dimensions
} from 'react-native';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { apiService } from '../../../services/api';
import { updateUserProfile } from '../../../auth/authSlice';
import { useSocket } from '../../../context/SocketContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';

const { height } = Dimensions.get('window');

const ProfileSetting = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const employeeId = user?.user?.employeeId;
    const userRole = user?.user?.role?.toLowerCase();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [faceStatus, setFaceStatus] = useState({ registered: false, message: '' });

    const [avatarUrl, setAvatarUrl] = useState('');
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [study, setStudy] = useState('');
    const [experience, setExperience] = useState('');
    const [achievement, setAchievement] = useState('');
    const [salary, setSalary] = useState('');
    const [gender, setGender] = useState('');
    const [mobileNo, setMobileNo] = useState('');
    const [address, setAddress] = useState('');
    const [ptkpStatus, setPtkpStatus] = useState('TK0');

    // UI States
    const [showDatePicker, setShowDatePicker] = useState(false);

    const TAX_OPTIONS = [
        { label: 'TK/0 (Single)', value: 'TK0' },
        { label: 'TK/1 (Single, 1 Dep)', value: 'TK1' },
        { label: 'TK/2 (Single, 2 Dep)', value: 'TK2' },
        { label: 'TK/3 (Single, 3 Dep)', value: 'TK3' },
        { label: 'K/0 (Married)', value: 'K0' },
        { label: 'K/1 (Married, 1 Dep)', value: 'K1' },
        { label: 'K/2 (Married, 2 Dep)', value: 'K2' },
        { label: 'K/3 (Married, 3 Dep)', value: 'K3' },
    ];

    const loadProfile = useCallback(async () => {
        if (!employeeId) return;
        try {
            setFetching(true);
            const [profile, status] = await Promise.all([
                apiService.getEmployeeProfile(employeeId),
                apiService.checkFaceStatus(employeeId)
            ]);

            setFaceStatus(status);

            if (profile) {
                setName(profile.name || '');
                setAvatarUrl(profile.avatarUrl || '');
                setDesignation(profile.designation || profile.position?.title || '');
                setDateOfBirth(profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '');
                setStudy(profile.study || '');
                setExperience(profile.experience || '');
                setAchievement(profile.achievement || '');
                setSalary(profile.salary?.toString() || '');
                setGender(profile.gender || 'MALE');
                setMobileNo(profile.phoneNumber || '');
                setAddress(profile.address || '');
                setPtkpStatus(profile.ptkpStatus || 'TK0');
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setFetching(false);
        }
    }, [employeeId]);

    const { socket } = useSocket();

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [loadProfile])
    );

    useEffect(() => {
        if (socket) {
            socket.on('employee_changed', (data) => {
                if (data.employee?.id === employeeId || data.employeeId === employeeId) {
                    loadProfile();
                }
            });
            return () => socket.off('employee_changed');
        }
    }, [socket, employeeId, loadProfile]);

    const handleSave = async () => {
        if (!name) return Alert.alert('Error', 'Name is required.');
        try {
            setLoading(true);
            const updateData = {
                name,
                avatarUrl,
                designation,
                study,
                experience,
                achievement,
                gender,
                phoneNumber: mobileNo,
                address,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            };
            await apiService.updateEmployeeProfile(employeeId, updateData);
            dispatch(updateUserProfile({ name, avatarUrl, designation, gender }));
            Alert.alert('Sukses', 'Profil berhasil diperbarui!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Gagal memperbarui profil.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetFace = async () => {
        Alert.alert(
            "Hapus Data Wajah",
            "Apakah Anda yakin ingin menghapus data wajah yang terdaftar?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await apiService.resetFaceData(employeeId);
                            setFaceStatus({ registered: false });
                            Alert.alert("Berhasil", "Data wajah dihapus.");
                        } catch (error) {
                            Alert.alert("Error", "Gagal menghapus data.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (fetching) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Menyiapkan profil...</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pengaturan Profil</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveHeaderBtn}>
                    {loading ? <ActivityIndicator size="small" color="#2563EB" /> : <Text style={styles.saveHeaderText}>Simpan</Text>}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Avatar Picker */}
                    <View style={styles.avatarSection}>
                        <Text style={styles.sectionLabel}>Pilih Avatar</Text>
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

                    {/* Basic Info */}
                    <View style={styles.mainCard}>
                        <Text style={styles.cardHeader}>Informasi Dasar</Text>
                        
                        <View style={styles.field}>
                            <Text style={styles.label}>Nama Lengkap</Text>
                            <TextInput style={styles.input} value={name} onChangeText={setName} />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Jabatan</Text>
                            <TextInput style={[styles.input, styles.inputDisabled]} value={designation} editable={false} />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
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
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>Tanggal Lahir</Text>
                                <View style={styles.selector}>
                                    <Text style={styles.selectorVal}>{dateOfBirth || 'Pilih...'}</Text>
                                    <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Contact & Address */}
                    <View style={styles.mainCard}>
                        <Text style={styles.cardHeader}>Kontak & Alamat</Text>
                        <View style={styles.field}>
                            <Text style={styles.label}>No. Telepon</Text>
                            <TextInput style={styles.input} value={mobileNo} onChangeText={setMobileNo} keyboardType="phone-pad" />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Alamat Lengkap</Text>
                            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={address} onChangeText={setAddress} multiline />
                        </View>
                    </View>

                    {/* Academic */}
                    <View style={styles.mainCard}>
                        <Text style={styles.cardHeader}>Akademik & Karir</Text>
                        <View style={styles.field}>
                            <Text style={styles.label}>Pendidikan Terakhir</Text>
                            <TextInput style={styles.input} value={study} onChangeText={setStudy} />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Pengalaman</Text>
                            <TextInput style={styles.input} value={experience} onChangeText={setExperience} />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Pencapaian</Text>
                            <TextInput style={styles.input} value={achievement} onChangeText={setAchievement} />
                        </View>
                    </View>

                    {/* Face Recognition Card */}
                    <View style={styles.mainCard}>
                        <Text style={styles.cardHeader}>Keamanan</Text>
                        <View style={styles.faceCard}>
                            <View style={styles.faceIconBox}>
                                <MaterialCommunityIcons 
                                    name={faceStatus.registered ? "face-recognition" : "face-recognition"} 
                                    size={32} 
                                    color={faceStatus.registered ? "#10B981" : "#94A3B8"} 
                                />
                            </View>
                            <View style={styles.faceInfo}>
                                <Text style={[styles.faceTitle, { color: faceStatus.registered ? '#10B981' : '#1E293B' }]}>
                                    {faceStatus.registered ? 'Wajah Terdaftar' : 'Belum Terdaftar'}
                                </Text>
                                <Text style={styles.faceSub}>
                                    {faceStatus.registered ? 'Akses absensi mandiri aktif.' : 'Daftarkan wajah untuk verifikasi.'}
                                </Text>
                            </View>
                        </View>
                        {userRole === 'employee' && (
                            faceStatus.registered ? (
                                <TouchableOpacity style={styles.resetBtn} onPress={handleResetFace}>
                                    <Text style={styles.resetBtnText}>Reset Data Wajah</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate("FaceRecognition", {
                                    mode: 'registration',
                                    employeeId: employeeId,
                                    employeeName: name
                                })}>
                                    <Text style={styles.registerBtnText}>Daftar Wajah Sekarang</Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity style={styles.finalBtn} onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.finalBtnText}>SIMPAN PERUBAHAN</Text>}
                    </TouchableOpacity>

                    <View style={{ height: 60 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Calendar Modal */}
            <Modal visible={showDatePicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBody}>
                        <View style={styles.modalHead}>
                            <Text style={styles.modalTitle}>Pilih Tanggal Lahir</Text>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <Calendar
                            current={dateOfBirth || '1995-01-01'}
                            onDayPress={(day) => {
                                setDateOfBirth(day.dateString);
                                setShowDatePicker(false);
                            }}
                            theme={{
                                todayTextColor: '#2563EB',
                                selectedDayBackgroundColor: '#2563EB',
                                arrowColor: '#2563EB',
                            }}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#64748B', fontWeight: 'bold' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    saveHeaderBtn: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#EFF6FF', borderRadius: 10 },
    saveHeaderText: { color: '#2563EB', fontWeight: 'bold' },
    scrollContent: { padding: 16 },
    avatarSection: { marginBottom: 24 },
    sectionLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
    avatarList: { flexDirection: 'row' },
    avatarBox: { width: 68, height: 68, borderRadius: 34, marginRight: 15, borderWidth: 2, borderColor: 'transparent', padding: 2 },
    avatarActive: { borderColor: '#2563EB' },
    avatarImg: { width: '100%', height: '100%', borderRadius: 32 },
    activeBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#2563EB', borderRadius: 10, padding: 2, borderWidth: 2, borderColor: 'white' },
    mainCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15 },
    cardHeader: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
    field: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 14, height: 50, paddingHorizontal: 15, fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    inputDisabled: { backgroundColor: '#F1F5F9', color: '#94A3B8' },
    row: { flexDirection: 'row' },
    genderSwitch: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, height: 50, padding: 5 },
    genderHalf: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
    genderActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    genderLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '700' },
    genderLabelActive: { color: '#2563EB' },
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', height: 50 },
    selectorVal: { fontSize: 14, color: '#1E293B', fontWeight: '700' },
    faceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 18, marginBottom: 16 },
    faceIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    faceInfo: { flex: 1, marginLeft: 15 },
    faceTitle: { fontSize: 15, fontWeight: '800' },
    faceSub: { fontSize: 12, color: '#64748B', marginTop: 3 },
    resetBtn: { backgroundColor: '#FFF1F2', height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    resetBtnText: { color: '#E11D48', fontWeight: 'bold' },
    registerBtn: { backgroundColor: '#EFF6FF', height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    registerBtnText: { color: '#2563EB', fontWeight: 'bold' },
    finalBtn: { backgroundColor: '#2563EB', height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#2563EB', shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
    finalBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalBody: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40 },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
});

export default ProfileSetting;