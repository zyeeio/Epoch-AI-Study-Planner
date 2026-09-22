import { Task, Routine, TimetableBlock, LectureNote, AcademicResearchEntry } from '../types';

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Implement Binary Search Tree (BST) in Java with inorder traversal',
    subject: 'Computer Science (Java)',
    category: 'Exam',
    priority: 'urgent',
    estimatedMinutes: 60,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '15:00',
    completed: false,
    notes: 'Prepare for university freshman CS placement test. Write clean Node class, insert, and recursive traversal.',
    reminderEnabled: true,
    tags: ['Java', 'Algorithms', 'College Prep'],
  },
  {
    id: 'task-2',
    title: 'Calculus: Integration by Parts & Trigonometric Substitution set',
    subject: 'Mathematics',
    category: 'Assignment',
    priority: 'high',
    estimatedMinutes: 50,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '11:30',
    completed: true,
    completedAt: new Date(Date.now() - 3600000).toISOString(),
    notes: 'Problems 14 through 28 in Stewart Calculus review. Focus on reduction formulas.',
    reminderEnabled: true,
    tags: ['Calculus', 'STEM'],
  },
  {
    id: 'task-3',
    title: 'Review Physics Mechanics: Angular Momentum and Torque equilibrium',
    subject: 'Physics',
    category: 'Lecture',
    priority: 'medium',
    estimatedMinutes: 45,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '20:00',
    completed: false,
    notes: 'Review MIT OpenCourseWare lecture slides on rotational dynamics and cross products.',
    reminderEnabled: true,
    tags: ['Physics', 'Newtonian'],
  },
  {
    id: 'task-4',
    title: 'Computer Science Term Paper & Literature Review',
    subject: 'Academic Writing',
    category: 'Project',
    priority: 'high',
    estimatedMinutes: 45,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '18:00',
    completed: false,
    notes: 'Structure literature review on distributed consensus algorithms and draft abstract.',
    reminderEnabled: true,
    tags: ['Research', 'Writing', 'Algorithms'],
  },
  {
    id: 'task-5',
    title: 'Active Recall: Java OOP Memory Layout & JVM Generational GC',
    subject: 'Computer Science (Java)',
    category: 'Revision',
    priority: 'medium',
    estimatedMinutes: 30,
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '21:00',
    completed: false,
    notes: 'Test recall on Stack vs Heap references and difference between G1GC and ZGC.',
    reminderEnabled: true,
    tags: ['Java', 'OOP', 'Revision'],
  },
  {
    id: 'task-6',
    title: 'Python Scripting: Build interactive CLI for study routine tracking',
    subject: 'Computer Science (Python)',
    category: 'Project',
    priority: 'medium',
    estimatedMinutes: 40,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '16:30',
    completed: false,
    notes: 'Practice Python dictionaries, list comprehensions, and JSON file I/O.',
    reminderEnabled: false,
    tags: ['Python', 'Project'],
  },
];

export const INITIAL_ROUTINES: Routine[] = [
  {
    id: 'routine-1',
    title: 'Morning Code & Problem Solving Warmup',
    timeOfDay: 'morning',
    scheduledTime: '08:00',
    durationMinutes: 30,
    daysOfWeek: [1, 2, 3, 4, 5, 6],
    streak: 14,
    lastCompletedDate: new Date().toISOString().split('T')[0],
    reminderEnabled: true,
    category: 'Academics',
    iconName: 'Terminal',
  },
  {
    id: 'routine-2',
    title: 'Daily Academic Project & Review Check',
    timeOfDay: 'afternoon',
    scheduledTime: '13:00',
    durationMinutes: 20,
    daysOfWeek: [1, 2, 3, 4, 5],
    streak: 9,
    lastCompletedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    reminderEnabled: true,
    category: 'Project',
    iconName: 'GraduationCap',
  },
  {
    id: 'routine-3',
    title: 'STEM Deep Focus Study Block',
    timeOfDay: 'afternoon',
    scheduledTime: '15:30',
    durationMinutes: 60,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    streak: 18,
    lastCompletedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    reminderEnabled: true,
    category: 'Deep Work',
    iconName: 'BrainCircuit',
  },
  {
    id: 'routine-4',
    title: 'Evening Flashcard Recall & Lecture Summary',
    timeOfDay: 'evening',
    scheduledTime: '21:00',
    durationMinutes: 25,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    streak: 21,
    lastCompletedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    reminderEnabled: true,
    category: 'Review',
    iconName: 'Sparkles',
  },
  {
    id: 'routine-5',
    title: 'Screen Break & Physical Fitness',
    timeOfDay: 'evening',
    scheduledTime: '17:30',
    durationMinutes: 45,
    daysOfWeek: [1, 3, 5],
    streak: 6,
    lastCompletedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    reminderEnabled: false,
    category: 'Wellness',
    iconName: 'Dumbbell',
  },
];

