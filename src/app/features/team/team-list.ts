import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Users } from '../../core/services/user';
import { UserProfile } from '../../core/models';
import { BranchState } from '../../core/services/branch.state';
import { Toasts } from '../../core/services/ui/toast';
import { toSignal } from '@angular/core/rxjs-interop';
import { Spinner } from '../../shared/components/spinner/spinner';

@Component({
  selector: 'app-team-list',
  imports: [CommonModule, ReactiveFormsModule, Spinner],
  templateUrl: './team-list.html'
})
export class TeamList {
  private userService = inject(Users);
  private branchService = inject(BranchState);
  private toastService = inject(Toasts);
  private fb = inject(FormBuilder);

  // Datos
  users = toSignal(this.userService.getAllUsers(), { initialValue: [] as UserProfile[] });
  branches = this.branchService.branches;

  // UI
  loading = signal(false);
  showModal = signal(false);
  editingUser = signal<UserProfile | null>(null);

  // Datos procesados con BranchName para evitar NG0100 (ExpressionChangedAfterItHasBeenCheckedError)
  teamMembers = computed(() => {
    const rawUsers = this.users() || [];
    const branchList = this.branches() || [];
    
    return rawUsers.map(user => ({
      ...user,
      branchName: this.resolveBranchName(user, branchList)
    }));
  });

  private resolveBranchName(user: UserProfile, branchList: any[]): string {
    if (user.role === 'SUPER_ADMIN') return 'Global (Acceso Total)';
    if (!user.branchId || user.branchId === 'all') return 'Sin asignar (Pendiente)';
    const branch = branchList.find(b => b.id === user.branchId);
    return branch ? branch.name : 'Sede Desconocida';
  }

  // Formulario
  userForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['MANAGER', [Validators.required]],
    branchId: ['', []], // 'all' para Super Admin o sin sede fija inicial
  });

  openCreateModal() {
    this.editingUser.set(null);
    this.userForm.reset({ role: 'MANAGER', branchId: 'all' });
    this.userForm.get('email')?.enable();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.showModal.set(true);
  }

  editUser(user: UserProfile) {
    this.editingUser.set(user);
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId || 'all'
    });
    
    this.userForm.get('email')?.disable();
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    
    this.showModal.set(true);
  }

  async saveUser() {
    if (this.userForm.invalid) return;

    try {
      this.loading.set(true);
      // Usamos getRawValue() para incluir el email aunque esté deshabilitado
      const formData = this.userForm.getRawValue();
      const { password, ...userData } = formData as any;
      
      const branchId = userData.branchId === 'all' ? null : userData.branchId;

      if (this.editingUser()) {
        // MODO EDICIÓN
        await this.userService.updateUser(this.editingUser()!.uid, {
          name: userData.name,
          role: userData.role,
          branchId: branchId
        });
        this.toastService.show('Usuario actualizado exitosamente', 'success');
      } else {
        // MODO CREACIÓN
        await this.userService.createStaffAccount({
          ...userData,
          branchId: branchId
        }, password);
        this.toastService.show('Usuario creado exitosamente', 'success');
      }
      
      this.showModal.set(false);
      // Ya no necesitamos reload(), la señal users() se actualiza vía stream

    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      let msg = this.editingUser() ? 'Error al actualizar' : 'Error al crear la cuenta';
      if (error.code === 'auth/email-already-in-use') msg = 'El email ya está registrado';
      this.toastService.show(msg, 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleStatus(uid: string, currentStatus: boolean) {
    try {
      await this.userService.updateUserStatus(uid, !currentStatus);
      this.toastService.show('Estado actualizado', 'success');
      // Eliminado reload() - reactividad automática activada
    } catch (error) {
      this.toastService.show('Error al actualizar estado', 'error');
    }
  }

  getBranchName(user: UserProfile): string {
    // 1. Si es Super Admin, siempre es Global
    if (user.role === 'SUPER_ADMIN') return 'Global (Acceso Total)';

    // 2. Si no es Super Admin y no tiene sede, está pendiente
    if (!user.branchId || user.branchId === 'all') return 'Sin asignar (Pendiente)';

    // 3. Buscar nombre de la sede
    const branch = this.branches().find(b => b.id === user.branchId);
    return branch ? branch.name : 'Sede Desconocida';
  }
}
