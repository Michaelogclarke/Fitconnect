import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { styles } from '@/styles/edit-routine.styles';

// ─── Data ────────────────────────────────────────────────────────────────────

type Exercise = {
  id: string;
  name: string;
  muscle: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
};

const INITIAL_EXERCISES: Exercise[] = [
  { id: '1', name: 'Flat Barbell Bench Press', muscle: 'Chest', sets: '4', reps: '8–10', weight: '80 kg', notes: '' },
  { id: '2', name: 'Incline Dumbbell Press', muscle: 'Chest', sets: '3', reps: '10–12', weight: '32 kg', notes: 'Control the eccentric' },
  { id: '3', name: 'Cable Chest Fly', muscle: 'Chest', sets: '3', reps: '12–15', weight: '15 kg', notes: '' },
  { id: '4', name: 'Tricep Rope Pushdown', muscle: 'Triceps', sets: '3', reps: '12–15', weight: '20 kg', notes: '' },
];

// ─── Subcomponents ────────────────────────────────────────────────────────────

function ExerciseCard({
  exercise,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  exercise: Exercise;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (field: keyof Exercise, value: string) => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.exerciseCard, expanded && styles.exerciseCardExpanded]}>
      <View style={styles.exerciseRow}>
        {/* Drag handle placeholder */}
        <View style={styles.dragHandle}>
          <Text style={{ color: Colors.onSurfaceVariant, fontSize: 16 }}>⠿</Text>
        </View>

        {/* Info */}
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.exerciseChips}>
            <View style={[styles.chip, styles.chipHighlight]}>
              <Text style={[styles.chipText, styles.chipTextHighlight]}>{exercise.muscle}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{exercise.sets} sets</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{exercise.reps} reps</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{exercise.weight}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.expandBtn} onPress={onToggle}>
          <IconSymbol
            name={expanded ? 'xmark.circle.fill' : 'pencil'}
            size={18}
            color={expanded ? Colors.onSurfaceVariant : Colors.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <IconSymbol name="trash" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.expandedBody}>
          <View style={styles.editRow}>
            <View style={styles.editField}>
              <Text style={styles.editFieldLabel}>Sets</Text>
              <TextInput
                style={styles.editFieldInput}
                value={exercise.sets}
                onChangeText={(v) => onUpdate('sets', v)}
                keyboardType="number-pad"
                placeholderTextColor={Colors.onSurfaceVariant}
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editFieldLabel}>Reps</Text>
              <TextInput
                style={styles.editFieldInput}
                value={exercise.reps}
                onChangeText={(v) => onUpdate('reps', v)}
                placeholderTextColor={Colors.onSurfaceVariant}
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editFieldLabel}>Weight</Text>
              <TextInput
                style={styles.editFieldInput}
                value={exercise.weight}
                onChangeText={(v) => onUpdate('weight', v)}
                placeholderTextColor={Colors.onSurfaceVariant}
              />
            </View>
          </View>
          <View style={styles.editNotes}>
            <TextInput
              style={styles.editNotesInput}
              value={exercise.notes}
              onChangeText={(v) => onUpdate('notes', v)}
              placeholder="Add a coaching note…"
              placeholderTextColor={Colors.onSurfaceVariant}
              multiline
            />
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function EditRoutineScreen() {
  const router = useRouter();
  const [routineName, setRoutineName] = useState('Hypertrophy Phase II: Chest');
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateExercise(id: string, field: keyof Exercise, value: string) {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  }

  function deleteExercise(id: string) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function addExercise() {
    const id = Date.now().toString();
    setExercises((prev) => [
      ...prev,
      { id, name: 'New Exercise', muscle: 'Muscle', sets: '3', reps: '10', weight: '0 kg', notes: '' },
    ]);
    setExpandedId(id);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.right" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        <TextInput
          style={styles.titleInput}
          value={routineName}
          onChangeText={setRoutineName}
          placeholderTextColor={Colors.onSurfaceVariant}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={() => router.back()}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Meta chips */}
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <IconSymbol name="dumbbell.fill" size={12} color={Colors.onSurfaceVariant} />
          <Text style={styles.metaChipText}>{exercises.length} exercises</Text>
        </View>
        <View style={styles.metaChip}>
          <IconSymbol name="flame.fill" size={12} color={Colors.onSurfaceVariant} />
          <Text style={styles.metaChipText}>~45 min</Text>
        </View>
        <View style={styles.metaChip}>
          <IconSymbol name="heart.fill" size={12} color={Colors.onSurfaceVariant} />
          <Text style={styles.metaChipText}>Chest</Text>
        </View>
      </View>

      {/* Exercise list */}
      <Text style={styles.sectionLabel}>Exercises</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            expanded={expandedId === ex.id}
            onToggle={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
            onUpdate={(field, value) => updateExercise(ex.id, field, value)}
            onDelete={() => deleteExercise(ex.id)}
          />
        ))}

        {/* Add exercise */}
        <TouchableOpacity style={styles.addExerciseBtn} onPress={addExercise}>
          <IconSymbol name="plus.circle.fill" size={20} color={Colors.primary} />
          <Text style={styles.addExerciseBtnText}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom save bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveLargeBtn} onPress={() => router.back()}>
          <Text style={styles.saveLargeBtnText}>Save Routine</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discardBtn} onPress={() => router.back()}>
          <Text style={styles.discardBtnText}>Discard Changes</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
