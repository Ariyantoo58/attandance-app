import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform, StyleSheet, ActivityIndicator, Modal, Alert, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';

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

    const [requestedDate, setRequestedDate] = useState(date ? getLocalDateString(date) : getLocalDateString(new Date()));
    
    // Helper to merge YYYY-MM-DD with a Date/ISO string
    const mergeDateAndTime = (dateStr, timeValue) => {
        if (!timeValue) return null;
        const time = new Date(timeValue);
        const [year, month, day] = dateStr.split('-').map(Number);
        const merged = new Date(time);
        merged.setFullYear(year, month - 1, day);
        return merged.toISOString();
    };

    const [requestedClockIn, setRequestedClockIn] = useState(clockIn ? mergeDateAndTime(getLocalDateString(date || clockIn), clockIn) : '');
    const [requestedClockOut, setRequestedClockOut] = useState(clockOut ? mergeDateAndTime(getLocalDateString(date || clockOut), clockOut) : '');
    const [reason, setReason] = useState('');
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showInTimePicker, setShowInTimePicker] = useState(false);
    const [showOutTimePicker, setShowOutTimePicker] = useState(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const authState = useSelector(state => state.auth.user);
    const employeeId = authState?.employeeId || authState?.user?.employeeId;

    const handleSend = async () => {
        if (!requestedDate || !reason) {
            Alert.alert("Error", "Please select a date and provide a reason.");
            return;
        }

        if (requestedClockIn && requestedClockOut) {
            if (new Date(requestedClockOut) <= new Date(requestedClockIn)) {
                Alert.alert("Validation Error", "Clock Out time must be after Clock In time.");
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
            Alert.alert("Success", "Attendance correction request submitted successfully.");
            navigation.goBack();
        } catch (error) {
            console.error("Failed to submit correction request:", error);
            Alert.alert("Error", error.response?.data?.message || "Failed to submit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            const newDateStr = getLocalDateString(selectedDate);
            setRequestedDate(newDateStr);
            // Re-sync times with new date
            if (requestedClockIn) setRequestedClockIn(mergeDateAndTime(newDateStr, requestedClockIn));
            if (requestedClockOut) setRequestedClockOut(mergeDateAndTime(newDateStr, requestedClockOut));
        }
    };

    const onInTimeChange = (event, selectedDate) => {
        setShowInTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setRequestedClockIn(mergeDateAndTime(requestedDate, selectedDate));
        }
    };

    const onOutTimeChange = (event, selectedDate) => {
        setShowOutTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setRequestedClockOut(mergeDateAndTime(requestedDate, selectedDate));
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return 'Select Time';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateDisplay = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <ScrollView style={styles.container} className="pt-12 px-4 bg-blue-50">
            <View style={styles.header}>
                <TouchableOpacity className="bg-blue-400" style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={20} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Attendance Correction</Text>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Date to Correct</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateTimeButton}>
                    <MaterialIcons name="event" size={20} color="#64748B" style={{marginRight: 10}} />
                    <Text style={styles.dateTimeText}>{formatDateDisplay(requestedDate)}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, {flex: 1, marginRight: 10}]}>
                    <Text style={styles.label}>Clock In</Text>
                    <TouchableOpacity onPress={() => setShowInTimePicker(true)} style={styles.dateTimeButton}>
                        <MaterialIcons name="access-time" size={20} color="#64748B" style={{marginRight: 8}} />
                        <Text style={styles.dateTimeText}>{formatTime(requestedClockIn)}</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.formGroup, {flex: 1}]}>
                    <Text style={styles.label}>Clock Out</Text>
                    <TouchableOpacity onPress={() => setShowOutTimePicker(true)} style={styles.dateTimeButton}>
                        <MaterialIcons name="access-time" size={20} color="#64748B" style={{marginRight: 8}} />
                        <Text style={styles.dateTimeText}>{formatTime(requestedClockOut)}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Reason for Correction</Text>
                <TextInput
                    multiline
                    numberOfLines={6}
                    value={reason}
                    onChangeText={setReason}
                    style={styles.textInput}
                    placeholder="e.g., Forgot to clock in due to morning meeting"
                />
            </View>

            <TouchableOpacity 
                onPress={handleSend} 
                style={[styles.sendButton, isSubmitting && { opacity: 0.7 }]} 
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.sendButtonText}>Submit Request</Text>
                )}
            </TouchableOpacity>

            {/* DateTime Pickers */}
            {(showDatePicker || showInTimePicker || showOutTimePicker) && (
                <DateTimePicker
                    value={new Date()}
                    mode={showDatePicker ? 'date' : 'time'}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={showDatePicker ? onDateChange : (showInTimePicker ? onInTimeChange : onOutTimeChange)}
                />
            )}
            
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: { width: 28, borderRadius: 5, padding: 4 },
    headerText: { fontSize: 18, fontWeight: 'bold', width: '88%', textAlign: 'center' },
    formGroup: { paddingVertical: 6, marginBottom: 5 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
    textInput: { height: 120, borderColor: '#E2E8F0', borderWidth: 1, padding: 12, backgroundColor: '#fff', borderRadius: 12, textAlignVertical: 'top', fontSize: 15 },
    dateTimeButton: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
    dateTimeText: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
    sendButton: { backgroundColor: '#00a2e4', padding: 16, borderRadius: 12, marginTop: 20, shadowColor: '#00a2e4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    sendButtonText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});

export default AttendanceCorrectionRequest;
