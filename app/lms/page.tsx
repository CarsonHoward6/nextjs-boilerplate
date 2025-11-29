"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./lms.module.css";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabase";
import Announcements from "@/app/components/Announcements";

// --- Mock data (replace with API later) ---
const initialCourses = [
        {
            id: 1,
            title: "Biology",
            pages: [
                { id: 11, title: "Cells", blocks: [
                    { id: 1101, title: "Introduction to Cells", content: "Cells are the basic structural and functional units of all living organisms. They are often called the building blocks of life. All cells share certain characteristics: they are bounded by a plasma membrane, contain cytoplasm, and have DNA as their genetic material." },
                    { id: 1102, title: "Cell Types", content: "There are two main types of cells: prokaryotic and eukaryotic. Prokaryotic cells lack a nucleus and membrane-bound organelles, while eukaryotic cells have a true nucleus and specialized organelles like mitochondria and endoplasmic reticulum." }
                ]},
                { id: 12, title: "Genetics", blocks: [
                    { id: 1201, title: "DNA and Heredity", content: "Genetics is the study of heredity and variation in organisms. DNA (deoxyribonucleic acid) carries the genetic instructions for the development, functioning, and reproduction of all known living organisms." },
                    { id: 1202, title: "Mendelian Inheritance", content: "Gregor Mendel established the fundamental laws of inheritance through his experiments with pea plants. His principles include the Law of Segregation and the Law of Independent Assortment." }
                ]},
                { id: 13, title: "Evolution", blocks: [
                    { id: 1301, title: "Natural Selection", content: "Evolution by natural selection is the process by which organisms with favorable traits are more likely to survive and reproduce. Over time, this leads to changes in the characteristics of populations." },
                    { id: 1302, title: "Evidence for Evolution", content: "Evidence for evolution comes from many sources including fossil records, comparative anatomy, molecular biology, and direct observation of evolutionary change in populations." }
                ]},
                { id: 14, title: "Ecology", blocks: [
                    { id: 1401, title: "Ecosystems", content: "Ecology is the study of interactions between organisms and their environment. Ecosystems include all living things in a given area, interacting with each other and with their non-living environments." },
                    { id: 1402, title: "Food Webs", content: "Energy flows through ecosystems via food webs. Producers (plants) capture energy from sunlight, which is then transferred to consumers (herbivores and carnivores) and decomposers." }
                ]},
                { id: 15, title: "Human Anatomy", blocks: [
                    { id: 1501, title: "Body Systems", content: "The human body consists of multiple organ systems working together. Major systems include the circulatory, respiratory, digestive, nervous, and musculoskeletal systems." },
                    { id: 1502, title: "Homeostasis", content: "Homeostasis is the body's ability to maintain a stable internal environment despite changes in external conditions. This includes regulating temperature, pH, blood sugar, and other vital parameters." }
                ]},
            ]
        },
        {
            id: 2,
            title: "Algebra",
            pages: [
                { id: 21, title: "Linear Equations", blocks: [
                    { id: 2101, title: "Understanding Linear Equations", content: "A linear equation is an equation where the highest power of the variable is 1. The standard form is ax + b = c, where a, b, and c are constants. Linear equations graph as straight lines." },
                    { id: 2102, title: "Solving Linear Equations", content: "To solve linear equations, isolate the variable by performing the same operations on both sides. Use inverse operations: addition/subtraction and multiplication/division to simplify." }
                ]},
                { id: 22, title: "Quadratics", blocks: [
                    { id: 2201, title: "Quadratic Equations", content: "Quadratic equations have the form ax² + bx + c = 0, where a ≠ 0. They can have two, one, or no real solutions. The graph of a quadratic function is a parabola." },
                    { id: 2202, title: "Solving Methods", content: "Quadratic equations can be solved by factoring, completing the square, or using the quadratic formula: x = (-b ± √(b²-4ac)) / 2a. The discriminant (b²-4ac) determines the nature of solutions." }
                ]},
                { id: 23, title: "Polynomials", blocks: [
                    { id: 2301, title: "Polynomial Basics", content: "A polynomial is an expression consisting of variables and coefficients, combined using addition, subtraction, and multiplication. The degree of a polynomial is the highest power of the variable." },
                    { id: 2302, title: "Operations with Polynomials", content: "Polynomials can be added, subtracted, and multiplied. Factoring polynomials involves breaking them down into simpler expressions that multiply together to give the original polynomial." }
                ]},
                { id: 24, title: "Inequalities", blocks: [
                    { id: 2401, title: "Understanding Inequalities", content: "Inequalities compare two expressions using symbols: < (less than), > (greater than), ≤ (less than or equal), ≥ (greater than or equal). Solutions are often ranges of values." },
                    { id: 2402, title: "Solving Inequalities", content: "Solve inequalities like equations, but remember to flip the inequality sign when multiplying or dividing by a negative number. Graph solutions on a number line." }
                ]},
                { id: 25, title: "Functions", blocks: [
                    { id: 2501, title: "What is a Function?", content: "A function is a relation where each input has exactly one output. Functions are often written as f(x), where x is the input and f(x) is the output. The domain is all valid inputs; the range is all possible outputs." },
                    { id: 2502, title: "Types of Functions", content: "Common function types include linear (f(x) = mx + b), quadratic (f(x) = ax² + bx + c), exponential (f(x) = aˣ), and logarithmic functions. Each has unique properties and graph shapes." }
                ]},
            ]
        },
        {
            id: 3,
            title: "Chemistry",
            pages: [
                { id: 31, title: "Atomic Structure", blocks: [
                    { id: 3101, title: "The Atom", content: "Atoms are the smallest units of matter that retain the properties of an element. They consist of a nucleus containing protons and neutrons, surrounded by electrons in orbitals." },
                    { id: 3102, title: "Electron Configuration", content: "Electrons occupy energy levels and orbitals around the nucleus. The arrangement of electrons determines an element's chemical properties and its position in the periodic table." }
                ]},
                { id: 32, title: "Chemical Bonding", blocks: [
                    { id: 3201, title: "Types of Bonds", content: "Chemical bonds hold atoms together. Ionic bonds form when electrons are transferred between atoms. Covalent bonds form when atoms share electrons. Metallic bonds occur in metals where electrons are delocalized." },
                    { id: 3202, title: "Molecular Geometry", content: "The shape of molecules is determined by electron pair repulsion (VSEPR theory). Common geometries include linear, trigonal planar, tetrahedral, and octahedral arrangements." }
                ]},
                { id: 33, title: "Periodic Table", blocks: [
                    { id: 3301, title: "Organization", content: "The periodic table organizes elements by increasing atomic number. Elements in the same column (group) have similar properties. Rows (periods) represent increasing energy levels." },
                    { id: 3302, title: "Periodic Trends", content: "Properties like atomic radius, ionization energy, and electronegativity follow predictable patterns across the periodic table. These trends help predict element behavior." }
                ]},
                { id: 34, title: "Reactions", blocks: [
                    { id: 3401, title: "Types of Reactions", content: "Chemical reactions include synthesis (combining), decomposition (breaking apart), single replacement, double replacement, and combustion. Each follows specific patterns." },
                    { id: 3402, title: "Balancing Equations", content: "Chemical equations must be balanced to satisfy the law of conservation of mass. The number of atoms of each element must be equal on both sides of the equation." }
                ]},
                { id: 35, title: "Organic Chemistry", blocks: [
                    { id: 3501, title: "Carbon Compounds", content: "Organic chemistry studies carbon-containing compounds. Carbon's ability to form four bonds and create chains and rings makes it the basis for an enormous variety of molecules." },
                    { id: 3502, title: "Functional Groups", content: "Functional groups are specific arrangements of atoms that give organic molecules characteristic properties. Examples include alcohols (-OH), carboxylic acids (-COOH), and amines (-NH₂)." }
                ]},
            ]
        },
        {
            id: 4,
            title: "Physics",
            pages: [
                { id: 41, title: "Mechanics", blocks: [
                    { id: 4101, title: "Newton's Laws", content: "Newton's three laws describe motion: 1) Objects remain at rest or in uniform motion unless acted upon by a force. 2) F = ma (force equals mass times acceleration). 3) Every action has an equal and opposite reaction." },
                    { id: 4102, title: "Energy and Work", content: "Work is done when a force moves an object. Energy is the capacity to do work. Kinetic energy is energy of motion; potential energy is stored energy. Energy is conserved in closed systems." }
                ]},
                { id: 42, title: "Thermodynamics", blocks: [
                    { id: 4201, title: "Heat and Temperature", content: "Temperature measures the average kinetic energy of particles. Heat is the transfer of thermal energy between objects. Heat flows from hot to cold until thermal equilibrium is reached." },
                    { id: 4202, title: "Laws of Thermodynamics", content: "The first law states energy is conserved. The second law states entropy (disorder) always increases in isolated systems. The third law states absolute zero cannot be reached." }
                ]},
                { id: 43, title: "Waves & Optics", blocks: [
                    { id: 4301, title: "Wave Properties", content: "Waves transfer energy without transferring matter. Key properties include wavelength, frequency, amplitude, and speed. Waves can be transverse (like light) or longitudinal (like sound)." },
                    { id: 4302, title: "Light and Optics", content: "Light behaves as both a wave and a particle. Reflection, refraction, and diffraction are wave behaviors. Lenses and mirrors manipulate light for applications like microscopes and telescopes." }
                ]},
                { id: 44, title: "Electricity", blocks: [
                    { id: 4401, title: "Electric Charge and Current", content: "Electric charge is a fundamental property of matter. Current is the flow of charge through a conductor. Voltage is the potential difference that drives current. Resistance opposes current flow." },
                    { id: 4402, title: "Circuits", content: "Electric circuits provide paths for current flow. Ohm's Law (V = IR) relates voltage, current, and resistance. Circuits can be series (one path) or parallel (multiple paths)." }
                ]},
                { id: 45, title: "Magnetism", blocks: [
                    { id: 4501, title: "Magnetic Fields", content: "Magnets have north and south poles. Like poles repel; opposite poles attract. Magnetic fields surround magnets and can be visualized using field lines running from north to south." },
                    { id: 4502, title: "Electromagnetism", content: "Electric currents create magnetic fields. This relationship is the basis for electromagnets, electric motors, and generators. Changing magnetic fields induce electric currents (electromagnetic induction)." }
                ]},
            ]
        },
        {
            id: 5,
            title: "History",
            pages: [
                { id: 51, title: "Ancient Civilizations", blocks: [
                    { id: 5101, title: "Mesopotamia and Egypt", content: "The earliest civilizations arose in river valleys. Mesopotamia (between the Tigris and Euphrates) developed writing, law codes, and city-states. Ancient Egypt built pyramids and developed hieroglyphics along the Nile." },
                    { id: 5102, title: "Greece and Rome", content: "Ancient Greece gave us democracy, philosophy, and classical art. Rome built a vast empire with advanced engineering, law, and governance systems that influenced Western civilization for millennia." }
                ]},
                { id: 52, title: "Medieval Period", blocks: [
                    { id: 5201, title: "Feudalism", content: "The medieval period (500-1500 CE) was characterized by feudalism, a hierarchical system of land ownership and obligations. Kings granted land to lords, who provided military service and governed peasants." },
                    { id: 5202, title: "The Church and Crusades", content: "The Catholic Church was the dominant institution in medieval Europe. The Crusades (1095-1291) were religious wars to capture the Holy Land, resulting in cultural exchange between East and West." }
                ]},
                { id: 53, title: "Renaissance", blocks: [
                    { id: 5301, title: "Rebirth of Learning", content: "The Renaissance (14th-17th century) was a cultural rebirth beginning in Italy. It emphasized humanism, classical learning, and artistic innovation. Artists like Leonardo da Vinci and Michelangelo transformed art." },
                    { id: 5302, title: "Scientific Revolution", content: "The Scientific Revolution challenged traditional views of the natural world. Copernicus, Galileo, and Newton developed new methods of inquiry and discoveries that laid the foundation for modern science." }
                ]},
                { id: 54, title: "Modern History", blocks: [
                    { id: 5401, title: "Industrial Revolution", content: "The Industrial Revolution (1760-1840) transformed society from agricultural to industrial. New machines, factories, and transportation systems changed how people lived and worked." },
                    { id: 5402, title: "Age of Revolutions", content: "The American Revolution (1776) and French Revolution (1789) spread ideas of liberty, equality, and democracy. These upheavals reshaped governments and inspired movements worldwide." }
                ]},
                { id: 55, title: "World Wars", blocks: [
                    { id: 5501, title: "World War I", content: "World War I (1914-1918) was triggered by the assassination of Archduke Franz Ferdinand. It introduced trench warfare, new weapons, and resulted in millions of casualties and the redrawing of European borders." },
                    { id: 5502, title: "World War II", content: "World War II (1939-1945) was the deadliest conflict in history. It arose from fascism, territorial aggression, and unresolved WWI issues. The Holocaust killed six million Jews. The war ended with atomic bombs and the emergence of the US and USSR as superpowers." }
                ]},
            ]
        },
        {
            id: 6,
            title: "Computer Science",
            pages: [
                { id: 61, title: "Programming Basics", blocks: [
                    { id: 6101, title: "What is Programming?", content: "Programming is writing instructions for computers to execute. Programs are written in programming languages like Python, JavaScript, or Java. Code is translated into machine language that computers understand." },
                    { id: 6102, title: "Variables and Control Flow", content: "Variables store data that can be used and modified. Control flow structures like if/else statements and loops (for, while) determine which code executes and how many times." }
                ]},
                { id: 62, title: "Data Structures", blocks: [
                    { id: 6201, title: "Arrays and Lists", content: "Data structures organize and store data efficiently. Arrays store elements in contiguous memory locations. Lists are more flexible, allowing dynamic sizing and various operations like insertion and deletion." },
                    { id: 6202, title: "Trees and Graphs", content: "Trees are hierarchical structures with nodes connected by edges. Binary trees have at most two children per node. Graphs represent networks with vertices and edges, useful for modeling relationships." }
                ]},
                { id: 63, title: "Algorithms", blocks: [
                    { id: 6301, title: "Searching and Sorting", content: "Algorithms are step-by-step procedures for solving problems. Searching algorithms (linear, binary) find elements. Sorting algorithms (bubble, merge, quick) arrange data in order." },
                    { id: 6302, title: "Algorithm Complexity", content: "Big O notation describes algorithm efficiency. O(1) is constant time, O(n) is linear, O(n²) is quadratic, O(log n) is logarithmic. Efficient algorithms are crucial for handling large datasets." }
                ]},
                { id: 64, title: "Databases", blocks: [
                    { id: 6401, title: "Relational Databases", content: "Databases store and organize data. Relational databases use tables with rows and columns. SQL (Structured Query Language) is used to create, read, update, and delete data." },
                    { id: 6402, title: "NoSQL Databases", content: "NoSQL databases offer alternatives to relational models. Document databases store JSON-like documents. Key-value stores are simple and fast. Graph databases excel at relationship-heavy data." }
                ]},
                { id: 65, title: "Web Development", blocks: [
                    { id: 6501, title: "Frontend Development", content: "Frontend development creates what users see and interact with. HTML structures content, CSS styles it, and JavaScript adds interactivity. Modern frameworks like React and Vue simplify complex UIs." },
                    { id: 6502, title: "Backend Development", content: "Backend development handles server-side logic, databases, and APIs. Languages like Node.js, Python, and Java power backends. RESTful APIs and GraphQL enable communication between frontend and backend." }
                ]},
            ]
        }
];

