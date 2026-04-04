import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, Animated, Easing, Dimensions, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';

const { width } = Dimensions.get('window');

export default function FaceRecognitionScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useSelector(state => state.auth);
    const { employeeId } = route.params || {};
    const [permission, requestPermission] = useCameraPermissions();
    const [photos, setPhotos] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const cameraRef = useRef(null);
    const scanAnim = useRef(new Animated.Value(0)).current;
    const guideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const guideLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(guideAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(guideAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        );
        guideLoop.start();
        return () => guideLoop.stop();
    }, [guideAnim, photos.length]);

    const getGuideTransform = () => {
        const step = photos.length;
        if (mode === 'attendance' || step === 0) {
            return [{ scale: guideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }];
        }
        if (step === 1) { 
            return [{ rotateY: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '50deg'] }) }];
        }
        if (step === 2) { 
            return [{ rotateY: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-50deg'] }) }];
        }
        if (step === 3) { 
            return [{ rotateX: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }];
        }
        if (step === 4) { 
            return [{ rotateX: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-45deg'] }) }];
        }
        return [];
    };

    useEffect(() => {
        const loopAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(scanAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ])
        );
        loopAnimation.start();
        return () => loopAnimation.stop();
    }, [scanAnim]);

    const scannerTranslateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 280]
    });

    const mode = route.params?.mode || 'attendance';
    const MAX_TAKES = mode === 'registration' ? 5 : 1;

    const registrationDirections = [
        "Lurus menghadap ke depan",
        "Tengok sedikit ke kanan",
        "Tengok sedikit ke kiri",
        "Sedikit mendongak ke atas",
        "Sedikit menunduk ke bawah"
    ];

    const getDirectionText = () => {
        if (photos.length >= MAX_TAKES) return "Memproses data wajah...";
        if (mode === 'attendance') return "Mohon posisikan wajah lurus ke kamera";
        return `Posisi ${photos.length + 1}/5: ${registrationDirections[photos.length]}`;
    };

    if (!permission) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContent}>
                    <Ionicons name="camera-outline" size={80} color="#3B82F6" />
                    <Text style={styles.permissionTitle}>Akses Kamera</Text>
                    <Text style={styles.permissionMessage}>Kami memerlukan izin kamera untuk fitur pengenalan wajah.</Text>
                    <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                        <Text style={styles.permissionText}>Berikan Izin</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current && photos.length < MAX_TAKES && !isProcessing) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
                const newPhotos = [...photos, photo.uri];
                setPhotos(newPhotos);

                if (newPhotos.length === MAX_TAKES) {
                    processPhotos(newPhotos);
                }
            } catch (error) {
                Alert.alert("Error", "Gagal mengambil gambar.");
            }
        }
    };

    const processPhotos = async (capturedPhotos) => {
        setIsProcessing(true);
        try {
            if (mode === 'registration') {
                let successCount = 0;
                let lastErrorMessage = "Wajah tidak terdeteksi dengan jelas.";
                
                for (let uri of capturedPhotos) {
                    const formData = new FormData();
                    formData.append('file', {
                        uri: uri,
                        name: 'photo.jpg',
                        type: 'image/jpeg',
                    });
                    formData.append('employeeId', employeeId || user?.employeeId || user?.id);
                    
                    const data = await apiService.registerFace(formData);
                    if (data.status === 'success') {
                        successCount++;
                    } else {
                        lastErrorMessage = data.message || lastErrorMessage;
                        if (lastErrorMessage.includes("sudah terdaftar")) {
                            Alert.alert("Registrasi Ditolak", lastErrorMessage);
                            setIsProcessing(false);
                            setPhotos([]);
                            return;
                        }
                    }
                }
                
                if (successCount > 0) {
                    Alert.alert("Sukses!", "Pendaftaran Wajah Berhasil.", [
                        { text: "OK", onPress: () => navigation.goBack() }
                    ]);
                } else {
                    Alert.alert("Gagal Registrasi", lastErrorMessage);
                }
            } else {
                const formData = new FormData();
                formData.append('file', {
                    uri: capturedPhotos[0],
                    name: 'photo.jpg',
                    type: 'image/jpeg',
                });
                const currentEmployeeId = user?.employeeId || user?.id;
                if (currentEmployeeId) formData.append('employeeId', currentEmployeeId);

                const data = await apiService.recognizeFace(formData);
                if (data.recognized) {
                    Alert.alert("Berhasil!", `Halo, ${data.name}! Absensi telah dicatat.`, [
                        { text: "OK", onPress: () => navigation.goBack() }
                    ]);
                } else {
                    Alert.alert("Info", data.message || "Wajah tidak cocok.");
                }
            }
        } catch (error) {
            console.error("API Error:", error);
            Alert.alert("Gagal", "Koneksi ke server gagal atau sesi berakhir.");
        } finally {
            setIsProcessing(false);
            setPhotos([]);
        }
    };


    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeHeader}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
                        <Ionicons name="close" size={28} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Face Identity</Text>
                    <View style={styles.headerAction} />
                </View>
            </SafeAreaView>

            <View style={styles.cameraFrame}>
                <CameraView 
                    style={StyleSheet.absoluteFill} 
                    facing="front" 
                    ref={cameraRef}
                />
                
                <View style={styles.scanOverlay}>
                    <View style={styles.scanBox}>
                        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scannerTranslateY }] }]} />
                    </View>
                    
                    {photos.length < MAX_TAKES && !isProcessing && (
                        <Animated.View style={[styles.centerDirectionOverlay, { transform: getGuideTransform() }]}>
                            <Ionicons name="scan-outline" size={200} color="rgba(255, 255, 255, 0.4)" />
                        </Animated.View>
                    )}
                </View>

                <View style={styles.instructionBanner}>
                     <Text style={styles.instructionText}>{getDirectionText()}</Text>
                </View>

                {isProcessing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.loadingText}>Menganalisa...</Text>
                    </View>
                )}
            </View>

            <View style={styles.controlsContainer}>
                <View style={styles.progressRow}>
                    {[...Array(MAX_TAKES)].map((_, index) => (
                        <View 
                            key={index} 
                            style={[
                                styles.progressSegment, 
                                { backgroundColor: index < photos.length ? '#3B82F6' : '#E5E7EB' }
                            ]} 
                        />
                    ))}
                </View>

                <View style={styles.shutterRow}>
                    <TouchableOpacity 
                        style={[
                            styles.shutterButton, 
                            (isProcessing || photos.length >= MAX_TAKES) && styles.shutterButtonDisabled
                        ]} 
                        disabled={isProcessing || photos.length >= MAX_TAKES}
                        onPress={takePicture}
                    >
                        <View style={styles.shutterInner} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.hintText}>
                    {mode === 'registration' ? 'Ambil 5 sampel posisi wajah' : 'Posisikan wajah Anda di dalam kotak'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeHeader: {
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerAction: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    cameraFrame: {
        flex: 1,
        margin: 20,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: '#000',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    scanBox: {
        width: 280,
        height: 280,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 40,
        backgroundColor: 'transparent',
    },
    scanLine: {
        width: '100%',
        height: 2,
        backgroundColor: '#3B82F6',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    centerDirectionOverlay: {
        position: 'absolute',
    },
    instructionBanner: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
    },
    instructionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 12,
        fontSize: 15,
        fontWeight: '600',
    },
    controlsContainer: {
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
    },
    progressRow: {
        flexDirection: 'row',
        width: width * 0.6,
        height: 4,
        gap: 6,
        marginBottom: 25,
    },
    progressSegment: {
        flex: 1,
        borderRadius: 2,
    },
    shutterRow: {
        marginBottom: 15,
    },
    shutterButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#3B82F6',
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterInner: {
        width: '100%',
        height: '100%',
        borderRadius: 36,
        backgroundColor: '#3B82F6',
    },
    shutterButtonDisabled: {
        borderColor: '#D1D5DB',
    },
    hintText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    permissionContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginTop: 20,
        marginBottom: 10,
    },
    permissionMessage: {
        textAlign: 'center',
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 24,
        marginBottom: 30,
    },
    permissionBtn: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    permissionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
