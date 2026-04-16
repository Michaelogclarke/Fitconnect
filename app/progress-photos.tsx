import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList,
  Modal, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useColors } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

const BUCKET    = 'progress-photos';
const GRID_COLS = 3;
const CELL_SIZE = (Dimensions.get('window').width - Spacing.lg * 2 - Spacing.sm * (GRID_COLS - 1)) / GRID_COLS;

type PhotoEntry = {
  name:      string;
  path:      string;
  publicUrl: string;
  date:      Date;
};

// ─── Camera modal ─────────────────────────────────────────────────────────────

function CameraModal({
  visible,
  onClose,
  onTaken,
}: {
  visible:  boolean;
  onClose:  () => void;
  onTaken:  (uri: string) => void;
}) {
  const C = useColors();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) onTaken(photo.uri);
    } catch {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  }

  if (!visible) return null;

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl }}>
          <IconSymbol name="camera.fill" size={48} color={C.onSurfaceVariant} />
          <Text style={{ ...Typography.titleLg, color: C.onSurface, textAlign: 'center' }}>
            Camera Access Required
          </Text>
          <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' }}>
            FitConnect needs camera access to take progress photos.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.lg }}
            onPress={requestPermission}>
            <Text style={{ ...Typography.titleMd, color: C.background, fontWeight: '700' }}>Grant Access</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant }}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        {/* Top bar */}
        <SafeAreaView edges={['top']}>
          <TouchableOpacity
            style={{ margin: Spacing.lg, width: 40, height: 40, borderRadius: Radius.full, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center' }}
            onPress={onClose}>
            <IconSymbol name="xmark" size={18} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Shutter */}
        <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: Spacing.xl }}>
          <TouchableOpacity
            style={{
              width: 72, height: 72,
              borderRadius: Radius.full,
              backgroundColor: capturing ? C.onSurfaceVariant : '#fff',
              borderWidth: 4,
              borderColor: '#ffffff88',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleCapture}
            disabled={capturing}>
            {capturing && <ActivityIndicator color={C.background} />}
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Full-screen photo viewer ─────────────────────────────────────────────────

function PhotoViewer({
  photo,
  onClose,
  onDelete,
}: {
  photo:    PhotoEntry;
  onClose:  () => void;
  onDelete: () => void;
}) {
  const C = useColors();
  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Image source={{ uri: photo.publicUrl }} style={StyleSheet.absoluteFill} contentFit="contain" />

        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.lg }}>
          <TouchableOpacity
            style={{ width: 40, height: 40, borderRadius: Radius.full, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center' }}
            onPress={onClose}>
            <IconSymbol name="xmark" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ width: 40, height: 40, borderRadius: Radius.full, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center' }}
            onPress={onDelete}>
            <IconSymbol name="trash" size={18} color={C.error} />
          </TouchableOpacity>
        </SafeAreaView>

        <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg }}>
          <Text style={{ ...Typography.bodyMd, color: '#ffffffcc', textAlign: 'center' }}>
            {photo.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProgressPhotosScreen() {
  const C = useColors();
  const router = useRouter();
  const [photos,       setPhotos]       = useState<PhotoEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [showCamera,   setShowCamera]   = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<PhotoEntry | null>(null);
  const [userId,       setUserId]       = useState<string | null>(null);

  useFocusEffect(useCallback(() => { loadPhotos(); }, []));

  async function loadPhotos() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: files, error } = await supabase.storage
        .from(BUCKET)
        .list(user.id, { sortBy: { column: 'created_at', order: 'desc' } });

      if (error) {
        if (error.message.includes('bucket') || error.message.includes('not found')) {
          Alert.alert(
            'Storage Not Set Up',
            'Create a public Supabase Storage bucket named "progress-photos" to use this feature.',
          );
        }
        return;
      }

      const entries: PhotoEntry[] = (files ?? [])
        .filter((f) => f.name !== '.emptyFolderPlaceholder')
        .map((f) => {
          const path = `${user.id}/${f.name}`;
          const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
          return {
            name:      f.name,
            path,
            publicUrl,
            date:      new Date(parseInt(f.name.split('.')[0], 10)),
          };
        });

      setPhotos(entries);
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handlePhotoTaken(uri: string) {
    setShowCamera(false);
    if (!userId) return;
    setUploading(true);
    try {
      const response  = await fetch(uri);
      const blob      = await response.blob();
      const path      = `${userId}/${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg' });

      if (error) throw error;
      await loadPhotos();
    } catch (e: any) {
      Alert.alert('Upload Failed', e?.message ?? 'Could not save photo. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photo: PhotoEntry) {
    Alert.alert('Delete Photo', 'Permanently delete this progress photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setViewingPhoto(null);
          await supabase.storage.from(BUCKET).remove([photo.path]);
          setPhotos((prev) => prev.filter((p) => p.path !== photo.path));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: C.outlineVariant,
        gap: Spacing.md,
      }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="chevron.left" size={22} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={{ ...Typography.headlineMd, color: C.onSurface, flex: 1 }}>Progress Photos</Text>
        {uploading ? (
          <ActivityIndicator color={C.primary} />
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: C.primary,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.xs,
              borderRadius: Radius.full,
            }}
            onPress={() => setShowCamera(true)}>
            <Text style={{ ...Typography.labelLg, color: C.background, fontWeight: '700' }}>+ Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={C.primary} style={{ marginTop: Spacing.xxxl }} />
      ) : photos.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl }}>
          <IconSymbol name="camera.fill" size={48} color={C.outlineVariant} />
          <Text style={{ ...Typography.titleLg, color: C.onSurfaceVariant }}>No photos yet</Text>
          <Text style={{ ...Typography.bodyMd, color: C.onSurfaceVariant, textAlign: 'center' }}>
            Take regular photos to track your body transformation over time
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.lg, marginTop: Spacing.sm }}
            onPress={() => setShowCamera(true)}>
            <Text style={{ ...Typography.titleMd, color: C.background, fontWeight: '700' }}>Take First Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.path}
          numColumns={GRID_COLS}
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm }}
          columnWrapperStyle={{ gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setViewingPhoto(item)} activeOpacity={0.85}>
              <Image
                source={{ uri: item.publicUrl }}
                style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: Radius.md, backgroundColor: C.surfaceContainer }}
                contentFit="cover"
              />
            </TouchableOpacity>
          )}
        />
      )}

      <CameraModal
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onTaken={handlePhotoTaken}
      />

      {viewingPhoto && (
        <PhotoViewer
          photo={viewingPhoto}
          onClose={() => setViewingPhoto(null)}
          onDelete={() => handleDelete(viewingPhoto)}
        />
      )}
    </SafeAreaView>
  );
}
