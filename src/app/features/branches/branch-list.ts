import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Branches } from '../../core/services/branch';
import { Users } from '../../core/services/user';
import { UserProfile } from '../../core/models';
import { Toasts } from '../../core/services/ui/toast';
import { Branch } from '../../core/models';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './branch-list.html'
})
export class BranchList {
  private branchService = inject(Branches);
  private userService = inject(Users);
  private toastService = inject(Toasts);
  private fb = inject(FormBuilder);

  // Estados reactivos
  branches = this.branchService.branches;
  showArchived = this.branchService.showArchived;
  managers = toSignal(this.userService.getStaffByRoles(['MANAGER', 'SUPER_ADMIN']), { initialValue: [] as UserProfile[] });
  
  loading = signal(false);
  showModal = signal(false);
  modalMode = signal<'edit' | 'delete'>('edit');
  editingBranch = signal<Branch | null>(null);

  // Formulario
  branchForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    location: ['', [Validators.required]],
    managerId: ['', [Validators.required]]
  });

  openCreateModal() {
    this.editingBranch.set(null);
    this.modalMode.set('edit');
    this.branchForm.reset();
    this.showModal.set(true);
  }

  openEditModal(branch: Branch) {
    this.editingBranch.set(branch);
    this.modalMode.set('edit');
    this.branchForm.patchValue({
      name: branch.name,
      location: branch.location,
      managerId: branch.managerId
    });
    this.showModal.set(true);
  }

  async saveBranch() {
    if (this.branchForm.invalid) return;

    try {
      this.loading.set(true);
      const data = this.branchForm.value as any;

      if (this.editingBranch()) {
        await this.branchService.updateBranch(this.editingBranch()!.id, data);
        this.toastService.show('Sede actualizada correctamente', 'success');
      } else {
        await this.branchService.createBranch(data);
        this.toastService.show('Nueva sede abierta correctamente', 'success');
      }

      this.showModal.set(false);
    } catch (error: any) {
      console.error('Error al guardar sede:', error);
      this.toastService.show('Error al procesar la solicitud', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  /** Abre el modal de confirmación para borrado lógico */
  onDeleteBranch(branch: Branch) {
    this.editingBranch.set(branch);
    this.modalMode.set('delete');
    this.showModal.set(true);
  }

  /** Ejecuta el borrado lógico desde el modal */
  async confirmDelete() {
    const branch = this.editingBranch();
    if (!branch) return;

    try {
      this.loading.set(true);
      await this.branchService.deleteBranch(branch.id);
      this.toastService.show(`Sede "${branch.name}" archivada correctamente`, 'success');
      this.showModal.set(false);
    } catch (error: any) {
      console.error('Error al archivar sede:', error);
      this.toastService.show('Error al procesar la solicitud', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  /** Reactivación de una sede archivada */
  async onActivateBranch(branch: Branch) {
    try {
      this.loading.set(true);
      await this.branchService.activateBranch(branch.id);
      this.toastService.show(`Sede "${branch.name}" reactivada con éxito`, 'success');
    } catch (error: any) {
      console.error('Error al reactivar sede:', error);
      this.toastService.show('Error al intentar reactivar la sede', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  getManagerName(managerId: string): string {
    const manager = this.managers().find(m => m.uid === managerId);
    return manager ? manager.name : 'Sin Asignar';
  }
}
