import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    Platform, 
    StyleSheet, 
    ActivityIndicator, 
    Modal, 
    ScrollView, 
    Dimensions,
    StatusBar,
    Alert,
    Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../../../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import { updateReimbursement, editReimbursement } from '../../../auth/dataSlice';
import { useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../../../config';


const { width, height } = Dimensions.get('window');

const ReimbursementRequest = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    
    // Form States
    const route = useRoute();
    const editData = route.params?.editData;

    const [title, setTitle] = useState(editData?.title || '');
    const [amount, setAmount] = useState(editData?.amount?.toString() || '');
    const [category, setCategory] = useState(editData?.category || 'TRANSPORT');
    const [description, setDescription] = useState(editData?.description || '');
    const [date, setDate] = useState(editData?.date ? editData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    const [image, setImage] = useState(editData?.receiptUrl ? { uri: `${API_BASE_URL}${editData.receiptUrl}`, isExisting: true } : null);
    
    // UI States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [calendarVisible, setCalendarVisible] = useState(false);


    const authState = useSelector(state => state.auth.user);
    const employeeId = authState?.employeeId || authState?.user?.employeeId;

    const CATEGORIES = [
        { id: 'TRANSPORT', name: 'Transport', icon: 'car-outline', color: '#3B82F6' },
        { id: 'FOOD', name: 'Makan', icon: 'restaurant-outline', color: '#F59E0B' },
        { id: 'MEDICAL', name: 'Medis', icon: 'medical-outline', color: '#EF4444' },
        { id: 'OFFICE', name: 'Kantor', icon: 'briefcase-outline', color: '#10B981' },
        { id: 'OTHER', name: 'Lainnya', icon: 'ellipsis-horizontal-outline', color: '#64748B' },
    ];

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });


        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin kamera untuk mengambil foto nota.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const handleSend = async () => {
        if (!title || !amount || !date || !category) {
            Alert.alert("Error", "Harap isi semua bidang yang diperlukan.");
            return;
        }

        try {
            setIsSubmitting(true);
            
            const formData = new FormData();
            formData.append('title', title);
            formData.append('amount', amount);
            formData.append('date', date);
            formData.append('category', category);
            formData.append('description', description);

            if (image) {
                const uriParts = image.uri.split('.');
                const fileType = uriParts[uriParts.length - 1];
                
                formData.append('receipt', {
                    uri: Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri,
                    name: `receipt_${Date.now()}.${fileType}`,
                    type: `image/${fileType}`,
                });
            }

            if (editData) {
                const result = await dispatch(editReimbursement({ id: editData.id, formData })).unwrap();
                Alert.alert("Berhasil", "Pengajuan reimbursement berhasil diperbarui.");
            } else {
                const result = await apiService.submitReimbursement(formData);
                dispatch(updateReimbursement(result));
                Alert.alert("Berhasil", "Pengajuan reimbursement berhasil dikirim.");
            }
            
            navigation.goBack();

        } catch (error) {
            console.error("Failed to submit reimbursement:", error);
            Alert.alert("Error", "Gagal mengirim pengajuan. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editData ? 'Edit Klaim' : 'Klaim Reimbursement'}</Text>
                <TouchableOpacity onPress={handleSend} disabled={isSubmitting} style={styles.saveBtn}>
                    {isSubmitting ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveBtnText}>{editData ? 'Update' : 'Kirim'}</Text>}
                </TouchableOpacity>
            </View>


            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Category Selector */}
                <View style={styles.typeSection}>
                    <Text style={styles.sectionTitle}>Pilih Kategori</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeList}>
                        {CATEGORIES.map((item) => (
                            <TouchableOpacity 
                                key={item.id}
                                style={[
                                    styles.typeCard, 
                                    category === item.id && { borderColor: item.color, backgroundColor: item.color + '08' }
                                ]}
                                onPress={() => setCategory(item.id)}
                            >
                                <View style={[styles.typeIconBox, { backgroundColor: item.color + '15' }]}>
                                    <Ionicons name={item.icon} size={24} color={item.color} />
                                </View>
                                <Text style={[styles.typeText, category === item.id && { color: item.color, fontWeight: '800' }]}>
                                    {item.name}
                                </Text>
                                {category === item.id && <View style={[styles.activeDot, { backgroundColor: item.color }]} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Main Form Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Rincian Biaya</Text>
                    
                    <View style={styles.field}>
                        <Text style={styles.inputLabel}>Judul Pengeluaran</Text>
                        <TextInput 
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Contoh: Bensin Surabaya-Malang"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.inputLabel}>Nominal (Rp)</Text>
                        <TextInput 
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#94A3B8"
                        />
                    </View>

                    <TouchableOpacity onPress={() => setCalendarVisible(true)} style={styles.selector}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.selectorLabel}>Tanggal Pengeluaran</Text>
                            <Text style={styles.selectorVal}>{moment(date).format('DD MMMM YYYY')}</Text>
                        </View>
                        <Ionicons name="calendar-outline" size={22} color="#2563EB" />
                    </TouchableOpacity>

                    <View style={styles.field}>
                        <Text style={styles.inputLabel}>Keterangan (Opsional)</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            value={description} 
                            onChangeText={setDescription} 
                            multiline 
                            placeholder="Berikan detail tambahan jika ada..."
                            placeholderTextColor="#94A3B8"
                        />
                    </View>
                </View>

                {/* Receipt Upload Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Bukti Pembayaran (Nota)</Text>
                    
                    {image ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
                                <Ionicons name="close-circle" size={32} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.uploadButtonsRow}>
                            <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                                <Ionicons name="camera" size={28} color="#2563EB" />
                                <Text style={styles.uploadBtnText}>Ambil Foto</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                                <Ionicons name="image" size={28} color="#2563EB" />
                                <Text style={styles.uploadBtnText}>Galeri</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.finalSubmit} onPress={handleSend} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>{editData ? 'UPDATE KLAIM' : 'SUBMIT KLAIM'}</Text>}
                </TouchableOpacity>


                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Calendar Modal */}
            <Modal visible={calendarVisible} transparent animationType="fade">
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setCalendarVisible(false)}
                >
                    <View style={styles.modalBody}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Tanggal</Text>
                            <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                        <Calendar
                            current={date}
                            onDayPress={(day) => {
                                setDate(day.dateString);
                                setCalendarVisible(false);
                            }}
                            theme={{
                                todayTextColor: '#2563EB',
                                selectedDayBackgroundColor: '#2563EB',
                                arrowColor: '#2563EB',
                            }}
                            markedDates={{
                                [date]: { selected: true, selectedColor: '#2563EB' }
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    saveBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#2563EB', borderRadius: 12 },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    scrollContent: { padding: 16 },
    
    typeSection: { marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
    typeList: { paddingBottom: 5 },
    typeCard: { width: 100, height: 110, backgroundColor: 'white', borderRadius: 20, padding: 12, marginRight: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
    typeIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    typeText: { fontSize: 11, fontWeight: '700', color: '#64748B', textAlign: 'center' },
    activeDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: 8 },

    mainCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
    cardHeader: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 18 },
    field: { marginBottom: 16 },
    inputLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 14, height: 52, paddingHorizontal: 16, fontSize: 15, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 14 },
    
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', height: 60, marginBottom: 16 },
    selectorLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
    selectorVal: { fontSize: 15, color: '#1E293B', fontWeight: '700', marginTop: 4 },
    
    uploadButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    uploadBtn: { flex: 0.48, height: 90, backgroundColor: '#F0F9FF', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
    uploadBtnText: { marginTop: 8, fontSize: 13, fontWeight: '700', color: '#2563EB' },
    imagePreviewContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', position: 'relative' },
    imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeImageBtn: { position: 'absolute', top: 10, right: 10 },

    finalSubmit: { backgroundColor: '#0F172A', height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
    submitText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', padding: 20 },
    modalBody: { backgroundColor: 'white', borderRadius: 32, padding: 20, elevation: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' }
});

export default ReimbursementRequest;
