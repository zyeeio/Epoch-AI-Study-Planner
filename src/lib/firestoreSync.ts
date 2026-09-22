import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs 
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, Routine, TimetableBlock, LectureNote } from '../types';

// Sync tasks to Firestore
export async function syncTasksToFirestore(userId: string, tasks: Task[]) {
  if (!userId) return;
  const colRef = collection(db, 'users', userId, 'tasks');
  const currentIds = new Set(tasks.map(t => t.id));
  try {
    const existingSnap = await getDocs(colRef);
    const toDelete = existingSnap.docs.filter(d => !currentIds.has(d.id));
    for (const d of toDelete) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('Tasks cleanup error:', err);
  }
  tasks.forEach(async (task) => {
    try {
      await setDoc(doc(colRef, task.id), task, { merge: true });
    } catch (err) {
      console.warn('Task sync error:', err);
    }
  });
}

// Delete single task
export async function deleteTaskFromFirestore(userId: string, taskId: string) {
  if (!userId || !taskId) return;
  try {
    await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
  } catch (err) {
    console.warn('Task deletion error:', err);
  }
}

// Subscribe to real-time tasks from Firestore
export function subscribeToFirestoreTasks(
  userId: string, 
  onUpdate: (tasks: Task[]) => void
) {
  if (!userId) return () => {};
  const colRef = collection(db, 'users', userId, 'tasks');
  return onSnapshot(colRef, (snapshot) => {
    const items = snapshot.docs.map(d => d.data() as Task);
    onUpdate(items);
  }, (err) => {
    console.warn('Firestore tasks snapshot error:', err);
  });
}

// Sync routines to Firestore
export async function syncRoutinesToFirestore(userId: string, routines: Routine[]) {
  if (!userId) return;
  const colRef = collection(db, 'users', userId, 'routines');
  const currentIds = new Set(routines.map(r => r.id));
  try {
    const existingSnap = await getDocs(colRef);
    const toDelete = existingSnap.docs.filter(d => !currentIds.has(d.id));
    for (const d of toDelete) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('Routines cleanup error:', err);
  }
  routines.forEach(async (routine) => {
    try {
      await setDoc(doc(colRef, routine.id), routine, { merge: true });
    } catch (err) {
      console.warn('Routine sync error:', err);
    }
  });
}

// Subscribe to routines
export function subscribeToFirestoreRoutines(
  userId: string, 
  onUpdate: (routines: Routine[]) => void
) {
  if (!userId) return () => {};
  const colRef = collection(db, 'users', userId, 'routines');
  return onSnapshot(colRef, (snapshot) => {
    const items = snapshot.docs.map(d => d.data() as Routine);
    onUpdate(items);
  }, (err) => {
    console.warn('Firestore routines snapshot error:', err);
  });
}

// Sync Timetable blocks
export async function syncTimetableToFirestore(userId: string, blocks: TimetableBlock[]) {
  if (!userId) return;
  const colRef = collection(db, 'users', userId, 'timetable');
  const currentIds = new Set(blocks.map(b => b.id));
  try {
    const existingSnap = await getDocs(colRef);
    const toDelete = existingSnap.docs.filter(d => !currentIds.has(d.id));
    for (const d of toDelete) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('Timetable cleanup error:', err);
  }
  blocks.forEach(async (block) => {
    try {
      await setDoc(doc(colRef, block.id), block, { merge: true });
    } catch (err) {
      console.warn('Timetable sync error:', err);
    }
  });
}

// Delete single timetable block
export async function deleteTimetableBlockFromFirestore(userId: string, blockId: string) {
  if (!userId || !blockId) return;
  try {
    await deleteDoc(doc(db, 'users', userId, 'timetable', blockId));
  } catch (err) {
    console.warn('Timetable block deletion error:', err);
  }
}

// Subscribe to Timetable blocks
export function subscribeToFirestoreTimetable(
  userId: string, 
  onUpdate: (blocks: TimetableBlock[]) => void
) {
  if (!userId) return () => {};
  const colRef = collection(db, 'users', userId, 'timetable');
  return onSnapshot(colRef, (snapshot) => {
    const items = snapshot.docs.map(d => d.data() as TimetableBlock);
    onUpdate(items);
  }, (err) => {
    console.warn('Firestore timetable snapshot error:', err);
  });
}

// Sync notes
export async function syncNotesToFirestore(userId: string, notes: LectureNote[]) {
  if (!userId) return;
  const colRef = collection(db, 'users', userId, 'notes');
  const currentIds = new Set(notes.map(n => n.id));
  try {
    const existingSnap = await getDocs(colRef);
    const toDelete = existingSnap.docs.filter(d => !currentIds.has(d.id));
    for (const d of toDelete) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.warn('Notes cleanup error:', err);
  }
  notes.forEach(async (note) => {
    try {
      await setDoc(doc(colRef, note.id), note, { merge: true });
    } catch (err) {
      console.warn('Notes sync error:', err);
    }
  });
}

// Delete single note
export async function deleteNoteFromFirestore(userId: string, noteId: string) {
  if (!userId || !noteId) return;
  try {
    await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
  } catch (err) {
    console.warn('Note deletion error:', err);
  }
}

// Subscribe to Notes
export function subscribeToFirestoreNotes(
  userId: string, 
  onUpdate: (notes: LectureNote[]) => void
) {
  if (!userId) return () => {};
  const colRef = collection(db, 'users', userId, 'notes');
  return onSnapshot(colRef, (snapshot) => {
    const items = snapshot.docs.map(d => d.data() as LectureNote);
    onUpdate(items);
  }, (err) => {
    console.warn('Firestore notes snapshot error:', err);
  });
}
