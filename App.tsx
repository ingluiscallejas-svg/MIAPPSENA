
import React, { useState, useEffect } from 'react';
import { InstructorView } from './components/instructor/InstructorView';
import { ApprenticeView } from './components/apprentice/ApprenticeView';
import { CoordinatorView, CoordinatorState } from './components/coordinator/CoordinatorView'; // NEW IMPORT
import { LoginView } from './components/auth/LoginView'; 
import { Apprentice, Ficha, FichaDocument, GuideSubmission, Announcement, Competency, CompetencyResult, AttendanceRecord } from './types';
import { MOCK_COMPETENCIES, MOCK_FICHAS } from './constants';
import { fetchFichasFromSheet, createFichaInSheet, saveAttendanceToSheet } from './services/googleSheetService';

const initialCoordinatorState: CoordinatorState = {
    step: 'SELECT_VIEW',
    deviceMode: 'DESKTOP',
    selectedInstructorId: null
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'instructor' | 'apprentice' | 'coordinator' | 'login'>('login'); // Added 'coordinator'
  const [viewerRole, setViewerRole] = useState<'instructor' | 'apprentice' | 'coordinator' | 'guest'>('guest'); // Added 'coordinator'
  const [selectedApprentice, setSelectedApprentice] = useState<Apprentice | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Coordinator Persistent State
  const [coordinatorState, setCoordinatorState] = useState<CoordinatorState>(initialCoordinatorState);

  // Auth State
  const [authError, setAuthError] = useState<string | null>(null);

  // State for managing multiple Fichas
  const [fichas, setFichas] = useState<Ficha[]>(MOCK_FICHAS);
  const [currentFichaId, setCurrentFichaId] = useState<string>(MOCK_FICHAS[0].id);

  // NEW: Store all raw evaluations to build dynamic views later
  const [allEvaluations, setAllEvaluations] = useState<any[][]>([]);
  // NEW: State for the specific competencies of the selected student
  const [selectedApprenticeCompetencies, setSelectedApprenticeCompetencies] = useState<Competency[]>([]);

  // Load Data from Google Sheets on Start
  useEffect(() => {
    const loadData = async () => {
        setIsLoadingData(true);
        const result = await fetchFichasFromSheet();
        
        if (result.status === 'success' && result.data) {
            const rawFichas = result.data.fichas;
            const rawApprentices = result.data.aprendices;
            const rawEvaluaciones = result.data.evaluaciones || [];
            const rawAsistencia = result.data.asistencia || [];
            
            // Store raw evaluations for detailed view generation
            setAllEvaluations(rawEvaluaciones);

            const newFichas: Ficha[] = [];

            // 1. Process Fichas from Sheet
            rawFichas.forEach((row, index) => {
                const fichaId = String(row[0]); 
                newFichas.push({
                    id: fichaId,
                    number: String(row[0]),
                    program: String(row[1]),
                    startDate: row[5] ? String(row[5]) : undefined, 
                    endDate: row[6] ? String(row[6]) : undefined,  
                    apprentices: [], 
                    documents: [],
                    attendanceHistory: [], 
                    visible: true 
                });
            });

            // 2. Process Attendance History
            const attendanceMap = new Map<string, AttendanceRecord[]>();
            
            rawAsistencia.forEach(row => {
                try {
                    let dateStr = String(row[0]);
                    if (dateStr.startsWith("'")) dateStr = dateStr.substring(1);
                    
                    // Simple Date Clean Up
                    if (dateStr.length > 10 && dateStr.includes('-')) dateStr = dateStr.substring(0, 10);

                    const fichaId = String(row[1]);
                    const evidenceUrl = String(row[3]);
                    const recordsJson = String(row[4]);
                    
                    const records = JSON.parse(recordsJson);
                    
                    if (!attendanceMap.has(fichaId)) attendanceMap.set(fichaId, []);
                    attendanceMap.get(fichaId)?.push({
                        date: dateStr,
                        evidenceUrl: evidenceUrl && evidenceUrl.startsWith('http') ? evidenceUrl : undefined,
                        records: records
                    });
                } catch (e) {
                    console.error("Error parsing attendance row", row, e);
                }
            });

            // 3. Process Apprentices and Assign to Fichas
            rawApprentices.forEach((row) => {
                const fichaId = String(row[6]);
                const docId = String(row[1]);
                const targetFicha = newFichas.find(f => f.id === fichaId);
                
                if (targetFicha) {
                    // CALCULAR ESTADISTICAS REALES
                    const apprenticeEvals = rawEvaluaciones.filter(ev => String(ev[1]) === docId);
                    
                    // Deduplicar RAPs para estadística
                    const uniqueRaps = new Map<string, boolean>();

                    apprenticeEvals.forEach(ev => {
                        const compName = String(ev[2]).trim();
                        const rapName = String(ev[3]).trim();
                        const status = String(ev[4]).toUpperCase().trim();
                        
                        const uniqueKey = `${compName}|${rapName}`;
                        const isApproved = status === 'APROBADO';

                        if (!uniqueRaps.has(uniqueKey)) {
                            uniqueRaps.set(uniqueKey, isApproved);
                        } else {
                            if (isApproved) {
                                uniqueRaps.set(uniqueKey, true);
                            }
                        }
                    });

                    const totalCompetencies = uniqueRaps.size;
                    const approvedCompetencies = Array.from(uniqueRaps.values()).filter(isApproved => isApproved).length;
                    const progressPercentage = totalCompetencies > 0 ? Math.round((approvedCompetencies / totalCompetencies) * 100) : 0;

                    targetFicha.apprentices.push({
                        id: docId, 
                        documentType: String(row[0]),
                        documentNumber: docId,
                        expeditionCity: '',
                        fullName: String(row[4]),
                        initials: String(row[4]).split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
                        status: String(row[5]) as any,
                        approvedCompetencies: approvedCompetencies,
                        totalCompetencies: totalCompetencies > 0 ? totalCompetencies : 1,
                        progressPercentage: progressPercentage
                    });
                }
            });

            if (newFichas.length > 0) {
                const mergedFichas = newFichas.map(nf => {
                    const mock = MOCK_FICHAS.find(m => m.number === nf.number);
                    const history = attendanceMap.get(nf.id) || [];
                    if (mock) {
                        return { 
                          ...nf, 
                          documents: mock.documents, 
                          attendanceHistory: history,
                          startDate: nf.startDate || mock.startDate, 
                          endDate: nf.endDate || mock.endDate 
                        };
                    }
                    return { ...nf, attendanceHistory: history };
                });
                
                setFichas(mergedFichas);
                setCurrentFichaId(mergedFichas[0].id);
            }
        }
        setIsLoadingData(false);
    };

    loadData();
  }, []);

  // State for Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: '1', title: 'Reunión de Padres', description: 'Próximo viernes 2:00 PM - Auditorio', type: 'INFO', date: '2024-05-20' },
    { id: '2', title: 'Entrega Pendiente', description: 'Guía 2 de SQL vence mañana.', type: 'ALERT', date: '2024-05-21' }
  ]);

  const currentFicha = fichas.find(f => f.id === currentFichaId) || fichas[0];

  // Helper function to build detailed competencies from flat sheet data
  const buildCompetenciesForApprentice = (docNumber: string): Competency[] => {
      // Filter evaluations for this student
      const studentEvals = allEvaluations.filter(row => String(row[1]) === docNumber);
      
      if (studentEvals.length === 0) return []; // Return empty if no data (or use MOCK if preferred fallback)

      const compMap = new Map<string, Competency>();

      studentEvals.forEach((row) => {
          const compName = String(row[2]).trim(); // Competencia
          const rapName = String(row[3]).trim();  // RAP
          const statusRaw = String(row[4]).toUpperCase().trim(); // Juicio
          const status: 'APROBADO' | 'POR EVALUAR' = statusRaw === 'APROBADO' ? 'APROBADO' : 'POR EVALUAR';

          const compNumberMatch = compName.match(/^\d+/);
          const compNumber = compNumberMatch ? compNumberMatch[0] : 'GEN';

          const rapCodeMatch = rapName.match(/RAP\s*\d+/i);
          const rapCode = rapCodeMatch ? rapCodeMatch[0].toUpperCase() : 'RAP';

          if (!compMap.has(compName)) {
              compMap.set(compName, {
                  id: compName, // Use name as ID
                  number: compNumber.substring(0, 2), // Just take first 2 digits for display
                  title: compName,
                  resultsCount: 0,
                  results: []
              });
          }

          const comp = compMap.get(compName)!;
          const existingResultIndex = comp.results.findIndex(r => r.description === rapName);

          if (existingResultIndex === -1) {
              comp.results.push({
                  id: `${compName}-${rapName}`,
                  code: rapCode,
                  description: rapName,
                  status: status
              });
              comp.resultsCount++;
          } else {
              if (status === 'APROBADO') {
                  comp.results[existingResultIndex].status = 'APROBADO';
              }
          }
      });

      return Array.from(compMap.values());
  };

  const handleLogin = (user: string, pass: string) => {
      setAuthError(null);

      // 1. Check Instructor Login
      if (user === 'INSTRUCTOR2026' && pass === 'INSTRUCTOR2026') {
          setViewerRole('instructor');
          setCurrentView('instructor');
          return;
      }
      
      // 2. Check Coordinator Login
      if (user === 'COORDINADOR2026' && pass === 'COORDINADOR2026') {
          setViewerRole('coordinator');
          setCurrentView('coordinator');
          return;
      }

      // 3. Check Apprentice Login
      // Iterate through all Fichas to find the apprentice
      let foundApprentice: Apprentice | null = null;
      let foundFichaId: string | null = null;

      for (const ficha of fichas) {
          const app = ficha.apprentices.find(a => a.documentNumber === user);
          if (app) {
              if (pass === app.documentNumber) {
                  foundApprentice = app;
                  foundFichaId = ficha.id;
              }
              break; // Found user, stop searching
          }
      }

      if (foundApprentice && foundFichaId) {
          setCurrentFichaId(foundFichaId); // Set context to their Ficha
          handleSelectApprentice(foundApprentice, 'apprentice');
          // handleSelectApprentice sets currentView to 'apprentice' automatically
          return;
      }

      // 4. Login Failed
      setAuthError('Credenciales inválidas. Verifique su usuario y contraseña.');
  };

  const handleLogout = () => {
      setViewerRole('guest');
      setCurrentView('login');
      setSelectedApprentice(null);
      setSelectedApprenticeCompetencies([]);
      setCoordinatorState(initialCoordinatorState); // Reset Coordinator State
      setAuthError(null);
  };

  const handleSelectApprentice = (apprentice: Apprentice, role: 'instructor' | 'apprentice' = 'instructor') => {
    setSelectedApprentice(apprentice);
    
    // FIX: If a coordinator is inspecting (role passed as 'instructor'), 
    // keep the viewerRole as 'coordinator' so the Back button knows where to return.
    if (viewerRole === 'coordinator' && role === 'instructor') {
        setViewerRole('coordinator');
    } else {
        setViewerRole(role); 
    }
    
    // BUILD DYNAMIC COMPETENCIES LIST
    const dynamicComps = buildCompetenciesForApprentice(apprentice.documentNumber);
    setSelectedApprenticeCompetencies(dynamicComps.length > 0 ? dynamicComps : []);
    
    setCurrentView('apprentice');
  };

  const handleBack = () => {
    if (viewerRole === 'apprentice') {
        // If logged in as apprentice, back means logout
        handleLogout();
    } else if (viewerRole === 'coordinator') {
        setCurrentView('coordinator');
        setSelectedApprentice(null);
        setSelectedApprenticeCompetencies([]);
    } else {
        // If instructor viewing apprentice, go back to dashboard
        setCurrentView('instructor');
        setSelectedApprentice(null);
        setViewerRole('instructor');
        setSelectedApprenticeCompetencies([]); // Clear
    }
  };

  const handleUpdateApprentices = (fichaId: string, list: Apprentice[]) => {
    setFichas(prevFichas => 
      prevFichas.map(f => f.id === fichaId ? { ...f, apprentices: list } : f)
    );
  };

  const handleAddDocument = (fichaId: string, doc: FichaDocument) => {
    setFichas(prevFichas =>
        prevFichas.map(f => f.id === fichaId ? { ...f, documents: [doc, ...f.documents] } : f)
    );
  };

  const handleSelectFicha = (id: string) => {
    setCurrentFichaId(id);
  };

  const handleCreateFicha = async (number: string, program: string, instructor: string) => {
    // Optimistic UI update
    const newFicha: Ficha = {
      id: number,
      number,
      program,
      apprentices: [],
      documents: [],
      attendanceHistory: [],
      visible: true
    };
    setFichas(prev => [...prev, newFicha]);
    setCurrentFichaId(newFicha.id);

    // Sync with backend
    try {
        const response = await createFichaInSheet(number, program, instructor);
        if (response.status === 'success') {
            // Optional: Show success notification
            alert(`Ficha ${number} creada y registrada en la nube.`);
        } else {
            alert('Error guardando en la nube: ' + response.message);
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión al crear la ficha.');
    }
  };

  // NEW: Handle Visibility Toggle
  const handleToggleFichaVisibility = (id: string) => {
    setFichas(prevFichas => prevFichas.map(f => {
        if (f.id === id) {
            return { ...f, visible: f.visible === undefined ? false : !f.visible };
        }
        return f;
    }));
  };

  const handleAddAnnouncement = (announcement: Announcement) => {
    setAnnouncements(prev => [announcement, ...prev]);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // --- ATTENDANCE HANDLER ---
  const handleSaveAttendance = async (fichaId: string, date: string, records: AttendanceRecord['records'], pdfBase64?: string) => {
    
    // Optimistic Update (Locally)
    setFichas(prevFichas => prevFichas.map(f => {
        if (f.id === fichaId) {
            const history = f.attendanceHistory || [];
            const existingIndex = history.findIndex(h => h.date === date);
            
            let newHistory = [...history];
            // We set a pending flag or temporary URL if needed, but for now we just keep old url until refresh
            if (existingIndex >= 0) {
                newHistory[existingIndex] = { ...newHistory[existingIndex], records };
            } else {
                newHistory.push({ date, records, evidenceUrl: undefined });
            }
            return { ...f, attendanceHistory: newHistory };
        }
        return f;
    }));

    // Persist to Cloud
    try {
        const response = await saveAttendanceToSheet(date, fichaId, records, pdfBase64);
        if (response.status === 'success') {
             // Update with CONFIRMED URL from server
             setFichas(prevFichas => prevFichas.map(f => {
                if (f.id === fichaId) {
                    const history = f.attendanceHistory || [];
                    const existingIndex = history.findIndex(h => h.date === date);
                    let newHistory = [...history];
                     if (existingIndex >= 0 && response.evidenceUrl) {
                        newHistory[existingIndex].evidenceUrl = response.evidenceUrl;
                    }
                    return { ...f, attendanceHistory: newHistory };
                }
                return f;
            }));
            return;
        } else {
            console.error("Server error:", response.message);
            throw new Error(response.message);
        }
    } catch(e) {
        console.error("Error saving attendance to backend", e);
        throw e; // Propagate to caller to handle UI feedback
    }
  };

  const handleSaveSubmission = (submission: GuideSubmission) => {
    if (!selectedApprentice) return;

    setFichas(prevFichas => prevFichas.map(f => {
      if (f.id === currentFichaId) {
        return {
          ...f,
          apprentices: f.apprentices.map(a => {
            if (a.id === selectedApprentice.id) {
               const existingSubmissions = a.submissions || [];
               const index = existingSubmissions.findIndex(s => s.guideId === submission.guideId);
               let newSubmissions = [...existingSubmissions];
               
               if (index >= 0) {
                   newSubmissions[index] = submission;
               } else {
                   newSubmissions.push(submission);
               }
               return { ...a, submissions: newSubmissions };
            }
            return a;
          })
        };
      }
      return f;
    }));

    setSelectedApprentice(prev => {
        if (!prev) return null;
        const existingSubmissions = prev.submissions || [];
        const index = existingSubmissions.findIndex(s => s.guideId === submission.guideId);
        let newSubmissions = [...existingSubmissions];
        if (index >= 0) {
            newSubmissions[index] = submission;
        } else {
            newSubmissions.push(submission);
        }
        return { ...prev, submissions: newSubmissions };
    });
  };

  // --- RENDER LOGIC ---

  if (isLoadingData) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
              <div className="size-16 rounded-full border-4 border-slate-200 border-t-sena-green animate-spin mb-4"></div>
              <p className="text-sena-dark font-bold animate-pulse">Sincronizando con Base de Datos...</p>
          </div>
      );
  }

  // 1. Show Login if not authenticated
  if (currentView === 'login') {
      return <LoginView onLogin={handleLogin} error={authError} />;
  }

  // 2. Show Apprentice View (Used for Apprentice Role, Instructor inspecting, AND Coordinator inspecting)
  if (currentView === 'apprentice' && selectedApprentice) {
    return (
      <ApprenticeView 
        apprentice={selectedApprentice} 
        competencies={selectedApprenticeCompetencies} 
        documents={currentFicha.documents}
        ficha={currentFicha} 
        onBack={handleBack}
        onSaveSubmission={handleSaveSubmission}
        isInstructorMode={viewerRole === 'instructor' || viewerRole === 'coordinator'} // Allow coord to see inspector view
        announcements={announcements}
      />
    );
  }

  // 3. Show Coordinator Dashboard
  // IMPORTANT: Filter out hidden fichas here
  if (currentView === 'coordinator') {
      const visibleFichas = fichas.filter(f => f.visible !== false);
      
      // Ensure we have a valid currentFicha within the visible set
      let safeCurrentFicha = currentFicha;
      if (visibleFichas.length > 0 && (!currentFicha || currentFicha.visible === false)) {
          // If current is hidden or doesn't exist, try to find a replacement in visible list
          // However, CoordinatorView usually manages selection via its own list logic, 
          // passing visibleFichas down is crucial.
          safeCurrentFicha = visibleFichas.find(f => f.id === currentFicha.id) || visibleFichas[0];
      }
      
      return (
          <CoordinatorView 
            fichas={visibleFichas}
            currentFicha={safeCurrentFicha || currentFicha}
            onSelectFicha={handleSelectFicha}
            onSelectApprentice={handleSelectApprentice}
            onSaveAttendance={handleSaveAttendance}
            onLogout={handleLogout}
            coordinatorState={coordinatorState}
            onStateChange={(updates) => setCoordinatorState(prev => ({ ...prev, ...updates }))}
          />
      );
  }

  // 4. Show Instructor Dashboard (Default fallthrough for 'instructor')
  return (
    <InstructorView 
      fichas={fichas}
      currentFicha={currentFicha}
      onSelectFicha={handleSelectFicha}
      onCreateFicha={handleCreateFicha}
      onToggleVisibility={handleToggleFichaVisibility} // Replaced onDeleteFicha
      onSelectApprentice={handleSelectApprentice} 
      onUpdateApprentices={handleUpdateApprentices}
      onAddDocument={handleAddDocument}
      announcements={announcements}
      onAddAnnouncement={handleAddAnnouncement}
      onDeleteAnnouncement={handleDeleteAnnouncement}
      onSaveAttendance={handleSaveAttendance} 
      onLogout={handleLogout}
    />
  );
};

export default App;
