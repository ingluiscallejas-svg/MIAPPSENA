import { Apprentice, Competency, Ficha, GuideSection } from './types';

// Using a generic PDF for demo purposes since we don't have a real backend upload yet
const DEMO_PDF_URL = "https://pdfobject.com/pdf/sample.pdf";

export const MOCK_APPRENTICES: Apprentice[] = [
  {
    id: '1',
    documentType: 'CC',
    documentNumber: '1020304050',
    expeditionCity: 'Bogotá',
    fullName: 'Ana María Restrepo',
    initials: 'AM',
    status: 'En formación',
    approvedCompetencies: 12,
    totalCompetencies: 15,
    progressPercentage: 80,
  },
  {
    id: '2',
    documentType: 'TI',
    documentNumber: '1098765432',
    expeditionCity: 'Medellín',
    fullName: 'Carlos Mario Cano',
    initials: 'CC',
    status: 'En formación',
    approvedCompetencies: 5,
    totalCompetencies: 15,
    progressPercentage: 33,
  },
  {
    id: '3',
    documentType: 'CC',
    documentNumber: '1122334455',
    expeditionCity: 'Cali',
    fullName: 'Lucía Valencia',
    initials: 'LV',
    status: 'En formación',
    approvedCompetencies: 14,
    totalCompetencies: 15,
    progressPercentage: 93,
  },
  {
    id: '4',
    documentType: 'CC',
    documentNumber: '1.098.765.432',
    expeditionCity: 'Manizales',
    fullName: 'Carlos Andrés Rivera',
    initials: 'CR',
    status: 'En formación',
    approvedCompetencies: 12,
    totalCompetencies: 16,
    progressPercentage: 75,
    photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgaWa7WVr4d-6ZHInhJPPlUUivdhqn1HGI86ONO1l0WZp8GLfDL4Wusbm5o_ptqyOpzHwFMMWDL7CG3sjLESoaEqlT6j1EnSWgLNp7XblMbnHPJJ1t1WNO1MXI5Zbw0jlxCLW2bYnOlrpfKZxgw6a6DQHlHLkKN7u4qK3i161Vj9ZpL1TyHCk1ASlxZc0yu7PMiClWHikjKIc91fzK5bCqFDnL0wG0vB8NhUh4PzfdFNgd7Q2NF3kYdwlQWc7lD9E-pIjmZP-IxOY'
  }
];

export const MOCK_FICHAS: Ficha[] = [
  {
    id: '1',
    number: '2503412',
    program: 'Análisis y Desarrollo de Software',
    startDate: '2024-01-20', // Added mock start
    endDate: '2025-06-20',   // Added mock end
    apprentices: MOCK_APPRENTICES,
    documents: [
      { id: '1', title: 'Guía 1: Requerimientos de Software', type: 'GUIA', uploadDate: '2024-02-10', fileName: 'guia_01_requerimientos.pdf', guideNumber: '1', fileUrl: DEMO_PDF_URL },
      { id: '2', title: 'Guía 2: Bases de Datos SQL', type: 'GUIA', uploadDate: '2024-03-15', fileName: 'guia_02_sql.pdf', guideNumber: '2', fileUrl: DEMO_PDF_URL },
      { id: '3', title: 'Guía 3: Frontend con React', type: 'GUIA', uploadDate: '2024-04-20', fileName: 'guia_03_react.pdf', guideNumber: '3', fileUrl: DEMO_PDF_URL },
      { id: '4', title: 'Lista de Chequeo: Producto 1', type: 'LDC', uploadDate: '2024-02-28', fileName: 'lista_chequeo_p1.xlsx' },
      { id: '5', title: 'Plan Concertado Fase Análisis', type: 'PTC', uploadDate: '2024-01-20', fileName: 'ptc_analisis_v1.pdf', fileUrl: DEMO_PDF_URL },
    ]
  },
  {
    id: '2',
    number: '2891234',
    program: 'Gestión Contable',
    startDate: '2024-03-01',
    endDate: '2025-09-01',
    apprentices: [],
    documents: []
  }
];

export const MOCK_COMPETENCIES: Competency[] = [
  {
    id: '1',
    number: '01',
    title: 'Desarrollar la estructura de datos y el código de la aplicación de software',
    resultsCount: 3,
    results: [
      { id: '1-1', code: 'RAP 01', description: 'Construir el mapa de navegación y el prototipo de la interfaz de usuario.', status: 'APROBADO' },
      { id: '1-2', code: 'RAP 02', description: 'Codificar los módulos del software siguiendo el diseño detallado.', status: 'APROBADO' },
      { id: '1-3', code: 'RAP 03', description: 'Realizar las pruebas unitarias y de integración de los módulos desarrollados.', status: 'POR EVALUAR' },
    ]
  },
  {
    id: '2',
    number: '02',
    title: 'Gestionar la base de datos de acuerdo con los requerimientos',
    resultsCount: 2,
    results: [
      { id: '2-1', code: 'RAP 01', description: 'Diseñar la base de datos.', status: 'APROBADO' },
      { id: '2-2', code: 'RAP 02', description: 'Implementar la base de datos.', status: 'POR EVALUAR' },
    ]
  },
  {
    id: '3',
    number: '03',
    title: 'Implementar buenas prácticas de calidad en el desarrollo de software',
    resultsCount: 4,
    results: [
      { id: '3-1', code: 'RAP 01', description: 'Planear actividades de calidad.', status: 'APROBADO' },
      { id: '3-2', code: 'RAP 02', description: 'Ejecutar pruebas de software.', status: 'APROBADO' },
      { id: '3-3', code: 'RAP 03', description: 'Reportar incidencias.', status: 'APROBADO' },
      { id: '3-4', code: 'RAP 04', description: 'Validar correcciones.', status: 'APROBADO' },
    ]
  },
  {
    id: '4',
    number: 'EN',
    title: 'Enriquece tu proyecto con habilidades de Inglés Técnico',
    resultsCount: 0,
    results: [],
    isLocked: true
  }
];

// Standard SENA Guide Structure for the Response Sheet
export const STANDARD_SENA_GUIDE_STRUCTURE: GuideSection[] = [
  {
    id: '3.1',
    title: '3.1 Actividades de Reflexión Inicial',
    content: 'Consulte la actividad 3.1 en el documento adjunto y desarrolle su respuesta a continuación.',
    isActivity: true
  },
  {
    id: '3.2',
    title: '3.2 Actividades de Contextualización',
    content: 'Identifique los conocimientos necesarios para el aprendizaje según la guía adjunta (Sección 3.2).',
    isActivity: true
  },
  {
    id: '3.3',
    title: '3.3 Actividades de Apropiación',
    content: 'Desarrolle los ejercicios, talleres o conceptualización técnica propuestos en la sección 3.3 de la guía.',
    isActivity: true
  },
  {
    id: '4',
    title: '4. Actividades de Transferencia',
    content: 'Presente la evidencia final o el producto del proyecto según lo indica la sección 4 de la guía.',
    isActivity: true
  }
];