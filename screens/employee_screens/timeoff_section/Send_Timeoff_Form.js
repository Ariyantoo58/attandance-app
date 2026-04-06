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
    FlatList
} from 'react-native';
import { AntDesign, Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height, width } = Dimensions.get('window');

const Send_Timeoff_Form = () => {
    const navigation = useNavigation();
    
    // Form States
    const [type, setType] = useState('VACATION');
    const [reason, setReason] = useState('');
    const [isFullDay, setIsFullDay] = useState('FULL_DAY');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [halfDayTime, setHalfDayTime] = useState(new Date().toISOString());
    
    // UI States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(''); // 'type', 'shift', 'start', 'end', 'time'
    const [pickerTitle, setPickerTitle] = useState('');

    const authState = useSelector(state => state.auth.user);
    const employeeId = authState?.employeeId || authState?.user?.employeeId;

    const LEAVE_TYPES = [
        { id: 'VACATION', name: 'Cuti Tahunan', icon: 'airplane-outline', color: '#3B82F6' },
        { id: 'SICK_LEAVE', name: 'Sakit', icon: 'medical-outline', color: '#EF4444' },
        { id: 'MATERNITY_LEAVE', name: 'Cuti Melahirkan', icon: 'woman-outline', color: '#EC4899' },
        { id: 'PATERNITY_LEAVE', name: 'Cuti Ayah', icon: 'man-outline', color: '#10B981' },
        { id: 'OTHER', name: 'Lainnya', icon: 'ellipsis-horizontal-outline', color: '#64748B' },
    ];

    const SHIFT_TYPES = [
        { id: 'FULL_DAY', name: 'Satu Hari Penuh', icon: 'sunny-outline' },
        { id: 'HALF_DAY', name: 'Setengah Hari', icon: 'partly-sunny-outline' },
        { id: 'HOLIDAY', name: 'Libur Nasional', icon: 'calendar-outline' },
    ];

    const handleSend = async () => {
        if (!type || !reason || !startDate || !endDate) {
            Alert.alert("Eror", "Harap isi semua bidang yang diperlukan.");
            return;
        }

        try {
            setIsSubmitting(true);
            const requestData = {
                employeeId,
                title: `Pengajuan: ${LEAVE_TYPES.find(t => t.id === type)?.name}`,
                description: `${reason}${isFullDay === 'HALF_DAY' ? ` (Setengah Hari - ${new Date(halfDayTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})` : ''}`,
                fromdate: startDate,
                todate: endDate,
                type: type
            };

            await apiService.requestTimeOff(requestData);
            Alert.alert("Berhasil", "Pengajuan cuti berhasil dikirim.");
            navigation.goBack();
        } catch (error) {
            console.error("Failed to submit leave request:", error);
            Alert.alert("Eror", "Gagal mengirim pengajuan. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openPicker = (type, title) => {
        setPickerType(type);
        setPickerTitle(title);
        setPickerVisible(true);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Pilih Tanggal';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatTime = (isoString) => {
        if (!isoString) return 'Pilih Jam';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pengajuan Cuti</Text>
                <TouchableOpacity onPress={handleSend} disabled={isSubmitting} style={styles.saveBtn}>
                    {isSubmitting ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveBtnText}>Kirim</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Modern Leave Type Selector */}
                <View style={styles.typeSection}>
                    <Text style={styles.sectionTitle}>Pilih Jenis Cuti</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeList}>
                        {LEAVE_TYPES.map((item) => (
                            <TouchableOpacity 
                                key={item.id}
                                style={[
                                    styles.typeCard, 
                                    type === item.id && { borderColor: item.color, backgroundColor: item.color + '08' }
                                ]}
                                onPress={() => setType(item.id)}
                            >
                                <View style={[styles.typeIconBox, { backgroundColor: item.color + '15' }]}>
                                    <Ionicons name={item.icon} size={24} color={item.color} />
                                </View>
                                <Text style={[styles.typeText, type === item.id && { color: item.color, fontWeight: '800' }]}>
                                    {item.name}
                                </Text>
                                {type === item.id && <View style={[styles.activeDot, { backgroundColor: item.color }]} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Configuration Card */}
                <View style={[styles.mainCard, { marginTop: 10 }]}>
                    <Text style={styles.cardHeader}>Waktu & Durasi</Text>
                    
                    <TouchableOpacity onPress={() => openPicker('shift', 'Pilih Durasi')} style={styles.selector}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.selectorLabel}>Durasi / Shift</Text>
                            <Text style={styles.selectorVal}>{SHIFT_TYPES.find(s => s.id === isFullDay)?.name}</Text>
                        </View>
                        <Ionicons name={SHIFT_TYPES.find(s => s.id === isFullDay)?.icon} size={20} color="#00a2e4" />
                    </TouchableOpacity>

                    {isFullDay === 'HALF_DAY' && (
                        <TouchableOpacity onPress={() => openPicker('time', 'Pilih Jam')} style={styles.selector}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.selectorLabel}>Jam Efektif</Text>
                                <Text style={styles.selectorVal}>{formatTime(halfDayTime)}</Text>
                            </View>
                            <Ionicons name="time-outline" size={20} color="#00a2e4" />
                        </TouchableOpacity>
                    )}

                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => openPicker('start', 'Tanggal Mulai')} style={[styles.selector, { flex: 1, marginRight: 10 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Mulai</Text>
                                <Text style={styles.selectorVal}>{formatDate(startDate)}</Text>
                            </View>
                            <Ionicons name="calendar-outline" size={18} color="#00a2e4" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => openPicker('end', 'Tanggal Selesai')} style={[styles.selector, { flex: 1 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Selesai</Text>
                                <Text style={styles.selectorVal}>{formatDate(endDate)}</Text>
                            </View>
                            <Ionicons name="calendar-outline" size={18} color="#00a2e4" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Information Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Alasan Pengajuan</Text>
                    <View style={styles.field}>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            value={reason} 
                            onChangeText={setReason} 
                            multiline 
                            placeholder="Berikan alasan yang jelas untuk pengajuan cuti Anda..."
                            placeholderTextColor="#94A3B8"
                        />
                    </View>
                </View>

                {/* Info Note */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color="#00a2e4" />
                    <Text style={styles.infoText}>
                        Pengajuan cuti Anda akan langsung diteruskan ke HR dan Manager untuk mendapatkan persetujuan.
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

                        {(pickerType === 'start' || pickerType === 'end') ? (
                            <Calendar
                                current={pickerType === 'start' ? startDate : endDate}
                                onDayPress={(day) => {
                                    if (pickerType === 'start') setStartDate(day.dateString);
                                    else setEndDate(day.dateString);
                                    setPickerVisible(false);
                                }}
                                theme={{
                                    todayTextColor: '#00a2e4',
                                    selectedDayBackgroundColor: '#00a2e4',
                                    arrowColor: '#00a2e4',
                                    textDayHeaderFontWeight: '700',
                                    textDayFontSize: 14,
                                    textMonthFontSize: 16,
                                    textMonthFontWeight: '800'
                                }}
                            />
                        ) : pickerType === 'time' ? (
                            <View style={{ padding: 20 }}>
                                <DateTimePicker
                                    value={new Date(halfDayTime)}
                                    mode="time"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) setHalfDayTime(selectedDate.toISOString());
                                        if (Platform.OS === 'android') setPickerVisible(false);
                                    }}
                                />
                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity style={styles.doneBtn} onPress={() => setPickerVisible(false)}>
                                        <Text style={styles.doneBtnText}>Selesai</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <FlatList
                                data={SHIFT_TYPES}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={[styles.optionItem, isFullDay === item.id && styles.optionActive]} 
                                        onPress={() => {
                                            setIsFullDay(item.id);
                                            setPickerVisible(false);
                                        }}
                                    >
                                        <View style={styles.optionContent}>
                                            <View style={[styles.optionIconBox, isFullDay === item.id && { backgroundColor: '#E0F2FE' }]}>
                                                <Ionicons name={item.icon} size={20} color={isFullDay === item.id ? "#00a2e4" : "#64748B"} />
                                            </View>
                                            <Text style={[styles.optionLabel, isFullDay === item.id && styles.optionLabelActive]}>
                                                {item.name}
                                            </Text>
                                        </View>
                                        {isFullDay === item.id && (
                                            <Ionicons name="checkmark-circle" size={24} color="#00a2e4" />
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
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    saveBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#00a2e4', borderRadius: 12 },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    scrollContent: { padding: 20 },
    
    // Type Picker
    typeSection: { marginBottom: 25 },
    sectionTitle: { fontSize: 13, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
    typeList: { flexDirection: 'row', paddingBottom: 5 },
    typeCard: { width: 110, height: 130, backgroundColor: 'white', borderRadius: 24, padding: 15, marginRight: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
    typeIconBox: { width: 50, height: 50, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    typeText: { fontSize: 12, fontWeight: '700', color: '#64748B', textAlign: 'center' },
    activeDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: 10 },

    mainCard: { backgroundColor: 'white', borderRadius: 28, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, elevation: 3, borderWidth: 1, borderColor: 'rgba(241, 245, 249, 0.5)' },
    cardHeader: { fontSize: 15, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
    field: { marginBottom: 5 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 16, height: 54, paddingHorizontal: 16, fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#F1F5F9' },
    textArea: { height: 120, textAlignVertical: 'top', paddingTop: 16 },
    row: { flexDirection: 'row' },
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', height: 64, marginBottom: 12 },
    selectorLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
    selectorVal: { fontSize: 14, color: '#1E293B', fontWeight: '700', marginTop: 4 },
    infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', padding: 16, borderRadius: 20, marginBottom: 25 },
    infoText: { flex: 1, marginLeft: 12, fontSize: 12, color: '#0369A1', lineHeight: 20, fontWeight: '600' },
    finalSubmit: { backgroundColor: '#0F172A', height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
    submitText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
    modalBody: { backgroundColor: 'white', borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingBottom: 40, maxHeight: height * 0.8 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 19, fontWeight: '800', color: '#1E293B' },
    optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, marginHorizontal: 20, marginTop: 10, borderRadius: 18, borderBottomWidth: 0 },
    optionContent: { flexDirection: 'row', alignItems: 'center' },
    optionIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    optionActive: { backgroundColor: '#F0F9FF' },
    optionLabel: { fontSize: 16, color: '#475569', fontWeight: '600' },
    optionLabelActive: { color: '#00a2e4', fontWeight: '800' },
    doneBtn: { margin: 20, backgroundColor: '#00a2e4', height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    doneBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default Send_Timeoff_Form;