const todayDay = new Date().getDay();

export const INITIAL_TIMETABLE_BLOCKS: TimetableBlock[] = [
  {
    id: 'block-1',
    dayOfWeek: todayDay,
    startTime: '08:00',
    endTime: '08:30',
    title: 'Morning Code & Logic Warmup',
    subject: 'Computer Science (Java)',
    type: 'routine',
    status: 'completed',
    routineId: 'routine-1',
    isFlexible: false,
    completed: true,
    notes: 'Solved 1 Java array recursion problem and reviewed Big-O.',
    checklist: [
      { id: 'c1', text: 'Review base cases for recursion', done: true },
      { id: 'c2', text: 'Trace call stack memory footprint', done: true },
    ],
    color: 'emerald',
    priority: 'high',
    energyLevel: 'high',
  },
  {
    id: 'block-2',
    dayOfWeek: todayDay,
    startTime: '09:00',
    endTime: '10:30',
    title: 'Calculus: Problem Sets & Integration Review',
    subject: 'Mathematics',
    type: 'deep_work',
    status: 'completed',
    taskId: 'task-2',
    isFlexible: true,
    completed: true,
    notes: 'Completed problems 14 to 28 in Stewart Calculus review.',
    checklist: [
      { id: 'c3', text: 'Solve integration by parts problem set', done: true },
      { id: 'c4', text: 'Check answers with trigonometric substitution', done: true },
    ],
    color: 'blue',
    priority: 'high',
    energyLevel: 'high',
  },
  {
    id: 'block-3',
    dayOfWeek: todayDay,
    startTime: '10:30',
    endTime: '10:50',
    title: 'Cognitive Recovery & Hydration Break',
    subject: 'Wellness',
    type: 'break',
    status: 'completed',
    isFlexible: true,
    completed: true,
    notes: 'Walk outside and rest eyes from screen.',
    color: 'amber',
    energyLevel: 'low',
  },
  {
    id: 'block-4',
    dayOfWeek: todayDay,
    startTime: '11:00',
    endTime: '12:15',
    title: 'Java BST Implementation & Traversal',
    subject: 'Computer Science (Java)',
    type: 'deep_work',
    status: 'in_progress',
    taskId: 'task-1',
    isFlexible: true,
    completed: false,
    notes: 'Build recursive and iterative depth-first algorithms in Java.',
    checklist: [
      { id: 'c5', text: 'Write Node class with left/right pointers', done: true },
      { id: 'c6', text: 'Implement recursive insert() method', done: true },
      { id: 'c7', text: 'Implement inorder, preorder, postorder traversals', done: false },
    ],
    color: 'indigo',
    priority: 'urgent',
    energyLevel: 'high',
  },
  {
    id: 'block-5',
    dayOfWeek: todayDay,
    startTime: '12:15',
    endTime: '13:15',
    title: 'Lunch & Relaxed Tech Reading',
    subject: 'Wellness',
    type: 'break',
    status: 'not_started',
    isFlexible: true,
    completed: false,
    color: 'amber',
    energyLevel: 'low',
  },
  {
    id: 'block-6',
    dayOfWeek: todayDay,
    startTime: '13:30',
    endTime: '14:30',
    title: 'Computer Science Term Paper & Literature Review',
    subject: 'Academic Writing',
    type: 'deep_work',
    status: 'not_started',
    taskId: 'task-4',
    isFlexible: true,
    completed: false,
    notes: 'Fine-tune literature review on distributed consensus algorithms and draft abstract.',
    checklist: [
      { id: 'c8', text: 'Refine opening problem statement and abstract', done: false },
      { id: 'c9', text: 'Ensure citation format follows IEEE guidelines', done: false },
    ],
    color: 'purple',
    priority: 'high',
    energyLevel: 'medium',
  },
  {
    id: 'block-7',
    dayOfWeek: todayDay,
    startTime: '14:45',
    endTime: '15:30',
    title: 'Physics Mechanics: Angular Momentum',
    subject: 'Physics',
    type: 'lecture',
    status: 'not_started',
    taskId: 'task-3',
    isFlexible: true,
    completed: false,
    notes: 'Review torque cross product theorems and rotational inertia.',
    color: 'rose',
    priority: 'medium',
    energyLevel: 'medium',
  },
  {
    id: 'block-8',
    dayOfWeek: todayDay,
    startTime: '16:00',
    endTime: '17:00',
    title: 'Flexible Buffer Block (Absorb Delays / Q&A)',
    subject: 'General Study',
    type: 'buffer',
    status: 'not_started',
    isFlexible: true,
    completed: false,
    notes: 'Specifically allocated to absorb study delays without shifting dinner.',
    color: 'sky',
    energyLevel: 'low',
  },
  {
    id: 'block-9',
    dayOfWeek: todayDay,
    startTime: '20:30',
    endTime: '21:15',
    title: 'Evening Active Recall Flashcards & Journaling',
    subject: 'Active Recall',
    type: 'review',
    status: 'not_started',
    routineId: 'routine-4',
    isFlexible: false,
    completed: false,
    notes: 'Review 15 active recall cards in Lecture Notes tab.',
    color: 'teal',
    priority: 'medium',
    energyLevel: 'low',
  },
];