export default function LMSPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState(initialCourses);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [selectedPage, setSelectedPage] = useState<number | null>(null);
    const [userSections, setUserSections] = useState<any[]>([]);
    const [availableCourses, setAvailableCourses] = useState<number[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");

    const [showAnnouncements, setShowAnnouncements] = useState(false);
    const [selectedSectionForAnnouncements, setSelectedSectionForAnnouncements] = useState<any>(null);
    const [announcementsUnreadCount, setAnnouncementsUnreadCount] = useState<Record<string, number>>({});

    const ADMIN_EMAIL = "carsonhoward6@gmail.com";
    const isAdmin = user?.email === ADMIN_EMAIL;

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    // Fetch user's assigned sections/classes
    useEffect(() => {
        if (user && !loading) {
            fetchUserSections();
        }
    }, [user, loading]);

    async function fetchUserSections() {
        if (!user) return;

        setLoadingCourses(true);

        // Admin sees all courses
        if (isAdmin) {
            setAvailableCourses([1, 2, 3, 4, 5, 6]);

            // Fetch all sections with teachers for admin
            const { data: allSections } = await supabase
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
                .eq("role", "teacher");

            if (allSections) {
                setUserSections(allSections);
            }

            setLoadingCourses(false);
            return;
        }

        // Fetch user's assigned sections with course and teacher info
        const { data: sectionsData } = await supabase
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
            .eq("user_id", user.id);

        if (sectionsData) {
            setUserSections(sectionsData);

            // Extract unique course IDs from assigned sections
            const courseIds = [...new Set(
                sectionsData
                    .filter(s => s.section)
                    .map(s => parseInt(s.section.course_id))
            )];

            setAvailableCourses(courseIds);
        }

        setLoadingCourses(false);
    }

    // Get sections for selected course with teacher info
    async function getSectionsForCourse(courseId: number) {
        if (!courseId) return [];

        // Get all sections for this course with teachers
        const { data: sections } = await supabase
            .from("section")
            .select("id, title, year, semester")
            .eq("course_id", courseId.toString());

        if (!sections) return [];

        // Get teachers for each section
        const sectionsWithTeachers = await Promise.all(
            sections.map(async (section) => {
                const { data: teachers } = await supabase
                    .from("user_sections")
                    .select(`
                        user_id,
                        user_profiles:user_id (
                            full_name,
                            email
                        )
                    `)
                    .eq("section_id", section.id)
                    .eq("role", "teacher");

                return {
                    ...section,
                    teachers: teachers || []
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
    }

    // Get sections for current course
    const [courseSections, setCourseSections] = useState<any[]>([]);

    useEffect(() => {
        if (selectedCourse) {
            getSectionsForCourse(selectedCourse).then(setCourseSections);
        } else {
            setCourseSections([]);
        }
    }, [selectedCourse, userSections]);

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

    function addBlock() {
        if (!page) return;
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
        if (!page) return;

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
                <h1>Courses</h1>
            </header>

            {/* LAYOUT */}
            <div className={styles.container}>
                {/* LEFT SIDEBAR */}
                <aside className={styles.left}>
                    <div className={styles.dropdown}>
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
                                            Teacher: {section.teachers.map((t: any) => t.user_profiles?.full_name || t.user_profiles?.email).join(", ")}
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

                    {/* Pages */}
                    {course && (
                        <ul className={styles.pageList}>
                            {course.pages.map(p => (
                                <li
                                    key={p.id}
                                    className={`${styles.pageItem} ${selectedPage === p.id ? styles.activePage : ""}`}
                                    onClick={() => setSelectedPage(p.id)}
                                >
                                    {p.title}
                                </li>
                            ))}
                        </ul>
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
                            </div>

                            {/* BLOCKS */}
                            <div className={styles.blocks}>
                                {page.blocks.map((b) => (
                                    <div className={styles.block} key={b.id}>
                                        <div className={styles.blockHeader}>
                                            <h3>{b.title}</h3>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => deleteBlock(b.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        <p>{b.content}</p>
                                    </div>
                                ))}
                            </div>

                            {/* ADD BLOCK */}
                            <div className={styles.addBlock}>
                                <h3>Add Block</h3>
                                <input
                                    className={styles.input}
                                    placeholder="Block title"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                />
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Block paragraph"
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                />
                                <button className={styles.addBtn} onClick={addBlock}>
                                    Add Block
                                </button>
                            </div>
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
        </div>
    );
}
