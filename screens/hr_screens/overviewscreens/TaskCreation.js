import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    Platform, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    Alert, 
    Modal, 
    FlatList,
    StatusBar,
    Dimensions
} from 'react-native';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { fetchHrDashboard } from '@/auth/dataSlice';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { apiService } from '../../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

const TaskCreation = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const initialEmployeeId = route.params?.initialEmployeeId;

    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(initialEmployeeId ? [initialEmployeeId] : []);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [assignType, setAssignType] = useState('INDIVIDUAL'); // 'INDIVIDUAL' or 'TEAM'
    const { allEmployees: employees, allTeams: teams, loading: fetchingEmployees } = useSelector(state => state.data.hrDashboard);
    const dispatch = useDispatch();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [category, setCategory] = useState('GENERAL');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [weight, setWeight] = useState(1);
    const [difficulty, setDifficulty] = useState('EASY');
    
    // UI States
    const [loading, setLoading] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState(''); // 'emp', 'cat', 'pri', 'start', 'due'
    const [pickerTitle, setPickerTitle] = useState('');

    const toggleEmployee = (id) => {
        if (selectedEmployeeIds.includes(id)) {
            setSelectedEmployeeIds(selectedEmployeeIds.filter(item => item !== id));
        } else {
            setSelectedEmployeeIds([...selectedEmployeeIds, id]);
        }
    };

    const handleSend = async () => {
        if (assignType === 'INDIVIDUAL' && selectedEmployeeIds.length === 0) {
            Alert.alert("Eror", "Pilih minimal satu karyawan.");
            return;
        }
        if (assignType === 'TEAM' && !selectedTeamId) {
            Alert.alert("Eror", "Pilih tim untuk diberikan tugas.");
            return;
        }
        if (!title) {
            Alert.alert("Eror", "Judul tugas tidak boleh kosong.");
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                title,
                description,
                date: startDate,
                dueDate: dueDate || null,
                priority,
                category,
                weight,
                difficulty
            };

            if (assignType === 'INDIVIDUAL') {
                requestData.employeeIds = selectedEmployeeIds;
            } else {
                requestData.teamId = selectedTeamId;
            }

            await apiService.assignTask(requestData);
            Alert.alert("Berhasil", "Tugas berhasil diberikan!");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Eror", "Gagal memberikan tugas.");
        } finally {
            setLoading(false);
        }
    };

    const getSelectedNames = () => {
        return employees
            .filter(emp => selectedEmployeeIds.includes(emp.id))
            .map(emp => emp.name)
            .join(', ');
    };

    const openPicker = (type, title) => {
        if (type === 'assignType') {
            setPickerType('assignType');
            setPickerTitle('Pilih Model Penugasan');
            setPickerVisible(true);
            return;
        }
        setPickerType(type);
        setPickerTitle(title);
        setPickerVisible(true);
    };

    const CATEGORIES = [
        { id: 'GENERAL', name: 'General' },
        { id: 'DEVELOPMENT', name: 'Dev' },
        { id: 'DESIGN', name: 'Design' },
        { id: 'MARKETING', name: 'Marketing' },
    ];

    const PRIORITIES = [
        { id: 'LOW', name: 'Low Priority' },
        { id: 'MEDIUM', name: 'Medium Priority' },
        { id: 'HIGH', name: 'High Priority' },
    ];

    const DIFFICULTIES = [
        { id: 'EASY', name: 'Easy' },
        { id: 'MEDIUM', name: 'Medium' },
        { id: 'HARD', name: 'Hard' },
    ];

    const WEIGHTS = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Weight ${i + 1}` }));

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{initialEmployeeId ? "Tugas Mandiri" : "Beri Tugas Baru"}</Text>
                <TouchableOpacity onPress={handleSend} disabled={loading} style={styles.headerSaveBtn}>
                    {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.headerSaveText}>Beri</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Information Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Inti Tugas</Text>

                    {!initialEmployeeId && (
                        <>
                        <View style={styles.tabContainer}>
                            <TouchableOpacity 
                                style={[styles.tab, assignType === 'INDIVIDUAL' && styles.activeTab]} 
                                onPress={() => setAssignType('INDIVIDUAL')}
                            >
                                <Ionicons name="person-outline" size={18} color={assignType === 'INDIVIDUAL' ? 'white' : '#64748B'} />
                                <Text style={[styles.tabText, assignType === 'INDIVIDUAL' && styles.activeTabText]}>Individu</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.tab, assignType === 'TEAM' && styles.activeTab]} 
                                onPress={() => setAssignType('TEAM')}
                            >
                                <Ionicons name="people-outline" size={18} color={assignType === 'TEAM' ? 'white' : '#64748B'} />
                                <Text style={[styles.tabText, assignType === 'TEAM' && styles.activeTabText]}>Tim</Text>
                            </TouchableOpacity>
                        </View>

                        {assignType === 'INDIVIDUAL' ? (
                            <TouchableOpacity onPress={() => openPicker('emp', 'Pilih Karyawan')} style={styles.selector}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.selectorLabel}>Diberikan Kepada</Text>
                                    <Text style={styles.selectorVal} numberOfLines={1}>
                                        {selectedEmployeeIds.length > 0 ? `${selectedEmployeeIds.length} Karyawan terpilih` : 'Pilih satu atau lebih...'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#2563EB" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => openPicker('team', 'Pilih Tim')} style={styles.selector}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.selectorLabel}>Tim Penerima</Text>
                                    <Text style={styles.selectorVal} numberOfLines={1}>
                                        {selectedTeamId ? teams.find(t => t.id === selectedTeamId)?.name : 'Pilih tim...'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#2563EB" />
                            </TouchableOpacity>
                        )}
                        </>
                    )}

                    <View style={styles.field}>
                        <Text style={styles.label}>Judul Tugas</Text>
                        <TextInput 
                            style={styles.input} 
                            value={title} 
                            onChangeText={setTitle} 
                            placeholder="Contoh: Laporan Mingguan"
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Deskripsi (Opsional)</Text>
                        <TextInput 
                            style={[styles.input, styles.textArea]} 
                            value={description} 
                            onChangeText={setDescription} 
                            multiline 
                            placeholder="Detail tugas yang perlu dilakukan..."
                        />
                    </View>
                </View>

                {/* Configuration Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Kategori & Prioritas</Text>
                    
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => openPicker('cat', 'Pilih Kategori')} style={[styles.selector, { flex: 1, marginRight: 10 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Kategori</Text>
                                <Text style={styles.selectorVal}>{CATEGORIES.find(c => c.id === category)?.name}</Text>
                            </View>
                            <Ionicons name="apps-outline" size={18} color="#2563EB" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => openPicker('pri', 'Pilih Prioritas')} style={[styles.selector, { flex: 1 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Prioritas</Text>
                                <Text style={styles.selectorVal}>{PRIORITIES.find(p => p.id === priority)?.name}</Text>
                            </View>
                            <Ionicons name="flag-outline" size={18} color="#2563EB" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => openPicker('diff', 'Pilih Kesulitan')} style={[styles.selector, { flex: 1, marginRight: 10 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Kesulitan</Text>
                                <Text style={styles.selectorVal}>{DIFFICULTIES.find(d => d.id === difficulty)?.name}</Text>
                            </View>
                            <Ionicons name="speedometer-outline" size={18} color="#2563EB" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => openPicker('weight', 'Bobot Nilai (1-10)')} style={[styles.selector, { flex: 1 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Bobot Kpi</Text>
                                <Text style={styles.selectorVal}>{weight} Poin</Text>
                            </View>
                            <Ionicons name="star-outline" size={18} color="#F59E0B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Timeline Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.cardHeader}>Jadwal (Timeline)</Text>

                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => openPicker('start', 'Tanggal Mulai')} style={[styles.selector, { flex: 1, marginRight: 10 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Mulai</Text>
                                <Text style={styles.selectorVal}>{startDate}</Text>
                            </View>
                            <Ionicons name="calendar-outline" size={18} color="#2563EB" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => openPicker('due', 'Batas Waktu')} style={[styles.selector, { flex: 1 }]}>
                            <View>
                                <Text style={styles.selectorLabel}>Selesai</Text>
                                <Text style={styles.selectorVal}>{dueDate || 'Tanpa Batas'}</Text>
                            </View>
                            <Ionicons name="time-outline" size={18} color="#F59E0B" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.finalSubmit} onPress={handleSend} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>KONFIRMASI TUGAS</Text>}
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

                        {(pickerType === 'start' || pickerType === 'due') ? (
                            <Calendar
                                current={pickerType === 'start' ? startDate : (dueDate || undefined)}
                                onDayPress={(day) => {
                                    if (pickerType === 'start') setStartDate(day.dateString);
                                    else setDueDate(day.dateString);
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
                                data={
                                    pickerType === 'cat' ? CATEGORIES : 
                                    (pickerType === 'pri' ? PRIORITIES : 
                                    (pickerType === 'diff' ? DIFFICULTIES :
                                    (pickerType === 'weight' ? WEIGHTS :
                                    (pickerType === 'emp' ? employees : teams))))
                                }
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={[
                                            styles.optionItem, 
                                            ((pickerType === 'emp' && selectedEmployeeIds.includes(item.id)) || 
                                             (pickerType === 'team' && selectedTeamId === item.id) ||
                                             category === item.id || 
                                             priority === item.id ||
                                             difficulty === item.id ||
                                             weight === item.id) && styles.optionActive
                                        ]} 
                                        onPress={() => {
                                            if (pickerType === 'emp') toggleEmployee(item.id);
                                            else if (pickerType === 'team') {
                                                setSelectedTeamId(item.id);
                                                setPickerVisible(false);
                                            }
                                            else {
                                                if (pickerType === 'cat') setCategory(item.id);
                                                if (pickerType === 'pri') setPriority(item.id);
                                                if (pickerType === 'diff') setDifficulty(item.id);
                                                if (pickerType === 'weight') setWeight(item.id);
                                                setPickerVisible(false);
                                            }
                                        }}
                                    >
                                        <Text style={[
                                            styles.optionLabel, 
                                            ((pickerType === 'emp' && selectedEmployeeIds.includes(item.id)) || 
                                             (pickerType === 'team' && selectedTeamId === item.id) ||
                                             category === item.id || 
                                             priority === item.id ||
                                             difficulty === item.id ||
                                             weight === item.id) && styles.optionLabelActive
                                        ]}>
                                            {item.name || item.title}
                                        </Text>
                                        {((pickerType === 'emp' && selectedEmployeeIds.includes(item.id)) || 
                                          (pickerType === 'team' && selectedTeamId === item.id) || 
                                          category === item.id || 
                                          priority === item.id ||
                                          difficulty === item.id ||
                                          weight === item.id) && (
                                            <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                                        )}
                                    </TouchableOpacity>
                                )}
                                ListFooterComponent={pickerType === 'emp' && (
                                    <TouchableOpacity style={styles.doneBtn} onPress={() => setPickerVisible(false)}>
                                        <Text style={styles.doneBtnText}>Selesai ({selectedEmployeeIds.length})</Text>
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
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    backButton: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 12 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    headerSaveBtn: { 
        paddingHorizontal: 20, 
        paddingVertical: 10, 
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
    tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, marginBottom: 20 },
    tab: { flex: 1, flexDirection: 'row', height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    activeTab: { backgroundColor: '#2563EB', shadowColor: '#2563EB', shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
    tabText: { marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#64748B' },
    activeTabText: { color: 'white' },
    mainCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15 },
    cardHeader: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
    field: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 10 },
    input: { backgroundColor: '#F8FAFC', borderRadius: 14, height: 50, paddingHorizontal: 15, fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
    row: { flexDirection: 'row' },
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', height: 56, marginBottom: 15 },
    selectorLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
    selectorVal: { fontSize: 14, color: '#1E293B', fontWeight: '700', marginTop: 4 },
    finalSubmit: { 
        backgroundColor: '#1E293B', 
        height: 60, 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 10, 
        shadowColor: '#1E293B', 
        shadowOpacity: 0.2, 
        shadowRadius: 15, 
        elevation: 8 
    },
    submitText: { 
        color: 'white', 
        fontSize: 16, 
        fontWeight: '900', 
        letterSpacing: 1 
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalBody: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, maxHeight: height * 0.8 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    optionActive: { backgroundColor: '#F0F9FF' },
    optionLabel: { fontSize: 15, color: '#334155', fontWeight: '600' },
    optionLabelActive: { color: '#2563EB', fontWeight: '800' },
    doneBtn: { margin: 20, backgroundColor: '#2563EB', height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    doneBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default TaskCreation;