export const INITIAL_LECTURE_NOTES: LectureNote[] = [
  {
    id: 'note-1',
    title: 'Java OOP Memory Layout: Stack vs Heap & Garbage Collection',
    subject: 'Computer Science (Java)',
    date: new Date().toISOString().split('T')[0],
    rawContent: `Java Memory Architecture Lecture Notes:
- JVM memory is partitioned into Stack, Heap, Metaspace, and Program Counter.
- Stack Memory: Stores local variables, method execution frames, and primitive types (int, float, boolean). Stack frames are pushed and popped in LIFO order. Very fast allocation.
- Heap Memory: Stores all objects instantiated with 'new'. Shared across all threads.
- References vs Objects: The variable 'Person p' is a reference living on the stack (typically 64-bit reference address), while the actual 'new Person()' object instance is allocated on the heap.
- Generational Garbage Collection:
  * Young Generation: Eden Space + Survivor Spaces (S0, S1). Most objects die young. Minor GC collects Eden.
  * Old / Tenured Generation: Objects that survive multiple GC cycles are promoted here. Major GC / Full GC runs less frequently.
  * Modern collectors: G1GC (Garbage-First) divides heap into regions, minimizing stop-the-world pauses.`,
    summary: `### 📌 Core Takeaways
1. **Stack vs. Heap Dichotomy**: Stack stores primitive values and 64-bit object references in fast LIFO frames; Heap stores dynamically allocated objects shared across threads.
2. **Generational Garbage Collection**: Leverages the *Weak Generational Hypothesis* (most objects die immediately). Divided into Young Gen (Eden, S0, S1) and Tenured Gen.
3. **Pass-by-Value**: Java is strictly pass-by-value; when passing objects, the value being passed is the reference address itself.`,
    keyTakeaways: [
      'Primitive types and reference handles live on the thread Stack',
      'Objects and instances always reside on the shared JVM Heap',
      'Eden space handles short-lived objects; survivors migrate to Old Generation',
      'Java references can be null; dereferencing throws NullPointerException',
    ],
    flashcards: [
      {
        id: 'fc-1',
        question: 'Where do primitive variables declared inside a method reside in Java?',
        answer: 'On the Call Stack inside that specific method execution frame.',
      },
      {
        id: 'fc-2',
        question: 'What is the Weak Generational Hypothesis in JVM Garbage Collection?',
        answer: 'The empirical observation that the vast majority of allocated objects have very short lifespans and can be reclaimed rapidly in the Young Generation.',
      },
      {
        id: 'fc-3',
        question: 'Does Java pass objects by reference or pass by value?',
        answer: 'Java is strictly pass-by-value. For objects, the value of the reference (memory address) is passed by copy.',
      },
    ],
    codeSnippets: [
      {
        language: 'java',
        code: `public class MemoryDemo {
    public static void main(String[] args) {
        int primitiveAge = 18;          // Stack
        String name = new String("CS"); // 'name' on Stack, String object on Heap
        modify(primitiveAge);
        System.out.println(primitiveAge); // Still 18 (pass-by-value)
    }

    private static void modify(int val) {
        val = 99; // Alters local stack copy only
    }
}`,
        explanation: 'Demonstrates stack allocation of primitives and pass-by-value immutability of the calling variable.',
      },
    ],
    tags: ['Java', 'Memory', 'JVM', 'GarbageCollection'],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'note-2',
    title: 'Single-Variable Calculus: Integration by Parts & LIATE Strategy',
    subject: 'Mathematics',
    date: new Date().toISOString().split('T')[0],
    rawContent: `Integration by Parts Formula:
Integral of u dv = u * v - Integral of v du

Origin: Derived from the Product Rule of differentiation:
d/dx[u * v] = u' * v + u * v'

Integrating both sides:
u * v = Integral(v du) + Integral(u dv) => Integral(u dv) = u * v - Integral(v du)

Choosing 'u' using LIATE:
L - Logarithmic (ln x)
I - Inverse Trig (arctan x)
A - Algebraic / Polynomial (x^2, 3x)
T - Trigonometric (sin x, cos x)
E - Exponential (e^x, 2^x)

Example: Integral of x * e^x dx
u = x => du = dx
dv = e^x dx => v = e^x
Result = x * e^x - Integral(e^x dx) = x * e^x - e^x + C = e^x(x - 1) + C`,
    summary: `### 📌 Core Takeaways
1. **Product Rule Dual**: Integration by parts undoes the product rule for derivatives by trading a difficult integral for an easier one.
2. **LIATE Strategy**: Prioritize $u$ selection from Logarithmic $\\rightarrow$ Inverse Trig $\\rightarrow$ Algebraic $\\rightarrow$ Trig $\\rightarrow$ Exponential.
3. **Tabular Method**: Recommended when integrating a polynomial multiplied by an easily integrable function ($e^{ax}, \\sin(ax)$).`,
    keyTakeaways: [
      'LIATE provides the optimal order for picking u',
      'The factor chosen for dv must be readily integrable',
      'Definite integrals require evaluating [u*v] across limits before subtracting the remaining integral',
    ],
    flashcards: [
      {
        id: 'fc-4',
        question: 'What is the canonical Integration by Parts formula?',
        answer: '∫ u dv = u·v - ∫ v du',
      },
      {
        id: 'fc-5',
        question: 'What does the LIATE mnemonic stand for?',
        answer: 'Logarithmic, Inverse trigonometric, Algebraic, Trigonometric, Exponential.',
      },
    ],
    tags: ['Calculus', 'Integration', 'LIATE', 'Mathematics'],
    lastUpdated: new Date().toISOString(),
  },
];

