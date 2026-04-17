# Plantilla Spec-First para Agentes de IA
**Estructura tu proyecto antes de escribir una línea de código o prompt**

> [!IMPORTANT]
> Instrucción: Rellena cada sección de este documento de forma completa antes de pasarlo como contexto al agente de IA (Antigravity). No dejes nada a la "suposición".

---

## SECCIÓN 1 — Visión del Producto
*La descripción más corta y clara de lo que construyes. Una o dos oraciones.*

**Preguntas guía:**
* ¿Qué hace exactamente este producto?
* ¿Para quién es?
* ¿Qué problema resuelve en una frase?

**Tu visión:**
[Escribe aquí tu respuesta...]

---

## SECCIÓN 2 — Usuarios y Casos de Uso
*Quién usa el producto y para qué. Define acciones concretas por rol.*

**Preguntas guía:**
* ¿Quién es el usuario principal?
* ¿Hay roles diferentes? (admin, editor, visitante)
* ¿Cuáles son las 3 acciones principales de cada rol?

**Tus usuarios y casos de uso:**
[Escribe aquí tu respuesta...]

---

## SECCIÓN 3 — Funcionalidades (Features)
*Lista organizada por módulos. Escribe como "El usuario puede..." o "El sistema permite...".*

**Preguntas guía:**
* ¿Qué puede hacer el usuario en cada módulo?
* ¿Qué lógica de negocio automática ocurre? (Hechos lógicos)

**Tus funcionalidades:**
[Espacio editable por módulos...]

---

## SECCIÓN 4 — Flujos de Usuario (User Flows)
*Pasos exactos para completar acciones principales. Incluye Happy Path y Errores.*

**Preguntas guía:**
* ¿Qué pasos sigue el usuario?
* ¿Qué pasa si el sistema falla en un paso intermedio?

**Tus flujos principales:**
[Un flujo por acción importante...]

---

## SECCIÓN 5 — Arquitectura Técnica e Invariantes
*La estructura técnica y decisiones que NO deben cambiar.*

**Preguntas guía:**
* **Invariantes:** ¿Qué librerías o herramientas son obligatorias? (ej: date-fns, Lucide, Firebase).
* ¿Cómo se comunican los componentes (Facades, Services)?

**Tu arquitectura:**
[Escribe aquí tus decisiones técnicas o "A decidir con agente IA" e indica las invariantes...]

---

## SECCIÓN 6 — Modelos y Estructuras de Datos (Data Contracts)
*La forma exacta de los datos. Evita que la IA asuma nombres de variables.*

**Preguntas guía:**
* **Validaciones de Negocio:** ¿Qué reglas deben cumplir los datos? (ej: monto > 0).
* Interfaces, Enums y DTOs principales.

**Tus Modelos de Datos:**
[Define interfaces, campos y validaciones...]

---

## SECCIÓN 7 — Requisitos No Funcionales
*Rendimiento, Escalabilidad, Idiomas.*

**Tus Requisitos:**
[Escribe aquí tu respuesta...]

---

## SECCIÓN 8 — Fuera de Alcance (Out of Scope)
*Lo que el sistema NO hará en esta versión para evitar "asunciones optimistas".*

**Tu lista de Out of Scope:**
[Escribe aquí lo que NO se debe construir...]

---

## SECCIÓN 9 — Estrategia de Testing y Calidad
*¿Cómo verificamos que funciona? Criterios de éxito.*

**Preguntas guía:**
* ¿Qué cobertura de Unit Tests requerimos?
* ¿Qué flujos E2E son críticos?

**Tu estrategia de QA:**
[Define los criterios de éxito...]

---

## SECCIÓN 10 — Diseño y Branding (Visual Facts)
*Hechos visuales concretos para evitar diseños genéricos.*

**Preguntas guía:**
* ¿Colores exactos (Hex), Tipografía, Estilo (Glassmorphism, Flat)?

**Tus Visual Facts:**
[Escribe Hex, fuentes y estilos clave...]

---

## SECCIÓN 11 — Seguridad y Permisos (Access Control)
*Hechos de acceso a los datos.*

**Preguntas guía:**
* ¿Quién puede leer/escribir qué? (Reglas de negocio factibles).

**Tu seguridad:**
[Define quién accede a qué datos...]
