import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';

const KpiDetailReview = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { employee, initialStats, month, year } = route.params;
    const { user } = useSelector(state => state.auth);

    const [metrics, setMetrics] = useState(initialStats?.metrics || [
        { name: 'Discipline', score: 0 },
        { name: 'Teamwork', score: 0 },
        { name: 'Communication', score: 0 }
    ]);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(initialStats);

    const behavioralScore = metrics.length > 0 
        ? metrics.reduce((acc, m) => acc + (m.score || 0), 0) / metrics.length 
        : 0;

    const handleSave = async (status = 'DRAFT') => {
        setLoading(true);
        try {
            const data = {
                employeeId: employee.id,
                reviewerId: user.user.id,
                month,
                year,
                metrics,
                comment,
                status
            };
            const response = await apiService.submitKpiReview(data);
            Alert.alert("Success", `KPI review saved as ${status}!`);
            navigation.goBack();
        } catch (error) {
            console.error('Error saving review:', error);
            Alert.alert("Error", "Failed to save review.");
        } finally {
            setLoading(false);
        }
    };

    const updateMetricScore = (index, score) => {
        const newMetrics = [...metrics];
        newMetrics[index].score = score;
        setMetrics(newMetrics);
    };

    const addMetric = () => {
        if (!newMetricName.trim()) return;
        setMetrics([...metrics, { name: newMetricName.trim(), score: 0 }]);
        setNewMetricName('');
        setShowAddForm(false);
    };

    const removeMetric = (index) => {
        const newMetrics = metrics.filter((_, i) => i !== index);
        setMetrics(newMetrics);
    };

    const renderScoreItem = (label, score, icon, color, description) => (
        <View style={styles.scoreCard}>
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                {icon}
            </View>
            <View style={styles.scoreContent}>
                <View style={styles.scoreHeader}>
                    <Text style={styles.scoreLabel}>{label}</Text>
                    <Text style={[styles.scoreVal, { color }]}>{score.toFixed(1)}%</Text>
                </View>
                <Text style={styles.scoreDesc}>{description}</Text>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${score}%`, backgroundColor: color }]} />
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Review Employee</Text>
                <TouchableOpacity onPress={() => handleSave('FINAL')} disabled={loading}>
                    <Text style={styles.submitBtn}>Submit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileSection}>
                    <Image source={{ uri: employee.avatarUrl || 'https://via.placeholder.com/150' }} style={styles.largeAvatar} />
                    <Text style={styles.profileName}>{employee.name}</Text>
                    <Text style={styles.profileSub}>{employee.designation} • {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
                </View>

                <View style={[styles.overallCard, { backgroundColor: '#1E293B' }]}>
                    <Text style={styles.overallLabel}>OVERALL KPI SCORE</Text>
                    <Text style={styles.overallScore}>{((stats.attendanceScore * 0.2) + (stats.taskScore * 0.4) + (behavioralScore * 0.4)).toFixed(1)}</Text>
                    <Text style={styles.overallStatus}>Manual & Auto Integrated</Text>
                </View>

                {renderScoreItem(
                    "Task Performance", 
                    stats.taskScore, 
                    <FontAwesome5 name="tasks" size={20} color="#3B82F6" />,
                    "#3B82F6",
                    "Based on weighted task completion and quality rating."
                )}

                {renderScoreItem(
                    "Attendance & Discipline", 
                    stats.attendanceScore, 
                    <MaterialIcons name="event-available" size={24} color="#10B981" />,
                    "#10B981",
                    "Based on presence and punctuality records."
                )}

                <View style={styles.manualSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Behavioral Components</Text>
                        <Text style={styles.manualScore}>{behavioralScore.toFixed(0)}%</Text>
                    </View>
                    <Text style={styles.manualDesc}>Rate each behavioral component based on global standards.</Text>

                    {metrics.map((metric, index) => (
                        <View key={index} style={styles.metricItem}>
                            <View style={styles.metricHeader}>
                                <Text style={styles.metricName}>{metric.name}</Text>
                            </View>
                            <View style={styles.sliderContainer}>
                                {[0, 25, 50, 75, 100].map(val => (
                                    <TouchableOpacity 
                                        key={val} 
                                        style={[styles.scoreOption, metric.score === val && styles.scoreOptionActive]}
                                        onPress={() => updateMetricScore(index, val)}
                                    >
                                        <Text style={[styles.optionText, metric.score === val && styles.optionTextActive]}>{val}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}

                    <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 }} />

                    <TextInput
                        style={styles.commentInput}
                        placeholder="Overall behavioral comments..."
                        multiline
                        numberOfLines={4}
                        value={comment}
                        onChangeText={setComment}
                    />
                </View>

                <TouchableOpacity 
                    style={styles.draftBtn} 
                    onPress={() => handleSave('DRAFT')}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#1E293B" /> : <Text style={styles.draftText}>Save as Draft</Text>}
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white' },
    backButton: { padding: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    submitBtn: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
    scrollContent: { padding: 16 },
    profileSection: { alignItems: 'center', marginBottom: 24 },
    largeAvatar: { width: 80, height: 80, borderRadius: 28, backgroundColor: '#E2E8F0' },
    profileName: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginTop: 12 },
    profileSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
    overallCard: { borderRadius: 32, padding: 24, alignItems: 'center', marginBottom: 24 },
    overallLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
    overallScore: { fontSize: 56, fontWeight: '900', color: 'white', marginVertical: 8 },
    overallStatus: { fontSize: 14, fontWeight: '600', color: '#10B981' },
    scoreCard: { backgroundColor: 'white', borderRadius: 24, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    scoreContent: { flex: 1, marginLeft: 16 },
    scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    scoreLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    scoreVal: { fontSize: 16, fontWeight: '800' },
    scoreDesc: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 10 },
    progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    manualSection: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
    manualScore: { fontSize: 20, fontWeight: '800', color: '#2563EB' },
    manualDesc: { fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 20 },
    sliderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    scoreOption: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    scoreOptionActive: { backgroundColor: '#2563EB', borderColor: '#BFDBFE' },
    optionText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
    optionTextActive: { color: 'white' },
    commentInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, fontSize: 14, color: '#1E293B', textAlignVertical: 'top', borderWidth: 1, borderColor: '#E2E8F0' },
    draftBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0', marginTop: 10 },
    draftText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    metricItem: { marginBottom: 20 },
    metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    metricName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#2563EB', marginTop: 10 },
    addBtnText: { color: '#2563EB', fontWeight: '700', marginLeft: 8 },
    addMetricForm: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    newMetricInput: { fontSize: 14, color: '#1E293B', padding: 8, borderBottomWidth: 1, borderBottomColor: '#CBD5E1', marginBottom: 12 },
    addFormButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 8 },
    cancelBtnText: { color: '#64748B', fontWeight: '600' },
    confirmAddBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    confirmAddBtnText: { color: 'white', fontWeight: '700' },
});

export default KpiDetailReview;