export const INITIAL_RESEARCH_ENTRIES: AcademicResearchEntry[] = [
  {
    id: 'res-1',
    query: 'How does Java JVM Garbage Collection compare with Python Reference Counting?',
    subject: 'Computer Science',
    timestamp: new Date().toISOString(),
    answer: `### Academic Comparison: Memory Management in Java vs. Python

Both Java and Python provide automatic memory reclamation, liberating programmers from manual \`malloc\` and \`free\` calls found in C/C++. However, their runtime internal architectures differ fundamentally:

#### 1. Java (JVM Generational Tracing GC)
- **Primary Mechanism**: Tracing garbage collection starting from Root sets (stack references, static variables, active thread references).
- **Generational Partitioning**: Java assumes objects either die in milliseconds or persist for a long time. The heap is split into:
  - **Young Generation (Eden + S0/S1 Survivor)**: Fast allocation using bump-the-pointer. Minor GC collects dead objects quickly.
  - **Old Generation (Tenured)**: Holds long-lived data structures.
- **Modern Collectors**: **G1GC** (Garbage-First) divides memory into equal regions, predicting pause times and prioritizing regions with the most garbage.

#### 2. Python (CPython Reference Counting + Cycle Detection)
- **Primary Mechanism**: Every object wrapper (\`PyObject\`) contains an internal counter (\`ob_refcnt\`).
- **Immediate Reclamation**: When a reference goes out of scope or is reassigned, the counter decrements. If it reaches zero, the memory is freed immediately.
- **Cyclic GC**: Reference counting cannot resolve circular references (e.g., Object A references B, and B references A). Python supplements this with a generational cycle-detecting GC that periodically audits reference graphs.

#### Summary Comparison Table
| Dimension | Java (JVM) | Python (CPython) |
| :--- | :--- | :--- |
| **Default Method** | Tracing Generational GC | Reference Counting + Cycle Detector |
| **Deallocation Timing** | Deferred during GC sweeps | Immediate when ref count reaches 0 |
| **Object Overhead** | Minimal (Object header ~12-16 bytes) | High (PyObject overhead ~28 bytes for an integer) |
| **Pause Characteristics** | Tunable (ZGC/G1 sub-millisecond goals) | Intermittent cycle detection passes |`,
    sources: [
      { title: 'Oracle Java Virtual Machine Specification', uri: 'https://docs.oracle.com/javase/specs/jvms/se17/html/' },
      { title: 'Python 3 Internal Memory Management & Data Model', uri: 'https://docs.python.org/3/c-api/memory.html' },
    ],
    webSearchQueries: ['Java JVM garbage collection generational', 'Python reference counting cyclic garbage collection'],
  },
];
