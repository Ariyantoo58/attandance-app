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
    Alert, 
    ScrollView,
    Dimensions,
    StatusBar
} from 'react-native';
import { AntDesign, Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const AttendanceCorrectionRequest = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { date, clockIn, clockOut } = route.params || {};

    const getLocalDateString = (dateObj) => {
        const d = new Date(dateObj);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const mergeDateAndTime = (dateStr, timeValue) => {
        if (!timeValue) return null;
        const time = new Date(timeValue);
        const [year, month, day] = dateStr.split('-').map(Number);
        const merged = new Date(time);
        merged.setFullYear(year, month - 1, day);
        return merged.toISOString();
    };

    const [requestedDate, setRequestedDate] = useState(date ? getLocalDateString(date) : getLocalDateString(new Date()));
    const [requestedClockIn, setRequestedClockIn] = useState(clockIn ? mergeDateAndTime(getLocalDateString(date || clockIn), clockIn) : '');
    const [requestedClockOut, setRequestedClockOut] = useState(clockOut ? mergeDateAndTime(getLocalDateString(date || clockOut), clockOut) : '');
    const [reason, setReason] = useState('');
    
    // UI States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(''); // 'date', 'in', 'out'
    const [pickerTitle, setPickerTitle] = useState('');
    
    const authState = useSelector(state => state.auth.user);
    const employeeId = authState?.employeeId || authState?.user?.employeeId;

    const handleSend = async () => {
        if (!requestedDate || !reason) {
            Alert.alert("Eror", "Harap pilih tanggal dan isi alasan pengajuan.");
            return;
        }

        if (requestedClockIn && requestedClockOut) {
            if (new Date(requestedClockOut) <= new Date(requestedClockIn)) {
                Alert.alert("Eror Validasi", "Waktu Clock Out harus setelah Clock In.");
                return;
            }
        }

        try {
            setIsSubmitting(true);
            const requestData = {
                employeeId,
                requestedDate,
                requestedClockIn: requestedClockIn || null,
                requestedClockOut: requestedClockOut || null,
                reason
            };

            await apiService.requestAttendanceCorrection(requestData);
            Alert.alert("Berhasil", "Pengajuan koreksi kehadiran berhasil dikirim.");
            navigation.goBack();
        } catch (error) {
            console.error("Failed to submit correction request:", error);
            Alert.alert("Eror", error.response?.data?.message || "Gagal mengirim pengajuan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openPicker = (type, title) => {
        setPickerType(type);
        setPickerTitle(title);
        setPickerVisible(true);
    };

    const formatTime = (isoString) => {
        if (!isoString) return 'Pilih Jam';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateDisplay = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Koreksi Absen</Text>
                <TouchableOpacity onPress={handleSend} disabled={isSubmitting} style={styles.saveBtn}>
                    {isSubmitting ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveBtnText}>Kirim</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Information Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Detail Waktu</Text>

                    <TouchableOpacity onPress={() => openPicker('date', 'Pilih Tanggal')} style={styles.selector}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.selectorLabel}>Tanggal Absen</Text>
                            <Text style={styles.selectorVal}>{formatDateDisplay(requestedDate)}</Text>
                        </View>
                        <Ionicons name="calendar-outline" size={20} color="#00a2e4" />
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => openPicker('in', 'Jam Masuk')} style={[styles.selector, { flex: 1, marginRight: 10 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Jam Masuk</Text>
                                <Text style={styles.selectorVal}>{formatTime(requestedClockIn)}</Text>
                            </View>
                            <Ionicons name="time-outline" size={18} color="#00a2e4" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => openPicker('out', 'Jam Pulang')} style={[styles.selector, { flex: 1 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Jam Pulang</Text>
                                <Text style={styles.selectorVal}>{formatTime(requestedClockOut)}</Text>
                            </View>
                            <Ionicons name="time-outline" size={18} color="#00a2e4" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Reason Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Alasan Koreksi</Text>
                    <View style={styles.field}>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            value={reason} 
                            onChangeText={setReason} 
                            multiline 
                            placeholder="Contoh: Lupa absen saat masuk karena meeting mendadak..."
                            placeholderTextColor="#94A3B8"
                        />
                    </View>
                </View>

                {/* Info Note */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color="#00a2e4" />
                    <Text style={styles.infoText}>
                        Pengajuan koreksi akan diverifikasi oleh HRD. Pastikan data yang Anda masukkan sudah benar.
                    </Text>
                </View>

                <TouchableOpacity style={styles.finalSubmit} onPress={handleSend} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>SUBMIT PENGAJUAN</Text>}
                </TouchableOpacity>

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Custom Picker Modal */}
            <Modal visible={pickerVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBody}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{pickerTitle}</Text>
                            <TouchableOpacity onPress={() => setPickerVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {pickerType === 'date' ? (
                            <Calendar
                                current={requestedDate}
                                onDayPress={(day) => {
                                    const newDateStr = day.dateString;
                                    setRequestedDate(newDateStr);
                                    if (requestedClockIn) setRequestedClockIn(mergeDateAndTime(newDateStr, requestedClockIn));
                                    if (requestedClockOut) setRequestedClockOut(mergeDateAndTime(newDateStr, requestedClockOut));
                                    setPickerVisible(false);
                                }}
                                theme={{
                                    todayTextColor: '#00a2e4',
                                    selectedDayBackgroundColor: '#00a2e4',
                                    arrowColor: '#00a2e4',
                                }}
                            />
                        ) : (
                            <View style={{ padding: 20 }}>
                                <DateTimePicker
                                    value={new Date(pickerType === 'in' ? (requestedClockIn || new Date()) : (requestedClockOut || new Date()))}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) {
                                            const merged = mergeDateAndTime(requestedDate, selectedDate);
                                            if (pickerType === 'in') setRequestedClockIn(merged);
                                            else setRequestedClockOut(merged);
                                        }
                                        if (Platform.OS === 'android') setPickerVisible(false);
                                    }}
                                />
                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity style={styles.doneBtn} onPress={() => setPickerVisible(false)}>
                                        <Text style={styles.doneBtnText}>Selesai</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backButton: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#00a2e4', borderRadius: 12 },
    saveBtnText: { color: 'white', fontWeight: 'bold' },
    scrollContent: { padding: 16 },
    mainCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 },
    cardHeader: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
    field: { marginBottom: 10 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 14, height: 50, paddingHorizontal: 15, fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    textArea: { height: 120, textAlignVertical: 'top', paddingTop: 15 },
    row: { flexDirection: 'row' },
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', height: 60, marginBottom: 15 },
    selectorLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
    selectorVal: { fontSize: 14, color: '#1E293B', fontWeight: '700', marginTop: 4 },
    infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F8FF', padding: 15, borderRadius: 18, marginBottom: 20 },
    infoText: { flex: 1, marginLeft: 12, fontSize: 12, color: '#00709B', lineHeight: 18, fontWeight: '500' },
    finalSubmit: { backgroundColor: '#1E293B', height: 58, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
    submitText: { color: 'white', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalBody: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: height * 0.8 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    doneBtn: { margin: 20, backgroundColor: '#00a2e4', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    doneBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default AttendanceCorrectionRequest;
