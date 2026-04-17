# Arquitectura Firebase "Standard Elite" (Zero Cost / Spark Plan)

Este documento contiene los hechos técnicos innegociables para el uso de Firebase en el plan gratuito (Spark). Se debe cumplir estrictamente para evitar costos accidentales o fallos de seguridad.

## 1. Stack y Plan
- **Plan:** Spark (Cero Costo).
- **Prohibido:** Firebase App Hosting, Firebase Cloud Functions (requieren Plan Blaze).
- **Permitido:** Firebase Hosting (Clásico), Firestore, Authentication, Analytics.

## 2. SDK y Patrones de Acceso
- **Version:** Firebase SDK v11 (Modular).
- **Patrón Facade/Repository:** Ningún componente de Angular debe importar nada de `firebase/firestore`. Todo debe pasar por un Servicio Angular que actúe como Facade.
- **Zoneless Safe:** Usar `inject()` en el constructor de servicios para obtener las instancias de Firestore/Auth.
- **Updates Granulares:** Usar `updateDoc` en lugar de `setDoc` para ahorrar escrituras innecesarias siempre que sea posible.

## 3. Seguridad de Datos (Security Rules)
Como no tenemos Cloud Functions para validar datos del lado del servidor, las Security Rules deben:
- **Validar Esquemas:** Comprobar que `request.resource.data` contenga todos los campos obligatorios y con el tipo correcto.
- **Inmutabilidad:** Impedir que ciertos campos (como `createdAt` o `userId`) sean modificados después de la creación.
- **Validación Cruzada:** Validar que los puntos/precios sean coherentes (ej. no dejar que un usuario se asigne puntos a sí mismo si no es el administrador).

## 4. Gestión de Medios (Cloudinary)
- **Almacenamiento:** No usar Firebase Storage (limite de transferencia diario restrictivo).
- **Implementación:** Usar el **Cloudinary Upload Widget**.
- **Seguridad:** Los `unsigned uploads` deben estar configurados en Cloudinary para permitir la carga directa desde el cliente.
- **Referencia:** En Firestore solo se guarda el `secure_url` o el `public_id` devuelto por Cloudinary.

## 5. Optimización Spark
- **Queries:** Evitar `collectionData` en listas masivas. Usar paginación o límites (`limit(20)`) por defecto.
- **Indexes:** Mantener los índices al mínimo para no agotar la cuota de almacenamiento de metadatos.

## 6. Auth
- **Métodos:** Email/Password (Standard).
- **Claims:** Los roles de administrador se deben manejar mediante un documento `users/{uid}` o custom claims (siempre y cuando sea posible sin Functions). Dado que estamos en Spark sin Functions, usaremos un documento de perfil para los roles.
