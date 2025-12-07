"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./lms.module.css";
import { useAuth } from "@/app/context/AuthContext";
import { getSupabase } from "@/lib/supabase";
import Announcements from "@/app/components/Announcements";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Section {
    id: string;
    title: string;
    course_id: string;
    year: number;
    semester: string;
    teachers?: {
        user_id: string;
        user_profiles?: {
            full_name?: string;
            email?: string;
        };
    }[];
}

interface UserSection {
    section_id: string;
    role: string;
    user_id?: string;
    section?: {
        id: string;
        title: string;
        course_id: string;
        year: number;
        semester: string;
    };
}
interface Block {
    id: number;
    title: string;
    content: string;
}

interface Page {
    id: number;
    title: string;
    dueDate?: string;
    blocks: Block[];
}

interface Course {
    id: number;
    title: string;
    pages: Page[];
}

// --- Mock data (replace with API later) ---
const initialCourses = [
        {
            id: 1,
            title: "MATH 101",
            pages: [
                { id: 11, title: "Assignment 1: Linear Equations", blocks: [
                    { id: 1101, title: "Problem 1", content: "Solve for x: 2x + 5 = 13. Show all your work." },
                    { id: 1102, title: "Problem 2", content: "Graph the equation y = 3x - 2 and identify the slope and y-intercept." }
                ]},
                { id: 12, title: "Assignment 2: Quadratic Functions", blocks: [
                    { id: 1201, title: "Problem 1", content: "Factor the quadratic expression: x² + 7x + 12" },
                    { id: 1202, title: "Problem 2", content: "Use the quadratic formula to solve: 2x² - 5x - 3 = 0" }
                ]},
                { id: 13, title: "Assignment 3: Systems of Equations", blocks: [
                    { id: 1301, title: "Problem 1", content: "Solve the system: 2x + y = 10 and x - y = 2" },
                    { id: 1302, title: "Problem 2", content: "Use substitution method to solve: y = 2x + 1 and 3x + y = 9" }
                ]},
                { id: 14, title: "Assignment 4: Polynomials", blocks: [
                    { id: 1401, title: "Problem 1", content: "Multiply and simplify: (x + 3)(x - 5)" },
                    { id: 1402, title: "Problem 2", content: "Factor completely: 2x³ + 8x² + 8x" }
                ]},
                { id: 15, title: "Assignment 5: Rational Expressions", blocks: [
                    { id: 1501, title: "Problem 1", content: "Simplify: (x² - 4)/(x - 2)" },
                    { id: 1502, title: "Problem 2", content: "Add and simplify: 1/x + 2/(x+1)" }
                ]},
                { id: 16, title: "Assignment 6: Exponents and Radicals", blocks: [
                    { id: 1601, title: "Problem 1", content: "Simplify: (2x³)⁴" },
                    { id: 1602, title: "Problem 2", content: "Solve for x: √(x + 5) = 7" }
                ]},
                { id: 17, title: "Assignment 7: Functions", blocks: [
                    { id: 1701, title: "Problem 1", content: "Given f(x) = 2x² - 3x + 1, find f(3)" },
                    { id: 1702, title: "Problem 2", content: "Determine if the relation {(1,2), (2,4), (3,6)} is a function" }
                ]},
                { id: 18, title: "Assignment 8: Logarithms", blocks: [
                    { id: 1801, title: "Problem 1", content: "Evaluate: log₂(32)" },
                    { id: 1802, title: "Problem 2", content: "Solve for x: log(x) + log(x-3) = 1" }
                ]},
                { id: 19, title: "Assignment 9: Sequences and Series", blocks: [
                    { id: 1901, title: "Problem 1", content: "Find the 10th term of the arithmetic sequence: 3, 7, 11, 15, ..." },
                    { id: 1902, title: "Problem 2", content: "Calculate the sum of the first 8 terms of the geometric series: 2, 6, 18, ..." }
                ]},
                { id: 110, title: "Assignment 10: Review and Applications", blocks: [
                    { id: 11001, title: "Problem 1", content: "A rectangular garden has length (2x + 3) and width (x - 1). Write an expression for the area." },
                    { id: 11002, title: "Problem 2", content: "If a car travels at 60 mph for 2.5 hours, how far does it travel? Express using algebra." }
                ]},
            ]
        },
        {
            id: 2,
            title: "CSC 102",
            pages: [
                { id: 21, title: "Assignment 1: Python Basics", blocks: [
                    { id: 2101, title: "Problem 1", content: "Write a Python function that takes a list of numbers and returns the sum of all even numbers." },
                    { id: 2102, title: "Problem 2", content: "Create a program that prints the Fibonacci sequence up to n terms." }
                ]},
                { id: 22, title: "Assignment 2: Data Structures", blocks: [
                    { id: 2201, title: "Problem 1", content: "Implement a stack using a Python list with push, pop, and peek operations." },
                    { id: 2202, title: "Problem 2", content: "Write a function to reverse a linked list." }
                ]},
                { id: 23, title: "Assignment 3: Loops and Conditionals", blocks: [
                    { id: 2301, title: "Problem 1", content: "Write a program that prints all prime numbers up to 100." },
                    { id: 2302, title: "Problem 2", content: "Create a function that checks if a string is a palindrome." }
                ]},
                { id: 24, title: "Assignment 4: Functions and Recursion", blocks: [
                    { id: 2401, title: "Problem 1", content: "Write a recursive function to calculate factorial of n." },
                    { id: 2402, title: "Problem 2", content: "Implement binary search using recursion." }
                ]},
                { id: 25, title: "Assignment 5: File I/O", blocks: [
                    { id: 2501, title: "Problem 1", content: "Write a program to read a file and count the number of words." },
                    { id: 2502, title: "Problem 2", content: "Create a function to write data to a CSV file." }
                ]},
                { id: 26, title: "Assignment 6: Object-Oriented Programming", blocks: [
                    { id: 2601, title: "Problem 1", content: "Create a Car class with properties: make, model, year, and a method to display info." },
                    { id: 2602, title: "Problem 2", content: "Implement inheritance by creating a ElectricCar class that extends Car." }
                ]},
                { id: 27, title: "Assignment 7: Exception Handling", blocks: [
                    { id: 2701, title: "Problem 1", content: "Write a function that handles division by zero errors gracefully." },
                    { id: 2702, title: "Problem 2", content: "Create a program that reads user input and validates it using try-except blocks." }
                ]},
                { id: 28, title: "Assignment 8: Algorithms", blocks: [
                    { id: 2801, title: "Problem 1", content: "Implement bubble sort to sort a list of integers." },
                    { id: 2802, title: "Problem 2", content: "Write a function to find the maximum element in an array." }
                ]},
                { id: 29, title: "Assignment 9: Dictionaries and Sets", blocks: [
                    { id: 2901, title: "Problem 1", content: "Create a dictionary to store student names and grades, then find the average." },
                    { id: 2902, title: "Problem 2", content: "Use a set to remove duplicate elements from a list." }
                ]},
                { id: 210, title: "Assignment 10: Final Project", blocks: [
                    { id: 21001, title: "Problem 1", content: "Build a simple todo list application with add, remove, and display features." },
                    { id: 21002, title: "Problem 2", content: "Implement a number guessing game with user input validation." }
                ]},
            ]
        },
        {
            id: 3,
            title: "CHEM 103",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 30 + i + 1,
                title: `Assignment ${i + 1}: Chemistry Topic ${i + 1}`,
                blocks: [
                    { id: (30 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete chemistry problem ${i + 1}.1` },
                    { id: (30 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete chemistry problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 4,
            title: "PHYS 104",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 40 + i + 1,
                title: `Assignment ${i + 1}: Physics Topic ${i + 1}`,
                blocks: [
                    { id: (40 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete physics problem ${i + 1}.1` },
                    { id: (40 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete physics problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 5,
            title: "ENG 105",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 50 + i + 1,
                title: `Assignment ${i + 1}: English Topic ${i + 1}`,
                blocks: [
                    { id: (50 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete English problem ${i + 1}.1` },
                    { id: (50 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete English problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 6,
            title: "BIO 106",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 60 + i + 1,
                title: `Assignment ${i + 1}: Biology Topic ${i + 1}`,
                blocks: [
                    { id: (60 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete biology problem ${i + 1}.1` },
                    { id: (60 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete biology problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 7,
            title: "HIST 107",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 70 + i + 1,
                title: `Assignment ${i + 1}: History Topic ${i + 1}`,
                blocks: [
                    { id: (70 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete history problem ${i + 1}.1` },
                    { id: (70 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete history problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 8,
            title: "ECON 108",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 80 + i + 1,
                title: `Assignment ${i + 1}: Economics Topic ${i + 1}`,
                blocks: [
                    { id: (80 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete economics problem ${i + 1}.1` },
                    { id: (80 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete economics problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 9,
            title: "PSY 109",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 90 + i + 1,
                title: `Assignment ${i + 1}: Psychology Topic ${i + 1}`,
                blocks: [
                    { id: (90 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete psychology problem ${i + 1}.1` },
                    { id: (90 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete psychology problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 10,
            title: "ART 110",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 100 + i + 1,
                title: `Assignment ${i + 1}: Art Topic ${i + 1}`,
                blocks: [
                    { id: (100 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete art problem ${i + 1}.1` },
                    { id: (100 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete art problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 11,
            title: "MUS 111",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 110 + i + 1,
                title: `Assignment ${i + 1}: Music Topic ${i + 1}`,
                blocks: [
                    { id: (110 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete music problem ${i + 1}.1` },
                    { id: (110 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete music problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 12,
            title: "SPAN 112",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 120 + i + 1,
                title: `Assignment ${i + 1}: Spanish Topic ${i + 1}`,
                blocks: [
                    { id: (120 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete Spanish problem ${i + 1}.1` },
                    { id: (120 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete Spanish problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 13,
            title: "SOC 113",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 130 + i + 1,
                title: `Assignment ${i + 1}: Sociology Topic ${i + 1}`,
                blocks: [
                    { id: (130 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete sociology problem ${i + 1}.1` },
                    { id: (130 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete sociology problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 14,
            title: "PHIL 114",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 140 + i + 1,
                title: `Assignment ${i + 1}: Philosophy Topic ${i + 1}`,
                blocks: [
                    { id: (140 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete philosophy problem ${i + 1}.1` },
                    { id: (140 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete philosophy problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 15,
            title: "STAT 115",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 150 + i + 1,
                title: `Assignment ${i + 1}: Statistics Topic ${i + 1}`,
                blocks: [
                    { id: (150 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete statistics problem ${i + 1}.1` },
                    { id: (150 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete statistics problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 16,
            title: "GEO 116",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 160 + i + 1,
                title: `Assignment ${i + 1}: Geography Topic ${i + 1}`,
                blocks: [
                    { id: (160 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete geography problem ${i + 1}.1` },
                    { id: (160 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete geography problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 17,
            title: "BUS 117",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 170 + i + 1,
                title: `Assignment ${i + 1}: Business Topic ${i + 1}`,
                blocks: [
                    { id: (170 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete business problem ${i + 1}.1` },
                    { id: (170 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete business problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 18,
            title: "ENV 118",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 180 + i + 1,
                title: `Assignment ${i + 1}: Environmental Science Topic ${i + 1}`,
                blocks: [
                    { id: (180 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete environmental science problem ${i + 1}.1` },
                    { id: (180 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete environmental science problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 19,
            title: "NURS 119",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 190 + i + 1,
                title: `Assignment ${i + 1}: Nursing Topic ${i + 1}`,
                blocks: [
                    { id: (190 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete nursing problem ${i + 1}.1` },
                    { id: (190 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete nursing problem ${i + 1}.2` }
                ]
            }))
        },
        {
            id: 20,
            title: "LAW 120",
            pages: Array.from({length: 10}, (_, i) => ({
                id: 200 + i + 1,
                title: `Assignment ${i + 1}: Law Topic ${i + 1}`,
                blocks: [
                    { id: (200 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete law problem ${i + 1}.1` },
                    { id: (200 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete law problem ${i + 1}.2` }
                ]
            }))
        }
];

// Sortable Page Item Component
function SortablePageItem({ page, isActive, onClick, canEdit }: { page: Page; isActive: boolean; onClick: () => void; canEdit: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: page.id, disabled: !canEdit });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`${styles.pageItem} ${isActive ? styles.activePage : ""}`}
            onClick={onClick}
        >
            {canEdit && (
                <span {...attributes} {...listeners} style={{ cursor: 'grab', marginRight: '8px', userSelect: 'none' }}>
                    ⋮⋮
                </span>
            )}
            {page.title}
        </li>
    );
}

// Sortable Block Item Component
function SortableBlockItem({ block, canEdit, isEditing, onEdit, onSave, onCancel, onDelete, editTitle, editContent, setEditTitle, setEditContent, onSubmitAnswer, answers, setAnswers, submissions, submitting }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id, disabled: !canEdit });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={styles.block}>
            <div className={styles.blockHeader}>
                {canEdit && (
                    <span {...attributes} {...listeners} style={{ cursor: 'grab', marginRight: '8px', userSelect: 'none', fontSize: '18px' }}>
                        ⋮⋮
                    </span>
                )}
                {isEditing ? (
                    <input
                        className={styles.input}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{ flex: 1, marginRight: '8px' }}
                    />
                ) : (
                    <h3 style={{ flex: 1 }}>{block.title}</h3>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {canEdit && !isEditing && (
                        <button
                            className={styles.editBtn}
                            onClick={onEdit}
                            title="Edit"
                        >
                            ✏️
                        </button>
                    )}
                    {canEdit && isEditing && (
                        <>
                            <button
                                className={styles.saveBtn}
                                onClick={onSave}
                                title="Save"
                            >
                                ✓
                            </button>
                            <button
                                className={styles.cancelBtn}
                                onClick={onCancel}
                                title="Cancel"
                            >
                                ✕
                            </button>
                        </>
                    )}
                    {canEdit && (
                        <button
                            className={styles.deleteBtn}
                            onClick={onDelete}
                            title="Delete"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            </div>
            {isEditing ? (
                <textarea
                    className={styles.textarea}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    style={{ marginTop: '12px' }}
                />
            ) : (
                <p>{block.content}</p>
            )}

            {/* Submission Form */}
            {!isEditing && (
                <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(0,0,0,0.1)" }}>
                    <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", fontSize: "14px" }}>
                        Your Answer:
                    </label>
                    <textarea
                        className={styles.textarea}
                        placeholder="Type your answer here..."
                        value={answers[block.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [block.id]: e.target.value })}
                        rows={4}
                        style={{ marginBottom: "12px" }}
                    />
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <button
                            className={styles.addBtn}
                            onClick={() => onSubmitAnswer(block.id)}
                            disabled={submitting[block.id]}
                            style={{ margin: 0 }}
                        >
                            {submitting[block.id] ? "Submitting..." : submissions[block.id] ? "Update Answer" : "Submit Answer"}
                        </button>
                        {submissions[block.id] && (
                            <span style={{ fontSize: "13px", color: "#34c759", fontWeight: "500" }}>
                                ✓ Submitted {new Date(submissions[block.id].submitted_at).toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LMSPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState(initialCourses);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [selectedPage, setSelectedPage] = useState<number | null>(null);
    const [userSections, setUserSections] = useState<UserSection[]>([]);
    const [availableCourses, setAvailableCourses] = useState<number[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");

    const [showAnnouncements, setShowAnnouncements] = useState(false);
    const [selectedSectionForAnnouncements, setSelectedSectionForAnnouncements] = useState<Section | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [announcementsUnreadCount, setAnnouncementsUnreadCount] = useState<Record<string, number>>({});

    // Assignment submission state
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [submissions, setSubmissions] = useState<Record<number, any>>({});
    const [submitting, setSubmitting] = useState<Record<number, boolean>>({});

    // New assignment modal state
    const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
    const [newAssignmentTitle, setNewAssignmentTitle] = useState("");
    const [newAssignmentDueDate, setNewAssignmentDueDate] = useState("");

    // New course modal state
    const [showAddCourseModal, setShowAddCourseModal] = useState(false);
    const [newCourseCode, setNewCourseCode] = useState("");
    const [newCourseNumber, setNewCourseNumber] = useState("");
        // Inline editing state for blocks
    const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const ADMIN_EMAIL = "carsonhoward6@gmail.com";
    const isAdmin = user?.email === ADMIN_EMAIL;

    // Check if user is a teacher for selected course
    const isTeacher = userSections.some(s => {
        if (!s.section) return false;
        return parseInt(s.section.course_id) === selectedCourse && s.role === 'teacher';
    });
    // Can edit if admin or teacher
    const canEdit = isAdmin || isTeacher;

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    const fetchUserSections = useCallback(async () => {
        if (!user) return;

        setLoadingCourses(true);

        const supabase = getSupabase();

        // Admin sees all courses
        if (isAdmin) {
            setAvailableCourses([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);

            // Fetch all sections with teachers for admin
            const { data: allSections } = await ((supabase as any)
                .from("user_sections")
                .select(`
                    section_id,
                    role,
                    user_id,
                    section:section_id (
                        id,
                        title,
                        course_id,
                        year,
                        semester
                    )
                `)
                .eq("role", "teacher"));

            if (allSections) {
                const formattedSections = allSections.map((s: any) => ({
                    section_id: s.section_id,
                    role: s.role,
                    user_id: s.user_id,
                    section: Array.isArray(s.section) ? s.section[0] : s.section
                }));
                setUserSections(formattedSections);
            }

            setLoadingCourses(false);
            return;
        }

        // Fetch user's assigned sections with course and teacher info
        const { data: sectionsData } = await ((supabase as any)
            .from("user_sections")
            .select(`
                section_id,
                role,
                section:section_id (
                    id,
                    title,
                    course_id,
                    year,
                    semester
                )
            `)
            .eq("user_id", user.id));

        if (sectionsData) {
            const formattedSections = sectionsData.map((s: any) => ({
                section_id: s.section_id,
                role: s.role,
                section: Array.isArray(s.section) ? s.section[0] : s.section
            }));
            setUserSections(formattedSections);

            // Extract unique course IDs from assigned sections
            const courseIds = [...new Set(
                formattedSections
                    .filter((s: any) => s.section)
                    .map((s: any) => parseInt(s.section.course_id))
            )] as number[];

            setAvailableCourses(courseIds);
        }

        setLoadingCourses(false);
    }, [user, isAdmin]);

    // Fetch user's assigned sections/classes
    useEffect(() => {
        if (user && !loading) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchUserSections();
        }
    }, [user, loading, fetchUserSections]);

    // Get sections for current course
    const [courseSections, setCourseSections] = useState<Section[]>([]);

    // Get sections for selected course with teacher info
    const getSectionsForCourse = useCallback(async (courseId: number) => {
        if (!courseId) return [];

        const supabase = getSupabase();

        // Get all sections for this course with teachers
        const { data: sections } = await ((supabase as any)
            .from("section")
            .select("id, title, course_id, year, semester")
            .eq("course_id", courseId.toString()));

        if (!sections) return [];

        // Get teachers for each section
        const sectionsWithTeachers = await Promise.all(
            sections.map(async (section: any) => {
                const { data: teachers } = await ((supabase as any)
                    .from("user_sections")
                    .select(`
                        user_id,
                        user_profiles:user_id (
                            full_name,
                            email
                        )
                    `)
                    .eq("section_id", section.id)
                    .eq("role", "teacher"));

                // Format teachers to match the Section interface
                const formattedTeachers = teachers?.map((t: any) => ({
                    user_id: t.user_id,
                    user_profiles: Array.isArray(t.user_profiles) ? t.user_profiles[0] : t.user_profiles
                })) || [];

                return {
                    ...section,
                    teachers: formattedTeachers
                };
            })
        );

        // Filter to only show sections user is assigned to (unless admin)
        if (isAdmin) {
            return sectionsWithTeachers;
        } else {
            const userSectionIds = userSections.map(s => s.section_id);
            return sectionsWithTeachers.filter(s => userSectionIds.includes(s.id));
        }
    }, [isAdmin, userSections]);

    useEffect(() => {
        if (selectedCourse) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            getSectionsForCourse(selectedCourse).then(setCourseSections);
        } else {
            setCourseSections([]);
        }
    }, [selectedCourse, getSectionsForCourse]);

    // -------------------------------
    // Helpers
    // -------------------------------

    const course = courses.find(c => c.id === selectedCourse) || null;
    const page = course?.pages.find(p => p.id === selectedPage) || null;

    // Get current page index for navigation
    const currentPageIndex = course?.pages.findIndex(p => p.id === selectedPage) ?? -1;
    const hasPrevPage = currentPageIndex > 0;
    const hasNextPage = course ? currentPageIndex < course.pages.length - 1 : false;

    function goToPrevPage() {
        if (!course || !hasPrevPage) return;
        setSelectedPage(course.pages[currentPageIndex - 1].id);
    }

    function goToNextPage() {
        if (!course || !hasNextPage) return;
        setSelectedPage(course.pages[currentPageIndex + 1].id);
    }

    // Handle page drag end
    function handlePageDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id || !course) {
            return;
        }

        const oldIndex = course.pages.findIndex(p => p.id === active.id);
        const newIndex = course.pages.findIndex(p => p.id === over.id);

        const newPages = arrayMove(course.pages, oldIndex, newIndex);

        // Update local state
        const updatedCourses = courses.map(c =>
            c.id === course.id ? { ...c, pages: newPages } : c
        );
        setCourses(updatedCourses);

        console.log(`Moved page ${active.id} from index ${oldIndex} to ${newIndex}`);
    }

    // Handle block drag end
    function handleBlockDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id || !page || !course) {
            return;
        }

        const oldIndex = page.blocks.findIndex(b => b.id === active.id);
        const newIndex = page.blocks.findIndex(b => b.id === over.id);

        const newBlocks = arrayMove(page.blocks, oldIndex, newIndex);

        // Update local state
        const updatedCourses = courses.map(c => {
            if (c.id !== course.id) return c;
            return {
                ...c,
                pages: c.pages.map(p =>
                    p.id === page.id ? { ...p, blocks: newBlocks } : p
                )
            };
        });
        setCourses(updatedCourses);

        console.log(`Moved block ${active.id} from index ${oldIndex} to ${newIndex}`);
    }

    // Start editing a block
    function startEditBlock(block: Block) {
        setEditingBlockId(block.id);
        setEditTitle(block.title);
        setEditContent(block.content);
    }

    // Save block edits
    async function saveBlockEdit(blockId: number) {
        if (!page || !course) return;

        // Update local state
        const updated = courses.map(c => {
            if (c.id !== course.id) return c;

            return {
                ...c,
                pages: c.pages.map(p =>
                    p.id === page.id
                        ? {
                            ...p,
                            blocks: p.blocks.map(b =>
                                b.id === blockId
                                    ? { ...b, title: editTitle, content: editContent }
                                    : b
                            )
                        }
                        : p
                )
            };
        });

        setCourses(updated);
        setEditingBlockId(null);

        console.log(`Saved block ${blockId}:`, { title: editTitle, content: editContent });
    }

    // Cancel editing
    function cancelBlockEdit() {
        setEditingBlockId(null);
        setEditTitle("");
        setEditContent("");
    }


    function addBlock() {
        if (!page || !course) return;
        if (!newTitle.trim() || !newContent.trim()) return;

        const block = {
            id: Date.now(),
            title: newTitle,
            content: newContent
        };

        const updated = courses.map(c => {
            if (c.id !== course.id) return c;

            return {
                ...c,
                pages: c.pages.map(p =>
                    p.id === page.id
                        ? { ...p, blocks: [...p.blocks, block] }
                        : p
                )
            };
        });

        setCourses(updated);
        setNewTitle("");
        setNewContent("");
    }

    function deleteBlock(id: number) {
        if (!page || !course) return;

        const updated = courses.map(c => {
            if (c.id !== course.id) return c;

            return {
                ...c,
                pages: c.pages.map(p =>
                    p.id === page.id
                        ? { ...p, blocks: p.blocks.filter(b => b.id !== id) }
                        : p
                )
            };
        });

        setCourses(updated);
    }

    function addNewAssignment() {
        if (!course || !newAssignmentTitle.trim()) {
            alert("Please enter an assignment title.");
            return;
        }

        const newPage = {
            id: Date.now(),
            title: newAssignmentTitle,
            dueDate: newAssignmentDueDate || undefined,
            blocks: []
        };

        const updated = courses.map(c => {
            if (c.id !== course.id) return c;
            return {
                ...c,
                pages: [...c.pages, newPage]
            };
        });

        setCourses(updated);
        setNewAssignmentTitle("");
        setNewAssignmentDueDate("");
        setShowAddAssignmentModal(false);
        alert("Assignment created successfully!");
    }

    function addNewCourse() {
        if (!newCourseCode.trim() || !newCourseNumber.trim()) {
            alert("Please enter both course code and number.");
            return;
        }

        const courseTitle = `${newCourseCode.toUpperCase()} ${newCourseNumber}`;
        const newCourseId = Math.max(...courses.map(c => c.id)) + 1;

        const newCourse = {
            id: newCourseId,
            title: courseTitle,
            pages: Array.from({length: 10}, (_, i) => ({
                id: newCourseId * 100 + i + 1,
                title: `Assignment ${i + 1}: ${newCourseCode} Topic ${i + 1}`,
                blocks: [
                    { id: (newCourseId * 100 + i + 1) * 100 + 1, title: "Problem 1", content: `Complete ${newCourseCode} problem ${i + 1}.1` },
                    { id: (newCourseId * 100 + i + 1) * 100 + 2, title: "Problem 2", content: `Complete ${newCourseCode} problem ${i + 1}.2` }
                ]
            }))
        };

        setCourses([...courses, newCourse]);
        setAvailableCourses([...availableCourses, newCourseId]);
        setNewCourseCode("");
        setNewCourseNumber("");
        setShowAddCourseModal(false);
        alert(`Course ${courseTitle} created successfully with 10 assignments!`);
    }

    // Fetch submissions for current assignment
    async function fetchSubmissions() {
        if (!user || !selectedCourse || !selectedPage) return;

        try {
            const response = await fetch(
                `/api/submissions?courseId=${selectedCourse}&assignmentId=${selectedPage}&userId=${user.id}`
            );
            if (response.ok) {
                const data = await response.json();
                const submissionsMap: Record<number, any> = {};
                const answersMap: Record<number, string> = {};

                data.forEach((sub: any) => {
                    submissionsMap[sub.problem_id] = sub;
                    answersMap[sub.problem_id] = sub.answer;
                });

                setSubmissions(submissionsMap);
                setAnswers(answersMap);
            }
        } catch (error) {
            console.error("Error fetching submissions:", error);
        }
    }

    // Submit or update an answer
    async function submitAnswer(problemId: number) {
        if (!user || !selectedCourse || !selectedPage) return;

        const answer = answers[problemId];
        if (!answer || !answer.trim()) {
            alert("Please enter an answer before submitting.");
            return;
        }

        setSubmitting({ ...submitting, [problemId]: true });

        try {
            const response = await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId: selectedCourse,
                    assignmentId: selectedPage,
                    problemId,
                    answer,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setSubmissions({ ...submissions, [problemId]: data });
                alert("Answer submitted successfully!");
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || "Failed to submit answer"}`);
            }
        } catch (error) {
            console.error("Error submitting answer:", error);
            alert("Failed to submit answer. Please try again.");
        } finally {
            setSubmitting({ ...submitting, [problemId]: false });
        }
    }

    // Fetch submissions when page changes
    useEffect(() => {
        if (selectedPage && user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchSubmissions();
        }
    }, [selectedPage, user]); // eslint-disable-line react-hooks/exhaustive-deps

    // Show loading or redirect if not authenticated
    if (loading) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className={styles.wrapper}>
            {/* HEADER */}
            <header className={styles.header}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <h1>Courses</h1>
                    {isAdmin && (
                        <button
                            className={styles.addBtn}
                            onClick={() => setShowAddCourseModal(true)}
                            style={{ margin: 0, padding: "8px 16px", fontSize: "14px" }}
                        >
                            + Create New Course
                        </button>
                    )}
                </div>
            </header>

            {/* LAYOUT */}
            <div className={styles.container}>
                {/* LEFT SIDEBAR */}
                <aside className={`${styles.left} ${isSidebarCollapsed ? styles.leftCollapsed : ''}`}>
                    {/* Dropdown and Collapse Button Container */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                        <div style={{ flex: 1 }}>
                            <select
                                className={styles.select}
                                value={selectedCourse ?? ""}
                                onChange={(e) => {
                                    const id = Number(e.target.value);
                                    setSelectedCourse(id);
                                    setSelectedPage(null);
                                }}
                                disabled={loadingCourses}
                            >
                                <option value="">{loadingCourses ? "Loading courses..." : "Select Course..."}</option>
                                {courses
                                    .filter(c => availableCourses.includes(c.id))
                                    .map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.title}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        {/* Collapse Toggle Button */}
                        <button
                            className={styles.collapseBtn}
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            style={{ margin: 0 }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {isSidebarCollapsed ? (
                                    <polyline points="9 18 15 12 9 6" />
                                ) : (
                                    <polyline points="15 18 9 12 15 6" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Sections with Teachers */}
                    {course && courseSections.length > 0 && (
                        <div style={{ marginTop: "20px", padding: "10px", background: "var(--bg-secondary, #f5f5f5)", borderRadius: "8px" }}>
                            <h3 style={{ fontSize: "14px", marginBottom: "10px", color: "var(--text-primary)" }}>Sections (Classes)</h3>
                            {courseSections.map((section) => (
                                <div key={section.id} style={{ marginBottom: "12px", padding: "8px", background: "white", borderRadius: "6px" }}>
                                    <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "4px" }}>
                                        {section.title}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary, #666)" }}>
                                        {section.year} - {section.semester}
                                    </div>
                                    {section.teachers && section.teachers.length > 0 && (
                                        <div style={{ fontSize: "12px", marginTop: "4px", color: "var(--text-secondary, #666)" }}>
                                            Teacher: {section.teachers.map(t => t.user_profiles?.full_name || t.user_profiles?.email).join(", ")}
                                        </div>
                                    )}
                                    <button
                                        className={styles.announcementsBtn}
                                        onClick={() => {
                                            setSelectedSectionForAnnouncements(section);
                                            setShowAnnouncements(true);
                                        }}
                                        style={{
                                            marginTop: "8px",
                                            width: "100%",
                                            padding: "6px 12px",
                                            background: "#3b82f6",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "6px",
                                            position: "relative"
                                        }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        Announcements
                                        {announcementsUnreadCount[section.id] > 0 && (
                                            <span style={{
                                                position: "absolute",
                                                top: "-6px",
                                                right: "-6px",
                                                background: "#ef4444",
                                                color: "white",
                                                borderRadius: "10px",
                                                padding: "2px 6px",
                                                fontSize: "10px",
                                                fontWeight: "700",
                                                minWidth: "18px",
                                                textAlign: "center"
                                            }}>
                                                {announcementsUnreadCount[section.id]}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

{/* Pages with Drag and Drop */}
                    {course && (
                        <>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handlePageDragEnd}
                            >
                                <SortableContext
                                    items={course.pages.map(p => p.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <ul className={styles.pageList}>
                                        {course.pages.map(p => (
                                            <SortablePageItem
                                                key={p.id}
                                                page={p}
                                                isActive={selectedPage === p.id}
                                                onClick={() => setSelectedPage(p.id)}
                                                canEdit={canEdit}
                                            />
                                        ))}
                                    </ul>
                                </SortableContext>
                            </DndContext>
                            {/* Add Assignment Button - Teachers and Admin Only */}
                            {!isSidebarCollapsed && (isAdmin || isTeacher) && (
                                <button
                                    className={styles.addBtn}
                                    onClick={() => setShowAddAssignmentModal(true)}
                                    style={{ marginTop: "12px", width: "100%" }}
                                >
                                    + Add New Assignment
                                </button>
                            )}
                        </>
                    )}
                </aside>

                {/* RIGHT SIDE CONTENT */}
                <main className={styles.right}>
                    {!page && (
                        <div className={styles.placeholder}>
                            Select a course & a page.
                        </div>
                    )}

                    {page && (
                        <>
                            {/* Page Header with Navigation */}
                            <div className={styles.pageHeader}>
                                <button
                                    className={`${styles.navArrow} ${!hasPrevPage ? styles.navDisabled : ""}`}
                                    onClick={goToPrevPage}
                                    disabled={!hasPrevPage}
                                    title="Previous Page"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                </button>
                                <h2 className={styles.pageTitle}>{page.title}</h2>
                                <button
                                    className={`${styles.navArrow} ${!hasNextPage ? styles.navDisabled : ""}`}
                                    onClick={goToNextPage}
                                    disabled={!hasNextPage}
                                    title="Next Page"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            </div>
                            <div className={styles.pageIndicator}>
                                Page {currentPageIndex + 1} of {course?.pages.length}
                                {(page as any).dueDate && (
                                    <span style={{ marginLeft: "16px", color: new Date((page as any).dueDate) < new Date() ? "#ef4444" : "#059669", fontWeight: "500" }}>
                                        • Due: {new Date((page as any).dueDate).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}
                                        {new Date((page as any).dueDate) < new Date() && " (Past Due)"}
                                    </span>
                                )}
                            </div>

{/* BLOCKS with Drag and Drop */}
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleBlockDragEnd}
                            >
                                <SortableContext
                                    items={page.blocks.map(b => b.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className={styles.blocks}>
                                        {page.blocks.map((b) => (
                                            <SortableBlockItem
                                                key={b.id}
                                                block={b}
                                                canEdit={canEdit}
                                                isEditing={editingBlockId === b.id}
                                                onEdit={() => startEditBlock(b)}
                                                onSave={() => saveBlockEdit(b.id)}
                                                onCancel={cancelBlockEdit}
                                                onDelete={() => deleteBlock(b.id)}
                                                editTitle={editTitle}
                                                editContent={editContent}
                                                setEditTitle={setEditTitle}
                                                setEditContent={setEditContent}
                                                onSubmitAnswer={submitAnswer}
                                                answers={answers}
                                                setAnswers={setAnswers}
                                                submissions={submissions}
                                                submitting={submitting}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>


                            {/* ADD BLOCK - Admin and Teachers */}
                            {canEdit && (
                                <div className={styles.addBlock}>
                                    <h3>Add Problem</h3>
                                    <input
                                        className={styles.input}
                                        placeholder="Problem title"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                    />
                                    <textarea
                                        className={styles.textarea}
                                        placeholder="Problem description"
                                        value={newContent}
                                        onChange={(e) => setNewContent(e.target.value)}
                                    />
                                    <button className={styles.addBtn} onClick={addBlock}>
                                        Add Problem
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* Announcements Modal */}
            {showAnnouncements && selectedSectionForAnnouncements && (
                <Announcements
                    sectionId={selectedSectionForAnnouncements.id}
                    sectionTitle={`${course?.title} - ${selectedSectionForAnnouncements.title}`}
                    onClose={() => setShowAnnouncements(false)}
                />
            )}

            {/* Add Assignment Modal */}
            {showAddAssignmentModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000
                    }}
                    onClick={() => setShowAddAssignmentModal(false)}
                >
                    <div
                        style={{
                            background: "white",
                            padding: "32px",
                            borderRadius: "12px",
                            maxWidth: "500px",
                            width: "90%",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "20px", fontWeight: "600" }}>
                            Create New Assignment
                        </h3>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                                Assignment Title:
                            </label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="e.g., Assignment 11: Advanced Topics"
                                value={newAssignmentTitle}
                                onChange={(e) => setNewAssignmentTitle(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </div>
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                                Due Date (optional):
                            </label>
                            <input
                                type="datetime-local"
                                className={styles.input}
                                value={newAssignmentDueDate}
                                onChange={(e) => setNewAssignmentDueDate(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </div>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => {
                                    setShowAddAssignmentModal(false);
                                    setNewAssignmentTitle("");
                                    setNewAssignmentDueDate("");
                                }}
                                style={{
                                    padding: "10px 20px",
                                    borderRadius: "8px",
                                    border: "1px solid #d1d5db",
                                    background: "white",
                                    color: "#374151",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addNewAssignment}
                                className={styles.addBtn}
                                style={{ margin: 0 }}
                            >
                                Create Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Course Modal */}
            {showAddCourseModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000
                    }}
                    onClick={() => setShowAddCourseModal(false)}
                >
                    <div
                        style={{
                            background: "white",
                            padding: "32px",
                            borderRadius: "12px",
                            maxWidth: "500px",
                            width: "90%",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "20px", fontWeight: "600" }}>
                            Create New Course
                        </h3>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                                Course Code:
                            </label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="e.g., MATH, CSC, BIO"
                                value={newCourseCode}
                                onChange={(e) => setNewCourseCode(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </div>
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                                Course Number:
                            </label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="e.g., 101, 201, 350"
                                value={newCourseNumber}
                                onChange={(e) => setNewCourseNumber(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </div>
                        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px", fontStyle: "italic" }}>
                            The course will be created with 10 default assignments.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => {
                                    setShowAddCourseModal(false);
                                    setNewCourseCode("");
                                    setNewCourseNumber("");
                                }}
                                style={{
                                    padding: "10px 20px",
                                    borderRadius: "8px",
                                    border: "1px solid #d1d5db",
                                    background: "white",
                                    color: "#374151",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addNewCourse}
                                className={styles.addBtn}
                                style={{ margin: 0 }}
                            >
                                Create Course
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
