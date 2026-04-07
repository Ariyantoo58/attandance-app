import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    Modal,
    Dimensions,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { apiService } from '../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const OvertimeRequest = ({ navigation }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    // UI States
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(''); // 'date', 'start', 'end'
    const [pickerTitle, setPickerTitle] = useState('');

    const handleStartTimeChange = (event, selectedTime) => {
        if (Platform.OS === 'android') setPickerVisible(false);
        if (selectedTime) setStartTime(selectedTime);
    };

    const handleEndTimeChange = (event, selectedTime) => {
        if (Platform.OS === 'android') setPickerVisible(false);
        if (selectedTime) setEndTime(selectedTime);
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Eror', 'Silakan masukkan alasan lembur.');
            return;
        }

        if (startTime >= endTime) {
            Alert.alert('Eror', 'Waktu selesai harus setelah waktu mulai.');
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                date: date,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                reason: reason
            };

            await apiService.requestOvertime(requestData);
            Alert.alert('Berhasil', 'Pengajuan lembur berhasil dikirim.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Overtime request error:', error);
            Alert.alert('Eror', 'Gagal mengirim pengajuan lembur.');
        } finally {
            setLoading(false);
        }
    };

    const openPicker = (type, title) => {
        setPickerType(type);
        setPickerTitle(title);
        setPickerVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header matches Send_Timeoff_Form */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pengajuan Lembur</Text>
                <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.saveBtn}>
                    {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveBtnText}>Kirim</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Information Card - Matches mainCard in Send_Timeoff_Form */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Waktu Lembur</Text>
                    
                    <TouchableOpacity onPress={() => openPicker('date', 'Tanggal Lembur')} style={styles.selector}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.selectorLabel}>Tanggal Lembur</Text>
                            <Text style={styles.selectorVal}>{moment(date).format('DD MMMM YYYY')}</Text>
                        </View>
                        <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => openPicker('start', 'Jam Mulai')} style={[styles.selector, { flex: 1, marginRight: 10 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Mulai</Text>
                                <Text style={styles.selectorVal}>{moment(startTime).format('HH:mm')}</Text>
                            </View>
                            <Ionicons name="time-outline" size={18} color="#2563EB" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => openPicker('end', 'Jam Selesai')} style={[styles.selector, { flex: 1 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Selesai</Text>
                                <Text style={styles.selectorVal}>{moment(endTime).format('HH:mm')}</Text>
                            </View>
                            <Ionicons name="time-outline" size={18} color="#F59E0B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Reason Card - Matches mainCard in Send_Timeoff_Form */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Alasan Lembur</Text>
                    <View style={styles.field}>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            value={reason} 
                            onChangeText={setReason} 
                            multiline 
                            placeholder="Berikan alasan yang jelas untuk pengajuan lembur Anda..."
                            placeholderTextColor="#94A3B8"
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Info Note - Matches infoBox in Send_Timeoff_Form */}
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color="#2563EB" />
                    <Text style={styles.infoText}>
                        Pengajuan lembur Anda akan diteruskan ke HR dan Manager untuk mendapatkan persetujuan.
                    </Text>
                </View>

                <TouchableOpacity style={styles.finalSubmit} onPress={handleSubmit} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>SUBMIT PENGAJUAN</Text>}
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
                                current={date}
                                onDayPress={(day) => {
                                    setDate(day.dateString);
                                    setPickerVisible(false);
                                }}
                                theme={{
                                    todayTextColor: '#2563EB',
                                    selectedDayBackgroundColor: '#2563EB',
                                    arrowColor: '#2563EB',
                                }}
                                markedDates={{
                                    [date]: { selected: true, disableTouchEvent: true, selectedColor: '#2563EB' }
                                }}
                            />
                        ) : (
                            <View style={styles.timePickerContainer}>
                                <DateTimePicker
                                    value={pickerType === 'start' ? startTime : endTime}
                                    mode="time"
                                    is24Hour={true}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={pickerType === 'start' ? handleStartTimeChange : handleEndTimeChange}
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
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    saveBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#2563EB', borderRadius: 12 },
    saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
    scrollContent: { padding: 16 },
    
    mainCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15 },
    cardHeader: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
    field: { marginBottom: 10 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 14, height: 50, paddingHorizontal: 15, fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    textArea: { height: 120, textAlignVertical: 'top', paddingTop: 15 },
    row: { flexDirection: 'row' },
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', height: 56, marginBottom: 15 },
    selectorLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
    selectorVal: { fontSize: 14, color: '#1E293B', fontWeight: '700', marginTop: 4 },
    
    infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', padding: 15, borderRadius: 20, marginBottom: 20 },
    infoText: { flex: 1, marginLeft: 12, fontSize: 12, color: '#0369A1', lineHeight: 18, fontWeight: '600' },
    
    finalSubmit: { backgroundColor: '#1E293B', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#1E293B', shadowOpacity: 0.2, shadowRadius: 15, elevation: 8 },
    submitText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalBody: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: height * 0.8 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    timePickerContainer: { padding: 20, alignItems: 'center' },
    doneBtn: { margin: 20, backgroundColor: '#2563EB', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    doneBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default OvertimeRequest;
