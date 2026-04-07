import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../../services/api';

const GlobalKpiSettings = () => {
    const navigation = useNavigation();
    const [criteria, setCriteria] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        try {
            setLoading(true);
            const data = await apiService.getKpiCriteria();
            setCriteria(data);
        } catch (error) {
            Alert.alert("Error", "Failed to fetch KPI criteria.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setAdding(true);
        try {
            await apiService.addKpiCriteria(newName.trim());
            setNewName('');
            fetchCriteria();
            Alert.alert("Success", "New criteria added.");
        } catch (error) {
            Alert.alert("Error", "Failed to add criteria.");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = (id, name) => {
        Alert.alert(
            "Delete Criteria",
            `Are you sure you want to remove "${name}" from all future evaluations?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiService.deleteKpiCriteria(id);
                            fetchCriteria();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete criteria.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>KPI Global Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#2563EB" />
                <Text style={styles.infoText}>
                    Criteria defined here will be applied to all employees across the company for their monthly performance reviews.
                </Text>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="New evaluation criteria (e.g. Attitude)"
                    value={newName}
                    onChangeText={setNewName}
                />
                <TouchableOpacity 
                    style={[styles.addBtn, !newName.trim() && styles.addBtnDisabled]} 
                    onPress={handleAdd}
                    disabled={adding || !newName.trim()}
                >
                    {adding ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="add" size={24} color="white" />}
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : (
                <FlatList
                    data={criteria}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={styles.criteriaCard}>
                            <View style={styles.iconCircle}>
                                <Feather name="target" size={18} color="#2563EB" />
                            </View>
                            <Text style={styles.criteriaName}>{item.name}</Text>
                            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialIcons name="playlist-add" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No global criteria defined yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white' },
    backButton: { padding: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    infoBox: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 16, margin: 16, borderRadius: 16, borderWidth: 1, borderColor: '#DBEAFE' },
    infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#1E40AF', lineHeight: 18, fontWeight: '500' },
    inputContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 12 },
    input: { flex: 1, height: 56, backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 16, fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: '#E2E8F0' },
    addBtn: { width: 56, height: 56, backgroundColor: '#2563EB', borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    addBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
    listContent: { padding: 16 },
    criteriaCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2 },
    iconCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
    criteriaName: { flex: 1, marginLeft: 16, fontSize: 15, fontWeight: '700', color: '#1E293B' },
    deleteBtn: { padding: 8 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, color: '#94A3B8', fontSize: 15, fontWeight: '500' }
});

export default GlobalKpiSettings;
